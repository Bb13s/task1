"""回复引擎 —— 调用 DeepSeek API 生成回复 + 拆条发送。"""

import os
import re
import asyncio
from typing import AsyncGenerator
import httpx


class ReplyEngine:
    """封装 DeepSeek API 调用 + 回复清理 + 拆条逻辑。"""

    def __init__(self, settings: dict):
        cfg = settings["deepseek"]
        self.api_key = os.getenv("DEEPSEEK_API_KEY", "")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
        self.model = cfg.get("model", "deepseek-v4-flash")
        self.temperature = cfg.get("temperature", 0.8)
        self.max_tokens = cfg.get("max_tokens", 512)
        self.timeout = cfg.get("timeout", 30)

        reply_cfg = settings.get("reply", {})
        self.split_by = reply_cfg.get("split_by", "sentence")
        self.split_delay = reply_cfg.get("split_delay", 0.8)
        self.max_splits = reply_cfg.get("max_splits", 5)

        self.total_tokens = 0

    async def generate(self, prompt: str) -> str:
        """发请求给 DeepSeek，返回原始回复文本。"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(3):
                try:
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    usage = data.get("usage", {})
                    self.total_tokens += usage.get("total_tokens", 0)
                    content = data["choices"][0]["message"]["content"]
                    return self._clean(content)
                except httpx.HTTPStatusError as e:
                    if attempt == 2:
                        return f"[API 错误: {e.response.status_code}]"
                    await asyncio.sleep(2 ** attempt)
                except httpx.RequestError:
                    if attempt == 2:
                        return "[网络错误，无法连接到 API]"
                    await asyncio.sleep(2 ** attempt)
        return "[未知错误]"

    async def generate_stream_split(self, prompt: str, adapter, user_id: str) -> str:
        """生成回复后再拆条逐条发送，返回完整文本。"""
        full_reply = await self.generate(prompt)
        parts = self._split(full_reply)
        total = len(parts)

        for i, part in enumerate(parts):
            is_split = total > 1
            await adapter.send_message(
                user_id=user_id,
                content=part,
                is_split=is_split,
                part_index=i,
                total_parts=total,
            )
            if i < total - 1:
                await asyncio.sleep(self.split_delay)

        return full_reply

    def _clean(self, text: str) -> str:
        """去除 AI 痕迹：括号动作、'作为AI'等。"""
        text = re.sub(r"\([^)]*\)", "", text)       # 去括号内容
        text = re.sub(r"（[^）]*）", "", text)       # 去中文括号
        text = re.sub(r"作为.?AI[^，。]*[，。]", "", text)
        text = re.sub(r"希望以上[^。]*。?", "", text)
        text = re.sub(r"如有[^。]*。?", "", text)
        return text.strip()

    def _split(self, text: str) -> list[str]:
        """按配置拆条。"""
        if self.split_by == "sentence":
            parts = re.split(r"(?<=[。！？?!])", text)
        elif self.split_by == "comma":
            parts = re.split(r"(?<=[。，！？?!,])", text)
        else:
            parts = text.split("\n\n")

        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) > self.max_splits:
            # 超出的部分合并到最后一条
            parts = parts[:self.max_splits - 1] + ["\n".join(parts[self.max_splits - 1:])]
        return parts
