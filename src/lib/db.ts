import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'notehub.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      folder_path TEXT DEFAULT '/',
      author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_public INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_path);
    CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
    CREATE INDEX IF NOT EXISTS idx_folders_author ON folders(author);

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      folder_path TEXT DEFAULT '/',
      note_id INTEGER,
      uploaded_by TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_public INTEGER DEFAULT 0,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_files_note ON files(note_id);
    CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_files_public ON files(is_public);
  `);

  console.log('Database initialized successfully');

  // 迁移：确保 files 表有 is_public 列
  try {
    const columns = db.prepare('PRAGMA table_info(files)').all() as { name: string }[];
    const hasIsPublic = columns.some(col => col.name === 'is_public');
    if (!hasIsPublic) {
      db.exec('ALTER TABLE files ADD COLUMN is_public INTEGER DEFAULT 0');
      db.exec('CREATE INDEX IF NOT EXISTS idx_files_public ON files(is_public)');
      console.log('Added is_public column to files table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

export interface Note {
  id: number;
  title: string;
  content: string;
  folder_path: string;
  author: string;
  created_at: string;
  is_public: number;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  author: string;
  created_at: string;
}

export interface FileRecord {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  folder_path: string;
  note_id: number | null;
  uploaded_by: string;
  uploaded_at: string;
  is_public: number;
}

export function getPublicNotes(): Note[] {
  const stmt = db.prepare(
    'SELECT * FROM notes WHERE is_public = 1 ORDER BY created_at DESC'
  );
  return stmt.all() as Note[];
}

import bcrypt from 'bcryptjs';

export function seedData() {
  // 确保 demo 用户存在（用于向后兼容已有数据）
  const demoUser = getUserByUsername('demo');
  if (!demoUser) {
    // 创建 demo 用户，密码也是 demo，使用 bcrypt 哈希
    const passwordHash = bcrypt.hashSync('demo', 10);
    createUser('demo', passwordHash, 'demo@example.com');
    console.log('Demo user created');
  }

  const folderCount = db.prepare('SELECT COUNT(*) as count FROM folders').get() as { count: number };

  if (folderCount.count === 0) {
    // 清理旧笔记数据，重新初始化
    db.exec('DELETE FROM notes');
    // 创建初始文件夹结构
    const insertFolder = db.prepare(
      'INSERT INTO folders (name, parent_id, author) VALUES (?, ?, ?)'
    );

    // 根级文件夹
    const courseFolder = insertFolder.run('课程笔记', null, 'demo');
    const paperFolder = insertFolder.run('论文阅读', null, 'demo');
    const techFolder = insertFolder.run('技术', null, 'demo');

    // 子文件夹 - 课程笔记下
    const mathFolder = insertFolder.run('数学', Number(courseFolder.lastInsertRowid), 'demo');
    const csFolder = insertFolder.run('计算机', Number(courseFolder.lastInsertRowid), 'demo');

    // 子文件夹 - 论文阅读下
    const aiFolder = insertFolder.run('人工智能', Number(paperFolder.lastInsertRowid), 'demo');
    const systemFolder = insertFolder.run('系统架构', Number(paperFolder.lastInsertRowid), 'demo');

    // 子子文件夹 - 数学下
    const calculusFolder = insertFolder.run('微积分', Number(mathFolder.lastInsertRowid), 'demo');
    const linearAlgebraFolder = insertFolder.run('线性代数', Number(mathFolder.lastInsertRowid), 'demo');

    // 子子文件夹 - 计算机下
    const algoFolder = insertFolder.run('算法', Number(csFolder.lastInsertRowid), 'demo');
    const networkFolder = insertFolder.run('网络', Number(csFolder.lastInsertRowid), 'demo');

    console.log('Folders created: 课程笔记, 论文阅读, 技术, 数学, 计算机, AI, 系统架构, 微积分, 线性代数, 算法, 网络');

    // 创建初始笔记
    const insertNote = db.prepare(
      'INSERT INTO notes (title, content, folder_path, author, is_public) VALUES (?, ?, ?, ?, ?)'
    );

    const notes = [
      {
        title: '极限与连续',
        content: '# 极限与连续\n\n## 极限的定义\n\n设函数 $f(x)$ 在点 $x_0$ 的某个去心邻域内有定义，如果存在常数 $A$，对于任意给定的正数 $\varepsilon$，总存在正数 $\delta$，使得当 $0 < |x - x_0| < \delta$ 时，有 $|f(x) - A| < \varepsilon$，则称 $A$ 为 $f(x)$ 当 $x \\to x_0$ 时的极限。\n\n## 连续性\n\n函数 $f(x)$ 在点 $x_0$ 处连续，当且仅当：\n$$\\lim_{x \\to x_0} f(x) = f(x_0)$$\n\n## 重要定理\n1. 闭区间上连续函数必有最大值和最小值\n2. 介值定理\n3. 零点存在定理',
        folder_path: '/课程笔记/数学/微积分',
        author: 'demo',
        is_public: 1,
      },
      {
        title: '矩阵运算基础',
        content: '# 矩阵运算基础\n\n## 矩阵乘法\n\n设 $A$ 是 $m \\times n$ 矩阵，$B$ 是 $n \\times p$ 矩阵，则乘积 $C = AB$ 是 $m \\times p$ 矩阵，其中：\n\n$$C_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}$$\n\n## 特征值与特征向量\n\n对于方阵 $A$，若存在非零向量 $v$ 和标量 $\lambda$ 使得：\n\n$$Av = \\lambda v$$\n\n则称 $\lambda$ 为 $A$ 的特征值，$v$ 为对应的特征向量。',
        folder_path: '/课程笔记/数学/线性代数',
        author: 'demo',
        is_public: 1,
      },
      {
        title: '动态规划入门',
        content: '# 动态规划入门\n\n## 核心思想\n\n动态规划（Dynamic Programming）是一种通过把原问题分解为相对简单的子问题的方式来求解复杂问题的方法。\n\n## 基本步骤\n\n1. **定义状态**：确定dp数组的含义\n2. **状态转移方程**：找出状态之间的关系\n3. **初始化**：设置边界条件\n4. **计算顺序**：确定遍历方向\n\n## 经典例题\n\n### 斐波那契数列\n```python\ndef fib(n):\n    if n <= 1: return n\n    dp = [0] * (n + 1)\n    dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i-1] + dp[i-2]\n    return dp[n]\n```\n\n### 背包问题\n状态定义：`dp[i][j]` 表示前 i 个物品，容量为 j 时的最大价值',
        folder_path: '/课程笔记/计算机/算法',
        author: 'demo',
        is_public: 1,
      },
      {
        title: 'TCP/IP 协议栈',
        content: '# TCP/IP 协议栈\n\n## 四层模型\n\n| 层次 | 协议 | 功能 |\n|------|------|------|\n| 应用层 | HTTP, FTP, SMTP | 应用程序接口 |\n| 传输层 | TCP, UDP | 端到端通信 |\n| 网络层 | IP, ICMP | 寻址和路由 |\n| 链路层 | Ethernet, WiFi | 物理传输 |\n\n## TCP 三次握手\n\n```\n客户端                    服务器\n  |    SYN, seq=x          |\n  | ----------------------> |\n  |    SYN-ACK, seq=y, ack=x+1 |\n  | <---------------------- |\n  |    ACK, ack=y+1        |\n  | ----------------------> |\n  |                        |\n  |    连接建立             |\n```\n\n## 流量控制与拥塞控制\n- 滑动窗口机制\n- 慢启动\n- 拥塞避免\n- 快重传与快恢复',
        folder_path: '/课程笔记/计算机/网络',
        author: 'demo',
        is_public: 1,
      },
      {
        title: 'Attention Is All You Need 阅读笔记',
        content: '# Attention Is All You Need\n\n> Vaswani et al., 2017\n\n## 核心贡献\n\n提出了 **Transformer** 架构，完全基于注意力机制，摒弃了 RNN 和 CNN。\n\n## 架构概览\n\n```\nInput Embedding\n      ↓\nPositional Encoding\n      ↓\n  ┌─────────┐\n  │ Encoder │ × N\n  └────┬────┘\n       ↓\n  ┌─────────┐\n  │ Decoder │ × N\n  └────┬────┘\n       ↓\nLinear + Softmax\n```\n\n## Self-Attention 机制\n\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\n\n### 为什么除以 $\sqrt{d_k}$？\n\n当 $d_k$ 较大时，点积的数值会很大，导致 softmax 进入梯度饱和区。缩放因子可以保持梯度稳定。\n\n## 多头注意力\n\n将注意力计算分解到多个子空间，允许模型同时关注不同位置的不同表示子空间的信息。',
        folder_path: '/论文阅读/人工智能',
        author: 'demo',
        is_public: 1,
      },
      {
        title: 'MapReduce: Simplified Data Processing',
        content: '# MapReduce: Simplified Data Processing on Large Clusters\n\n> Dean & Ghemawat, OSDI 2004\n\n## 核心思想\n\n将大规模数据处理抽象为两个操作：\n- **Map**：将输入数据转换为键值对\n- **Reduce**：按键聚合处理\n\n## Word Count 示例\n\n```python\n# Map 函数\ndef map(document_id, document_content):\n    for word in document_content.split():\n        emit(word, 1)\n\n# Reduce 函数  \ndef reduce(word, counts):\n    emit(word, sum(counts))\n```\n\n## 系统架构\n\n1. **Master** 节点协调任务调度\n2. **Worker** 节点执行 Map/Reduce 任务\n3. 中间结果通过 **shuffle** 阶段传递\n4. 自动处理故障恢复\n\n## 关键优化\n- Combiner：在 Map 端局部聚合\n- Partitioner：控制数据分布\n- Speculative execution：处理慢节点',
        folder_path: '/论文阅读/系统架构',
        author: 'demo',
        is_public: 1,
      },
      {
        title: 'Next.js 14 学习笔记',
        content: '# Next.js 14 学习笔记\n\nNext.js 14 引入了许多新特性：\n\n## App Router\n- 基于文件系统的路由\n- 支持布局嵌套\n- 加载和错误状态\n\n## Server Components\n- 默认服务端渲染\n- 减少客户端 JavaScript\n- 更好的性能\n\n## Server Actions\n可以直接在组件中调用服务端函数：\n\n```typescript\nasync function createNote(formData: FormData) {\n  \'use server\'\n  // 直接操作数据库\n}\n```',
        folder_path: '/技术',
        author: 'demo',
        is_public: 1,
      },
      {
        title: '微积分期末复习',
        content: '# 微积分期末复习要点\n\n## 导数应用\n- 求切线方程\n- 函数的单调性与极值\n- 凹凸性与拐点\n- 曲率计算\n\n## 积分技巧\n1. 换元法\n2. 分部积分\n3. 有理函数积分\n4. 三角函数积分\n\n## 定积分应用\n- 平面图形面积\n- 旋转体体积\n- 曲线弧长\n- 物理应用',
        folder_path: '/课程笔记/数学/微积分',
        author: 'demo',
        is_public: 0,
      },
    ];

    for (const note of notes) {
      insertNote.run(note.title, note.content, note.folder_path, note.author, note.is_public);
    }

    console.log('Seed data inserted');
  }
}

// ==================== Folder Operations ====================

export function getAllFolders(author: string): Folder[] {
  const stmt = db.prepare('SELECT * FROM folders WHERE author = ? ORDER BY name');
  return stmt.all(author) as Folder[];
}

export function createFolder(name: string, parentId: number | null, author: string): Folder {
  const stmt = db.prepare(
    'INSERT INTO folders (name, parent_id, author) VALUES (?, ?, ?)'
  );
  const result = stmt.run(name, parentId, author);
  return {
    id: Number(result.lastInsertRowid),
    name,
    parent_id: parentId,
    author,
    created_at: new Date().toISOString(),
  };
}

export function updateFolder(id: number, name: string, author: string): boolean {
  const stmt = db.prepare(
    'UPDATE folders SET name = ? WHERE id = ? AND author = ?'
  );
  const result = stmt.run(name, id, author);
  return result.changes > 0;
}

export function deleteFolder(id: number, author: string): boolean {
  const stmt = db.prepare('DELETE FROM folders WHERE id = ? AND author = ?');
  const result = stmt.run(id, author);
  return result.changes > 0;
}

export function getFolderPath(folderId: number | null, author: string): string {
  if (!folderId) return '/';

  const paths: string[] = [];
  let currentId: number | null = folderId;

  while (currentId) {
    const stmt = db.prepare('SELECT name, parent_id FROM folders WHERE id = ? AND author = ?');
    const folder = stmt.get(currentId, author) as { name: string; parent_id: number | null } | undefined;
    if (!folder) break;
    paths.unshift(folder.name);
    currentId = folder.parent_id;
  }

  return '/' + paths.join('/');
}

// ==================== Note Operations ====================

export function getNotesByFolder(folderPath: string, author: string): Note[] {
  const stmt = db.prepare(
    'SELECT * FROM notes WHERE folder_path = ? AND author = ? ORDER BY created_at DESC'
  );
  return stmt.all(folderPath, author) as Note[];
}

export function getAllNotes(author: string): Note[] {
  const stmt = db.prepare(
    'SELECT * FROM notes WHERE author = ? ORDER BY created_at DESC'
  );
  return stmt.all(author) as Note[];
}

export function getNoteById(id: number, author: string): Note | undefined {
  const stmt = db.prepare('SELECT * FROM notes WHERE id = ? AND author = ?');
  return stmt.get(id, author) as Note | undefined;
}

export function createNote(
  title: string,
  content: string,
  folderPath: string,
  author: string,
  isPublic: number = 0
): Note {
  const stmt = db.prepare(
    'INSERT INTO notes (title, content, folder_path, author, is_public) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(title, content, folderPath, author, isPublic);
  return {
    id: Number(result.lastInsertRowid),
    title,
    content,
    folder_path: folderPath,
    author,
    created_at: new Date().toISOString(),
    is_public: isPublic,
  };
}

export function updateNote(
  id: number,
  updates: Partial<Pick<Note, 'title' | 'content' | 'folder_path' | 'is_public'>>,
  author: string
): boolean {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.folder_path !== undefined) {
    fields.push('folder_path = ?');
    values.push(updates.folder_path);
  }
  if (updates.is_public !== undefined) {
    fields.push('is_public = ?');
    values.push(updates.is_public);
  }

  if (fields.length === 0) return false;

  const stmt = db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND author = ?`);
  const result = stmt.run(...values, id, author);
  return result.changes > 0;
}

export function deleteNote(id: number, author: string): boolean {
  const stmt = db.prepare('DELETE FROM notes WHERE id = ? AND author = ?');
  const result = stmt.run(id, author);
  return result.changes > 0;
}

export function moveNoteToFolder(id: number, folderPath: string, author: string): boolean {
  return updateNote(id, { folder_path: folderPath }, author);
}

// ==================== File Operations ====================

export function createFileRecord(
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  filePath: string,
  uploadedBy: string,
  folderPath: string = '/',
  noteId: number | null = null
): FileRecord {
  const stmt = db.prepare(
    'INSERT INTO files (filename, original_name, mime_type, size, path, folder_path, uploaded_by, note_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(filename, originalName, mimeType, size, filePath, folderPath, uploadedBy, noteId);
  return {
    id: Number(result.lastInsertRowid),
    filename,
    original_name: originalName,
    mime_type: mimeType,
    size,
    path: filePath,
    folder_path: folderPath,
    uploaded_by: uploadedBy,
    note_id: noteId,
    uploaded_at: new Date().toISOString(),
  };
}

export function getFilesByUploader(uploadedBy: string): FileRecord[] {
  const stmt = db.prepare(
    'SELECT * FROM files WHERE uploaded_by = ? ORDER BY uploaded_at DESC'
  );
  return stmt.all(uploadedBy) as FileRecord[];
}

export function getFilesByFolder(folderPath: string, uploadedBy: string): FileRecord[] {
  const stmt = db.prepare(
    'SELECT * FROM files WHERE folder_path = ? AND uploaded_by = ? ORDER BY uploaded_at DESC'
  );
  return stmt.all(folderPath, uploadedBy) as FileRecord[];
}

export function getFileByFilename(filename: string): FileRecord | undefined {
  const stmt = db.prepare('SELECT * FROM files WHERE filename = ?');
  return stmt.get(filename) as FileRecord | undefined;
}

export function deleteFileRecord(id: number, uploadedBy: string): boolean {
  const stmt = db.prepare('DELETE FROM files WHERE id = ? AND uploaded_by = ?');
  const result = stmt.run(id, uploadedBy);
  return result.changes > 0;
}

export function getFileById(id: number): FileRecord | undefined {
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  return stmt.get(id) as FileRecord | undefined;
}

// 获取所有公开文件
export function getPublicFiles(): FileRecord[] {
  const stmt = db.prepare(
    'SELECT * FROM files WHERE is_public = 1 ORDER BY uploaded_at DESC'
  );
  return stmt.all() as FileRecord[];
}

// 更新文件公开状态
export function updateFilePublicStatus(id: number, isPublic: number, uploadedBy: string): boolean {
  const stmt = db.prepare(
    'UPDATE files SET is_public = ? WHERE id = ? AND uploaded_by = ?'
  );
  const result = stmt.run(isPublic, id, uploadedBy);
  return result.changes > 0;
}

// 迁移：确保 files 表存在（用于开发环境）
export function migrateFilesTable() {
  try {
    // 检查表是否存在
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='files'"
    ).get();

    if (!tableExists) {
      // 创建新表
      db.exec(`
        CREATE TABLE files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL UNIQUE,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          path TEXT NOT NULL,
          folder_path TEXT DEFAULT '/',
          note_id INTEGER,
          uploaded_by TEXT NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
        );

        CREATE INDEX idx_files_note ON files(note_id);
        CREATE INDEX idx_files_uploader ON files(uploaded_by);
        CREATE INDEX idx_files_folder ON files(folder_path);
      `);
      console.log('Files table created successfully');
    } else {
      // 检查 folder_path 列是否存在
      const columns = db.prepare('PRAGMA table_info(files)').all() as { name: string }[];
      const hasFolderPath = columns.some(col => col.name === 'folder_path');

      if (!hasFolderPath) {
        // 添加 folder_path 列
        db.exec('ALTER TABLE files ADD COLUMN folder_path TEXT DEFAULT "/"');
        db.exec('CREATE INDEX idx_files_folder ON files(folder_path)');
        console.log('Added folder_path column to files table');
      }

      // 检查 is_public 列是否存在
      const hasIsPublic = columns.some(col => col.name === 'is_public');
      if (!hasIsPublic) {
        // 添加 is_public 列
        db.exec('ALTER TABLE files ADD COLUMN is_public INTEGER DEFAULT 0');
        db.exec('CREATE INDEX idx_files_public ON files(is_public)');
        console.log('Added is_public column to files table');
      }
    }
  } catch (error) {
    console.error('Files table migration error:', error);
  }
}

// ==================== User System ====================

export interface User {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
}

export function initUserTables() {
  try {
    // 用户表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Session 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    `);

    console.log('User tables initialized successfully');
  } catch (error) {
    console.error('User tables initialization error:', error);
  }
}

export function createUser(username: string, passwordHash: string, email?: string): User {
  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)'
  );
  const result = stmt.run(username, passwordHash, email || null);
  return {
    id: Number(result.lastInsertRowid),
    username,
    password_hash: passwordHash,
    email: email || null,
    created_at: new Date().toISOString(),
  };
}

export function getUserByUsername(username: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

export function createSession(sessionId: string, userId: number, expiresAt: Date): Session {
  const stmt = db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  );
  stmt.run(sessionId, userId, expiresAt.toISOString());
  return {
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  };
}

export function getSessionById(sessionId: string): Session | undefined {
  const stmt = db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')");
  return stmt.get(sessionId) as Session | undefined;
}

export function deleteSession(sessionId: string): boolean {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const result = stmt.run(sessionId);
  return result.changes > 0;
}

export function cleanupExpiredSessions(): void {
  const stmt = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')");
  stmt.run();
}
