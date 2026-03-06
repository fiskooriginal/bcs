import asyncio
import sys
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.utils import utc_now
from app.core.websocket import ws_manager
from app.models.execution import ScriptExecution, ScriptLog
from app.models.script import Script


class ExecutionService:
    def __init__(self, scripts_dir: str):
        self.scripts_dir = Path(scripts_dir)
        self.active_processes: dict[uuid.UUID, asyncio.subprocess.Process] = {}

    async def create_execution(
        self,
        db: AsyncSession,
        script_id: uuid.UUID,
        triggered_by: str = "manual",
    ) -> ScriptExecution:
        stmt = select(Script).where(Script.id == script_id)
        result = await db.execute(stmt)
        script = result.scalar_one_or_none()

        if not script:
            raise HTTPException(status_code=404, detail="Script not found")

        execution = ScriptExecution(
            script_id=script_id,
            status="pending",
            triggered_by=triggered_by,
            started_at=utc_now(),
        )

        db.add(execution)
        await db.commit()
        await db.refresh(execution)

        return execution

    async def get_execution(self, db: AsyncSession, execution_id: uuid.UUID) -> ScriptExecution:
        stmt = (
            select(ScriptExecution)
            .where(ScriptExecution.id == execution_id)
            .options(selectinload(ScriptExecution.logs))
        )
        result = await db.execute(stmt)
        execution = result.scalar_one_or_none()

        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")

        return execution

    async def get_script_executions(
        self,
        db: AsyncSession,
        script_id: uuid.UUID,
        limit: int = 50,
    ) -> list[ScriptExecution]:
        stmt = (
            select(ScriptExecution)
            .where(ScriptExecution.script_id == script_id)
            .order_by(ScriptExecution.started_at.desc())
            .limit(limit)
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def add_log(
        self,
        db: AsyncSession,
        execution_id: uuid.UUID,
        message: str,
        stream: str = "stdout",
        level: str = "INFO",
    ) -> ScriptLog:
        log = ScriptLog(
            execution_id=execution_id,
            level=level,
            message=message,
            stream=stream,
            timestamp=utc_now(),
        )

        db.add(log)
        await db.commit()
        await db.refresh(log)

        return log

    async def update_execution_status(
        self,
        db: AsyncSession,
        execution_id: uuid.UUID,
        status: str,
        exit_code: Optional[int] = None,
    ) -> ScriptExecution:
        execution = await self.get_execution(db, execution_id)

        execution.status = status

        if status in ("completed", "failed", "cancelled"):
            execution.finished_at = utc_now()

        if exit_code is not None:
            execution.exit_code = exit_code

        await db.commit()
        await db.refresh(execution)

        return execution

    async def run_script(
        self,
        db: AsyncSession,
        script_id: uuid.UUID,
        triggered_by: str = "manual",
        log_callback: Optional[callable] = None,
    ) -> ScriptExecution:
        stmt = select(Script).where(Script.id == script_id)
        result = await db.execute(stmt)
        script = result.scalar_one_or_none()

        if not script:
            raise HTTPException(status_code=404, detail="Script not found")

        script_path = self.scripts_dir / script.filename

        if not script_path.exists():
            raise HTTPException(status_code=404, detail="Script file not found on disk")

        execution = await self.create_execution(db, script_id, triggered_by)

        asyncio.create_task(self._execute_script(db, execution.id, script_path, log_callback))

        return execution

    async def _execute_script(
        self,
        db: AsyncSession,
        execution_id: uuid.UUID,
        script_path: Path,
        log_callback: Optional[callable] = None,
    ) -> None:
        try:
            await self.update_execution_status(db, execution_id, "running")

            await self.add_log(
                db,
                execution_id,
                f"Starting execution of script: {script_path.name}",
                stream="stdout",
                level="INFO",
            )

            process = await asyncio.create_subprocess_exec(
                sys.executable,
                str(script_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.scripts_dir),
            )

            self.active_processes[execution_id] = process

            async def read_stream(stream, stream_name: str):
                while True:
                    line = await stream.readline()
                    if not line:
                        break

                    message = line.decode("utf-8", errors="replace").rstrip()

                    if message:
                        level = "ERROR" if stream_name == "stderr" else "INFO"
                        log_entry = await self.add_log(
                            db,
                            execution_id,
                            message,
                            stream=stream_name,
                            level=level,
                        )

                        await ws_manager.broadcast_log(execution_id, log_entry)

                        if log_callback:
                            try:
                                await log_callback(log_entry)
                            except Exception as e:
                                print(f"Log callback error: {e}")

            await asyncio.gather(
                read_stream(process.stdout, "stdout"),
                read_stream(process.stderr, "stderr"),
            )

            exit_code = await process.wait()

            self.active_processes.pop(execution_id, None)

            if exit_code == 0:
                status = "completed"
                await self.add_log(
                    db,
                    execution_id,
                    f"Script completed successfully with exit code {exit_code}",
                    stream="stdout",
                    level="INFO",
                )
            else:
                status = "failed"
                await self.add_log(
                    db,
                    execution_id,
                    f"Script failed with exit code {exit_code}",
                    stream="stderr",
                    level="ERROR",
                )

            await self.update_execution_status(db, execution_id, status, exit_code)

        except asyncio.CancelledError:
            await self.add_log(
                db,
                execution_id,
                "Execution was cancelled",
                stream="stderr",
                level="ERROR",
            )
            await self.update_execution_status(db, execution_id, "cancelled", exit_code=-1)
            self.active_processes.pop(execution_id, None)
            raise

        except Exception as e:
            await self.add_log(
                db,
                execution_id,
                f"Execution error: {str(e)}",
                stream="stderr",
                level="ERROR",
            )
            await self.update_execution_status(db, execution_id, "failed", exit_code=-1)
            self.active_processes.pop(execution_id, None)

    async def stop_execution(self, db: AsyncSession, execution_id: uuid.UUID) -> ScriptExecution:
        execution = await self.get_execution(db, execution_id)

        if execution.status not in ("pending", "running"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot stop execution with status '{execution.status}'",
            )

        process = self.active_processes.get(execution_id)

        if process and process.returncode is None:
            try:
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()

                await self.add_log(
                    db,
                    execution_id,
                    "Execution stopped by user",
                    stream="stderr",
                    level="ERROR",
                )

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to stop execution: {str(e)}")

            finally:
                self.active_processes.pop(execution_id, None)

        await self.update_execution_status(db, execution_id, "cancelled", exit_code=-1)

        return execution
