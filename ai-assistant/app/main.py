"""FastAPI 主入口 —— 辩论 AI 系统。"""

import json
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader

from .config.loader import init as init_config
from .core.character_engine import CharacterEngine
from .core.debate_engine import DebateEngine
from .core.session_manager import SessionManager
from .core.prompt_builder import PromptBuilder
from .core.reply_engine import ReplyEngine
from .core.dispatcher import Dispatcher
from .core.knowledge_manager import KnowledgeManager
from .adapters.web_adapter import WebAdapter

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)

# ── 路径 ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))      # app/
PROJECT_ROOT = os.path.dirname(BASE_DIR)                    # ai-assistant/

# ── 全局单例 ──
config: dict = {}
dispatcher: Dispatcher = None
adapter: WebAdapter = None
templates: Environment = None
character_engine: CharacterEngine = None
knowledge_manager: KnowledgeManager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global config, dispatcher, adapter, templates, character_engine, knowledge_manager

    logger.info("Starting debate AI...")
    config = init_config()
    settings = config["settings"]
    character_config = config["character"]

    # 初始化所有模块
    debate_engine = DebateEngine()
    character_engine = CharacterEngine(
        character_config=character_config,
        character_data_dir=settings["paths"]["character_data"],
    )
    session_manager = SessionManager(
        data_dir=settings["paths"]["debates"],
        idle_timeout_minutes=settings["session"]["idle_timeout_minutes"],
    )
    prompt_builder = PromptBuilder(settings)
    reply_engine = ReplyEngine(settings)
    adapter = WebAdapter()

    # 知识库
    knowledge_manager = KnowledgeManager(
        kb_dir=settings["paths"]["knowledge_base"],
        data_dir=settings["paths"]["knowledge_data"],
    )
    # 索引知识库 + 角色 speeches 目录
    chars_dir = os.path.join(BASE_DIR, "character_data")
    extra_dirs = []
    if os.path.exists(chars_dir):
        for char_dir in os.listdir(chars_dir):
            speeches_dir = os.path.join(chars_dir, char_dir, "speeches")
            if os.path.isdir(speeches_dir):
                extra_dirs.append(speeches_dir)
    knowledge_manager.index_all(extra_dirs=extra_dirs)
    # 后台文件监控
    import asyncio
    asyncio.create_task(knowledge_manager.watch())

    dispatcher = Dispatcher(
        debate_engine=debate_engine,
        character_engine=character_engine,
        session_manager=session_manager,
        prompt_builder=prompt_builder,
        reply_engine=reply_engine,
        knowledge_manager=knowledge_manager,
    )

    # 模板引擎（直接创建 Environment，绕过 Jinja2Templates 3.1.6 缓存 bug）
    templates = Environment(
        loader=FileSystemLoader(os.path.join(BASE_DIR, "templates")),
        cache_size=0,
        auto_reload=True,
    )

    logger.info(f"角色 '{character_config['name']}' 已加载")
    yield

    # ── shutdown ──
    logger.info("Shutting down...")
    logger.info(f"Stats: {dispatcher.stats}")
    logger.info(f"Tokens used: {reply_engine.total_tokens}")


# ── FastAPI 应用 ──

app = FastAPI(title="辩论 AI", version="3.0", lifespan=lifespan)


@app.get("/")
async def index(request: Request):
    template = templates.get_template("index.html")
    return HTMLResponse(template.render(request=request))


@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.0"}


# ── 管理页面 ──

@app.get("/admin")
async def admin_page(request: Request):
    template = templates.get_template("settings.html")
    return HTMLResponse(template.render(request=request))


# ── 管理 API ──

@app.get("/api/characters")
async def list_characters():
    """列出所有可用的角色。扫描 character_data/ 下包含 style.yaml 的目录。"""
    chars_base = os.path.join(BASE_DIR, "character_data")
    characters = []
    if os.path.exists(chars_base):
        for d in sorted(os.listdir(chars_base)):
            style_path = os.path.join(chars_base, d, "style.yaml")
            if os.path.isfile(style_path):
                import yaml as _yaml
                with open(style_path, "r", encoding="utf-8") as fh:
                    cfg = _yaml.safe_load(fh) or {}
                name = cfg.get("name", d)
                characters.append({
                    "id": d,
                    "name": name,
                    "active": name == character_engine.config.get("name", ""),
                })
    return {"characters": characters}


@app.post("/api/characters/switch")
async def switch_character(data: dict):
    """切换角色。"""
    char_id = data.get("id", "徐经纬")
    path = os.path.join(BASE_DIR, "character_data", char_id, "style.yaml")

    if not os.path.exists(path):
        return {"error": f"角色 '{char_id}' 不存在"}, 404

    import yaml as _yaml
    with open(path, "r", encoding="utf-8") as fh:
        new_config = _yaml.safe_load(fh) or {}

    character_engine.reload(
        new_config,
        character_data_dir=config["settings"]["paths"]["character_data"],
    )
    logger.info(f"角色已切换为: {new_config.get('name', char_id)}")
    return {"status": "ok", "character": new_config.get("name", char_id)}


@app.get("/api/knowledge")
async def knowledge_status():
    """知识库状态。"""
    from fastapi.responses import JSONResponse
    stats = knowledge_manager.get_stats()
    # 列出所有文档
    docs = []
    for path, doc in knowledge_manager._docs.items():
        docs.append({
            "path": str(path),
            "title": str(doc.title),
            "side": str(doc.side),
            "type": str(doc.doc_type),
            "triggers": [str(t) for t in doc.triggers],
        })
    import json as _json
    return JSONResponse(
        content=_json.loads(_json.dumps({"stats": stats, "documents": docs}, ensure_ascii=False))
    )


@app.get("/api/debates")
async def list_debates():
    """列出所有辩论存档。"""
    debates_dir = os.path.join(PROJECT_ROOT, config["settings"]["paths"]["debates"])
    debates = []
    if os.path.exists(debates_dir):
        for f in sorted(os.listdir(debates_dir), reverse=True):
            if f.endswith(".json"):
                import json as _json
                path = os.path.join(debates_dir, f)
                with open(path, "r", encoding="utf-8") as fh:
                    d = _json.load(fh)
                # 计数消息
                total_msgs = sum(len(msgs) for msgs in d.get("rounds", {}).values())
                debates.append({
                    "id": d.get("debate_id", f.replace(".json", "")),
                    "motion": d.get("motion", "闲聊"),
                    "mode": d.get("mode", ""),
                    "user_side": d.get("user_side", ""),
                    "ai_side": d.get("ai_side", ""),
                    "messages": total_msgs,
                    "created": d.get("created_at", ""),
                    "has_feedback": bool(d.get("feedback")),
                })
    return {"debates": debates}


@app.get("/api/debates/{debate_id}")
async def view_debate(debate_id: str):
    """查看单场辩论详情。"""
    debates_dir = os.path.join(PROJECT_ROOT, config["settings"]["paths"]["debates"])
    path = os.path.join(debates_dir, f"{debate_id}.json")
    if not os.path.exists(path):
        return {"error": "辩论不存在"}, 404

    import json as _json
    with open(path, "r", encoding="utf-8") as fh:
        d = _json.load(fh)
    return d


@app.delete("/api/debates/{debate_id}")
async def delete_debate(debate_id: str):
    """删除单场辩论存档。"""
    debates_dir = os.path.join(PROJECT_ROOT, config["settings"]["paths"]["debates"])
    path = os.path.join(debates_dir, f"{debate_id}.json")
    if not os.path.exists(path):
        return {"error": "辩论不存在"}, 404

    os.remove(path)
    logger.info(f"辩论存档已删除: {debate_id}")
    return {"status": "ok"}


app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")


# ── WebSocket ──

@app.websocket("/ws/debate")
async def ws_debate(ws: WebSocket):
    user_id = None
    debate_id = None

    try:
        # 先 accept，再收握手消息
        await ws.accept()

        init_data = await ws.receive_text()
        init_msg = json.loads(init_data)

        if init_msg.get("type") != "connect":
            await ws.close(code=4001, reason="First message must be type:connect")
            return

        user_id = init_msg.get("user_id", "anonymous")
        adapter.register(user_id, ws)
        await adapter.send_system(user_id, "已连接到辩论 AI")

        motion = init_msg.get("motion", "")
        user_side = init_msg.get("user_side", "")
        mode = init_msg.get("mode", "free")

        debate_id = await dispatcher.handle_start(user_id, motion, user_side, mode)
        ai_side = "反方" if user_side == "正方" else "正方"

        # 闲聊模式：简单开聊
        if mode == "chat":
            await ws.send_text(json.dumps({"type": "debate_id", "debate_id": debate_id}, ensure_ascii=False))
            await adapter.send_message(user_id, "嗨，我是小B。聊点什么？", is_split=False)
        else:
            # 辩论模式：发送辩题等信息
            await ws.send_text(json.dumps({"type": "debate_id", "debate_id": debate_id}, ensure_ascii=False))
            await adapter.send_message(user_id,
                f"辩题：{motion}\n你持{user_side}，我持{ai_side}\n开始辩论吧！", is_split=False)

        # 主循环
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type", "chat")

            if msg_type == "chat":
                content = msg.get("content", "").strip()
                if not content:
                    continue
                await dispatcher.process_message(debate_id, user_id, content, adapter)

            elif msg_type == "request_feedback":
                state = dispatcher._active_states.get(debate_id)
                if state:
                    await dispatcher._handle_feedback(debate_id, user_id, state, adapter)

            elif msg_type == "end_debate":
                await dispatcher.handle_end(debate_id, user_id, adapter)
                await adapter.send_system(user_id, "辩论已结束")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user_id}")
    except json.JSONDecodeError:
        if ws.client_state.name != "DISCONNECTED":
            await ws.close(code=4002, reason="Invalid JSON")
    except Exception as e:
        logger.exception(f"WS error: {e}")
    finally:
        if user_id:
            await adapter.disconnect(user_id)
