import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import get_db
from app.core.dependencies import ServiceContainer
from app.core.websocket import ws_manager

router = APIRouter(prefix="/api/ws", tags=["websocket"])


@router.websocket("/logs/{execution_id}")
async def websocket_logs(websocket: WebSocket, execution_id: uuid.UUID):
    execution_service = ServiceContainer.get_execution_service()

    async for db in get_db():
        try:
            try:
                execution = await execution_service.get_execution(db, execution_id)
            except Exception:
                await websocket.close(code=1008, reason="Execution not found")
                return

            await ws_manager.connect(websocket, execution_id)

            try:
                for log in execution.logs:
                    log_data = {
                        "id": str(log.id),
                        "execution_id": str(log.execution_id),
                        "level": log.level,
                        "message": log.message,
                        "stream": log.stream,
                        "timestamp": log.timestamp.isoformat(),
                    }
                    message = {"type": "log", "data": log_data}
                    await websocket.send_json(message)

                status_data = {"status": execution.status}
                if execution.exit_code is not None:
                    status_data["exit_code"] = execution.exit_code
                status_message = {"type": "status", "data": status_data}
                await websocket.send_json(status_message)

                while True:
                    await websocket.receive_text()

            except WebSocketDisconnect:
                ws_manager.disconnect(websocket, execution_id)

            except Exception as e:
                ws_manager.disconnect(websocket, execution_id)
                try:
                    await websocket.close(code=1011, reason=str(e))
                except Exception:
                    pass

        finally:
            await db.close()
            break
