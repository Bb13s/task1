# NoteHub VPS 部署指南

## 一、购买服务器和域名

### 1. 推荐配置
- **服务器**: 腾讯云/阿里云轻量应用服务器
  - 配置: 2核2G 内存, 50GB SSD
  - 带宽: 3-5Mbps
  - 系统: Ubuntu 22.04 LTS
  - 价格: 约 99-150元/年（新用户优惠）

- **域名**: .top / .xyz / .site
  - 价格: 约 10-30元/年
  - 推荐平台: 腾讯云、阿里云、Namecheap

### 2. 购买后记录
购买完成后，你需要提供给我：
- [ ] 服务器 IP 地址
- [ ] root 密码（或 SSH 密钥）
- [ ] 域名（已解析到服务器 IP）

---

## 二、部署步骤（我来执行）

### 步骤 1: 连接服务器并运行安装脚本
```bash
# 1. 上传部署脚本
scp -r scripts/ root@你的IP:/root/

# 2. SSH 登录服务器
ssh root@你的IP

# 3. 运行安装脚本
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
```

### 步骤 2: 上传项目代码
```bash
# 在本地项目目录执行
npm run build
rsync -avz --exclude=node_modules --exclude=.next \
  . root@你的IP:/var/www/notehub/
```

### 步骤 3: 服务器上完成配置
```bash
ssh root@你的IP
cd /var/www/notehub

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env  # 修改 SESSION_SECRET 等配置

# 构建
npm run build

# 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 步骤 4: 配置 Nginx 和 SSL
```bash
# 需要域名解析完成后执行
sudo ./scripts/setup-nginx.sh your-domain.com
```

---

## 三、部署后管理

### 常用命令
```bash
# 查看应用状态
pm2 status
pm2 logs notehub

# 重启应用
pm2 restart notehub

# 更新代码后
npm run build
pm2 reload notehub

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 备份数据
```bash
# 备份数据库和上传的文件
tar czf backup-$(date +%Y%m%d).tar.gz /var/www/notehub/data /var/www/notehub/uploads
```

---

## 四、故障排查

| 问题 | 解决 |
|------|------|
| 网站无法访问 | 检查防火墙: `ufw status` |
| 502 错误 | 检查应用: `pm2 logs` |
| 文件上传失败 | 检查目录权限: `chown -R www-data /var/www/notehub/uploads` |
| SSL 过期 | 手动续期: `certbot renew` |

---

## 五、费用总结

| 项目 | 费用 | 备注 |
|------|------|------|
| 服务器 | ~100元/年 | 腾讯云轻量新用户 99元/年 |
| 域名 | ~10元/年 | .top/.xyz 域名 |
| **总计** | **~110元/年** | |

---

**准备好了吗？提供服务器信息给我，我开始部署！**
