# 十三工作室 — 网站进度总览

---

## 一、项目结构

```
note-hub/
│
├── hub/                           # 十三工作室主控页（静态 HTML, nginx :80）
│   ├── index.html                 # 单页主控页（5 套主题皮肤、Canvas 粒子）
│   ├── style.css                  # 基础样式 + 响应式
│   └── favicon.svg                # 网站图标
│
├── debate-site/                   # 辩论队官网（Next.js 14, PM2 :3000）
│   ├── package.json               # Next.js 14 + Tailwind CSS + TypeScript
│   ├── next.config.mjs            # Next.js 配置
│   ├── tailwind.config.ts         # Tailwind CSS 配置
│   ├── tsconfig.json              # TypeScript 配置
│   ├── public/                    # 静态资源
│   │   ├── favicon.svg / favicon.png
│   │   ├── team-logo.png / team-logo.svg
│   │   ├── 招新群二维码.jpg
│   │   ├── 30631245521340d9.png   # 海报二维码
│   │   ├── poster.html            # 招新宣传海报
│   │   ├── 队伍风采图片1~12        # 照片轮播素材
│   │   └── hall-of-fame/          # 名人堂队员头像
│   └── src/app/
│       ├── layout.tsx             # 根布局（象牙白底、元数据）
│       ├── globals.css            # 全局样式（CSS 变量、动画）
│       ├── page.tsx               # 首页（学院感设计，Client Component）
│       ├── hall-of-fame/
│       │   └── page.tsx           # 辩论名人堂（暖色调）
│       └── timer/                 # 辩论计时器
│           ├── page.tsx           # 入口（重定向到 setup）
│           ├── setup/page.tsx     # 设备测试页
│           ├── config/page.tsx    # 赛前配置页
│           └── run/page.tsx       # 主计时界面
│
├── workshop/                      # 创意工坊（静态 HTML, nginx :3001）
│   ├── index.html                 # 工坊首页（卡片导航）
│   ├── debate-timer.html          # 辩论计时器（React CDN）
│   ├── pretty-buttons.html        # 键盘粒子钢琴（Canvas + Web Audio）
│   └── 天文科普-太阳系demo.html    # 太阳系 3D 探索（Three.js）
│
├── notehub-server/                # NoteHub 知识库（独立 Next.js 服务，PM2 :6001）
│   ├── package.json               # Next.js 14 + CodeMirror + Markdown 渲染
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # 知识库首页
│       │   ├── layout.tsx         # 独立根布局（含数据库初始化）
│       │   ├── login/page.tsx     # 登录页
│       │   ├── register/page.tsx  # 注册页（已关闭）
│       │   ├── workspace/         # 工作区（3 栏布局）
│       │   │   ├── page.tsx       # 服务端入口（鉴权重定向）
│       │   │   ├── WorkspaceClient.tsx
│       │   │   ├── FolderTree.tsx
│       │   │   ├── CodeMirrorEditor.tsx
│       │   │   ├── MarkdownPreview.tsx
│       │   │   ├── SimpleEditor.tsx
│       │   │   ├── FileManager.tsx
│       │   │   └── FilePreview.tsx
│       │   ├── explore/           # 公开广场
│       │   ├── notes/[id]/        # 笔记详情页
│       │   └── api/               # REST API（11 个路由）
│       └── lib/
│           ├── db.ts              # 数据库操作（SQLite）
│           └── auth.ts            # 用户鉴权工具
│
├── ai-assistant/                  # AI 辩手（独立 Python 服务，PM2 :8000）
│   ├── .env                       # DeepSeek API 密钥（不入 git）
│   ├── requirements.txt           # Python 依赖
│   └── app/
│       ├── main.py                # FastAPI 入口
│       ├── config/                # 加载器 + 角色配置
│       ├── core/                  # 核心引擎（辩论/角色/会话/知识库）
│       ├── adapters/              # WebSocket 适配器
│       ├── character_data/        # 角色数据（人设/金句/陈词/训练）
│       ├── knowledge_base/        # 知识库文档
│       ├── templates/             # Jinja2 页面模板
│       ├── static/                # CSS/JS 静态资源
│       └── scripts/               # 训练脚本（distill/export）
│
├── scripts/                       # 运维脚本
│   ├── setup.sh                   # VPS 初始化
│   └── setup-nginx.sh             # Nginx 配置
│
├── README.md                      # 项目介绍
└── PROGRESS.md                    # 本文件
```

---

## 二、路由一览

```
139.155.142.76                    # 十三工作室主控页（Nginx :80）
    │

139.155.142.76:3000               # 辩论队官网（PM2 debate-site）
    │
    ├── /                        主页（Hero / 关于 / 风采 / 成绩 / 招新）
    ├── /hall-of-fame            辩论名人堂
    ├── /timer                   计时器入口
    │   ├── /timer/setup         设备测试
    │   ├── /timer/config        赛前配置
    │   └── /timer/run           主计时界面

139.155.142.76:3001               # 创意工坊（静态 Nginx）
    │
    ├── /                        工坊首页
    ├── debate-timer.html        辩论计时器
    ├── pretty-buttons.html      键盘粒子钢琴
    └── 天文科普-太阳系demo.html  太阳系 3D 探索

139.155.142.76:6001               # NoteHub 知识库（PM2 notehub-server）
    │
    ├── /                        NoteHub 首页
    ├── /explore                 广场（公开笔记/文件）
    ├── /workspace               工作区（编辑/上传）
    ├── /login                   登录
    ├── /register                注册（已关闭）
    ├── /notes/[id]              笔记详情页
    └── /api/*                   后端 API（11 个路由）

139.155.142.76:8000               # AI 辩手（PM2 debate-ai）
```

---

## 三、功能模块详情

### 1. 主控页（hub/）

十三工作室的总入口。单页静态 HTML，5 套可切换视觉主题（星域、银河星云、赛博朋克故障、涂鸦爆炸、终端黑客），Canvas 粒子特效每套不同。3 张项目卡片链接至各子服务，卡片和底部"快速链接"均用 `data-port` 动态构建 URL。favicon.svg 为十三工作室品牌标识。

### 2. 辩论队官网首页（debate-site /:3000）

| 区块 | 状态 | 设计 |
|------|------|------|
| 导航栏 | ✅ 关于我们、队伍风采、赛事成绩、招新信息、辩论名人堂 | 象牙白半透明毛玻璃 + 宋体队名 |
| Hero 首屏 | ✅ "辩以明物，论以穷理" | 衬线大字、金线装饰、宣纸纹理、淡入动画 |
| 关于我们 | ✅ 三段完整介绍文案 | drop cap 首字放大、红金装饰线、暖色阴影卡片 |
| 队伍风采 | ✅ 12 张照片轮播 | 横向无限循环 + 两侧淡出遮罩 + 相框细边 |
| 赛事成绩 | ✅ 5 条历史战绩 | 时间线布局、冠军金/亚军银/季军铜 |
| 招新信息 | ✅ 二维码 + QQ群号 | 红底卡片 + 金色角标装饰 |
| Footer | ✅ 辩论计时器入口 + 版权 | 深褐底暖色链接 |

**设计风格**：学院感 · 温润雅致 — 象牙白底 `#fefaf5`、宋体标题、红 `#9e1b32` 金 `#c4943a` 点缀、区块入场动画。

另含 `public/poster.html` 招新宣传海报专用页，左文右码布局，适合截图做宣传图。

### 3. 辩论名人堂（debate-site /hall-of-fame）

- **风格**：暖色调深褐底 `#2c1810`，暖金光晕，荣誉殿堂氛围
- **功能**：年级筛选（全部 / 2018~2025）、4 列卡片网格
- **2025 级 6 人已填充**：徐经纬、王思远、江安博、刘名扬、董征、鲍嘉明（含头像）
- **2018~2024 级**：锁定卡片展示（虚线边框 + 🔒 + "待解锁"），等待后续补充

### 4. NoteHub 知识库（独立服务 :6001）

整个项目中**最复杂、开发时间最长的模块**。本质上是 GitHub 风格的个人知识管理系统——支持 Markdown 编辑、文件夹管理、PDF 托管，以及与辩论队官网的公开/权限体系打通。

#### 权限体系

```
未登录用户 → 访问 NoteHub 首页 → 弹窗"仅向内部人员开放"→ 必须登录
已登录用户 → 正常使用全部功能
注册功能 → 已关闭，新账号须管理员手动创建
```

登录用 bcrypt 加密密码 + cookie session（7 天有效期）。

#### 编辑器（CodeMirror 6）

| 特性 | 实现 |
|------|------|
| Markdown 语法高亮 | `@codemirror/lang-markdown` |
| 双链补全 | 自定义补全函数，监听 `[[` 触发，搜索全部笔记标题 |
| 历史记录 | `history + historyKeymap` |
| 实时保存 | `onChange` 回调 + debounce 500ms → PATCH API |

#### 三栏布局（工作区核心页面）

```
┌──────────┬─────────────────┬──────────┐
│ 左侧栏    │    中间栏        │  右侧栏   │
│ 文件夹树   │    编辑器        │  预览区   │
│          │                 │          │
│ 📁 根目录 │  CodeMirror 6  │ Markdown │
│  ├─📁子目录│  (简易/专业)    │ Preview  │
│  │  📝笔记 │                │          │
│  │  📎PDF  │                │ PDF预览  │
│  └─...    │                │          │
└──────────┴─────────────────┴──────────┘
```

#### Markdown 预览与公式

`MarkdownPreview.tsx` 关键链路——使用 `react-markdown` + `remarkMath` + `rehypeKatex` 渲染带数学公式的文档。

#### 数据库设计

```sql
folders  (id, name, parent_id, author, created_at)
notes    (id, title, content, folder_path, author, created_at, is_public)
files    (id, filename, original_name, mime_type, size, path,
          folder_path, note_id, uploaded_by, uploaded_at, is_public)
users    (id, username, password_hash, email, created_at)
sessions (id, user_id, expires_at)
```

### 5. 辩论计时器（debate-site /timer/*）

辩论赛现场使用的计时工具。核心目标是**远距离可见**和**键盘单手操作**。

#### 页面流程

```
/timer → 自动跳转 /timer/setup
    ↓ 测试扬声器 → 下一步
/timer/config → 填写赛事信息 → 配置赛程 → 点击"开始计时"
    ↓
/timer/run → 按空格开始 → 操作快捷键 → 结束后返回配置
```

#### 快捷键系统

| 键 | 功能 |
|----|------|
| 空格 | 启动/暂停 |
| ← / → | 上下环节 |
| Tab | 切换发言方（自由辩论） |
| P | 暂停 |
| R | 重置 |
| Q / W / E | 测试 30s / 5s / 结束音 |
| F | 全屏 |
| B | 返回配置 |

预设两套模板（"校园赛规则"12 环节 / "银卡赛规则"8 环节），支持自定义增删调序。配置保存在 localStorage。提示音用 Web Audio API 的 `OscillatorNode` 纯代码合成。

### 6. AI 辩手（独立服务 :8000）

一个能模仿特定辩手风格的 AI 对练系统。当前角色为"徐经纬"数字分身，支持自由辩论和闲聊两种模式，赛后自动生成结构化五维点评。

#### 角色模仿（三层体系）

```
character_data/徐经纬/
    ├── style.yaml          ← 风格、口头禅、论证偏好、禁忌词
    ├── persona.md          ← 完整人设描述
    ├── phrases.md          ← 口头禅 + 惯用句式
    ├── persona_chat.md     ← 闲聊模式人设
    ├── phrases_chat.md     ← 闲聊模式句式
    ├── speeches/           ← 真实比赛稿（few-shot 参考，9 篇）
    ├── chats/              ← 日常对话训练样本
    └── training/           ← 训练目录
```

| 层级 | 内容 | 实现 |
|------|------|------|
| 风格层 | 语气、句式、口头禅、禁忌词 | style.yaml + phrases.md |
| 观点层 | 立场、论据、论证方式 | 真实辩论稿 few-shot |
| 思维层 | 怎么开场、反驳、结辩 | thinking 配置 + 发言参考 |

#### 技术栈

| 层 | 组件 |
|------|------|
| 后端 | FastAPI + WebSocket |
| 前端 | Jinja2 + Vanilla JS |
| LLM | DeepSeek API |
| 搜索 | SQLite FTS5 + ChromaDB（可选） |
| 部署 | Docker + PM2 |

### 7. 创意工坊（静态服务 :3001）

独立创意项目集合，纯前端 HTML 单页。

#### debate-timer.html
辩论计时器独立版（React 18 CDN + Tailwind CDN），功能与官网内嵌版一致。

#### pretty-buttons.html
键盘粒子钢琴 —— Canvas 粒子渲染 + Web Audio 合成。完整钢琴键盘映射、5 种音色、实时参数面板、6 首内置曲目自动演奏。

#### 天文科普-太阳系demo.html
Three.js 3D 交互式太阳系探索。双层弹窗信息卡（含跨文化神话对照表），WebGL 不兼容自动降级。

---

## 四、配色体系

### 辩论队官网（学院感暖色调）

| 颜色 | 色值 | 用途 |
|------|------|------|
| 象牙白 | #fefaf5 | 主页背景 |
| 暖灰 | #f5f0e8 | 区块交替背景 |
| 深褐 | #2c1810 | Footer、名人堂背景 |
| 华科红 | #9e1b32 | 按钮、强调、Q 框外框 |
| 金棕 | #c4943a | 装饰线、标语、角标、勋章 |
| 暖文 | #3d2c24 | 正文文字 |
| 灰褐 | #8b7355 | 辅助文字、导航 |

### 计时器 / AI 页面

| 颜色 | 色值 | 用途 |
|------|------|------|
| 华科红 | #9e1b32 | 正方条带、用户消息泡 |
| 物理紫 | #6d28d9 | 反方条带、AI 消息泡 |
| 深蓝 | #0f172a | 背景 |

---

## 五、服务器部署

| 服务 | 端口 | 进程管理 | 路径 |
|------|------|---------|------|
| hub（主控页） | 80 | Nginx | /var/www/hub |
| debate-site（辩论队官网） | 3000 | PM2 debate-site | /var/www/debate-site |
| workshop（创意工坊） | 3001 | Nginx | /var/www/workshop |
| notehub-server（知识库） | 6001 | PM2 notehub-server | /var/www/notehub-server |
| debate-ai（AI 辩手） | 8000 | PM2 debate-ai | /var/www/ai-assistant |

### 部署流程

```bash
# 本地
git add -A && git commit -m "xxx"
git push origin master

# 远程
ssh ubuntu@139.155.142.76

# 辩论队官网（需构建）
cd /var/www/debate-site && sudo git pull && sudo npm install && sudo npm run build && sudo pm2 restart debate-site

# NoteHub（需构建）
cd /var/www/notehub-server && sudo git pull && sudo npm install && sudo npm run build && sudo pm2 restart notehub-server

# 主控页（静态，无需构建）
cd /var/www/hub && sudo git pull

# 创意工坊（静态，无需构建）
cd /var/www/workshop && sudo git pull

# AI 辩手
cd /var/www/ai-assistant && sudo git pull && sudo pm2 restart debate-ai
```

---

## 六、待办

| 优先级 | 事项 |
|--------|------|
| 🟡 中 | 主页"队伍风采"轮播点击放大查看 |
| 🟡 低 | 名人堂 2018~2024 级队员数据补充 |
| 🟡 低 | 海报页面移动端适配 |
