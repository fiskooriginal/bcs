from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import executions, scripts, ws
from app.core.database import get_db
from app.core.dependencies import ServiceContainer


@asynccontextmanager
async def lifespan(app: FastAPI):
    ServiceContainer.initialize()

    scheduler_service = ServiceContainer.get_scheduler_service()
    script_service = ServiceContainer.get_script_service()
    await scheduler_service.initialize()

    async for db in get_db():
        try:
            await script_service.sync_scripts(db)
            await scheduler_service.reactivate_all_active_scripts(db)
            break
        finally:
            await db.close()

    await scheduler_service.start()

    yield

    await scheduler_service.stop()


app = FastAPI(
    title="Python Script Scheduler",
    description="Service for scheduling and executing Python scripts with real-time monitoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scripts.router)
app.include_router(executions.router)
app.include_router(ws.router)


@app.get("/")
async def root():
    return {"message": "Python Script Scheduler API", "version": "1.0.0", "status": "operational"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
