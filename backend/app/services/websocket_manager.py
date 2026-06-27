import logging
import asyncio
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Maps tool_call_id to pending asyncio futures
        self.pending_approvals: Dict[str, asyncio.Future] = {}

    async def connect(self, user_id: int, websocket: WebSocket, accept_first: bool = True):
        if accept_first:
            await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Active: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}.")

    async def broadcast_to_user(self, user_id: int, message_obj: Dict[str, Any]):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message_obj)
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id}: {e}")

    def register_pending_approval(self, tool_call_id: str, future: asyncio.Future):
        self.pending_approvals[tool_call_id] = future

    def unregister_pending_approval(self, tool_call_id: str):
        if tool_call_id in self.pending_approvals:
            del self.pending_approvals[tool_call_id]

    def get_pending_approval(self, tool_call_id: str) -> asyncio.Future:
        return self.pending_approvals.get(tool_call_id)

    async def wait_for_tool_approval(self, user_id: int, tool_call_id: str, tool_name: str, code: str) -> bool:
        """Sends an approval request to the client and halts tool execution until user response is received."""
        if user_id not in self.active_connections or not self.active_connections[user_id]:
            logger.warning(f"No active WebSocket connections for user {user_id}. Tool approval denied automatically.")
            return False

        loop = asyncio.get_event_loop()
        fut = loop.create_future()
        self.register_pending_approval(tool_call_id, fut)

        logger.info(f"Requesting operator approval for tool '{tool_name}' (ID: {tool_call_id})")
        await self.broadcast_to_user(user_id, {
            "type": "tool_approval_request",
            "tool_call_id": tool_call_id,
            "tool_name": tool_name,
            "code": code
        })

        try:
            # Operator has 60 seconds to respond before timeout aborts execution
            approved = await asyncio.wait_for(fut, timeout=60.0)
            return approved
        except asyncio.TimeoutError:
            logger.warning(f"Operator approval timeout for tool_call_id {tool_call_id}")
            return False
        finally:
            self.unregister_pending_approval(tool_call_id)

manager = ConnectionManager()
