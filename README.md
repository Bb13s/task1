# 十三工作室

**主控页**：http://139.155.142.76

## 项目结构

```
note-hub/
├── hub/                     # 十三工作室主控页 (static HTML, nginx :80)
├── debate-site/             # 辩论队官网 (Next.js 14, :3000)
├── workshop/                # 创意工坊 (static HTML, nginx :3001)
├── notehub-server/          # NoteHub 知识库 (Next.js 14, :6001)
├── ai-assistant/            # 辩论 AI (Python FastAPI, :8000)
└── scripts/                 # 部署脚本
```

## 项目入口

| 项目 | 地址 | 说明 |
|------|------|------|
| 十三工作室 | http://139.155.142.76 | 主控入口 |
| 辩论队官网 | http://139.155.142.76:3000 | 队伍品牌 + 名人堂 + 计时器 |
| 创意工坊 | http://139.155.142.76:3001 | 键盘粒子 · 太阳系科普 · 计时器 |
| NoteHub | http://139.155.142.76:6001 | Markdown 笔记 + PDF 管理 |
| 辩论 AI | http://139.155.142.76:8000 | AI 辩论对手，DeepSeek 驱动 |

## 本地开发

```bash
# 辩论队官网
cd debate-site && npm install && npm run dev

# NoteHub
cd notehub-server && npm install && npm run dev

# 辩论 AI
cd ai-assistant && pip install -r requirements.txt && uvicorn app.main:app --reload

# 主控页 / 创意工坊（静态文件，直接打开即可）
# hub/index.html
# workshop/index.html
```

## 部署

```bash
ssh ubuntu@139.155.142.76

# 辩论队官网
cd /var/www/debate-site && sudo git pull && sudo npm install && sudo npm run build && sudo pm2 restart debate-site

# NoteHub
cd /var/www/notehub-server && sudo git pull && sudo npm install && sudo npm run build && sudo pm2 restart notehub-server

# 主控页（静态文件，无需构建）
cd /var/www/hub && sudo git pull

# 创意工坊（静态文件，无需构建）
cd /var/www/workshop && sudo git pull

# 辩论 AI
cd /var/www/ai-assistant && sudo git pull && sudo pm2 restart debate-ai
```

## 技术栈

- **前端**：Next.js 14 + Tailwind CSS + TypeScript
- **创意/科普**：Vanilla HTML/CSS/JS + Three.js + Canvas + Web Audio
- **数据库**：SQLite（better-sqlite3）
- **AI 服务**：Python FastAPI + WebSocket + DeepSeek API
- **部署**：Ubuntu + PM2 + Nginx
