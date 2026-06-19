"""消息调度器 —— 编排完整的辩论处理流水线。"""

import logging

from .debate_engine import DebateEngine
from .character_engine import CharacterEngine
from .intent_classifier import classify, Intent
from .session_manager import SessionManager
from .prompt_builder import PromptBuilder
from .reply_engine import ReplyEngine

logger = logging.getLogger(__name__)


class Dispatcher:
    """总调度中心。所有消息处理流程在此编排。"""

    def __init__(self,
                 debate_engine: DebateEngine,
                 character_engine: CharacterEngine,
                 session_manager: SessionManager,
                 prompt_builder: PromptBuilder,
                 reply_engine: ReplyEngine,
                 knowledge_manager=None,   # 第二阶段加入
                 feedback_engine=None,      # 第二阶段加入
                 ):
        self.debate_engine = debate_engine
        self.character_engine = character_engine
        self.session_manager = session_manager
        self.prompt_builder = prompt_builder
        self.reply_engine = reply_engine
        self.knowledge_manager = knowledge_manager
        self.feedback_engine = feedback_engine

        # 统计
        self.stats = {"total_debates": 0, "total_replies": 0}

        # 活跃的辩论状态 (内存中)
        self._active_states: dict[str, dict] = {}

    async def handle_start(self, user_id: str, motion: str, user_side: str, mode: str = "free") -> str:
        """开始一场新辩论。返回 debate_id。"""
        state = self.debate_engine.start_debate(mode, motion, user_side)
        debate_id = self.session_manager.create(
            motion=motion,
            user_side=user_side,
            ai_side=state["ai_side"],
            mode=mode,
        )
        self._active_states[debate_id] = state
        self.stats["total_debates"] += 1

        ai_side = state["ai_side"]

        # 正式赛制：AI 先立论
        if state["ai_should_speak_first"]:
            opening_msg = f"好的，我方持{ai_side}立场，开始立论。"
            await self.process_message(debate_id, user_id, opening_msg, role="system")
            ai_opening = await self._generate_and_send(debate_id, user_id, state)
            self.session_manager.add_turn(debate_id, "opening", "ai", ai_opening)

        return debate_id

    async def process_message(self,
                              debate_id: str,
                              user_id: str,
                              content: str,
                              adapter=None,
                              role: str = "user") -> str | None:
        """
        处理一条用户消息。完整流水线：

        1. 记录消息到 session
        2. 更新辩论状态
        3. 意图识别
        4. 处理特殊指令（点评/环节切换）
        5. 构建人格 prompt
        6. 构建完整 prompt
        7. 调用 API 生成回复
        8. 拆条发送
        9. 记录回复 + 更新状态
        """
        state = self._active_states.get(debate_id)
        if state is None:
            logger.warning(f"No active state for debate {debate_id}")
            return None

        debate_context = self.debate_engine.to_dict(state)
        round_name = state["current_round"]

        # ── 1. 记录用户消息 ──
        self.session_manager.add_turn(debate_id, round_name, role, content)

        # ── 2. 更新状态 ──
        state = self.debate_engine.after_user_speak(state)
        self._active_states[debate_id] = state

        # ── 3. 意图识别 ──
        is_first = state["turn_count"] <= 1
        is_opening_round = (state["current_round"] == "opening")
        intent = classify(content, is_first_turn=is_first, is_opening_round=is_opening_round)

        # ── 4. 特殊指令处理 ──
        if intent == Intent.FEEDBACK or state.get("feedback_requested"):
            state["feedback_requested"] = False
            return await self._handle_feedback(debate_id, user_id, state, adapter)

        # ── 5. 构建人格 prompt ──
        character_prompt = self.character_engine.build_character_prompt(debate_context)

        # ── 6. 获取历史 ──
        history = self.session_manager.get_history(debate_id, last_n=20)

        # ── 7. 知识库检索（第二阶段）──
        knowledge = ""
        if self.knowledge_manager:
            side = debate_context.get("ai_side", "")
            knowledge = self.knowledge_manager.query(content, debate_side=side)

        # ── 8. 构建完整 prompt ──
        prompt = self.prompt_builder.build(
            character_prompt=character_prompt,
            debate_context=debate_context,
            history=history,
            user_message=content,
            intent=intent,
            knowledge=knowledge,
        )

        # ── 9. 调用 API + 拆条发送 ──
        if adapter:
            await adapter.send_typing(user_id, True)
            full_reply = await self.reply_engine.generate_stream_split(prompt, adapter, user_id)
            await adapter.send_typing(user_id, False)
        else:
            # 无 adapter 时直接返回（用于内部调用）
            full_reply = await self.reply_engine.generate(prompt)

        # ── 10. 记录 AI 回复 ──
        if full_reply and not full_reply.startswith("["):
            self.session_manager.add_turn(debate_id, round_name, "ai", full_reply)
            self.stats["total_replies"] += 1

        return full_reply

    async def handle_next_round(self, debate_id: str, user_id: str, adapter) -> str | None:
        """正式赛制：进入下一环节。"""
        state = self._active_states.get(debate_id)
        if state is None:
            return None

        state = self.debate_engine.next_round(state)
        if state is None:
            await adapter.send_system(user_id, "辩论已结束（所有环节已完成）")
            return None

        self._active_states[debate_id] = state
        self.session_manager.set_round(debate_id, state["current_round"])

        round_label = self.debate_engine.get_round_label(state)
        await adapter.send_round_change(user_id, state["current_round"], round_label)

        return state["current_round"]

    async def handle_end(self, debate_id: str, user_id: str, adapter) -> str:
        """结束辩论：触发点评 + 标记结束。"""
        state = self._active_states.get(debate_id)
        if state is None:
            return ""

        self.session_manager.end(debate_id)
        feedback = await self._handle_feedback(debate_id, user_id, state, adapter)
        self._active_states.pop(debate_id, None)
        return feedback

    # ── 内部方法 ──

    async def _generate_and_send(self, debate_id: str, user_id: str, state: dict) -> str:
        """内部：构建 prompt 并调用 API（不通过 process_message）。"""
        # 简化版，用于 AI 主动发言（如正式赛制的立论）
        debate_context = self.debate_engine.to_dict(state)
        character_prompt = self.character_engine.build_character_prompt(debate_context)
        history = self.session_manager.get_history(debate_id, last_n=10)

        prompt = self.prompt_builder.build(
            character_prompt=character_prompt,
            debate_context=debate_context,
            history=history,
            user_message=f"请以{state['ai_side']}立场发表{self.debate_engine.get_round_label(state)}",
            intent=Intent.OPENING if state["current_round"] == "opening" else Intent.CHAT,
        )
        return await self.reply_engine.generate(prompt)

    async def _handle_feedback(self, debate_id: str, user_id: str, state: dict, adapter) -> str:
        """生成结构化赛后点评。"""
        await adapter.send_typing(user_id, True)

        debate_context = self.debate_engine.to_dict(state)
        history = self.session_manager.get_history(debate_id, last_n=100)

        history_text = "\n".join(
            f"{'徐经纬' if m['speaker'] == 'ai' else '你'}: {m['content']}" for m in history
        )

        # 知识库参考：检索辩题相关的论点，用于对比
        kb_ref = ""
        if self.knowledge_manager:
            motion = debate_context.get("motion", "")
            if motion:
                kb_ref = self.knowledge_manager.query(motion)

        kb_section = ""
        if kb_ref:
            kb_section = f"""
【该辩题徐经纬的真实论证（供对比参考）】
{kb_ref[:600]}
"""

        feedback_prompt = f"""你是一个资深的辩论教练。现在给一位辩手做赛后复盘。

辩题：{debate_context['motion']}
辩手持{debate_context['user_side']}，AI持{debate_context['ai_side']}
{kb_section}
完整对话记录：
{history_text}

请按以下格式输出一份结构化点评。每一项都要引用对话中的具体原话作为例证：

## 评分卡（每项 1-5 分）

| 维度 | 评分 | 一句话理由 |
|------|------|-----------|
| 论点清晰度 | _ | _ |
| 证据支撑 | _ | _（引用数据的有效性）|
| 逻辑严密性 | _ | _（有没有逻辑漏洞）|
| 反驳有效性 | _ | _（是否正面回应了对方的攻击点）|
| 节奏把控 | _ | _（有没有被对方带着走）|

## 亮点
- 指出 2 个做得好的地方，引用原话

## 问题
- 指出 2 个具体的问题，引用原话，说明为什么是问题

## 改进建议
- 给出 2-3 条具体可行的改进建议。比如换一种论证方式、换个角度、增加什么类型的论据。

## 一句话总结

语气：教练复盘的口吻，直接、具体、不废话。不要泛泛而谈'你可以做得更好'，要说哪里没做好、怎么改。"""

        feedback = await self.reply_engine.generate(feedback_prompt)
        self.session_manager.set_feedback(debate_id, feedback)

        if adapter:
            await adapter.send_feedback(user_id, feedback)

        await adapter.send_typing(user_id, False)
        return feedback
