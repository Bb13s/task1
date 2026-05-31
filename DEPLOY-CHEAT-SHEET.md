# NoteHub 部署速查表

## 服务器信息
- **IP**: 139.155.142.76
- **用户**: ubuntu (SSH) / root (sudo)
- **部署目录**: /var/www/notehub
- **GitHub 仓库**: https://github.com/Bb13s/task1.git

## 部署步骤

```bash
# 1. SSH 登录
ssh ubuntu@139.155.142.76

# 2. 进入项目目录
cd /var/www/notehub

# 3. 拉取最新代码
sudo git pull

# 4. 安装依赖（如有新增）
sudo npm install

# 5. 构建项目
sudo npm run build

# 6. 重启服务
sudo pm2 restart notehub

# 7. 检查状态
sudo pm2 status
sudo pm2 logs notehub --lines 20
```

## 常见问题

### 如果 git pull 失败（不是 git 仓库）
```bash
cd /var/www
sudo rm -rf notehub
sudo git clone https://github.com/Bb13s/task1.git notehub
cd notehub
sudo npm install && sudo npm run build
sudo pm2 start npm --name "notehub" -- start
```

### 如果端口被占用
```bash
sudo pm2 stop notehub
sudo pm2 delete notehub
sudo pm2 start npm --name "notehub" -- start
```

### 查看日志
```bash
sudo pm2 logs notehub
sudo pm2 logs notehub --lines 50
```

## 访问地址
- **网站**: http://139.155.142.76:3000

## 关键配置（已设置）
- Cookie secure: false（HTTP 访问）
- 数据库: SQLite (data/notehub.db)
- 上传目录: uploads/
- PM2 进程名: notehub
