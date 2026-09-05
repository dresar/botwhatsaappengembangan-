// PM2 Configuration - OPTIMIZED FOR VPS 1GB RAM
module.exports = {
  apps: [{
    name: 'whatsapp-bot-optimized',
    script: 'app.js',
    instances: 1,
    exec_mode: 'fork', // Use fork mode instead of cluster
    autorestart: true,
    watch: false,
    max_memory_restart: '400M', // Restart if memory exceeds 400MB
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Node.js optimization flags
    node_args: [
      '--max-old-space-size=512',
      '--optimize-for-size',
      '--gc-interval=100'
    ],
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      NODE_OPTIONS: '--max-old-space-size=512'
    },
    env_production: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=512'
    },
    
    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Performance monitoring
    pmx: true,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Cron restart (daily at 3 AM to clear memory)
    cron_restart: '0 3 * * *',
    
    // Merge logs
    merge_logs: true,
    
    // Time zone
    time: true
  }]
}