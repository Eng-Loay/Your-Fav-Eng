// TODO: once you buy a domain, replace YOUR_DOMAIN below with it and update the
// cwd/log paths to match your actual server deployment path.
module.exports = {
  apps: [
    {
      name: 'loay-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/YOUR_USER/web/YOUR_DOMAIN/public_html',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3114
      },
      error_file: '/home/YOUR_USER/web/YOUR_DOMAIN/public_html/logs/pm2-frontend-error.log',
      out_file: '/home/YOUR_USER/web/YOUR_DOMAIN/public_html/logs/pm2-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'loay-backend',
      script: 'dist/index.js',
      cwd: '/home/YOUR_USER/web/YOUR_DOMAIN/public_html/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5076
      },
      error_file: '/home/YOUR_USER/web/YOUR_DOMAIN/public_html/logs/pm2-backend-error.log',
      out_file: '/home/YOUR_USER/web/YOUR_DOMAIN/public_html/logs/pm2-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
