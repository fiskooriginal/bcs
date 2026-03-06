import uuid
from typing import Dict, Set

from fastapi import WebSocket

from app.models.execution import ScriptLog


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, Set[WebSocket]] = {}

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

        disconnected = set()

        for connection in self.active_connections[execution_id]:
            try:
                await connection.send_json(log_data)
            except Exception:
                disconnected.add(connection)

        for connection in disconnected:
            self.disconnect(connection, execution_id)


ws_manager = WebSocketManager()
