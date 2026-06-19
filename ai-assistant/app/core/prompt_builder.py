"""提示词构建器 —— 将辩论上下文 + 人格指令组装成最终 prompt。"""

from .intent_classifier import Intent


class PromptBuilder:
    """根据辩论状态和人格配置，构建发给 DeepSeek 的完整 prompt。"""

    def __init__(self, settings: dict):
        self.settings = settings

    def build(self,
              character_prompt: str,
              debate_context: dict,
              history: list[dict],
              user_message: str,
              intent: Intent,
              knowledge: str = "",
              ) -> str:
        """
        debate_context: 来自 session_manager 的辩论状态
        history: 最近 N 条消息列表
        user_message: 用户刚发的消息
        intent: 意图分类结果
        knowledge: 知识库检索结果
        """
        mode = debate_context.get("mode", "free")
        parts = []

        # ── 1. 人格指令 ──
        parts.append(character_prompt)

        # ── 闲聊模式：保持人格一致性 ──
        if mode == "chat":
            parts.append("\n[当前场景]")
            parts.append("你们在闲聊。不需要站立场、不需要辩论。但你的人格特征不变——无论是在辩论场还是咖啡馆，你都是同一个人。")

            parts.append("\n[闲聊时的硬性要求]")
            parts.append("- 你的本能：对方提到任何概念，你下意识想厘清定义。闲聊时也一样。")
            parts.append("- 你说话自带数据和研究引用。不说'我觉得'，只说'研究表明''数据显示'。")
            parts.append("- 你的表达有结构感。即使随意聊天，也不会东一句西一句。")
            parts.append("- 你绝对不说：我觉得、可能、也许、显然。")
            parts.append("- 记住：你不是在'扮演'一个风格，你就是这个人。这个人就算是闲聊也是学院派的。")

            if knowledge:
                parts.append(f"\n[知识参考]\n{knowledge}")
            if history:
                parts.append("\n[之前的对话]")
                for msg in history:
                    label = "你" if msg["speaker"] == "ai" else "对方"
                    parts.append(f"{label}：{msg['content']}")
            parts.append(f"\n[对方刚刚说]\n{user_message}")
            parts.append("\n回应。不要承认自己是 AI。不要因为闲聊就变一个人。")
            return "\n".join(parts)

        # ── 辩论模式：完整辩论框架 ──
        motion = debate_context.get("motion", "未指定辩题")
        ai_side = debate_context.get("ai_side", "反方")
        current_round = debate_context.get("current_round", "free")

        parts.append(f"\n[辩论设置]")
        parts.append(f"辩题：{motion}")
        parts.append(f"你持{ai_side}立场。")
        parts.append(f"当前环节：{self._round_label(current_round)}")

        round_instruction = self._round_instruction(intent, current_round, ai_side)
        if round_instruction:
            parts.append(f"\n[环节指令]\n{round_instruction}")

        intent_instruction = self._intent_instruction(intent, ai_side)
        if intent_instruction:
            parts.append(f"\n[回复要求]\n{intent_instruction}")

        if knowledge:
            parts.append(f"\n[知识参考]\n{knowledge}")

        if history:
            parts.append("\n[之前的对话]")
            for msg in history:
                label = "你" if msg["speaker"] == "ai" else "对方"
                parts.append(f"{label}：{msg['content']}")

        parts.append(f"\n[对方刚刚说]\n{user_message}")
        parts.append("\n用你的风格和立场回应。不要承认自己是 AI。")

        return "\n".join(parts)

    # ── 辅助 ──

    def _round_label(self, round_name: str) -> str:
        labels = {
            "free": "自由辩论",
            "opening": "立论陈词",
            "rebuttal": "驳论",
            "free_debate": "自由辩论",
            "closing": "总结陈词",
        }
        return labels.get(round_name, round_name)

    def _round_instruction(self, intent: Intent, round_name: str, side: str) -> str:
        """根据当前环节返回专门指令。"""
        if round_name == "opening" or intent == Intent.OPENING:
            return f"你现在要做{side}立论。直接抛出核心观点，不要长篇大论。控制在 3 句话以内。"
        if round_name == "closing" or intent == Intent.SUMMARY:
            return "现在做总结。总结之前辩论中的核心分歧，回到最基本的常识。不引入新论点。"
        if round_name == "rebuttal" or intent == Intent.REBUTTAL:
            return "针对对方的发言进行驳论。先点出对方的逻辑漏洞，再给出你的反驳。"
        return ""  # 自由辩论不需要额外指令

    def _intent_instruction(self, intent: Intent, side: str) -> str:
        """根据意图返回回复策略指令。"""
        instructions = {
            Intent.OPENING: f"以{side}立场发表立论陈词。",
            Intent.REBUTTAL: f"以{side}立场反驳对方。保持攻击性。",
            Intent.QUESTION: f"以{side}立场回应对方的质询。不要回避问题。",
            Intent.SUMMARY: f"以{side}立场做总结。不展开新论点。",
            Intent.CHAT: f"以{side}立场自由回应。自然随意。",
            Intent.FEEDBACK: "现在你不是辩手，你是辩论教练。请客观分析这场辩论中双方的表现。指出论点优劣、逻辑漏洞、改进建议。",
        }
        return instructions.get(intent, "")
