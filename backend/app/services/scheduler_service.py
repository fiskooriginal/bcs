import uuid
from typing import Optional

from apscheduler import AsyncScheduler, ConflictPolicy
from apscheduler.datastores.sqlalchemy import SQLAlchemyDataStore
from apscheduler.eventbrokers.asyncpg import AsyncpgEventBroker
from apscheduler.triggers.cron import CronTrigger
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine
from app.models.script import Script
from app.services.execution_service import execution_service


class SchedulerService:
    def __init__(self):
        self.scheduler: Optional[AsyncScheduler] = None
        self._is_started = False

    async def initialize(self) -> None:
        if self.scheduler is not None:
            return

        data_store = SQLAlchemyDataStore(engine, schema="public")
        event_broker = AsyncpgEventBroker.from_async_sqla_engine(engine)

        self.scheduler = AsyncScheduler(data_store, event_broker, timezone=settings.apscheduler_timezone)

    async def start(self) -> None:
        if not self.scheduler:
            raise RuntimeError("Scheduler not initialized. Call initialize() first.")

        if self._is_started:
            return

        await self.scheduler.start_in_background()
        self._is_started = True

    async def stop(self) -> None:
        if self.scheduler and self._is_started:
            await self.scheduler.stop()
            self._is_started = False

    async def add_schedule(
        self,
        script_id: uuid.UUID,
        cron_expression: str,
        db_session_factory,
    ) -> str:
        if not self.scheduler:
            raise RuntimeError("Scheduler not initialized")

        if not cron_expression or not cron_expression.strip():
            raise HTTPException(status_code=400, detail="Cron expression cannot be empty")

        try:
            trigger = CronTrigger.from_crontab(cron_expression)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid cron expression: {str(e)}")

        schedule_id = f"script_{script_id}"

        async def scheduled_task():
            async for session in db_session_factory():
                try:
                    await execution_service.run_script(
                        db=session,
                        script_id=script_id,
                        triggered_by="cron",
                    )
                    break
                except Exception as e:
                    print(f"Error running scheduled script {script_id}: {e}")
                finally:
                    await session.close()

        await self.scheduler.add_schedule(
            scheduled_task,
            trigger,
            id=schedule_id,
            conflict_policy=ConflictPolicy.replace,
        )

        return schedule_id

    async def remove_schedule(self, script_id: uuid.UUID) -> None:
        if not self.scheduler:
            raise RuntimeError("Scheduler not initialized")

        schedule_id = f"script_{script_id}"

        try:
            await self.scheduler.remove_schedule(schedule_id)
        except Exception:
            pass

    async def pause_schedule(self, script_id: uuid.UUID) -> None:
        if not self.scheduler:
            raise RuntimeError("Scheduler not initialized")

        schedule_id = f"script_{script_id}"

        try:
            await self.scheduler.pause_schedule(schedule_id)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Schedule not found: {str(e)}")

    async def unpause_schedule(self, script_id: uuid.UUID) -> None:
        if not self.scheduler:
            raise RuntimeError("Scheduler not initialized")

        schedule_id = f"script_{script_id}"

        try:
            await self.scheduler.unpause_schedule(schedule_id, resume_from="now")
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Schedule not found: {str(e)}")

    async def get_schedule(self, script_id: uuid.UUID) -> Optional[dict]:
        if not self.scheduler:
            raise RuntimeError("Scheduler not initialized")

        schedule_id = f"script_{script_id}"

        try:
            schedule = await self.scheduler.get_schedule(schedule_id)
            if schedule:
                return {
                    "id": schedule.id,
                    "next_fire_time": schedule.next_fire_time,
                    "paused": schedule.paused if hasattr(schedule, "paused") else False,
                }
        except Exception:
            pass

        return None

    async def activate_script(
        self,
        db: AsyncSession,
        script: Script,
        db_session_factory,
    ) -> None:
        if not script.cron_expression:
            raise HTTPException(
                status_code=400,
                detail="Cannot activate script without cron expression",
            )

        if script.is_active:
            return

        await self.add_schedule(script.id, script.cron_expression, db_session_factory)

        script.is_active = True
        await db.commit()
        await db.refresh(script)

    async def deactivate_script(self, db: AsyncSession, script: Script) -> None:
        if not script.is_active:
            return

        await self.remove_schedule(script.id)

        script.is_active = False
        await db.commit()
        await db.refresh(script)

    async def reactivate_all_active_scripts(
        self,
        db: AsyncSession,
        db_session_factory,
    ) -> int:
        from sqlalchemy import select

        stmt = select(Script).where(Script.is_active)
        result = await db.execute(stmt)
        active_scripts = result.scalars().all()

        count = 0
        for script in active_scripts:
            if script.cron_expression:
                try:
                    await self.add_schedule(script.id, script.cron_expression, db_session_factory)
                    count += 1
                except Exception as e:
                    print(f"Failed to reactivate script {script.id}: {e}")

        return count


scheduler_service = SchedulerService()
