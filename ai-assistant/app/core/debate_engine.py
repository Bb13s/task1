"""辩论引擎 —— 辩论状态机，管理模式/环节切换/计时。"""


class DebateEngine:
    """管理辩论流程的核心状态机。

    三种模式：
    - 闲聊：无辩题无立场，纯人格聊天
    - 自由辩论：无限轮次，用户随时发言
    """

    def __init__(self):
        pass

    def start_debate(self, mode: str, motion: str, user_side: str) -> dict:
        """创建一场新辩论/对话，返回初始状态。"""
        if mode == "chat":
            return {
                "mode": "chat",
                "motion": "",
                "user_side": "",
                "ai_side": "",
                "current_round": "chat",
                "turn_count": 0,
                "ai_should_speak_first": False,
                "feedback_requested": False,
            }

        ai_side = "反方" if user_side == "正方" else "正方"
        return {
            "mode": mode,
            "motion": motion,
            "user_side": user_side,
            "ai_side": ai_side,
            "current_round": "free",
            "turn_count": 0,
            "ai_should_speak_first": False,
            "feedback_requested": False,
        }

    def after_user_speak(self, state: dict) -> dict:
        """用户发言后，更新状态，返回更新后的状态。"""
        state["turn_count"] += 1
        return state

    def next_round(self, state: dict) -> dict | None:
        """正式赛制：进入下一环节。返回更新后的 state，无下一环节返回 None。"""
        if state["mode"] != "formal":
            return None

        flow = self.FORMAL_FLOW
        current = state["current_round"]
        try:
            idx = flow.index(current)
        except ValueError:
            return None

        if idx + 1 >= len(flow):
            return None  # 已经是最后一个环节

        state["current_round"] = flow[idx + 1]
        return state

    def request_feedback(self, state: dict) -> dict:
        """标记为请求点评。"""
        state["feedback_requested"] = True
        return state

    def end_debate(self, state: dict) -> dict:
        """结束辩论。"""
        state["feedback_requested"] = True  # 结束时自动触发点评
        return state

    def get_round_label(self, state: dict) -> str:
        labels = {
            "free": "自由辩论",
            "opening": "立论陈词",
            "rebuttal": "驳论",
            "free_debate": "自由辩论",
            "closing": "总结陈词",
        }
        return labels.get(state["current_round"], state["current_round"])

    def to_dict(self, state: dict) -> dict:
        """将内部状态转为可存入 session 的 dict。"""
        return {
            "motion": state["motion"],
            "user_side": state["user_side"],
            "ai_side": state["ai_side"],
            "mode": state["mode"],
            "current_round": state["current_round"],
        }
