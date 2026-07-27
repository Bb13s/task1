#!/bin/bash

# Nginx + SSL 配置脚本
# 用法：sudo ./setup-nginx.sh your-domain.com

set -e

DOMAIN=$1
HUB_DIR="/var/www/hub"

if [ -z "$DOMAIN" ]; then
  echo "错误：请提供域名"
  echo "用法：sudo ./setup-nginx.sh your-domain.com"
  exit 1
fi

echo "=== 配置 Nginx for $DOMAIN (十三工作室主控页) ==="

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/notehub << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    root HUB_DIR_PLACEHOLDER;
    index index.html;

    # 主控页 - 静态文件
    location / {
        try_files $uri $uri/ =404;
    }

    # 静态资源缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 替换占位符
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/notehub
sed -i "s|HUB_DIR_PLACEHOLDER|$HUB_DIR|g" /etc/nginx/sites-available/notehub

# 启用站点
ln -sf /etc/nginx/sites-available/notehub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx

echo "Nginx 配置完成"
echo ""

# 申请 SSL 证书
echo "正在申请 SSL 证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

echo ""
echo "=== SSL 配置完成 ==="
echo "网站已可通过 https://$DOMAIN 访问"
echo ""
echo "证书自动续期已启用，测试命令："
echo "  certbot renew --dry-run"
