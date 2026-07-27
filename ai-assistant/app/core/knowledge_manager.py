"""知识库引擎 —— ChromaDB 语义搜索 + SQLite FTS5 关键词搜索。

工作原理：
1. 启动时扫描 knowledge_base/ 下所有 .md 文件
2. 解析 frontmatter 中的 triggers 字段
3. 向量化正文存入 ChromaDB，关键词存入 SQLite FTS5
4. query(msg) → 检查 triggers 是否命中 → 命中后混合检索 → 返回相关片段
"""

import os
import re
import yaml
import asyncio
import logging
from pathlib import Path
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# 延迟导入重型依赖
_import_errors = {}


@dataclass
class KnowledgeDoc:
    """知识库文档。"""
    path: str
    triggers: list[str] = field(default_factory=list)
    side: str = ""
    doc_type: str = "argument"
    title: str = ""
    content: str = ""


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    """解析 Markdown 的 YAML frontmatter。"""
    text = text.strip()
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    try:
        meta = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        meta = {}
    return meta, parts[2].strip()


class KnowledgeManager:
    """管理知识库的索引和检索。"""

    def __init__(self, kb_dir: str, data_dir: str):
        self.kb_dir = Path(kb_dir)
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self._docs: dict[str, KnowledgeDoc] = {}  # path → doc
        self._fts_ready = False

        # SQLite FTS5 路径
        self._db_path = self.data_dir / "knowledge.db"

        # 延迟初始化 ChromaDB（重型依赖）
        self._chroma = None
        self._embed_fn = None

    # ── 初始化 ──

    def _ensure_deps(self):
        """延迟导入重型依赖，避免启动时阻塞。"""
        global _import_errors
        if self._chroma is None:
            try:
                import chromadb
                from chromadb.config import Settings
                self._chroma = chromadb.PersistentClient(
                    path=str(self.data_dir / "chroma"),
                    settings=Settings(anonymized_telemetry=False),
                )
                collection_name = "debate_knowledge"
                # 删除旧 collection 确保重建（开发阶段）
                try:
                    self._chroma.delete_collection(collection_name)
                except Exception:
                    pass
                self._collection = self._chroma.get_or_create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"},
                )
            except Exception as e:
                _import_errors["chromadb"] = str(e)
                logger.warning(f"ChromaDB 初始化失败（将仅使用关键词搜索）: {e}")

        if self._embed_fn is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._embed_fn = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            except Exception as e:
                _import_errors["embedding"] = str(e)
                logger.warning(f"嵌入模型加载失败（将仅使用关键词搜索）: {e}")

    # ── 索引 ──

    def index_all(self, extra_dirs: list = None):
        """全量索引 knowledge_base/ 和额外目录下所有 .md 文件。"""
        self._ensure_deps()
        self._docs.clear()

        dirs = [self.kb_dir]
        if extra_dirs:
            dirs.extend(Path(d) for d in extra_dirs if Path(d).exists())

        for d in dirs:
            logger.info(f"索引: {d}")
            for md_file in sorted(d.rglob("*.md")):
                self._index_file(md_file, rel_base=d)

        # 重建 FTS5
        self._rebuild_fts()

        # 重建 ChromaDB
        if self._embed_fn and self._chroma:
            self._rebuild_chroma()

        logger.info(f"知识库索引完成，共 {len(self._docs)} 篇文档")

    def _index_file(self, filepath: Path, rel_base: Path = None):
        """索引单个文件。rel_base 用于计算相对路径，默认使用 self.kb_dir。"""
        try:
            text = filepath.read_text(encoding="utf-8")
        except Exception:
            return

        meta, content = _parse_frontmatter(text)
        if not content.strip():
            return

        triggers = meta.get("triggers", [])
        if isinstance(triggers, str):
            triggers = [triggers]

        # 从文件名和目录名中提取中文触发词（过滤英文路径碎片和角色名）
        auto_triggers = set()
        for part in filepath.parts:
            for match in re.findall(r"[\u4e00-\u9fff]{2,}", part):
                # 排除 speeches/character_data 等目录名和已知角色名
                if match in ("徐经纬", "小王", "speeches", "character_data", "knowledge_base"):
                    continue
                auto_triggers.add(match)

        all_triggers = list(set(triggers + list(auto_triggers)))

        # 计算文档 key：优先用相对路径，否则用文件名
        base = rel_base or self.kb_dir
        try:
            doc_key = str(filepath.relative_to(base))
        except ValueError:
            parent_name = filepath.parent.name if filepath.parent.name else ""
            doc_key = f"{parent_name}/{filepath.name}" if parent_name else filepath.name

        doc = KnowledgeDoc(
            path=doc_key,
            triggers=all_triggers,
            side=meta.get("side", "通用"),
            doc_type=meta.get("type", "argument"),
            title=self._extract_title(content),
            content=content,
        )
        self._docs[doc_key] = doc

    def _extract_title(self, content: str) -> str:
        """从 Markdown 中提取标题。"""
        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("# "):
                return line[2:].strip()
        return ""

    def _rebuild_fts(self):
        """重建 SQLite FTS5 全文索引。"""
        try:
            import sqlite3
            conn = sqlite3.connect(str(self._db_path))
            conn.execute("DROP TABLE IF EXISTS kb_fts")
            conn.execute("""
                CREATE VIRTUAL TABLE kb_fts USING fts5(
                    path, triggers, title, content, tokenize='unicode61'
                )
            """)
            for doc in self._docs.values():
                conn.execute(
                    "INSERT INTO kb_fts VALUES (?, ?, ?, ?)",
                    (doc.path, " ".join(doc.triggers), doc.title, doc.content),
                )
            conn.commit()
            conn.close()
            self._fts_ready = True
        except Exception as e:
            logger.warning(f"FTS5 索引构建失败: {e}")
            self._fts_ready = False

    def _rebuild_chroma(self):
        """重建 ChromaDB 向量索引。"""
        try:
            docs = list(self._docs.values())
            if not docs:
                return

            ids = [d.path for d in docs]
            texts = [d.content[:2000] for d in docs]  # 向量化前 2000 字
            metadatas = [
                {"side": d.side, "type": d.doc_type, "title": d.title}
                for d in docs
            ]
            embeddings = self._embed_fn.encode(texts, show_progress_bar=False)

            # 清空并重建
            self._collection.delete(ids=self._collection.get().get("ids", []))
            self._collection.add(
                ids=ids,
                embeddings=embeddings.tolist(),
                documents=texts,
                metadatas=metadatas,
            )
        except Exception as e:
            logger.warning(f"ChromaDB 重建失败: {e}")

    # ── 检索 ──

    def query(self, user_message: str, debate_side: str = None) -> str:
        """
        检索与用户消息相关的知识。

        流程：
        1. 检查消息中是否包含任何文档的 trigger 关键词
        2. 如果命中 → 进行 FTS5 精确搜索 + ChromaDB 语义搜索
        3. 返回拼接后的知识片段
        """
        if not self._docs:
            return ""

        # Step 1: 检查触发器
        triggered_docs = self._match_triggers(user_message)
        if not triggered_docs:
            return ""

        # Step 2: FTS5 关键词搜索
        fts_results = self._fts_search(user_message, limit=3)

        # Step 3: ChromaDB 语义搜索
        chroma_results = self._chroma_search(user_message, limit=3)

        # Step 4: 合并结果
        seen = set()
        results = []

        # 优先显示触发匹配的文档
        for doc in triggered_docs:
            if doc.path not in seen:
                side_tag = f"[{doc.side}]" if doc.side != "通用" else ""
                results.append(f"{side_tag} {doc.title}\n{doc.content[:500]}")
                seen.add(doc.path)

        # 补充 FTS 结果
        for doc in fts_results:
            if doc.path not in seen and len(results) < 5:
                results.append(f"{doc.title}\n{doc.content[:400]}")
                seen.add(doc.path)

        # 补充向量搜索结果
        for doc in chroma_results:
            if doc.path not in seen and len(results) < 5:
                results.append(f"{doc.title}\n{doc.content[:400]}")
                seen.add(doc.path)

        if not results:
            return ""

        return "\n\n---\n\n".join(results)

    def _match_triggers(self, message: str) -> list[KnowledgeDoc]:
        """查找 trigger 匹配的文档。"""
        matched = []
        for doc in self._docs.values():
            for trigger in doc.triggers:
                if len(trigger) >= 2 and trigger in message:
                    matched.append(doc)
                    break
        return matched

    def _fts_search(self, query: str, limit: int = 3) -> list[KnowledgeDoc]:
        """SQLite FTS5 全文搜索。"""
        if not self._fts_ready:
            return []
        try:
            import sqlite3
            conn = sqlite3.connect(str(self._db_path))
            # 使用简单匹配
            terms = " OR ".join(re.split(r"\s+", query.strip()))
            sql = "SELECT path FROM kb_fts WHERE kb_fts MATCH ? LIMIT ?"
            rows = conn.execute(sql, (terms, limit)).fetchall()
            conn.close()
            return [self._docs[r[0]] for r in rows if r[0] in self._docs]
        except Exception:
            return []

    def _chroma_search(self, query: str, limit: int = 3) -> list[KnowledgeDoc]:
        """ChromaDB 语义搜索。"""
        if not self._embed_fn or not self._chroma:
            return []
        try:
            embedding = self._embed_fn.encode([query], show_progress_bar=False)
            results = self._collection.query(
                query_embeddings=embedding.tolist(),
                n_results=min(limit, len(self._docs)),
            )
            docs = []
            for doc_id in results.get("ids", [[]])[0]:
                if doc_id in self._docs:
                    docs.append(self._docs[doc_id])
            return docs
        except Exception:
            return []

    def get_motions(self) -> list[str]:
        """获取所有辩题目录名。"""
        motions_dir = self.kb_dir / "motions"
        if not motions_dir.exists():
            return []
        return [d.name for d in sorted(motions_dir.iterdir()) if d.is_dir()]

    def get_stats(self) -> dict:
        """获取知识库状态。"""
        return {
            "total_docs": len(self._docs),
            "fts_ready": self._fts_ready,
            "chroma_ready": self._chroma is not None and self._embed_fn is not None,
            "motions": self.get_motions(),
        }

    # ── 热更新 ──

    async def watch(self):
        """文件监控（后台任务）。"""
        try:
            from watchfiles import awatch
            async for changes in awatch(str(self.kb_dir)):
                changed = False
                for _, path in changes:
                    if path.endswith(".md"):
                        self._index_file(Path(path))
                        changed = True
                if changed:
                    self._rebuild_fts()
                    if self._embed_fn and self._chroma:
                        self._rebuild_chroma()
                    logger.info(f"知识库热更新完成 ({len(changes)} 变更)")
        except ImportError:
            logger.warning("watchfiles 未安装，热更新不可用")
            await asyncio.Event().wait()  # 永远等待
