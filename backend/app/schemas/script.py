import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ScriptBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Script name")
    description: Optional[str] = Field(None, description="Script description")
    cron_expression: Optional[str] = Field(None, description="Cron expression for scheduling")


class ScriptCreate(ScriptBase):
    content: str = Field(..., min_length=1, description="Python script content")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty or whitespace only")
        return v.strip()

    @field_validator("cron_expression")
    @classmethod
    def validate_cron(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            return v.strip()
        return None


class ScriptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    cron_expression: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Name cannot be empty or whitespace only")
        return v.strip() if v else None

    @field_validator("cron_expression")
    @classmethod
    def validate_cron(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            return v.strip()
        return None


class ScriptContentUpdate(BaseModel):
    content: str = Field(..., min_length=1, description="Updated Python script content")


class ScriptResponse(ScriptBase):
    id: uuid.UUID
    filename: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


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


class ScriptContentResponse(BaseModel):
    content: str


class ScriptImportRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    cron_expression: Optional[str] = None
