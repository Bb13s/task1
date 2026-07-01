#!/bin/bash

# NoteHub VPS 一键部署脚本
# 使用方法：
# 1. 购买 VPS 后，SSH 登录
# 2. 上传此脚本到服务器
# 3. 运行：chmod +x setup.sh && sudo ./setup.sh

set -e

# 配置
APP_NAME="notehub"
APP_DIR="/var/www/notehub"
LOG_DIR="/var/log/notehub"
NODE_VERSION="20"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== NoteHub 服务器部署脚本 ===${NC}"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}请使用 sudo 运行此脚本${NC}"
  exit 1
fi

# 1. 更新系统
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt-get update && apt-get upgrade -y

# 2. 安装必要软件
echo -e "${YELLOW}[2/8] 安装必要软件...${NC}"
apt-get install -y curl wget git nginx certbot python3-certbot-nginx

# 3. 安装 Node.js
echo -e "${YELLOW}[3/8] 安装 Node.js ${NODE_VERSION}...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

# 4. 安装 PM2
echo -e "${YELLOW}[4/8] 安装 PM2...${NC}"
npm install -g pm2

# 5. 创建目录
echo -e "${YELLOW}[5/8] 创建应用目录...${NC}"
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
mkdir -p $APP_DIR/data
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/hub   # 十三工作室主控页

# 6. 设置权限
echo -e "${YELLOW}[6/8] 设置目录权限...${NC}"
chown -R www-data:www-data $APP_DIR
chown -R www-data:www-data $LOG_DIR
chmod 755 $APP_DIR
chmod 755 $LOG_DIR

echo ""
echo -e "${GREEN}=== 基础环境安装完成 ===${NC}"
echo ""
echo -e "${YELLOW}下一步操作：${NC}"
echo "1. 将项目代码上传到 $APP_DIR"
echo "   方法A：git clone 你的仓库到 $APP_DIR"
echo "   方法B：用 scp/rsync 上传本地代码"
echo ""
echo "2. 安装依赖："
echo "   cd $APP_DIR && npm install"
echo ""
echo "3. 配置环境变量："
echo "   cp $APP_DIR/.env.example $APP_DIR/.env"
echo "   nano $APP_DIR/.env  # 修改配置"
echo ""
echo "4. 构建项目："
echo "   cd $APP_DIR && npm run build"
echo ""
echo "5. 启动服务："
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "6. 配置 Nginx（需要域名）："
echo "   运行：sudo ./scripts/setup-nginx.sh your-domain.com"
echo "   （主控页将部署到 80 端口，各项目通过不同端口访问）"
echo ""
echo "7. 项目访问地址："
echo "   十三工作室主控页：http://你的域名或IP"
echo "   辩论队官网：http://你的域名或IP:3000"
echo "   NoteHub：    http://你的域名或IP:6001"
echo "   辩论 AI：    http://你的域名或IP:8000"
echo ""
