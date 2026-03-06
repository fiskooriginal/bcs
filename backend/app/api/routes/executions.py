import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.core.dependencies import get_execution_service
from app.models.execution import ScriptLog
from app.schemas.execution import (
    ScriptExecutionDetailResponse,
    ScriptExecutionListResponse,
    ScriptExecutionResponse,
    ScriptLogResponse,
)
from app.services.execution_service import ExecutionService

router = APIRouter(prefix="/api", tags=["executions"])


@router.get("/scripts/{script_id}/executions", response_model=list[ScriptExecutionListResponse])
async def get_script_executions(
    script_id: uuid.UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    execution_service: ExecutionService = Depends(get_execution_service),
):
    executions = await execution_service.get_script_executions(db, script_id, limit)

    result = []
    for execution in executions:
        stmt = select(func.count(ScriptLog.id)).where(ScriptLog.execution_id == execution.id)
        log_count_result = await db.execute(stmt)
        log_count = log_count_result.scalar() or 0

        result.append(
            ScriptExecutionListResponse(
                id=execution.id,
                script_id=execution.script_id,
                status=execution.status,
                triggered_by=execution.triggered_by,
                started_at=execution.started_at,
                finished_at=execution.finished_at,
                exit_code=execution.exit_code,
                log_count=log_count,
            )
        )

    return result


@router.get("/executions/{execution_id}", response_model=ScriptExecutionDetailResponse)
async def get_execution_details(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    execution_service: ExecutionService = Depends(get_execution_service),
):
    execution = await execution_service.get_execution(db, execution_id)

    return ScriptExecutionDetailResponse(
        id=execution.id,
        script_id=execution.script_id,
        status=execution.status,
        triggered_by=execution.triggered_by,
        started_at=execution.started_at,
        finished_at=execution.finished_at,
        exit_code=execution.exit_code,
        logs=[
            ScriptLogResponse(
                id=log.id,
                execution_id=log.execution_id,
                level=log.level,
                message=log.message,
                stream=log.stream,
                timestamp=log.timestamp,
            )
            for log in execution.logs
        ],
    )


@router.get("/executions/{execution_id}/logs", response_model=list[ScriptLogResponse])
async def get_execution_logs(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    execution_service: ExecutionService = Depends(get_execution_service),
):
    execution = await execution_service.get_execution(db, execution_id)

    return [
        ScriptLogResponse(
            id=log.id,
            execution_id=log.execution_id,
            level=log.level,
            message=log.message,
            stream=log.stream,
            timestamp=log.timestamp,
        )
        for log in execution.logs
    ]


@router.post("/executions/{execution_id}/stop", response_model=ScriptExecutionResponse)
async def stop_execution(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    execution_service: ExecutionService = Depends(get_execution_service),
):
    return await execution_service.stop_execution(db, execution_id)
