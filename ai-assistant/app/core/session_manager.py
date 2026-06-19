"""辩论场次管理 —— 每场辩论存为一个独立 JSON 文件。"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path


class SessionManager:
    """按场次管理辩论记录。"""

    def __init__(self, data_dir: str, idle_timeout_minutes: int = 60, max_messages: int = 200):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.idle_timeout = idle_timeout_minutes * 60
        self.max_messages = max_messages
        self._active: dict[str, dict] = {}

    def create(self, motion: str, user_side: str, ai_side: str, mode: str) -> str:
        debate_id = uuid.uuid4().hex[:12]
        debate = {
            "debate_id": debate_id,
            "motion": motion,
            "user_side": user_side,
            "ai_side": ai_side,
            "mode": mode,                       # "free" or "formal"
            "current_round": "free" if mode == "free" else "opening",
            "rounds": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_active": datetime.now(timezone.utc).isoformat(),
            "ended_at": None,
            "feedback": None,
        }
        self._active[debate_id] = debate
        self._save(debate_id)
        return debate_id

    def get(self, debate_id: str) -> dict | None:
        if debate_id in self._active:
            return self._active[debate_id]
        path = self.data_dir / f"{debate_id}.json"
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                self._active[debate_id] = json.load(f)
            return self._active[debate_id]
        return None

    def add_turn(self, debate_id: str, round_name: str, speaker: str, content: str):
        debate = self._active.get(debate_id) or self.get(debate_id)
        if debate is None:
            raise ValueError(f"Debate {debate_id} not found")

        debate.setdefault("rounds", {}).setdefault(round_name, [])
        debate["rounds"][round_name].append({
            "speaker": speaker,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        debate["last_active"] = datetime.now(timezone.utc).isoformat()
        self._save(debate_id)

    def set_round(self, debate_id: str, round_name: str):
        debate = self._active.get(debate_id) or self.get(debate_id)
        if debate:
            debate["current_round"] = round_name
            self._save(debate_id)

    def end(self, debate_id: str):
        debate = self._active.get(debate_id) or self.get(debate_id)
        if debate:
            debate["ended_at"] = datetime.now(timezone.utc).isoformat()
            self._save(debate_id)

    def set_feedback(self, debate_id: str, feedback: str):
        debate = self._active.get(debate_id) or self.get(debate_id)
        if debate:
            debate["feedback"] = feedback
            self._save(debate_id)

    def get_history(self, debate_id: str, last_n: int = 20) -> list[dict]:
        """获取最近 N 条对话记录，返回扁平消息列表。"""
        debate = self._active.get(debate_id) or self.get(debate_id)
        if not debate:
            return []
        messages = []
        for round_msgs in debate.get("rounds", {}).values():
            messages.extend(round_msgs)
        return messages[-last_n:]

    def is_expired(self, debate_id: str) -> bool:
        debate = self._active.get(debate_id) or self.get(debate_id)
        if not debate or debate.get("ended_at"):
            return debate.get("ended_at") is not None
        last = datetime.fromisoformat(debate["last_active"])
        elapsed = (datetime.now(timezone.utc) - last).total_seconds()
        return elapsed > self.idle_timeout

    def _save(self, debate_id: str):
        if debate_id in self._active:
            path = self.data_dir / f"{debate_id}.json"
            with open(path, "w", encoding="utf-8") as f:
                json.dump(self._active[debate_id], f, ensure_ascii=False, indent=2)
