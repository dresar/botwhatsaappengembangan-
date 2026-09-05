// Bot Configuration - OPTIMIZED FOR VPS 1GB RAM
module.exports = {
    // Bot Settings
    prefix: '/',
    adminNumbers: [], // Add admin numbers here
    maxMessageLength: 500, // Reduced from 1000
    cooldownTime: 2000, // Reduced to 2 seconds
    
    // Cache Settings - OPTIMIZED
    cache: {
        stdTTL: 300, // Reduced to 5 minutes
        checkperiod: 60 // Reduced to 1 minute
    },
    
    // WhatsApp Client Settings - MEMORY OPTIMIZED
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--memory-pressure-off',
            '--max_old_space_size=512',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-default-apps'
        ]
    },
    
    // Web Version Cache
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    
    // Performance Settings - VPS OPTIMIZED
    performance: {
        maxConcurrentRequests: 2, // Reduced from 5
        requestTimeout: 15000, // Reduced from 30000
        memoryLimit: 256, // Reduced from 512MB
        gcInterval: 180000 // Reduced to 3 minutes
    },
    
    // Game Settings - LIGHTWEIGHT
    games: {
        maxAttempts: 3, // Reduced from 5
        timeLimit: 20, // Reduced from 30 seconds
        pointsWin: 15, // Reduced from 20
        pointsLose: 3, // Reduced from 5
        pointsDraw: 8 // Reduced from 10
    },
    
    // API Settings - OPTIMIZED
    apis: {
        timeout: 8000, // Reduced from 10000
        retries: 2, // Reduced from 3
        rateLimit: {
            requests: 50, // Reduced from 100
            window: 60000 // 1 minute
        }
    },
    
    // AI Settings - VPS OPTIMIZED
    ai: {
        maxHistory: 8, // Reduced conversation history
        responseLimit: 400, // Reduced response length
        memoryCleanupInterval: 300000, // 5 minutes
        maxConcurrentRequests: 1 // Only 1 AI request at a time
    },
    
    // Database Settings - OPTIMIZED
    database: {
        connectionLimit: 1,
        acquireTimeout: 10000,
        timeout: 10000,
        pragmas: {
            journal_mode: 'WAL',
            cache_size: 1000,
            temp_store: 'memory',
            synchronous: 'normal'
        }
    }
};