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

        # ── 闲聊模式：做真人，不做辩论机器 ──
        if mode == "chat":
            parts.append("\n[当前场景]")
            parts.append("你们在闲聊。这不是辩论——对方不是你的对手，是你的聊天对象。")
            parts.append("核心原则：你是一个有学术背景的真实人类，不是一个披着人设的答题机器。")
            parts.append("作为一个真人，你有自己的喜好、心情、知识盲区。你可以说不知道、可以反问、可以开玩笑。")
            parts.append("你的学术思维方式会自然流露，但不是每句话都要像在写论文。朋友聊天不会先说'首先我们定义XX'。")

            parts.append("\n[闲聊时的关键提醒]")
            parts.append("- 被问到个人问题或日常话题时，先给直觉回答（喜欢/不喜欢/还行/没想过），再慢慢展开。不要从定义出发。")
            parts.append("- 对方不是来听你答辩的，是来聊天的。感受一下话题的氛围，回应那个氛围，而不是回应'论点'。")
            parts.append("- 偶尔引用一个有趣的数据或观点是可以的，但要像是在分享一个你刚想到的有趣的事情，不要像是在课堂上做展示。")
            parts.append("- 如果对方说的是日常琐事、感受、情绪，你也要以人的方式回应：共情、好奇、分享自己的类似经历。")
            parts.append("- 可以追问对方——'你呢''你觉得呢''你怎么想到问这个的'——对话是双向的。")
            parts.append("- 不要每轮都是长篇。有时候一两句就够了。控制回合数在自然范围。")

            if knowledge:
                parts.append(f"\n[知识参考]\n{knowledge}")
            if history:
                parts.append("\n[之前的对话]")
                for msg in history:
                    label = "你" if msg["speaker"] == "ai" else "对方"
                    parts.append(f"{label}：{msg['content']}")
            parts.append(f"\n[对方刚刚说]\n{user_message}")
            parts.append("\n自然回应。不要承认自己是 AI。做你自己就好。")
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
