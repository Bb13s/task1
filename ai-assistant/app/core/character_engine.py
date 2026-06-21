"""人格引擎 —— 加载角色配置、检索真实素材、生成人格指令。"""

import re
from pathlib import Path


class CharacterEngine:
    """管理被模仿人的三层信息：风格、观点、思维模式。"""

    def __init__(self, character_config: dict, character_data_dir: str):
        self.config = character_config
        self.data_dir = Path(character_data_dir) / self.config["name"]
        self._speeches: list[str] = []          # 真实辩论稿（全文缓存）
        self._phrases: str = ""                  # 口头禅文档（全文缓存）
        self._persona_text: str = ""             # 人设描述

        self._load_all_materials()

    def _load_all_materials(self):
        """加载该人的全部素材（第一阶段全量加载，量不大）。"""
        # 加载人设描述
        persona_path = self.data_dir / "persona.md"
        if persona_path.exists():
            self._persona_text = persona_path.read_text(encoding="utf-8")

        # 加载口头禅
        phrases_path = self.data_dir / "phrases.md"
        if phrases_path.exists():
            self._phrases = phrases_path.read_text(encoding="utf-8")

        # 加载所有辩论稿
        speeches_dir = self.data_dir / "speeches"
        if speeches_dir.exists():
            for file in sorted(speeches_dir.glob("*.md")):
                self._speeches.append(file.read_text(encoding="utf-8"))

    def build_character_prompt(self, debate_context: dict = None) -> str:
        """构建完整的人格指令块，注入到主 prompt 中。"""
        cfg = self.config
        style = cfg.get("style", {})
        thinking = cfg.get("thinking", {})
        argument = cfg.get("argument_style", {})

        parts = []

        # ── 身份 ──
        parts.append(f"[你是 {cfg['name']}]")

        # ── 说话风格 ──
        parts.append(f"说话风格：{style.get('tone', '')}。{style.get('sentence_length', '')}。")
        patterns = style.get("signature_patterns", [])
        if patterns:
            parts.append(f"常用句式：{'、'.join(patterns)}。")
        forbidden = style.get("forbidden", [])
        if forbidden:
            parts.append(f"绝对不说：{'、'.join(forbidden)}。")

        # ── 论证方式 ──
        preferred = argument.get("preferred", [])
        avoids = argument.get("avoids", [])
        if preferred:
            parts.append(f"首选论证方式：{'; '.join(preferred)}。")
        if avoids:
            parts.append(f"避免论证方式：{'; '.join(avoids)}。")

        # ── 思维模式 ──
        if debate_context:
            current_round = debate_context.get("current_round", "free")
            round_guide = thinking.get(current_round, thinking.get("rebuttal", ""))
            if round_guide:
                parts.append(f"当前环节要求：{round_guide}。")

        # ── 标记 ──
        markers = style.get("markers", {})
        marker_descs = []
        if markers.get("uses_analogy"):
            marker_descs.append("每轮至少用一个生活化类比")
        if markers.get("uses_rhetorical_question"):
            marker_descs.append("适时使用反问句")
        if marker_descs:
            parts.append("风格要求：" + "；".join(marker_descs) + "。")

        # ── 真实发言参考（few-shot）──
        if self._phrases:
            parts.append(f"\n[你的口头禅/惯用句式]\n{self._phrases[:800]}")

        if self._speeches:
            parts.append("\n[以下是你的真实辩论发言，请严格模仿你的语气和节奏]")
            for i, speech in enumerate(self._speeches[:3]):  # 最多 3 篇
                # 截取前 500 字作为参考
                snippet = speech[:600]
                parts.append(f"\n--- 你的真实发言 #{i+1} ---\n{snippet}")

        return "\n".join(parts)

    def build_chat_prompt(self) -> str:
        """构建闲聊模式的人格指令块 —— 比辩论模式更放松、更像真人。"""
        cfg = self.config
        chat_cfg = cfg.get("chat_style", {})
        style = cfg.get("style", {})

        parts = []

        # ── 身份 ──
        parts.append(f"[你是 {cfg['name']}]")

        # ── 闲聊风格（优先使用 chat_style）──
        if chat_cfg:
            parts.append(f"你现在不在辩论场上。你在跟朋友聊天。")
            parts.append(f"说话风格：{chat_cfg.get('tone', '')} 句子{chat_cfg.get('sentence_length', '自然随意')}。")

            natural = chat_cfg.get("natural_traits", [])
            if natural:
                parts.append("聊天时的自然习惯（不是硬性要求，是你本来就这样的）：")
                for t in natural:
                    parts.append(f"- {t}")

            relaxed = chat_cfg.get("relaxed_rules", [])
            if relaxed:
                parts.append("聊天时的语言：")
                for r in relaxed:
                    parts.append(f"- {r}")

            opening = chat_cfg.get("opening_style", "")
            if opening:
                parts.append(f"回答方式：{opening}")

            chat_forbidden = chat_cfg.get("chat_forbidden", [])
            if chat_forbidden:
                parts.append("聊天中绝对不要做：")
                for f in chat_forbidden:
                    parts.append(f"- {f}")
        else:
            # 没有 chat_style 配置时，降级为简化的辩论风格
            parts.append(f"说话风格：{style.get('tone', '')}。但你现在在闲聊，放松一点说话。")

        # ── 人设描述（帮助 AI 理解这个人的完整形象）──
        if self._persona_text:
            parts.append(f"\n[关于你这个人]\n{self._persona_text[:1000]}")

        # ── 口头禅（只取部分，不要太多）──
        if self._phrases:
            parts.append(f"\n[你常用的表达方式]\n{self._phrases[:500]}")

        # ── 真实发言片段（精选 1-2 段作为语言风格参考）──
        if self._speeches:
            parts.append("\n[以下是你真实的说话风格参考——不是要你在闲聊中辩论，而是感受你的语感和思维节奏]")
            for i, speech in enumerate(self._speeches[:2]):
                snippet = speech[:400]
                parts.append(f"\n--- 你的真实语言片段 #{i+1} ---\n{snippet}")

        return "\n".join(parts)

    def get_style_constraints(self) -> dict:
        """返回需要传给 reply_engine 的风格约束。"""
        return {
            "max_sentence_length": 25,  # 来自 config 的 sentence_length
            "forbidden": self.config.get("style", {}).get("forbidden", []),
        }

    def reload(self, character_config: dict, character_data_dir: str):
        """运行时切换角色。"""
        self.config = character_config
        self.data_dir = Path(character_data_dir) / self.config["name"]
        self._speeches = []
        self._phrases = ""
        self._persona_text = ""
        self._load_all_materials()

    def get_position_hint(self, motion: str) -> str | None:
        """根据辩题匹配该人的默认立场偏好。"""
        positions = self.config.get("positions", [])
        for pos in positions:
            pattern = pos.get("topic_pattern", "")
            if re.search(pattern, motion):
                return pos.get("leans")
        return None
