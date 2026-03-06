import ast
import uuid
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import ScriptExecution
from app.models.script import Script
from app.schemas.script import ScriptContentResponse, ScriptListResponse, ScriptUpdate


class ScriptService:
    def __init__(self, scripts_dir: str):
        self.scripts_dir = Path(scripts_dir)

    def _get_script_path(self, filename: str) -> Path:
        return self.scripts_dir / filename

    def _prettify_name(self, filename: str) -> str:
        stem = Path(filename).stem
        return stem.replace("_", " ").replace("-", " ").title()

    async def _extract_docstring(self, filename: str) -> Optional[str]:
        file_path = self._get_script_path(filename)
        try:
            async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                content = await f.read()
            tree = ast.parse(content)
            return ast.get_docstring(tree)
        except Exception:
            return None

    async def sync_scripts(self, db: AsyncSession) -> dict:
        # Discover all .py files on disk
        disk_files = {f.name for f in self.scripts_dir.glob("*.py") if not f.name.startswith("__")}

        stmt = select(Script)
        result = await db.execute(stmt)
        db_scripts = result.scalars().all()
        db_by_filename = {s.filename: s for s in db_scripts}

        deleted = 0
        for filename, script in db_by_filename.items():
            if filename not in disk_files:
                await db.delete(script)
                deleted += 1

        await db.flush()

        created = 0
        for filename in disk_files:
            if filename not in db_by_filename:
                name = self._prettify_name(filename)
                description = await self._extract_docstring(filename)
                db_script = Script(
                    name=name,
                    filename=filename,
                    description=description,
                    cron_expression=None,
                    is_active=False,
                )
                db.add(db_script)
                created += 1

        await db.commit()
        return {"created": created, "deleted": deleted}

    async def get_script(self, db: AsyncSession, script_id: uuid.UUID) -> Script:
        stmt = select(Script).where(Script.id == script_id)
        result = await db.execute(stmt)
        script = result.scalar_one_or_none()

        if not script:
            raise HTTPException(status_code=404, detail="Script not found")

        return script

    async def get_scripts(self, db: AsyncSession) -> list[ScriptListResponse]:
        stmt = select(
            Script,
            func.coalesce(
                select(ScriptExecution.status)
                .where(ScriptExecution.script_id == Script.id)
                .order_by(ScriptExecution.started_at.desc())
                .limit(1)
                .scalar_subquery(),
                None,
            ).label("last_execution_status"),
            func.coalesce(
                select(ScriptExecution.started_at)
                .where(ScriptExecution.script_id == Script.id)
                .order_by(ScriptExecution.started_at.desc())
                .limit(1)
                .scalar_subquery(),
                None,
            ).label("last_execution_time"),
        ).order_by(Script.created_at.desc())

        result = await db.execute(stmt)
        rows = result.all()

        scripts_list = []
        for row in rows:
            script = row[0]
            scripts_list.append(
                ScriptListResponse(
                    id=script.id,
                    name=script.name,
                    description=script.description,
                    filename=script.filename,
                    cron_expression=script.cron_expression,
                    is_active=script.is_active,
                    created_at=script.created_at,
                    updated_at=script.updated_at,
                    last_execution_status=row.last_execution_status,
                    last_execution_time=row.last_execution_time,
                )
            )

        return scripts_list

    async def update_script(
        self,
        db: AsyncSession,
        script_id: uuid.UUID,
        script_data: ScriptUpdate,
    ) -> Script:
        script = await self.get_script(db, script_id)

        # Use model_fields_set to distinguish "not sent" from "explicitly null"
        if "cron_expression" in script_data.model_fields_set:
            script.cron_expression = script_data.cron_expression

        await db.commit()
        await db.refresh(script)

        return script

    async def get_script_content(self, db: AsyncSession, script_id: uuid.UUID) -> ScriptContentResponse:
        script = await self.get_script(db, script_id)
        file_path = self._get_script_path(script.filename)

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Script file not found on disk")

        try:
            async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                content = await f.read()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read script file: {str(e)}")

        return ScriptContentResponse(content=content)
