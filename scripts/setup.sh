#!/bin/bash

# 十三工作室 VPS 一键部署脚本
# 使用方法：
# 1. 购买 VPS 后，SSH 登录
# 2. 上传仓库代码到 /var/www/
# 3. 运行：chmod +x setup.sh && sudo ./setup.sh

set -e

# 配置
WWW_DIR="/var/www"
HUB_DIR="$WWW_DIR/hub"
DEBATE_DIR="$WWW_DIR/debate-site"
NOTEHUB_DIR="$WWW_DIR/notehub-server"
LOG_DIR="/var/log/notehub"
NODE_VERSION="20"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 十三工作室 服务器部署脚本 ===${NC}"
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
apt-get install -y curl wget git nginx certbot python3-certbot-nginx python3-pip

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
mkdir -p $HUB_DIR
mkdir -p $DEBATE_DIR
mkdir -p $NOTEHUB_DIR/data
mkdir -p $NOTEHUB_DIR/uploads
mkdir -p $LOG_DIR

# 6. 设置权限
echo -e "${YELLOW}[6/8] 设置目录权限...${NC}"
chown -R www-data:www-data $HUB_DIR
chown -R www-data:www-data $DEBATE_DIR
chown -R www-data:www-data $NOTEHUB_DIR
chown -R www-data:www-data $LOG_DIR
chmod 755 $HUB_DIR $DEBATE_DIR $NOTEHUB_DIR $LOG_DIR

echo ""
echo -e "${GREEN}=== 基础环境安装完成 ===${NC}"
echo ""
echo -e "${YELLOW}项目结构：${NC}"
echo "  $HUB_DIR         # 十三工作室主控页"
echo "  $DEBATE_DIR      # 辩论队官网"
echo "  $NOTEHUB_DIR     # NoteHub 知识库"
echo ""
echo -e "${YELLOW}部署步骤：${NC}"
echo "1. 将代码上传到对应目录"
echo ""
echo "2. 安装依赖并构建："
echo "   cd $DEBATE_DIR && npm install && npm run build"
echo "   cd $NOTEHUB_DIR && npm install && npm run build"
echo ""
echo "3. 启动服务："
echo "   pm2 start 'cd $DEBATE_DIR && npm start' --name debate-site"
echo "   pm2 start 'cd $NOTEHUB_DIR && npm start' --name notehub-server"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. 配置 Nginx（需要域名）："
echo "   sudo ./scripts/setup-nginx.sh your-domain.com"
echo ""
echo -e "${YELLOW}项目访问地址：${NC}"
echo "   十三工作室主控页：http://你的域名或IP"
echo "   辩论队官网：       http://你的域名或IP:3000"
echo "   NoteHub：          http://你的域名或IP:6001"
echo "   辩论 AI：          http://你的域名或IP:8000"
echo ""
