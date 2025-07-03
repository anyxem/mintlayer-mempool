module.exports = {
  apps: [
    {
      name: 'mintlayer-wallet-mempool-dev',
      script: 'index.ts',
      interpreter: 'ts-node',
      watch: true,
      ignore_watch: [
        'node_modules',
        'dist',
        '*.log',
        '.git'
      ],
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: './logs/dev-err.log',
      out_file: './logs/dev-out.log',
      log_file: './logs/dev-combined.log',
      time: true,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'mintlayer-wallet-mempool-prod',
      script: 'dist/index.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/prod-err.log',
      out_file: './logs/prod-out.log',
      log_file: './logs/prod-combined.log',
      time: true,
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      max_memory_restart: '1G'
    }
  ]
};
