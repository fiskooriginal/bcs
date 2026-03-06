from pathlib import Path

from app.core.config import settings
from app.core.database import async_session_factory
from app.services.execution_service import ExecutionService
from app.services.scheduler_service import SchedulerService
from app.services.script_service import ScriptService


class ServiceContainer:
    _script_service: ScriptService | None = None
    _execution_service: ExecutionService | None = None
    _scheduler_service: SchedulerService | None = None

    @classmethod
    def initialize(cls) -> None:
        scripts_dir = Path(settings.scripts_dir)
        scripts_dir.mkdir(parents=True, exist_ok=True)

        cls._script_service = ScriptService(settings.scripts_dir)
        cls._execution_service = ExecutionService(settings.scripts_dir, async_session_factory)
        cls._scheduler_service = SchedulerService(execution_service=cls._execution_service)

    @classmethod
    def get_script_service(cls) -> ScriptService:
        if cls._script_service is None:
            raise RuntimeError("ServiceContainer is not initialized")
        return cls._script_service

    @classmethod
    def get_execution_service(cls) -> ExecutionService:
        if cls._execution_service is None:
            raise RuntimeError("ServiceContainer is not initialized")
        return cls._execution_service

    @classmethod
    def get_scheduler_service(cls) -> SchedulerService:
        if cls._scheduler_service is None:
            raise RuntimeError("ServiceContainer is not initialized")
        return cls._scheduler_service
