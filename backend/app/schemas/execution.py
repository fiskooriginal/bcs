import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_serializer


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

    @field_serializer("timestamp")
    def serialize_datetime(self, dt: datetime) -> str:
        """Сериализует naive datetime как UTC ISO 8601 с Z суффиксом"""
        return dt.isoformat() + "Z"


class ScriptExecutionBase(BaseModel):
    status: str = Field(
        ...,
        description="Execution status: pending, running, completed, failed, cancelled",
    )
    triggered_by: str = Field(..., description="How execution was triggered: manual, cron, api")


class ScriptExecutionCreate(ScriptExecutionBase):
    script_id: uuid.UUID


class ScriptExecutionUpdate(BaseModel):
    status: str | None = None
    finished_at: datetime | None = None
    exit_code: int | None = None


class ScriptExecutionResponse(ScriptExecutionBase):
    id: uuid.UUID
    script_id: uuid.UUID
    started_at: datetime
    finished_at: datetime | None
    exit_code: int | None

    model_config = {"from_attributes": True}

    @field_serializer("started_at", "finished_at")
    def serialize_datetime(self, dt: datetime | None) -> str | None:
        """Сериализует naive datetime как UTC ISO 8601 с Z суффиксом"""
        if dt is None:
            return None
        return dt.isoformat() + "Z"


class ScriptExecutionDetailResponse(ScriptExecutionResponse):
    logs: list[ScriptLogResponse] = []

    model_config = {"from_attributes": True}


class ScriptExecutionListResponse(BaseModel):
    id: uuid.UUID
    script_id: uuid.UUID
    status: str
    triggered_by: str
    started_at: datetime
    finished_at: datetime | None
    exit_code: int | None
    log_count: int = 0

    model_config = {"from_attributes": True}

    @field_serializer("started_at", "finished_at")
    def serialize_datetime(self, dt: datetime | None) -> str | None:
        """Сериализует naive datetime как UTC ISO 8601 с Z суффиксом"""
        if dt is None:
            return None
        return dt.isoformat() + "Z"
