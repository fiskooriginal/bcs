import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ScriptLogBase(BaseModel):
    level: str = Field(..., description="Log level (INFO, ERROR, etc.)")
    message: str = Field(..., description="Log message")
    stream: str = Field(..., description="stdout or stderr")


class ScriptLogCreate(ScriptLogBase):
    execution_id: uuid.UUID


class ScriptLogResponse(ScriptLogBase):
    id: uuid.UUID
    execution_id: uuid.UUID
    timestamp: datetime

    model_config = {"from_attributes": True}


class ScriptExecutionBase(BaseModel):
    status: str = Field(
        ...,
        description="Execution status: pending, running, completed, failed, cancelled",
    )
    triggered_by: str = Field(..., description="How execution was triggered: manual, cron, api")


class ScriptExecutionCreate(ScriptExecutionBase):
    script_id: uuid.UUID


class ScriptExecutionUpdate(BaseModel):
    status: Optional[str] = None
    finished_at: Optional[datetime] = None
    exit_code: Optional[int] = None


class ScriptExecutionResponse(ScriptExecutionBase):
    id: uuid.UUID
    script_id: uuid.UUID
    started_at: datetime
    finished_at: Optional[datetime]
    exit_code: Optional[int]

    model_config = {"from_attributes": True}


class ScriptExecutionDetailResponse(ScriptExecutionResponse):
    logs: list[ScriptLogResponse] = []

    model_config = {"from_attributes": True}


class ScriptExecutionListResponse(BaseModel):
    id: uuid.UUID
    script_id: uuid.UUID
    status: str
    triggered_by: str
    started_at: datetime
    finished_at: Optional[datetime]
    exit_code: Optional[int]
    log_count: int = 0

    model_config = {"from_attributes": True}
