import uuid

from apscheduler import AsyncScheduler, ConflictPolicy
from apscheduler.datastores.sqlalchemy import SQLAlchemyDataStore
from apscheduler.eventbrokers.asyncpg import AsyncpgEventBroker
from apscheduler.triggers.cron import CronTrigger
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory, engine
from app.models.script import Script
from app.services.execution_service import ExecutionService


async def execute_scheduled_script(script_id: str | uuid.UUID) -> None:
    """Module-level callable for APScheduler — must be importable by ref."""
    from app.core.dependencies import ServiceContainer

    execution_service = ServiceContainer.get_execution_service()

    if isinstance(script_id, uuid.UUID):
        script_uuid = script_id
    else:
        script_uuid = uuid.UUID(script_id)

    async with async_session_factory() as session:
        try:
            await execution_service.run_script(db=session, script_id=script_uuid, triggered_by="cron")
        except Exception as e:
            print(f"Error running scheduled script {script_id}: {e}")


class SchedulerService:
    def __init__(self, execution_service: ExecutionService):
        self.execution_service = execution_service
        self.scheduler: AsyncScheduler | None = None
        self._is_started = False

    async def initialize(self) -> None:
        if self.scheduler is not None:
            return

        data_store = SQLAlchemyDataStore(engine, schema="public")
        event_broker = AsyncpgEventBroker.from_async_sqla_engine(engine)

        self.scheduler = AsyncScheduler(data_store, event_broker)

        await self.scheduler.__aenter__()

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

        if self.scheduler:
            await self.scheduler.__aexit__(None, None, None)

    async def add_schedule(
        self,
        script_id: uuid.UUID,
        cron_expression: str,
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

        await self.scheduler.add_schedule(
            execute_scheduled_script,
            trigger,
            id=schedule_id,
            conflict_policy=ConflictPolicy.replace,
            kwargs={"script_id": str(script_id)},
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

    async def get_schedule(self, script_id: uuid.UUID) -> dict | None:
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
    ) -> None:
        if not script.cron_expression:
            raise HTTPException(
                status_code=400,
                detail="Cannot activate script without cron expression",
            )

        if script.is_active:
            return

        await self.add_schedule(script.id, script.cron_expression)

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

    async def reactivate_all_active_scripts(self, db: AsyncSession) -> int:
        from sqlalchemy import select

        stmt = select(Script).where(Script.is_active)
        result = await db.execute(stmt)
        active_scripts = result.scalars().all()

        count = 0
        for script in active_scripts:
            if script.cron_expression:
                try:
                    await self.add_schedule(script.id, script.cron_expression)
                    count += 1
                except Exception as e:
                    print(f"Failed to reactivate script {script.id}: {e}")

        return count
