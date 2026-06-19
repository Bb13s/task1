"""辩论意图识别 —— 基于规则的分类器。"""

from enum import Enum


class Intent(Enum):
    OPENING = "opening"           # 立论陈词
    REBUTTAL = "rebuttal"        # 反驳/驳论
    QUESTION = "question"        # 质询/追问
    SUMMARY = "summary"          # 总结陈词
    FEEDBACK = "feedback"        # 请求点评
    CHAT = "chat"                # 普通发言（自由辩论中的常规回应）


# ── 关键词规则 ──

QUESTION_WORDS = ["为什么", "你怎么看", "请问", "你凭什么", "你意思是", "那你觉得",
                   "回答我", "我问你", "能不能解释", "如何", "什么叫", "难道"]
SUMMARY_SIGNALS = ["综上所述", "总得来说", "整体来看", "我方认为", "我方的立场是",
                   "总结", "综上", "归结起来"]
FEEDBACK_SIGNALS = ["点评一下", "给我反馈", "打得怎么样", "分析一下", "评价",
                    "我这轮怎么样", "给点建议", "打分"]
OPENING_SIGNALS = ["我先立论", "我先说", "开始陈词", "我方观点是"]
REBUTTAL_SIGNALS = ["你错了", "不对", "反驳", "你这个论证的问题是", "你凭什么说",
                    "你说的不对", "你这是", "逻辑有问题", "偷换概念", "以偏概全"]


def classify(message: str, is_first_turn: bool = False, is_opening_round: bool = False) -> Intent:
    text = message.strip()

    # 请求点评
    if any(w in text for w in FEEDBACK_SIGNALS):
        return Intent.FEEDBACK

    # 正式赛制的立论环节
    if is_opening_round and len(text) > 30:
        return Intent.OPENING
    if is_first_turn and any(w in text for w in OPENING_SIGNALS):
        return Intent.OPENING

    # 总结信号
    if any(w in text for w in SUMMARY_SIGNALS):
        return Intent.SUMMARY

    # 反驳/驳论信号
    if any(w in text for w in REBUTTAL_SIGNALS):
        return Intent.REBUTTAL

    # 质询信号
    if any(w in text for w in QUESTION_WORDS) and "?" in text or "？" in text:
        return Intent.QUESTION

    # 默认：自由辩论中的普通发言
    return Intent.CHAT
