import uuid
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import ScriptExecution
from app.models.script import Script
from app.schemas.script import (
    ScriptContentResponse,
    ScriptCreate,
    ScriptListResponse,
    ScriptUpdate,
)


class ScriptService:
    def __init__(self, scripts_dir: str = "/app/scripts"):
        self.scripts_dir = Path(scripts_dir)
        self.scripts_dir.mkdir(parents=True, exist_ok=True)

    def _generate_filename(self, name: str) -> str:
        safe_name = "".join(c if c.isalnum() or c in ("_", "-") else "_" for c in name)
        timestamp = uuid.uuid4().hex[:8]
        return f"{safe_name}_{timestamp}.py"

    def _get_script_path(self, filename: str) -> Path:
        return self.scripts_dir / filename

    async def create_script(
        self,
        db: AsyncSession,
        script_data: ScriptCreate,
    ) -> Script:
        stmt = select(Script).where(Script.name == script_data.name)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Script with name '{script_data.name}' already exists")

        filename = self._generate_filename(script_data.name)
        file_path = self._get_script_path(filename)

        try:
            async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
                await f.write(script_data.content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to write script file: {str(e)}")

        db_script = Script(
            name=script_data.name,
            filename=filename,
            description=script_data.description,
            cron_expression=script_data.cron_expression,
            is_active=False,
        )

        db.add(db_script)
        await db.commit()
        await db.refresh(db_script)

        return db_script

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

        if script_data.name is not None and script_data.name != script.name:
            stmt = select(Script).where(Script.name == script_data.name, Script.id != script_id)
            result = await db.execute(stmt)
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"Script with name '{script_data.name}' already exists",
                )
            script.name = script_data.name

        if script_data.description is not None:
            script.description = script_data.description

        if script_data.cron_expression is not None:
            script.cron_expression = script_data.cron_expression

        await db.commit()
        await db.refresh(script)

        return script

    async def delete_script(self, db: AsyncSession, script_id: uuid.UUID) -> None:
        script = await self.get_script(db, script_id)

        file_path = self._get_script_path(script.filename)
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete script file: {str(e)}")

        await db.delete(script)
        await db.commit()

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

    async def update_script_content(
        self,
        db: AsyncSession,
        script_id: uuid.UUID,
        content: str,
    ) -> Script:
        script = await self.get_script(db, script_id)
        file_path = self._get_script_path(script.filename)

        try:
            async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
                await f.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update script file: {str(e)}")

        await db.commit()
        await db.refresh(script)

        return script

    async def import_script(
        self,
        db: AsyncSession,
        file: UploadFile,
        name: str,
        description: Optional[str] = None,
        cron_expression: Optional[str] = None,
    ) -> Script:
        if not file.filename or not file.filename.endswith(".py"):
            raise HTTPException(status_code=400, detail="Only .py files are allowed")

        stmt = select(Script).where(Script.name == name)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Script with name '{name}' already exists")

        content = await file.read()
        try:
            content_str = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")

        filename = self._generate_filename(name)
        file_path = self._get_script_path(filename)

        try:
            async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
                await f.write(content_str)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to write script file: {str(e)}")

        db_script = Script(
            name=name,
            filename=filename,
            description=description,
            cron_expression=cron_expression,
            is_active=False,
        )

        db.add(db_script)
        await db.commit()
        await db.refresh(db_script)

        return db_script


script_service = ScriptService()
