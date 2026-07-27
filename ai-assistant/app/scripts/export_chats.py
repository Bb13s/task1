"""对话导出脚本 —— 从 data/debates/*.json 导出为训练格式。

用法:
    python -m app.scripts.export_chats --character 徐经纬
    python -m app.scripts.export_chats --character 徐经纬 --debate-id abc123
"""

import os
import json
import argparse
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def export_all(character_name: str, base_dir: Path = BASE_DIR) -> list[Path]:
    """导出所有辩论存档为训练格式，返回导出文件列表。"""
    debates_dir = base_dir / "app" / "data" / "debates"
    if not debates_dir.exists():
        print(f"辩论存档目录不存在: {debates_dir}")
        return []

    out_dir = (base_dir / "app" / "character_data" / character_name /
               "training" / "pending" / "exported_chats")
    out_dir.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    all_pairs = []
    exported_files = []

    for f in sorted(debates_dir.glob("*.json")):
        pairs = export_single(f, character_name)
        all_pairs.extend(pairs)

    if not all_pairs:
        print("没有提取到有效的问答对")
        return []

    # 写入合并文件
    out_path = out_dir / f"exported_{stamp}.md"
    content = f"# 网页对话导出 — {character_name}\n"
    content += f"# 导出时间: {datetime.now().isoformat()}\n"
    content += f"# 共 {len(all_pairs)} 个问答对\n\n"

    for i, (q, a, ctx) in enumerate(all_pairs):
        content += f"## {ctx}\n"
        content += f"问：{q}\n"
        content += f"答：{a}\n\n---\n\n"

    out_path.write_text(content, encoding="utf-8")
    exported_files.append(out_path)
    print(f"导出完成: {out_path} ({len(all_pairs)} 条问答)")

    return exported_files


def export_single(filepath: Path, character_name: str) -> list[tuple]:
    """导出单个辩论存档，返回 [(question, answer, context), ...]."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return []

    motion = data.get("motion", "")
    mode = data.get("mode", "")
    rounds = data.get("rounds", {})

    pairs = []
    for round_name, messages in rounds.items():
        ai_responses = []
        current_user_msg = ""

        for msg in messages:
            speaker = msg.get("speaker", "")
            content = msg.get("content", "").strip()

            if not content:
                continue

            if speaker == "user":
                current_user_msg = content
            elif speaker == "ai" and current_user_msg:
                # 过滤系统消息和错误
                if len(content) < 20:
                    continue
                if content.startswith("[API") or content.startswith("[网络"):
                    continue
                if content.startswith("[Unknown"):
                    continue
                # 过滤纯系统提示
                if any(content.startswith(p) for p in
                       ["好的", "辩题", "已连接", "嗨", "开始"]):
                    if len(content) < 50:
                        continue

                ctx = "闲聊" if mode == "chat" else (motion or round_name)
                pairs.append((current_user_msg, content, ctx))
                current_user_msg = ""

    return pairs


async def main():
    parser = argparse.ArgumentParser(description="导出辩论对话为训练格式")
    parser.add_argument("--character", default="徐经纬",
                        help="目标角色名 (default: 徐经纬)")
    parser.add_argument("--debate-id", default="",
                        help="只导出指定辩论 (默认全部)")
    args = parser.parse_args()

    if args.debate_id:
        path = (BASE_DIR / "app" / "data" / "debates" /
                f"{args.debate_id}.json")
        if not path.exists():
            print(f"辩论不存在: {args.debate_id}")
            return
        pairs = export_single(path, args.character)
        print(f"提取到 {len(pairs)} 条问答")
        for q, a, ctx in pairs:
            print(f"\n[{ctx}]")
            print(f"Q: {q[:80]}...")
            print(f"A: {a[:80]}...")
    else:
        export_all(args.character)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
