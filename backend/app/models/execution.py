import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.utils import utc_now
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.script import Script


class ScriptExecution(Base):
    __tablename__ = "script_executions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, server_default=None)
    script_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scripts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    triggered_by: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    exit_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    script: Mapped["Script"] = relationship("Script", back_populates="executions")
    logs: Mapped[list["ScriptLog"]] = relationship(
        "ScriptLog",
        back_populates="execution",
        cascade="all, delete-orphan",
        order_by="ScriptLog.timestamp",
    )

    def __repr__(self) -> str:
        return f"<ScriptExecution(id={self.id}, script_id={self.script_id}, status={self.status})>"


class ScriptLog(Base):
    __tablename__ = "script_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, server_default=None)
    execution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("script_executions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    stream: Mapped[str] = mapped_column(String(10), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False, index=True)
    execution: Mapped["ScriptExecution"] = relationship("ScriptExecution", back_populates="logs")

    def __repr__(self) -> str:
        return f"<ScriptLog(id={self.id}, execution_id={self.execution_id}, stream={self.stream})>"
