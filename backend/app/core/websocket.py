import uuid

from fastapi import WebSocket

from app.models.execution import ScriptLog


class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[uuid.UUID, set[WebSocket]] = {}
        self.global_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, execution_id: uuid.UUID):
        await websocket.accept()

        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = set()

        self.active_connections[execution_id].add(websocket)

    def disconnect(self, websocket: WebSocket, execution_id: uuid.UUID):
        if execution_id in self.active_connections:
            self.active_connections[execution_id].discard(websocket)

            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

    async def broadcast_log(self, execution_id: uuid.UUID, log: ScriptLog):
        if execution_id not in self.active_connections:
            return

        log_data = {
            "id": str(log.id),
            "execution_id": str(log.execution_id),
            "level": log.level,
            "message": log.message,
            "stream": log.stream,
            "timestamp": log.timestamp.isoformat(),
        }

        message = {"type": "log", "data": log_data}

        disconnected = set()

        for connection in self.active_connections[execution_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        for connection in disconnected:
            self.disconnect(connection, execution_id)

    async def broadcast_status(self, execution_id: uuid.UUID, status: str, exit_code: int | None = None):
        if execution_id not in self.active_connections:
            return

        status_data = {"status": status}
        if exit_code is not None:
            status_data["exit_code"] = exit_code

        message = {"type": "status", "data": status_data}

        disconnected = set()

        for connection in self.active_connections[execution_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        for connection in disconnected:
            self.disconnect(connection, execution_id)

    def connect_global(self, websocket: WebSocket) -> None:
        self.global_connections.add(websocket)

    def disconnect_global(self, websocket: WebSocket) -> None:
        self.global_connections.discard(websocket)

    async def broadcast_execution_update(
        self,
        script_id: uuid.UUID,
        execution_id: uuid.UUID,
        event: str,
        status: str | None = None,
        exit_code: int | None = None,
    ) -> None:
        if not self.global_connections:
            return

        data: dict = {
            "script_id": str(script_id),
            "execution_id": str(execution_id),
            "event": event,
        }
        if status is not None:
            data["status"] = status
        if exit_code is not None:
            data["exit_code"] = exit_code

        message = {"type": "execution_update", "data": data}
        disconnected: set[WebSocket] = set()

        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        for connection in disconnected:
            self.disconnect_global(connection)


ws_manager = WebSocketManager()
