# 华中科技大学物理学院辩论队 — 网站进度总览

---

## 一、项目结构

```
note-hub/
│
├── src/                          # Next.js 主站源码
│   ├── app/
│   │   ├── page.tsx              # 辩论队官网首页
│   │   ├── layout.tsx            # 全局布局（标题/图标/语言）
│   │   ├── globals.css           # 全局样式
│   │   ├── UserNav.tsx           # 用户导航组件（登录/注册状态）
│   │   ├── hall-of-fame/
│   │   │   └── page.tsx          # 辩论名人堂
│   │   ├── notehub/              # NoteHub 知识库（需登录）
│   │   │   ├── page.tsx          # 知识库首页
│   │   │   ├── explore/
│   │   │   │   ├── page.tsx      # 广场页入口
│   │   │   │   └── ExploreClient.tsx  # 广场客户端组件
│   │   │   ├── workspace/
│   │   │   │   ├── page.tsx      # 工作区入口（含鉴权重定向）
│   │   │   │   ├── WorkspaceClient.tsx  # 主布局
│   │   │   │   ├── FolderTree.tsx       # 文件夹树
│   │   │   │   ├── CodeMirrorEditor.tsx # Markdown 编辑器
│   │   │   │   ├── MarkdownPreview.tsx  # Markdown 预览
│   │   │   │   ├── SimpleEditor.tsx     # 简易编辑器
│   │   │   │   ├── FileManager.tsx      # 文件上传管理
│   │   │   │   └── FilePreview.tsx      # 文件预览
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # 登录页
│   │   │   ├── register/
│   │   │   │   └── page.tsx      # 注册页（已关闭）
│   │   │   └── notes/
│   │   │       └── [id]/
│   │   │           └── page.tsx  # 笔记详情页
│   │   ├── timer/                # 辩论计时器
│   │   │   ├── page.tsx          # 入口（重定向到 setup）
│   │   │   ├── setup/
│   │   │   │   └── page.tsx      # 设备测试页
│   │   │   ├── config/
│   │   │   │   └── page.tsx      # 赛前配置页
│   │   │   └── run/
│   │   │       └── page.tsx      # 主计时界面
│   │   └── api/                  # 后端 API 路由
│   │       ├── auth/             # 登录/注册/获取用户
│   │       ├── files/            # 文件 CRUD
│   │       ├── folders/          # 文件夹管理
│   │       ├── notes/            # 笔记 CRUD
│   │       └── upload/           # 文件上传
│   └── lib/
│       ├── db.ts                 # 数据库操作（SQLite）
│       └── auth.ts               # 用户鉴权工具
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
├── data/                         # SQLite 数据库文件（不入 git）
├── uploads/                      # 用户上传文件（不入 git）
├── scripts/                      # 运维脚本（Nginx 配置等）
├── PROGRESS.md                   # 本文件
└── README.md                     # 项目介绍
```

---

## 二、路由一览

```
139.155.142.76:3000
    │
    ├── /                       辩论队官网首页
    ├── /hall-of-fame           辩论名人堂
    │
    ├── /notehub                NoteHub 知识库首页（需登录）
    │   ├── /notehub/explore    广场（公开笔记/文件）
    │   ├── /notehub/workspace  工作区（编辑/上传）
    │   ├── /notehub/login      登录
    │   ├── /notehub/register   注册（已关闭）
    │   └── /notehub/notes/[id] 笔记详情页
    │
    ├── /timer                  辩论计时器入口
    │   ├── /timer/setup        设备测试
    │   ├── /timer/config       赛前配置
    │   └── /timer/run          主计时界面
    │
    139.155.142.76:8000          AI 辩手（独立 Python 服务）
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

### 3. NoteHub 知识库（/notehub/*）

| 功能 | 说明 |
|------|------|
| 权限 | 需登录，弹窗提示"仅向内部人员开放" |
| 注册 | 已关闭，手动添加账号 |
| Markdown 编辑 | CodeMirror 6，双链补全，实时预览 |
| 公式渲染 | remark-math + rehype-katex |
| 文件夹管理 | 无限层级嵌套 |
| 笔记公开 | 可选公开到广场 |
| PDF 上传/公开 | 可选公开/不公开 |
| 广场 | 公开笔记 + 公开文件 |

### 4. 辩论计时器（/timer/*）

**① 设备测试**
- ✅ 扬声器测试（440Hz 提示音）

**② 赛前配置**
- 赛事名称、对阵双方、辩题
- 赛程模板（校园赛/银卡赛）
- 环节编辑（名称/时长/所属方/5秒提醒/双方计时）
- localStorage 持久化

**③ 主计时界面**

| 功能 | 说明 |
|------|------|
| 顶栏 | 左"正方"+队名(红)、右"反方"+队名(紫) |
| 倒计时 | 超大字体，远距离可见 |
| 提示音 | 30s三嘟 / 5s三嘀 / 时间到八哔 |
| 双方计时 | 点击或 Tab 切换发言方 |
| 快捷键 | 空格(启停) ←→(切换环节) F(全屏) 等 10 个 |
| 奇袭 | 30 秒临时计时 |

### 5. AI 辩手（独立服务 :8000）

- **框架**：FastAPI + WebSocket
- **AI**：DeepSeek API
- **功能**：自由辩论 / 闲聊模式、辩论点评、辩论记录存档
- **配色**：华科红 + 物理紫 + 深蓝

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
| debate-ai | 8000 | PM2 | /var/www/ai-assistant |

### 部署流程
```bash
# 本地
git add -A && git commit -m "xxx"
git push origin master

# 远程
ssh ubuntu@139.155.142.76
cd /var/www/notehub && sudo git pull && sudo npm run build && sudo pm2 restart notehub
# AI 服务有文件变更时：sudo pm2 restart debate-ai
```

---

## 六、待办

| 优先级 | 事项 |
|--------|------|
| 🟡 低 | 首页真实内容（介绍/照片/成绩/二维码） |
| 🟡 低 | 名人堂 2018~2024 级数据 |
| 🟡 低 | 更多工具箱功能 |
