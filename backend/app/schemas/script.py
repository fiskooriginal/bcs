import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_serializer, field_validator


class ScriptUpdate(BaseModel):
    cron_expression: Optional[str] = None

    @field_validator("cron_expression")
    @classmethod
    def validate_cron(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            return v.strip()
        return None


class ScriptResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    filename: str
    cron_expression: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, dt: datetime) -> str:
        """Сериализует naive datetime как UTC ISO 8601 с Z суффиксом"""
        return dt.isoformat() + "Z"


class ScriptListResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    filename: str
    cron_expression: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_execution_status: Optional[str] = None
    last_execution_time: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_serializer("created_at", "updated_at", "last_execution_time")
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """Сериализует naive datetime как UTC ISO 8601 с Z суффиксом"""
        if dt is None:
            return None
        return dt.isoformat() + "Z"


class ScriptContentResponse(BaseModel):
    content: str
