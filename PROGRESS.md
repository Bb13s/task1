# 华中科技大学物理学院辩论队 — 网站进度总览

---

## 一、项目结构

```
note-hub/
│
├── src/                          # Next.js 主站（纯前端门面）
│   ├── app/
│   │   ├── page.tsx              # 辩论队官网首页
│   │   ├── layout.tsx            # 全局布局（标题/图标/语言）
│   │   ├── globals.css           # 全局样式
│   │   ├── hall-of-fame/
│   │   │   └── page.tsx          # 辩论名人堂
│   │   └── timer/                # 辩论计时器
│   │       ├── page.tsx          # 入口（重定向到 setup）
│   │       ├── setup/
│   │       │   └── page.tsx      # 设备测试页
│   │       ├── config/
│   │       │   └── page.tsx      # 赛前配置页
│   │       └── run/
│   │           └── page.tsx      # 主计时界面
│
├── notehub-server/               # NoteHub 知识库（独立 Next.js 服务，端口 6001）
│   ├── .env.local                # 环境变量（NEXT_PUBLIC_MAIN_SITE_URL 等）
│   ├── package.json              # Next.js 14 + CodeMirror + Markdown 渲染
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # 知识库首页
│       │   ├── layout.tsx        # 独立根布局（含数据库初始化）
│       │   ├── globals.css
│       │   ├── login/page.tsx    # 登录页
│       │   ├── register/page.tsx # 注册页（已关闭）
│       │   ├── workspace/        # 工作区（3 栏布局）
│       │   │   ├── page.tsx      # 服务端入口（鉴权重定向）
│       │   │   ├── WorkspaceClient.tsx  # 主布局
│       │   │   ├── FolderTree.tsx       # 文件夹树
│       │   │   ├── CodeMirrorEditor.tsx # Markdown 编辑器
│       │   │   ├── MarkdownPreview.tsx  # Markdown 预览
│       │   │   ├── SimpleEditor.tsx     # 简易编辑器
│       │   │   ├── FileManager.tsx      # 文件上传管理
│       │   │   └── FilePreview.tsx      # 文件预览
│       │   ├── explore/          # 公开广场
│       │   ├── notes/[id]/       # 笔记详情页
│       │   └── api/              # REST API（11 个路由）
│       │       ├── auth/         # 登录/登出/获取用户/注册
│       │       ├── files/        # 文件 CRUD + 公开
│       │       ├── folders/      # 文件夹管理
│       │       ├── notes/        # 笔记 CRUD + 公开
│       │       └── upload/       # 文件上传
│       └── lib/
│           ├── db.ts             # 数据库操作（SQLite，独立）
│           └── auth.ts           # 用户鉴权工具
│
├── ai-assistant/                 # AI 辩手（独立 Python 服务，端口 8000）
│   ├── .env                      # DeepSeek API 密钥（不入 git）
│   ├── requirements.txt          # Python 依赖
│   ├── Dockerfile                # Docker 构建（备选）
│   ├── docker-compose.yml        # Docker 编排（备选）
│   └── app/
│       ├── main.py               # FastAPI 入口
│       ├── config/               # 加载器 + 角色配置
│       ├── core/                 # 核心引擎（辩论/角色/会话/知识库等）
│       ├── adapters/             # WebSocket 适配器
│       ├── character_data/       # 角色数据（人物设定/金句/陈词）
│       ├── knowledge_base/       # 知识库文档（辩题/技巧）
│       ├── templates/            # Jinja2 页面模板
│       └── static/               # CSS/JS 静态资源
│
├── public/                       # 静态资源
│   ├── favicon.svg               # 网站图标（红底白"辩"字）
│   ├── team-logo.png             # 队徽
│   └── hall-of-fame/             # 名人堂队员头像
│
├── scripts/                      # 运维脚本（Nginx 配置等）
├── PROGRESS.md                   # 本文件
└── README.md                     # 项目介绍
```

---

## 二、路由一览

```
139.155.142.76:3000              # 主站（纯前端门面）
    │
    ├── /                       辩论队官网首页
    ├── /hall-of-fame           辩论名人堂
    ├── /timer                  辩论计时器入口
    │   ├── /timer/setup        设备测试
    │   ├── /timer/config       赛前配置
    │   └── /timer/run          主计时界面

139.155.142.76:6001              # NoteHub 知识库（独立 Next.js 服务）
    │
    ├── /                       NoteHub 首页
    ├── /explore                广场（公开笔记/文件）
    ├── /workspace              工作区（编辑/上传）
    ├── /login                  登录
    ├── /register               注册（已关闭）
    ├── /notes/[id]             笔记详情页
    └── /api/*                  后端 API（11 个路由，全部数据操作）

139.155.142.76:8000              # AI 辩手（独立 Python 服务）
```

---

## 三、功能模块详情

### 1. 辩论队官网首页（/）

| 区块 | 状态 |
|------|------|
| 导航栏 | ✅ 关于我们、队伍风采、赛事成绩、招新信息、辩论名人堂 |
| Hero 首屏 | ✅ "辩以明物，论以穷理" + 红紫渐变背景 |
| 关于我们 | 🟡 占位"啦啦啦" |
| 队伍风采 | 🟡 8 格纯色占位 |
| 赛事成绩 | 🟡 3 张荣誉卡片（数据待填） |
| 招新信息 | 🟡 二维码/Q群占位 |
| Footer | ✅ 辩论队工具箱（3 个入口卡片） |

### 2. 辩论名人堂（/hall-of-fame）

- **风格**：深蓝背景，红紫光晕，荣誉殿堂氛围
- **功能**：年级筛选（全部 / 2018~2025）、4 列卡片网格
- **25 级已填充**：徐经纬、王思远、江安博、刘名扬、董征、鲍嘉明（含头像）
- **其余年级**：占位"啦啦啦"

### 3. NoteHub 知识库（独立服务 :6001，原 /notehub/*）

整个项目中**最复杂、开发时间最长的模块**。本质上是 GitHub 风格的个人知识管理系统——支持 Markdown 编辑、文件夹管理、PDF 托管，以及与辩论队官网的公开/权限体系打通。

#### 权限体系

```
未登录用户 → 访问 NoteHub 首页 → 弹窗"仅向内部人员开放"→ 必须登录
已登录用户 → 正常使用全部功能
注册功能 → 已关闭，新账号须管理员手动创建
```

登录用 bcrypt 加密密码 + cookie session（7 天有效期），注册关闭后通过 SQLite 直接 INSERT 创建账号：

```sql
-- 在服务器上手动添加新用户
sqlite3 /var/www/notehub/notehub-server/data/notehub.db
INSERT INTO users (username, password_hash) VALUES ('用户名', 'bcrypt_hash');
```

#### 编辑器（CodeMirror 6）

没选 Monaco 或 Slate 这类重型编辑器，因为 CodeMirror 6 更轻量、更适合 Markdown 场景。

| 特性 | 实现 |
|------|------|
| Markdown 语法高亮 | `@codemirror/lang-markdown` |
| 双链补全 | 自定义补全函数，监听 `[[` 触发，搜索全部笔记标题 |
| 历史记录 | `history + historyKeymap` |
| 实时保存 | `onChange` 回调 + debounce → `setEditorContent` |

双链补全的关键代码——在 `CodeMirrorEditor.tsx` 中注册一个正则匹配器，当用户输入 `[[` 时弹出补全菜单，选项是所有笔记标题：

```typescript
function createWikiLinkCompletion(noteTitles: string[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const beforeCursor = context.matchBefore(/\[\[([^\]]*)?/);
    if (!beforeCursor) return null;
    const query = beforeCursor.text.slice(2).toLowerCase();
    const options = noteTitles
      .filter(title => title.toLowerCase().includes(query))
      .map(title => ({ label: title, type: 'link', /* apply 函数插入 [[title]] */ }));
    return { from: beforeCursor.from, options };
  };
}
```

#### 三栏布局（工作区核心页面）

```
┌──────────┬─────────────────┬──────────┐
│ 左侧栏    │    中间栏        │  右侧栏   │
│ 文件夹树   │    编辑器        │  预览区   │
│          │                 │          │
│ 📁 根目录 │  CodeMirror 6  │ Markdown │
│  ├─📁子目录│  (可自选简易/  │ Preview  │
│  │  📝笔记 │   专业编辑器)   │          │
│  │  📎PDF  │               │  PDF预览 │
│  └─...    │               │          │
│          │                 │          │
└──────────┴─────────────────┴──────────┘
```

左侧栏 (`FolderTree.tsx`) 是整个布局的核心——用递归函数 `buildTree()` 把扁平数据库结果构建成 `TreeNode` 树结构，每个节点包含 `children: TreeNode[]`、`notes`、`files`。

#### 笔记保存流程

```
用户输入 → CodeMirror onChange
    → debounce 500ms
    → fetch PATCH /api/notes/[id]
    → updateNote(notes_db, id, { title, content })
    → SQL UPDATE notes SET ...
    → setSaveStatus('saved')
```

保存状态指示器：🟡 unsaved → 🔵 saving → 🟢 saved，通过 `saveStatus` state 驱动。

#### Markdown 预览与公式

`MarkdownPreview.tsx` 是关键链路组件。公式渲染是反复踩坑才调通的——最初只在工作区预览生效，笔记详情页和广场都失效，最终追溯到两处遗漏：

1. 笔记详情页 (`notes/[id]/page.tsx`) 缺少 `remarkMath` 和 `rehypeKatex` 插件
2. 广场页原本是 Server Component，无公式插件；改为 Client Component 后单独配置

```typescript
// MarkdownPreview.tsx 的插件链
<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}       // GFM + 数学语法
  rehypePlugins={[rehypeKatex]}                  // KaTeX 渲染
  components={{ code, h1~h6, p, ul, ol, blockquote, table }}
>
```

#### PDF 公开机制

这是一个独立功能链路，经历了多次调试才稳定下来：

```
上传 PDF（可选勾选"公开到广场"）
    ↓
POST /api/upload → multipart 解析 → 存到 uploads/ → 写入 files 表
    ↓ is_public = 0 或 1
工作区点击"公开/取消公开"
    ↓
PATCH /api/files?id=xxx { is_public: 0|1 }
    ↓ updateFilePublicStatus() → UPDATE files SET is_public = ?
广场读取
    ↓
getPublicFiles() → SELECT * FROM files WHERE is_public = 1
```

**踩过的坑：**

| 问题 | 原因 | 修复 |
|------|------|------|
| 广场不显示新公开的 PDF | 页面是 Server Component，数据被缓存 | 改为 Client Component (`ExploreClient.tsx`)，每次请求加时间戳 |
| API 返回"未登录" | `PATCH` 方法用了旧的 `getCurrentUser()` | 改为直接从 `cookies()` 获取 session |
| 服务器部署后广场不更新 | 代码未通过 git pull 同步 | 先 commit → push → pull，不再直接 SSH 改文件 |
| 按钮状态不立即更新 | PDF 只调 `refreshFiles()`，没更新本地 state | 像笔记一样 `setFiles(prev => prev.map(...))` 立即更新 |

#### 数据库设计

```sql
-- 核心三表
folders  (id, name, parent_id, author, created_at)
notes    (id, title, content, folder_path, author, created_at, is_public)
files    (id, filename, original_name, mime_type, size, path, 
          folder_path, note_id, uploaded_by, uploaded_at, is_public)

-- 用户表
users    (id, username, password_hash, email, created_at)
sessions (id, user_id, expires_at)
```

所有表用 `better-sqlite3` 操作，`is_public` 默认 0，需要用户主动公开。`folder_path` 用字符串路径（如 `/课程笔记/量子力学`），不用递归查询，查询效率高。

### 4. 辩论计时器（/timer/*）

辩论赛现场使用的计时工具。核心目标是**远距离可见**和**键盘单手操作**——辩手站在台上也能看清剩余时间，计时员一只手放在键盘上就能完成所有操作。

#### 页面流程

```
/timer → 自动跳转 /timer/setup
    ↓ 测试扬声器 → 下一步
/timer/config → 填写赛事信息 → 配置赛程 → 点击"开始计时"
    ↓
/timer/run → 按空格开始 → 操作快捷键 → 结束后返回配置
```

#### 数据持久化

配置信息全部存在 **浏览器 localStorage**，不依赖后端。这样：
- 不同设备互不冲突（你配你的，我配我的）
- 刷新页面不丢失
- 无需网络请求，打开即用

存储结构：

```typescript
const STORAGE_KEY = 'timer-config';
localStorage.setItem(STORAGE_KEY, JSON.stringify({
  matchName,      // 赛事名称
  proName,         // 正方队伍名
  conName,         // 反方队伍名
  proTopic,        // 正方辩题
  conTopic,        // 反方辩题
  segments: [      // 环节列表
    { id, name, duration, side, warn5s, dualTimer },
    ...
  ],
  autoNext         // 是否自动切换环节
}));
```

#### 环节配置

这是赛前配置的核心。每个环节 `Segment` 有 7 个字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 环节名称（如"正方一辩立论"） |
| duration | number | 时长（秒） |
| side | 'pro'/'con'/'neutral' | 所属方，决定顶栏高亮色 |
| warn5s | boolean | 是否在剩余 5 秒时响铃 |
| dualTimer | boolean | 是否启用双方计时模式 |

预设了两套模板——"校园赛规则"（12 环节）和"银卡赛规则"（8 环节），一键套用，也可以手动增删调序。

#### 计时核心

计时器没有用 `setInterval`（精度不够，会漂移），用的是一秒一次的 `setInterval` + `useState` 倒计数。实际计时精度取决于浏览器，辩论赛场景下 1 秒精度足够。

```typescript
// 简化的计时逻辑
useEffect(() => {
  if (timerState !== 'running') return;
  const id = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        setTimerState('idle');
        playTimeUp();                    // 时间到→触发哔哔声
        return 0;
      }
      if (prev === 31) playWarn30s();   // 30 秒→嘟三声
      if (prev === 6) playWarn5s();     // 5 秒→嘀三声
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(id);
}, [timerState]);
```

TimerState 三态机：`idle`（未开始）→ `running`（计时中）←→ `paused`（暂停）。启动用空格，暂停用 P。

#### 提示音系统（Web Audio API）

所有提示音都用 `OscillatorNode` 生成，不走 `<audio>` 标签——没有音频文件依赖，纯代码合成。

```typescript
const playBeep = (freq: number, duration: number, startDelay = 0) => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';                      // 正弦波，最干净
  osc.frequency.value = freq;
  gain.gain.value = 0.3;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const start = ctx.currentTime + startDelay;
  osc.start(start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);  // 自然衰减
  osc.stop(start + duration);
};
```

三个核心声音通过组合调用实现：

| 声音 | 频率 | 实现 |
|------|------|------|
| 嘟嘟嘟（30s） | 500Hz × 3 | `playBeep(500, 0.25, 0/0.4/0.8)` 三个偏移 |
| 嘀嘀嘀（5s） | 880Hz × 3 | `playBeep(880, 0.12, 0/0.2/0.4)` 更快更尖锐 |
| 哔哔哔哔×2（结束） | 660Hz × 8 | 两组各 4 声，间隔 2.5s |

先用 OscillatorNode 生成音频再通过 ExponentialRamp 淡出，避免咔嚓声。

#### 双方计时模式

自由辩论时，正反方各有独立的时间池，但只有发言方在消耗时间。核心是用一个 `activeSide` 状态控制当前谁的时钟在走：

```
点击敌方计时器 / 按 Tab
         ↓
setActiveSide(prev => prev === 'pro' ? 'con' : 'pro')
         ↓
timer effect 检测 activeSide → 只减对应 side 的时间
```

```
┌─────────────────────────────────────────────┐
│   [正方 王思远]      VS      [反方 江安博]    │
│      3:21                      2:47          │
│   ← 当前发言方高亮              点击切换 →    │
└─────────────────────────────────────────────┘
```

当前发言方：红色边框 + 放大 + 完全显示。非发言方：半透明 + 缩小。切换瞬间不中断计时。

#### 快捷键系统

全局 `keydown` 监听，过滤掉 input 内的事件，避免编辑赛程时误触发：

| 键 | 功能 | 场景 |
|----|------|------|
| 空格 | 启动/暂停 | 最常用 |
| ← / → | 上下环节 | 切换阶段 |
| Tab | 切换发言方 | 自由辩论 |
| P | 暂停 | 中断 |
| R | 重置 | 重来 |
| Q | 测试 30s 音 | 赛前试音 |
| W | 测试 5s 音 | 赛前试音 |
| E | 测试结束音 | 赛前试音 |
| F | 全屏 | 隐藏地址栏 |
| B | 返回配置 | 退出 |

#### 视觉反馈

| 状态 | 时间颜色 | 进度条 | 顶栏 |
|------|---------|--------|------|
| 正常计时 | 白色 | 红色 | 正方红 / 反方紫 |
| 剩余 5 秒内 | **黄色** | 黄色 | 不变 |
| 时间到 | **红色闪烁** | 红色 | 红色闪烁 |
| 奇袭模式 | 白色 | 紫色 | 双方变紫 |

#### 奇袭

`surpriseActive` 状态控制临时切到 30 秒倒计时，到期自动回到原环节：

```typescript
handleSurprise = () => {
  setSurpriseActive(true);
  setTimeLeft(30);
  setTimerState('running');
  setTimeout(() => {
    setSurpriseActive(false);
    setTimeLeft(current.duration);   // 恢复原环节时间
  }, 30_000);
};
```

### 5. AI 辩手（独立服务 :8000）

一个能模仿特定辩手风格的 AI 对练系统。不是通用聊天机器人，而是能模拟真实队员辩论风格的"数字分身"——队员打开页面就能和它打一场，赛后收到结构化点评。

#### 两种模式

| 模式 | 辩题/立场 | 效果 |
|------|---------|------|
| 自由辩论 | 需要选择 | 站立场对辩，AI 自动持相反立场 |
| 闲聊 | 不需要 | 纯人格聊天，AI 保持辩手风格但不逼辩 |

辩论过程中可随时"请求点评"，AI 切换到教练视角给出复盘。

#### 角色模仿（三层体系）

新增一个模仿对象 = 创建一个 YAML 配置文件 + 一个素材目录，不涉及代码改动。

```
config/characters/default.yaml      ← 风格、口头禅、论证偏好、禁忌词
character_data/徐经纬/
    ├── persona.md                   ← 完整人设描述
    ├── phrases.md                   ← 口头禅 + 惯用句式
    └── speeches/                    ← 真实比赛稿（few-shot 参考）
        ├── 下坠_反方.md
        ├── 草台班子_正方.md
        └── 共享经济_反方.md
```

| 层级 | 模仿内容 | 实现方式 |
|------|---------|---------|
| 风格层 | 语气、句式长短、口头禅、禁忌词 | persona.yaml + phrases.md |
| 观点层 | 立场、论据、常用论证方式 | 真实辩论稿作为 few-shot 参考 |
| 思维层 | 怎么开场、怎么反驳、怎么结辩 | thinking 配置 + 真实发言参考 |

当前配置的徐经纬是典型的学院派辩手——说话中等偏长、逻辑严密，每轮必先定义关键概念，本能地引用研究数据，从不使用"我觉得""可能""也许"。

#### 知识库

按辩题组织 Markdown 文件，每份带 YAML 头部定义触发关键词：

```markdown
---
triggers: ["下坠", "商业模式", "操控人性"]
side: "反方"
type: "argument"
---
# 反方一辩立论稿...

用户消息 → 关键词匹配 triggers → SQLite FTS5 全文搜索 → 相关段落注入 prompt
```

| 项目 | 数据 |
|------|------|
| 已入库辩题 | 9 个（下坠、草台班子、共享经济、医疗AI、成熟、玄学、知足常乐、筛选、绩点） |
| 每辩题内容 | 正/反方一辩稿 + 攻防稿 |
| 来源 | 徐经纬真实比赛稿件 |
| 热更新 | 修改文件后自动重索引，无需重启 |

预留 ChromaDB 语义搜索接口，安装后自动启用混合检索。

#### 赛后点评

五维结构化评分卡，每一项引用对话原话：

| 维度 | 评分(1-5) | 依据 |
|------|-----------|------|
| 论点清晰度 | — | 原话 |
| 证据支撑 | — | 原话 |
| 逻辑严密性 | — | 原话 + 漏洞分析 |
| 反驳有效性 | — | 原话 + 被绕开之处 |
| 节奏把控 | — | 原话 |

附带亮点（2处）、问题（2处）、改进建议（2-3条）、一句话总结。点评时自动对比知识库中该辩题的真实论证作为参照。

#### 管理面板（/admin）

| 区域 | 功能 |
|------|------|
| 角色切换 | 显示可用角色，一键切换并热加载 |
| 知识库状态 | 文档总数、FTS5 状态、每篇的侧/类型/触发词 |
| 辩论存档 | 历场辩论列表 + 点击展开完整记录（含点评） |

每场辩论以独立 JSON 存档，含每轮发言及点评，可作为日后微调模型的训练数据。

#### 技术栈

| 层 | 组件 | 说明 |
|------|------|------|
| 后端 | FastAPI (Python 3.11+) | 异步 + WebSocket 原生支持 |
| 前端 | Jinja2 模板 + Vanilla JS | 零构建步骤，本地和服务器同一套代码 |
| 通信 | WebSocket | 实时双向，支持拆条发送和打字状态 |
| LLM | DeepSeek API | 低成本高质量中文 |
| 搜索 | SQLite FTS5 | Python 内置，零配置 |
| 语义 | ChromaDB | 可选，未安装自动降级为关键词搜索 |
| 部署 | Docker + PM2 | Dockerfile/docker-compose 就绪 |

---

## 四、配色体系

| 颜色 | 色值 | 用途 |
|------|------|------|
| 华科红 | #9e1b32 | 按钮、高亮、正方条带、用户消息泡 |
| 物理紫 | #6d28d9 | 渐变、反方条带、AI 消息泡 |
| 深蓝 | #0f172a | Footer、名人堂、计时器、AI 页面背景 |

---

## 五、服务器部署

| 服务 | 端口 | 进程管理 | 路径 |
|------|------|---------|------|
| notehub（主站） | 3000 | PM2 | /var/www/notehub |
| notehub-server（知识库） | 6001 | PM2 | /var/www/notehub/notehub-server |
| debate-ai（AI 辩手） | 8000 | PM2 | /var/www/ai-assistant |

### 部署流程
```bash
# 本地
git add -A && git commit -m "xxx"
git push origin master

# 远程 — 主站
ssh ubuntu@139.155.142.76
cd /var/www/notehub && sudo git pull && sudo npm run build && sudo pm2 restart notehub

# 远程 — 知识库
cd /var/www/notehub/notehub-server && sudo npm run build && sudo pm2 restart notehub-server

# 远程 — AI 辩手
sudo pm2 restart debate-ai
```

---

## 六、待办

| 优先级 | 事项 |
|--------|------|
| 🟡 低 | 首页真实内容（介绍/照片/成绩/二维码） |
| 🟡 低 | 名人堂 2018~2024 级数据 |
| 🟡 低 | 更多工具箱功能 |
