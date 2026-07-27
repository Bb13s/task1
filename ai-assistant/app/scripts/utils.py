"""蒸馏管线工具模块。"""

import os
import re
import json
import time
import shutil
from pathlib import Path
from datetime import datetime
import httpx
from dotenv import load_dotenv

# 自动加载 .env
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BASE_DIR / ".env")


# ═══════════════════════════════════════════════════════════════
# DeepSeek API 客户端（同步版，用于离线脚本）
# ═══════════════════════════════════════════════════════════════

class DeepSeekClient:
    """同步调用 DeepSeek API 的轻量客户端。"""

    def __init__(self, api_key: str = "", base_url: str = "",
                 model: str = "deepseek-v4-flash"):
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY", "")
        self.base_url = (base_url or os.getenv("DEEPSEEK_BASE_URL",
                          "https://api.deepseek.com/v1"))
        self.model = model

    def complete(self, prompt: str, max_tokens: int = 2048,
                 temperature: float = 0.3) -> str:
        """发送请求，返回原始文本。"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        for attempt in range(3):
            try:
                resp = httpx.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers, json=payload, timeout=60.0,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                if attempt == 2:
                    raise RuntimeError(f"DeepSeek API 调用失败: {e}")
                time.sleep(2 ** attempt)
        return ""

    def complete_json(self, prompt: str, max_tokens: int = 2048,
                      temperature: float = 0.3) -> dict:
        """调用 API 并解析 JSON 结果，失败自动重试。"""
        for attempt in range(3):
            try:
                text = self.complete(prompt, max_tokens, temperature)
                return self._parse_json(text)
            except (json.JSONDecodeError, RuntimeError) as e:
                if attempt == 2:
                    raise RuntimeError(f"JSON 解析失败（已重试3次）: {e}")
                # 加强 prompt 重试
                if "请输出合法的JSON" not in prompt:
                    prompt += "\n\n警告：你上次的输出不是合法的JSON。请务必只输出JSON，不要加任何解释。"

    @staticmethod
    def _parse_json(text: str) -> dict:
        """从文本中提取 JSON（兼容 markdown 代码块包裹）。"""
        text = text.strip()
        # 去除 markdown 代码块
        m = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if m:
            text = m.group(1).strip()
        # 找到第一个 { 到最后一个 }
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            raise json.JSONDecodeError("No JSON object found", text, 0)
        return json.loads(text[start:end + 1])


# ═══════════════════════════════════════════════════════════════
# 文件工具
# ═══════════════════════════════════════════════════════════════

def backup_file(filepath: Path) -> Path:
    """创建带时间戳的备份文件。"""
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = filepath.with_suffix(f"{filepath.suffix}.bak.{stamp}")
    if filepath.exists():
        shutil.copy2(filepath, bak)
    return bak


def read_file_safe(filepath: Path) -> str | None:
    """安全读取文件，自动尝试多种编码。"""
    for enc in ["utf-8", "gbk", "gb18030", "utf-16"]:
        try:
            return filepath.read_text(encoding=enc)
        except (UnicodeDecodeError, UnicodeError):
            continue
    return None


def count_chinese_chars(text: str) -> int:
    """统计中文字符数（用于估算 token）。"""
    return len(re.findall(r"[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]", text))


def detect_material_type(filepath: Path, text: str) -> str:
    """检测素材类型。"""
    name = filepath.stem.lower()
    path_str = str(filepath).lower()

    if any(k in name for k in ["chat", "聊天", "对话", "微信", "qq", "wechat"]):
        return "chat_log"
    if any(k in path_str for k in ["chat_log", "exported_chat"]):
        return "chat_log"
    if any(k in name for k in ["debate", "辩论", "辩", "陈词", "一辩", "二辩"]):
        return "debate_transcript"
    if any(k in path_str for k in ["debate_transcript", "speech"]):
        return "debate_transcript"
    if any(k in name for k in ["article", "文章", "稿", "essay", "post"]):
        return "article"
    if any(k in path_str for k in ["article", "web_archive"]):
        return "article"

    # 启发式检测：检查是否有多轮对话标记
    dialogue_markers = len(re.findall(r"[：:][^\n]{3,50}", text))
    if dialogue_markers >= 5:
        return "chat_log"

    # 检查是否有辩论特征
    if re.search(r"(正方|反方|辩题|立论|驳论|总结)", text):
        return "debate_transcript"

    return "raw"


def sample_material_text(materials: list[tuple[Path, str]],
                         max_chars: int = 8000) -> str:
    """从多个素材中均匀采样，控制在 max_chars 以内。"""
    if not materials:
        return ""

    # 按文件大小均匀分配配额
    total_size = sum(len(t) for _, t in materials)
    if total_size == 0:
        return ""

    parts = []
    for filepath, text in materials:
        quota = max(500, int(max_chars * len(text) / total_size))
        # 采样：取开头 40% + 结尾 20% + 中间 40%
        text = text.strip()
        if len(text) <= quota:
            parts.append(f"\n--- {filepath.name} ---\n{text}")
        else:
            head = int(quota * 0.4)
            tail = int(quota * 0.2)
            mid_start = len(text) // 2 - int(quota * 0.2)
            sampled = (text[:head] + "\n\n...\n\n" +
                       text[mid_start:mid_start + int(quota * 0.4)] +
                       "\n\n...\n\n" + text[-tail:])
            parts.append(f"\n--- {filepath.name} (sampled) ---\n{sampled}")

    return "\n".join(parts)


def move_to_distilled(src: Path, distilled_dir: Path) -> Path:
    """移动已处理文件到 distilled/，保持子目录结构。"""
    rel = src.relative_to(src.parents[2])  # relative to training/
    dst = distilled_dir.parent / "distilled" / rel.name
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))
    return dst


def move_to_rejected(src: Path, rejected_dir: Path, reason: str) -> Path:
    """移动失败文件到 rejected/。"""
    dst = rejected_dir / src.name
    shutil.move(str(src), str(dst))
    # 写拒绝原因
    note = dst.with_suffix(".rejection_reason.txt")
    note.write_text(reason, encoding="utf-8")
    return dst


# ═══════════════════════════════════════════════════════════════
# 配置加载
# ═══════════════════════════════════════════════════════════════

def load_character_config(character_name: str, base_dir: Path) -> dict:
    """加载角色 YAML 配置（character_data/{name}/style.yaml）。"""
    import yaml as _yaml
    config_path = base_dir / "app" / "character_data" / character_name / "style.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"角色配置文件不存在: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        return _yaml.safe_load(f) or {}


def load_settings(base_dir: Path) -> dict:
    """加载 settings.yaml。"""
    import yaml as _yaml
    settings_path = base_dir / "app" / "config" / "settings.yaml"
    with open(settings_path, "r", encoding="utf-8") as f:
        return _yaml.safe_load(f) or {}
