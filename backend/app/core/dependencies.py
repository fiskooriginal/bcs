from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.services.execution_service import ExecutionService
from app.services.scheduler_service import SchedulerService
from app.services.script_service import ScriptService


class ServiceContainer:
    _script_service: Optional[ScriptService] = None
    _execution_service: Optional[ExecutionService] = None
    _scheduler_service: Optional[SchedulerService] = None

    @classmethod
    def initialize(cls) -> None:
        scripts_dir = Path(settings.scripts_dir)
        scripts_dir.mkdir(parents=True, exist_ok=True)

        cls._script_service = ScriptService(settings.scripts_dir)
        cls._execution_service = ExecutionService(settings.scripts_dir)
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


def get_script_service() -> ScriptService:
    return ServiceContainer.get_script_service()


def get_execution_service() -> ExecutionService:
    return ServiceContainer.get_execution_service()


def get_scheduler_service() -> SchedulerService:
    return ServiceContainer.get_scheduler_service()
