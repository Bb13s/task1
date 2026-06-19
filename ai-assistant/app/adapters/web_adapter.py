"""WebSocket 连接管理器 —— 管理用户 WebSocket 连接、消息下发。"""

import json
import logging
from datetime import datetime, timezone
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebAdapter:
    """管理 WebSocket 连接，处理消息的收发协议。"""

    def __init__(self):
        self._connections: dict[str, WebSocket] = {}   # user_id → websocket

    async def connect(self, user_id: str, ws: WebSocket):
        """先 accept 再注册。"""
        await ws.accept()
        self._connections[user_id] = ws
        await self.send_system(user_id, "已连接到辩论 AI")

    def register(self, user_id: str, ws: WebSocket):
        """仅注册（WebSocket 已被 accept）。"""
        self._connections[user_id] = ws

    async def disconnect(self, user_id: str):
        self._connections.pop(user_id, None)

    def is_connected(self, user_id: str) -> bool:
        return user_id in self._connections

    # ── 发送方法 ──

    async def _send(self, user_id: str, payload: dict):
        ws = self._connections.get(user_id)
        if ws is None:
            return
        try:
            await ws.send_text(json.dumps(payload, ensure_ascii=False))
        except Exception:
            logger.warning(f"Failed to send to {user_id}")

    async def send_message(self, user_id: str, content: str,
                           is_split: bool = False, part_index: int = 0, total_parts: int = 1):
        await self._send(user_id, {
            "type": "message",
            "sender": "ai",
            "content": content,
            "is_split": is_split,
            "part_index": part_index,
            "total_parts": total_parts,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    async def send_typing(self, user_id: str, is_typing: bool):
        await self._send(user_id, {"type": "typing", "is_typing": is_typing})

    async def send_error(self, user_id: str, message: str):
        await self._send(user_id, {"type": "error", "message": message})

    async def send_system(self, user_id: str, content: str):
        await self._send(user_id, {"type": "system", "content": content})

    async def send_round_change(self, user_id: str, round_name: str, label: str):
        await self._send(user_id, {"type": "round_change", "round": round_name, "label": label})

    async def send_feedback(self, user_id: str, content: str):
        await self._send(user_id, {"type": "feedback", "content": content})
