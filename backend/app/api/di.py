from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import ServiceContainer
from app.services.execution_service import ExecutionService
from app.services.scheduler_service import SchedulerService
from app.services.script_service import ScriptService


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session


def get_script_service() -> ScriptService:
    return ServiceContainer.get_script_service()


def get_execution_service() -> ExecutionService:
    return ServiceContainer.get_execution_service()


def get_scheduler_service() -> SchedulerService:
    return ServiceContainer.get_scheduler_service()
