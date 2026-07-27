"""角色蒸馏主脚本 —— 从原始素材中提取角色特征，自动更新 5 个配置文件。

用法:
    python -m app.scripts.distill --character 徐经纬
    python -m app.scripts.distill --character 徐经纬 --dry-run
    python -m app.scripts.distill --character 徐经纬 --steps 2,3
"""

import os
import sys
import re
import yaml as _yaml
from pathlib import Path
from datetime import datetime

from .utils import (
    DeepSeekClient, backup_file, read_file_safe, count_chinese_chars,
    detect_material_type, sample_material_text, move_to_distilled,
    move_to_rejected, load_character_config, load_settings,
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Distiller:
    """蒸馏器 —— 编排 5 步蒸馏管线。"""

    def __init__(self, character_name: str, dry_run: bool = False,
                 max_chars: int = 8000):
        self.character_name = character_name
        self.dry_run = dry_run
        self.max_chars = max_chars

        # 路径
        self.char_dir = (BASE_DIR / "app" / "character_data" / character_name)
        self.training_dir = self.char_dir / "training"
        self.pending_dir = self.training_dir / "pending"
        self.distilled_dir = self.training_dir / "distilled"
        self.rejected_dir = self.training_dir / "rejected"

        # 配置文件路径
        self.persona_path = self.char_dir / "persona.md"
        self.persona_chat_path = self.char_dir / "persona_chat.md"
        self.phrases_path = self.char_dir / "phrases.md"
        self.phrases_chat_path = self.char_dir / "phrases_chat.md"
        self.chats_dir = self.char_dir / "chats"
        self.speeches_dir = self.char_dir / "speeches"
        settings = load_settings(BASE_DIR)
        self.yaml_path = self.char_dir / "style.yaml"

        # API 客户端
        cfg = settings.get("deepseek", {})
        self.client = DeepSeekClient(model=cfg.get("model", "deepseek-v4-flash"))

        # 统计
        self.stats = {"scanned": 0, "processed": 0, "rejected": 0,
                      "api_calls": 0, "files_updated": []}

    # ═══════════════════════════════════════════════════════════
    # Step 1: 扫描素材
    # ═══════════════════════════════════════════════════════════

    async def step1_scan(self) -> list[tuple[Path, str, str]]:
        """扫描 pending/ 目录，返回 [(path, text, material_type), ...]."""
        print("\n" + "=" * 60)
        print("Step 1: 扫描 pending/ 素材")
        print("=" * 60)

        materials = []
        for f in sorted(self.pending_dir.rglob("*")):
            if not f.is_file() or f.name.startswith(".") or f.suffix == ".gitkeep":
                continue

            self.stats["scanned"] += 1
            text = read_file_safe(f)
            if text is None:
                move_to_rejected(f, self.rejected_dir, "无法识别的文件编码")
                self.stats["rejected"] += 1
                print(f"  [FAIL] {f.name} - 编码错误，已移至 rejected/")
                continue

            # 过滤过短内容
            cn_chars = count_chinese_chars(text)
            if cn_chars < 100:
                move_to_rejected(f, self.rejected_dir, f"中文字符过少 ({cn_chars})")
                self.stats["rejected"] += 1
                print(f"  [FAIL] {f.name} - 内容过短 ({cn_chars} 中文字)，已移至 rejected/")
                continue

            mtype = detect_material_type(f, text)
            materials.append((f, text, mtype))
            print(f"  [OK] {f.name} [{mtype}] {cn_chars}字")

        print(f"\n扫描完成: {len(materials)} 有效, {self.stats['rejected']} 拒绝")
        return materials

    # ═══════════════════════════════════════════════════════════
    # Step 2: 提取人格特征 → persona.md
    # ═══════════════════════════════════════════════════════════

    async def step2_extract_persona(self, materials: list[tuple[Path, str, str]]):
        """提取人格特征，更新 persona.md（核心）和 persona_chat.md（闲聊）。"""
        print("\n" + "=" * 60)
        print("Step 2: 提取人格特征 → persona.md + persona_chat.md")
        print("=" * 60)

        if not materials:
            print("  无素材，跳过")
            return

        sampled = sample_material_text(
            [(p, t) for p, t, _ in materials], self.max_chars)

        prompt = f"""你是一位人格分析专家。以下是一个真实人物的对话记录、文章和辩论发言集合。
请从这些材料中提取以下信息，严格基于材料内容，不要编造材料中没有的信息。

[材料内容]
{sampled}

请按以下JSON格式输出（确保是合法的JSON）：
{{
  "identity": "这个人的身份标签（一句话）",
  "core_personality": ["性格特征1", "性格特征2", ...],
  "debate_habits": ["辩论中的习惯1", ...],
  "beliefs_and_values": ["核心观念1", ...],
  "chat_personality": {{
    "casual_style": "闲聊中的说话方式（2-3句话描述他和朋友聊天的样子）",
    "hobbies": ["爱好1", ...],
    "humor": "幽默风格（如有）",
    "weaknesses": ["闲聊时会暴露的小缺点1", ...],
    "how_he_talks_to_friends": "和熟人相处的特征（2-3句话）",
    "chat_taboos": ["闲聊中绝对不要做的事1", ...]
  }}
}}

core_personality 3-5条，debate_habits 和 beliefs_and_values 各3-5条。
chat_personality 中的各项基于材料如实提取，未体现的写"未体现"。"""

        print("  调用 DeepSeek 分析人格...")
        result = self.client.complete_json(prompt, max_tokens=2048, temperature=0.3)
        self.stats["api_calls"] += 1

        # 生成 persona.md（核心+辩论）
        new_core = self._gen_persona_md(result)
        # 生成 persona_chat.md（闲聊专属）
        new_chat = self._gen_persona_chat_md(result)

        print(f"  生成 persona.md ({len(new_core)} 字) + persona_chat.md ({len(new_chat)} 字)")

        if self.dry_run:
            print("\n--- [DRY RUN] persona.md 预览 ---")
            print(new_core[:500])
            print("\n--- [DRY RUN] persona_chat.md 预览 ---")
            print(new_chat[:500])
            print("--- 预览结束 ---")
            return

        backup_file(self.persona_path)
        self.persona_path.write_text(new_core, encoding="utf-8")
        self.stats["files_updated"].append(str(self.persona_path))

        backup_file(self.persona_chat_path)
        self.persona_chat_path.write_text(new_chat, encoding="utf-8")
        self.stats["files_updated"].append(str(self.persona_chat_path))
        print("  [OK] persona.md + persona_chat.md 已更新")

    def _gen_persona_md(self, data: dict) -> str:
        """根据提取结果生成 persona.md（核心人设+辩论习惯）。"""
        name = self.character_name
        identity = data.get("identity", "辩手")
        personality = data.get("core_personality", [])
        habits = data.get("debate_habits", [])
        beliefs = data.get("beliefs_and_values", [])

        parts = [f"# {name} — 核心人设（辩论和闲聊通用）\n"]

        parts.append("## 身份\n")
        parts.append(f"{identity}\n")

        parts.append("## 性格底色\n")
        for p in personality:
            parts.append(f"- {p}")

        parts.append("\n## 辩论习惯\n")
        for h in habits:
            parts.append(f"- {h}")

        parts.append("\n## 他的观念\n")
        for b in beliefs:
            if b != "未体现":
                parts.append(f"- {b}")

        return "\n".join(parts)

    def _gen_persona_chat_md(self, data: dict) -> str:
        """根据提取结果生成 persona_chat.md（闲聊专属人设）。"""
        name = self.character_name
        chat = data.get("chat_personality", {})

        parts = [f"# {name} — 闲聊时的人格\n"]

        parts.append("## 他不是辩论机器\n")
        parts.append("在闲聊中，" + self.character_name +
                    "是一个有学术背景的正常男生，不是在参加辩论赛。他会笑、会自嘲、会说不知道。\n")

        parts.append("## 闲聊中的样子\n")
        casual = chat.get("casual_style", "")
        if casual and casual != "未体现":
            parts.append(f"- {casual}")

        parts.append("\n## 他的兴趣爱好\n")
        hobbies = chat.get("hobbies", [])
        for h in hobbies:
            if h != "未体现":
                parts.append(f"- {h}")

        parts.append("\n## 他和朋友的相处\n")
        friend_style = chat.get("how_he_talks_to_friends", "")
        if friend_style and friend_style != "未体现":
            parts.append(f"- {friend_style}")
        humor = chat.get("humor", "")
        if humor and humor != "未体现":
            parts.append(f"- 幽默风格：{humor}")

        parts.append("\n## 闲聊中显露的小缺点\n")
        weaknesses = chat.get("weaknesses", [])
        for w in weaknesses:
            if w != "未体现":
                parts.append(f"- {w}")

        parts.append("\n## 闲聊中的禁止行为\n")
        taboos = chat.get("chat_taboos", [])
        for t in taboos:
            if t != "未体现":
                parts.append(f"- {t}")

        return "\n".join(parts)

    # ═══════════════════════════════════════════════════════════
    # Step 3: 提取语言风格 → phrases.md + phrases_chat.md + style.yaml
    # ═══════════════════════════════════════════════════════════

    async def step3_extract_style(self, materials: list[tuple[Path, str, str]]):
        """提取语言风格，更新 phrases.md（辩论）、phrases_chat.md（闲聊）和 style.yaml。"""
        print("\n" + "=" * 60)
        print("Step 3: 提取语言风格 → phrases.md + phrases_chat.md + style.yaml")
        print("=" * 60)

        if not materials:
            print("  无素材，跳过")
            return

        sampled = sample_material_text(
            [(p, t) for p, t, _ in materials], self.max_chars)

        prompt = f"""你是一位语言风格分析专家。以下是一个真实人物的发言记录集合。
请提取这个人在辩论中和闲聊中最有个人特色的句式模式。

[材料内容]
{sampled}

请按以下JSON格式输出（确保是合法的JSON）：
{{
  "debate_phrases": {{
    "opening_patterns": ["辩论开篇句式1", ...],
    "argument_patterns": ["论证句式1", ...],
    "rebuttal_patterns": ["反驳句式1", ...],
    "closing_patterns": ["结辩句式1", ...],
    "forbidden_patterns": ["辩论中绝对不会说的句式1", ...]
  }},
  "chat_phrases": {{
    "personal_responses": ["被问个人问题时的回应方式1", ...],
    "opinion_expressions": ["闲聊中表达观点的方式1", ...],
    "admitting_ignorance": ["承认不知道的说法1", ...],
    "asking_back": ["反问对方的方式1", ...],
    "casual_fillers": ["日常感叹和连接词1", ...],
    "self_deprecation": ["自嘲的说法1", ...],
    "chat_forbidden": ["闲聊中绝对不要做的事1", ...]
  }},
  "signature_markers": {{
    "defines_terms_first": true/false,
    "cites_data": true/false,
    "uses_numbered_arguments": true/false,
    "uses_analogy": true/false,
    "uses_rhetorical_question": true/false,
    "ends_with_conclusion": true/false
  }}
}}

各列表3-6条，只提取材料中真实出现的模式。聊天中没有体现的类型写空列表。"""

        print("  调用 DeepSeek 分析语言风格...")
        result = self.client.complete_json(prompt, max_tokens=2048, temperature=0.3)
        self.stats["api_calls"] += 1

        # 3a: 更新 phrases.md（辩论句式）
        self._update_phrases(result.get("debate_phrases", result))
        # 3b: 更新 phrases_chat.md（闲聊句式）
        self._update_phrases_chat(result.get("chat_phrases", {}))
        # 3c: 更新 style.yaml
        self._update_yaml_style(result)

    def _update_phrases(self, data: dict):
        """重新生成 phrases.md。"""
        parts = [f"# {self.character_name}的惯用句式\n"]

        for section, title in [
            ("opening_patterns", "开篇句式"),
            ("argument_patterns", "论证句式"),
            ("rebuttal_patterns", "反驳句式"),
            ("closing_patterns", "结辩句式"),
        ]:
            patterns = data.get(section, [])
            if patterns:
                parts.append(f"\n## {title}\n")
                for p in patterns:
                    if p and p != "未体现":
                        parts.append(f"- {p}")

        forbidden = data.get("forbidden_patterns", [])
        if forbidden:
            parts.append("\n## 不说的句式（禁止）\n")
            for f in forbidden:
                if f and f != "未体现":
                    parts.append(f"- {f}")

        new_content = "\n".join(parts)
        print(f"  生成 phrases.md ({len(new_content)} 字)")

        if self.dry_run:
            print("  [DRY RUN] phrases.md 预览 (前500字):")
            print(new_content[:500])
            return

        backup_file(self.phrases_path)
        self.phrases_path.write_text(new_content, encoding="utf-8")
        self.stats["files_updated"].append(str(self.phrases_path))
        print("  [OK] phrases.md 已更新")

    def _update_phrases_chat(self, data: dict):
        """重新生成 phrases_chat.md（闲聊句式）。"""
        if not data:
            return

        parts = [f"# {self.character_name} — 闲聊时的惯用表达\n"]

        sections = [
            ("personal_responses", "回应个人问题"),
            ("opinion_expressions", "表达观点（闲聊中）"),
            ("admitting_ignorance", "承认不知道"),
            ("asking_back", "反问对方"),
            ("casual_fillers", "聊天中的感叹和连接"),
            ("self_deprecation", "自嘲"),
        ]
        for key, title in sections:
            patterns = data.get(key, [])
            if patterns:
                parts.append(f"\n## {title}\n")
                for p in patterns:
                    if p and p != "未体现":
                        parts.append(f"- {p}")

        forbidden = data.get("chat_forbidden", [])
        if forbidden:
            parts.append("\n## 不说的\n")
            for f in forbidden:
                if f and f != "未体现":
                    parts.append(f"- {f}")

        new_content = "\n".join(parts)
        print(f"  生成 phrases_chat.md ({len(new_content)} 字)")

        if self.dry_run:
            print("  [DRY RUN] phrases_chat.md 预览 (前400字):")
            print(new_content[:400])
            return

        backup_file(self.phrases_chat_path)
        self.phrases_chat_path.write_text(new_content, encoding="utf-8")
        self.stats["files_updated"].append(str(self.phrases_chat_path))
        print("  [OK] phrases_chat.md 已更新")

    def _update_yaml_style(self, data: dict):
        """合并风格标记到 style.yaml 的 style 部分。"""
        config = load_character_config(self.character_name, BASE_DIR)

        markers_data = data.get("signature_markers", {})
        if not markers_data:
            print("  未提取到风格标记，跳过 style.yaml")
            return

        style = config.get("style", {})
        existing_markers = style.get("markers", {})

        # 合并 markers
        for key in ["defines_terms_first", "cites_data",
                     "uses_numbered_arguments", "ends_with_conclusion"]:
            if key in markers_data and markers_data[key] is not None:
                existing_markers[key] = markers_data[key]

        style["markers"] = existing_markers

        # 更新 signature_patterns（如果 extraction 有新的）和 forbidden
        patterns = data.get("argument_patterns", [])
        if patterns:
            existing_sig = style.get("signature_patterns", [])
            for p in patterns[:6]:
                if p not in existing_sig and p != "未体现":
                    existing_sig.append(p)
            style["signature_patterns"] = existing_sig[:10]

        forbidden = data.get("forbidden_patterns", [])
        if forbidden:
            existing_forbidden = style.get("forbidden", [])
            for f in forbidden:
                if f not in existing_forbidden and f != "未体现":
                    existing_forbidden.append(f)
            style["forbidden"] = existing_forbidden

        config["style"] = style
        print(f"  更新 style.yaml 风格标记: {list(markers_data.keys())}")

        if self.dry_run:
            print("  [DRY RUN] style.yaml 不写入")
            return

        backup_file(self.yaml_path)
        with open(self.yaml_path, "w", encoding="utf-8") as f:
            _yaml.dump(config, f, allow_unicode=True, default_flow_style=False,
                      sort_keys=False)
        self.stats["files_updated"].append(str(self.yaml_path))
        print("  [OK] style.yaml 已更新")

    # ═══════════════════════════════════════════════════════════
    # Step 4: 生成聊天示例 → chats/*.md
    # ═══════════════════════════════════════════════════════════

    async def step4_generate_chats(self, materials: list[tuple[Path, str, str]]):
        """提取和生成聊天示例。"""
        print("\n" + "=" * 60)
        print("Step 4: 生成聊天示例 → chats/*.md")
        print("=" * 60)

        # 4a: 从聊天记录素材中直接提取 Q&A 对
        chat_materials = [(p, t) for p, t, m in materials if m == "chat_log"]
        qa_pairs = []

        if chat_materials:
            print(f"  从 {len(chat_materials)} 个聊天记录中提取 Q&A 对...")
            for path, text in chat_materials:
                pairs = self._extract_qa_from_chat(text)
                qa_pairs.extend(pairs)
            print(f"  提取到 {len(qa_pairs)} 个 Q&A 对")

        # 4b: 用 AI 根据人设生成更多 Q&A
        persona_text = ""
        if self.persona_path.exists():
            persona_text = self.persona_path.read_text(encoding="utf-8")

        # 读取已有聊天示例作为参考
        existing_chats = ""
        if self.chats_dir.exists():
            for f in sorted(self.chats_dir.glob("*.md")):
                existing_chats += f"\n{f.read_text(encoding='utf-8')[:1500]}"

        if persona_text:
            prompt = f"""你是一位对话生成专家。以下是关于一个真实人物的完整人设和语言风格描述。
请根据这个人的性格和说话方式，生成8-10个日常闲聊的问答示例。

[人物描述]
{persona_text[:2000]}

[已有聊天示例参考]
{existing_chats[:2000]}

要求：
1. 每个问答中，"问"应该是日常生活中可能出现的自然问题
2. "答"应该严格模仿这个人的语气、思考方式和语言习惯
3. 覆盖不同场景：被问到爱好、被问到观点、被夸赞、被问到失败经历、
   对方突然倾诉烦恼、被问到不熟悉的领域、被开玩笑、被问未来计划
4. 回答长度应该自然地长短交替，不要每个回答都是长篇大论
5. 这个人可以说"我觉得""可能""不知道"——他是真人不是机器
6. 偶尔反问对方——对话是双向的

请按以下格式输出，每个问答以"---"分隔：

## 被问到[场景描述]
问：[问题]
答：[回答]

---

## 被问到[另一个场景]
问：[问题]
答：[回答]
"""

            print("  调用 DeepSeek 生成聊天示例...")
            text = self.client.complete(prompt, max_tokens=4096, temperature=0.5)
            self.stats["api_calls"] += 1
            generated_pairs = self._parse_qa_from_ai_output(text)
            qa_pairs.extend(generated_pairs)
            print(f"  AI 生成 {len(generated_pairs)} 个 Q&A 对")

        if not qa_pairs:
            print("  无生成的 Q&A 对，跳过")
            return

        # 写入新文件
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = self.chats_dir / f"generated_batch_{stamp}.md"
        self.chats_dir.mkdir(parents=True, exist_ok=True)

        content = f"# {self.character_name} — 自动生成的聊天示例\n"
        content += f"# 生成时间: {datetime.now().isoformat()}\n\n"
        for i, (q, a, ctx) in enumerate(qa_pairs):
            content += f"## {ctx or '日常对话'}\n"
            content += f"问：{q}\n"
            content += f"答：{a}\n"
            content += "\n---\n\n"

        print(f"  生成聊天示例文件 ({len(qa_pairs)} 条)")

        if self.dry_run:
            print("  [DRY RUN] chats/ 新文件预览 (前800字):")
            print(content[:800])
            return

        out_path.write_text(content, encoding="utf-8")
        self.stats["files_updated"].append(str(out_path))
        print(f"  [OK] {out_path.name} 已创建")

    def _extract_qa_from_chat(self, text: str) -> list[tuple[str, str, str]]:
        """从聊天记录中提取 Q&A 对。"""
        pairs = []
        # 匹配通用对话格式: 名字：内容 或 名字: 内容
        lines = text.strip().split("\n")
        current_q = None
        current_a = None
        target_names = [self.character_name, "徐经纬", "经纬", "我"]

        for line in lines:
            line = line.strip()
            if not line:
                continue

            m = re.match(r"^(.+?)[：:](.+)", line)
            if not m:
                continue

            speaker = m.group(1).strip()
            content = m.group(2).strip()

            if len(content) < 5:
                continue

            is_target = any(n in speaker for n in target_names)
            is_other = not is_target and len(speaker) < 8

            if is_other and "?" in content or "？" in content or "吗" in content:
                current_q = content
            elif is_target and current_q:
                current_a = content
                ctx = "对话记录"
                pairs.append((current_q, current_a, ctx))
                current_q = None

        return pairs[:10]  # 最多 10 对

    def _parse_qa_from_ai_output(self, text: str) -> list[tuple[str, str, str]]:
        """解析 AI 生成的 Q&A 示例。"""
        pairs = []
        # 按 --- 分割
        blocks = re.split(r"\n---+\n", text)
        for block in blocks:
            ctx = ""
            ctx_m = re.search(r"##\s*(.+)", block)
            if ctx_m:
                ctx = ctx_m.group(1).strip()

            q_m = re.search(r"问[：:]\s*(.+?)(?:\n|$)", block)
            a_m = re.search(r"答[：:]\s*(.+?)(?:\n---|$)", block, re.DOTALL)

            if q_m and a_m:
                q = q_m.group(1).strip()
                a = a_m.group(1).strip()
                if len(q) > 3 and len(a) > 10:
                    pairs.append((q, a, ctx))

        return pairs[:12]

    # ═══════════════════════════════════════════════════════════
    # Step 5: 整理辩论稿 → speeches/*.md
    # ═══════════════════════════════════════════════════════════

    async def step5_extract_speeches(self, materials: list[tuple[Path, str, str]]):
        """整理辩论稿为结构化格式。"""
        print("\n" + "=" * 60)
        print("Step 5: 整理辩论稿 → speeches/*.md")
        print("=" * 60)

        debate_mats = [(p, t) for p, t, m in materials if m == "debate_transcript"]
        if not debate_mats:
            print("  无辩论稿素材，跳过")
            return

        print(f"  处理 {len(debate_mats)} 个辩论稿...")
        processed = 0

        for path, text in debate_mats:
            cn_chars = count_chinese_chars(text)
            if cn_chars < 200:
                continue

            prompt = f"""你是一位辩论稿编辑。以下是一篇辩论发言/辩论记录的原文。
请将其整理为结构化的辩论稿件格式，保留原文的核心论点、数据和论证结构。

[原文]
{text[:4000]}

请输出一个Markdown格式的辩论稿，包含：
1. YAML frontmatter（triggers关键词列表、side立场、type类型）
2. 如有概念定义，整理在"定义"章节
3. 核心论点（按一、二、三标号，每个论点包含数据或引用）
4. 结论章节

注意：严格保留原文的论证内容和数据，不要添加原文中没有的信息。"""

            print(f"    处理: {path.name}...")
            result = self.client.complete(prompt, max_tokens=2048, temperature=0.3)
            self.stats["api_calls"] += 1

            # 清理：确保 frontmatter 是有效的 YAML
            cleaned = self._clean_speech_output(result, path.name)

            out_name = f"extracted_{path.stem}.md"
            out_path = self.speeches_dir / out_name
            self.speeches_dir.mkdir(parents=True, exist_ok=True)

            if not self.dry_run:
                out_path.write_text(cleaned, encoding="utf-8")
                self.stats["files_updated"].append(str(out_path))
                processed += 1
                print(f"    [OK] {out_name}")
            else:
                print(f"    [DRY RUN] → {out_name}")

        print(f"  辩论稿整理完成: {processed} 篇")

    def _clean_speech_output(self, text: str, source_name: str) -> str:
        """清理 AI 输出，确保结构正确。"""
        text = text.strip()
        # 确保有 frontmatter
        if not text.startswith("---"):
            frontmatter = f"""---
triggers: []
side: ""
type: "argument"
source: "{source_name}"
---
"""
            text = frontmatter + text
        return text

    # ═══════════════════════════════════════════════════════════
    # 主流程
    # ═══════════════════════════════════════════════════════════

    async def run(self, steps: list[int]):
        """执行指定的蒸馏步骤。"""
        start_time = datetime.now()
        print(f"\n{'=' * 60}")
        print(f"  角色蒸馏管线 — {self.character_name}")
        print(f"  {'[DRY RUN - 仅预览]' if self.dry_run else '[正式运行]'}")
        print(f"  步骤: {steps}")
        print(f"{'=' * 60}")

        # Step 1 必须先执行（提供 materials 给后续步骤）
        materials = []
        if 1 in steps:
            materials = await self.step1_scan()

        if not materials and any(s in steps for s in [2, 3, 4, 5]):
            print("\n[WARN] 无有效素材，跳过提取步骤")
            return

        for step in sorted(steps):
            if step == 2:
                await self.step2_extract_persona(materials)
            elif step == 3:
                await self.step3_extract_style(materials)
            elif step == 4:
                await self.step4_generate_chats(materials)
            elif step == 5:
                await self.step5_extract_speeches(materials)

        # 移动已处理的素材
        if not self.dry_run and materials:
            for path, _, _ in materials:
                try:
                    move_to_distilled(path, self.distilled_dir)
                    self.stats["processed"] += 1
                except Exception:
                    pass

        # 打印摘要
        elapsed = (datetime.now() - start_time).total_seconds()
        print(f"\n{'=' * 60}")
        print(f"  蒸馏完成 ({elapsed:.1f}s)")
        print(f"  API 调用: {self.stats['api_calls']} 次")
        print(f"  文件更新: {len(self.stats['files_updated'])} 个")
        for f in self.stats['files_updated']:
            print(f"    - {f}")
        print(f"  素材处理: {self.stats['processed']} / "
              f"跳过: {self.stats['rejected']}")
        if self.dry_run:
            print(f"\n  [WARN] 这是 DRY RUN，所有文件均未实际修改。")
        print(f"{'=' * 60}\n")


# ═══════════════════════════════════════════════════════════════
# CLI 入口
# ═══════════════════════════════════════════════════════════════

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="角色蒸馏管线")
    parser.add_argument("--character", default="徐经纬",
                        help="目标角色名 (default: 徐经纬)")
    parser.add_argument("--dry-run", action="store_true",
                        help="预览模式，不实际写入文件")
    parser.add_argument("--steps", default="1,2,3,4,5",
                        help="要运行的步骤，逗号分隔 (default: 1,2,3,4,5)")
    parser.add_argument("--max-chars", type=int, default=8000,
                        help="每次 API 调用最大字符数 (default: 8000)")
    args = parser.parse_args()

    steps = [int(s.strip()) for s in args.steps.split(",") if s.strip()]
    distiller = Distiller(
        character_name=args.character,
        dry_run=args.dry_run,
        max_chars=args.max_chars,
    )
    await distiller.run(steps)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
