import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.utils import utc_now
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.execution import ScriptExecution


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, server_default=None)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cron_expression: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    executions: Mapped[list["ScriptExecution"]] = relationship(
        "ScriptExecution", back_populates="script", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Script(id={self.id}, name={self.name}, is_active={self.is_active})>"
