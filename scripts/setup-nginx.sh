#!/bin/bash

# Nginx + SSL 配置脚本
# 用法：sudo ./setup-nginx.sh your-domain.com

set -e

DOMAIN=$1
APP_PORT=3000

if [ -z "$DOMAIN" ]; then
  echo "错误：请提供域名"
  echo "用法：sudo ./setup-nginx.sh your-domain.com"
  exit 1
fi

echo "=== 配置 Nginx for $DOMAIN ==="

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/notehub << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 替换域名
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/notehub

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
