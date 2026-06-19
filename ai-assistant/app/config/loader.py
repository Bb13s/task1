"""统一配置加载器。支持 YAML + .env 环境变量。"""

import os
import yaml
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = Path(__file__).resolve().parent


def _load_yaml(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def init():
    """初始化：加载 .env 和所有配置文件。返回全局配置字典。"""
    load_dotenv(BASE_DIR / ".env")

    return {
        "settings": _load_yaml(CONFIG_DIR / "settings.yaml"),
        "character": _load_yaml(CONFIG_DIR / "characters" / "default.yaml"),
    }
