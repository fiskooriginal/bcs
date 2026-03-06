import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.di import (
    get_db_session,
    get_execution_service,
    get_scheduler_service,
    get_script_service,
)
from app.schemas.script import ScriptContentResponse, ScriptListResponse, ScriptResponse, ScriptUpdate
from app.services.execution_service import ExecutionService
from app.services.scheduler_service import SchedulerService
from app.services.script_service import ScriptService

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


@router.get("", response_model=list[ScriptListResponse])
async def list_scripts(
    db: AsyncSession = Depends(get_db_session),
    script_service: ScriptService = Depends(get_script_service),
):
    return await script_service.get_scripts(db)


@router.post("/sync", response_model=dict)
async def sync_scripts(
    db: AsyncSession = Depends(get_db_session),
    script_service: ScriptService = Depends(get_script_service),
):
    return await script_service.sync_scripts(db)


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    script_service: ScriptService = Depends(get_script_service),
):
    return await script_service.get_script(db, script_id)


@router.put("/{script_id}", response_model=ScriptResponse)
async def update_script(
    script_id: uuid.UUID,
    script_data: ScriptUpdate,
    db: AsyncSession = Depends(get_db_session),
    script_service: ScriptService = Depends(get_script_service),
):
    return await script_service.update_script(db, script_id, script_data)


@router.get("/{script_id}/content", response_model=ScriptContentResponse)
async def get_script_content(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    script_service: ScriptService = Depends(get_script_service),
):
    return await script_service.get_script_content(db, script_id)


@router.post("/{script_id}/activate", response_model=ScriptResponse)
async def activate_script(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    script_service: ScriptService = Depends(get_script_service),
    scheduler_service: SchedulerService = Depends(get_scheduler_service),
):
    script = await script_service.get_script(db, script_id)
    await scheduler_service.activate_script(db, script)
    return script


@router.post("/{script_id}/deactivate", response_model=ScriptResponse)
async def deactivate_script(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    script_service: ScriptService = Depends(get_script_service),
    scheduler_service: SchedulerService = Depends(get_scheduler_service),
):
    script = await script_service.get_script(db, script_id)
    await scheduler_service.deactivate_script(db, script)
    return script


@router.post("/{script_id}/run", response_model=dict, status_code=202)
async def run_script(
    script_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    execution_service: ExecutionService = Depends(get_execution_service),
):
    execution = await execution_service.run_script(db, script_id, triggered_by="manual")

    return {
        "message": "Script execution started",
        "execution_id": str(execution.id),
        "status": execution.status,
    }
