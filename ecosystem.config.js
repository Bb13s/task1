module.exports = {
  apps: [{
    name: 'notehub',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/notehub',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // 日志配置
    log_file: '/var/log/notehub/combined.log',
    out_file: '/var/log/notehub/out.log',
    error_file: '/var/log/notehub/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 自动重启
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // 内存限制
    max_memory_restart: '500M',
    // 健康检查
    health_check_grace_period: 30000,
  }],
};
