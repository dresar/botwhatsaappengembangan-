require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Import custom modules
const Database = require('./database');
const MenuSystem = require('./menu');
const GameEngine = require('./games');
const UtilityManager = require('./utils');
const APIManager = require('./api');
const AdminSystem = require('./admin');
const AISystem = require('./ai');
const config = require('./config');

// Import optimized modules
const monitoring = require('./monitoring');
const optimizer = require('./optimasi');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize components with optimized settings
const db = new Database();
const menuSystem = new MenuSystem();
const gameEngine = new GameEngine(db);
const utils = new UtilityManager();
const apiManager = new APIManager();
const adminSystem = new AdminSystem(db);
const aiSystem = new AISystem(db);

// Make aiSystem globally accessible for admin updates
global.aiSystem = aiSystem;

// Make monitoring and optimizer globally accessible
global.monitoring = monitoring;
global.optimizer = optimizer;

// WhatsApp Client with optimized configuration
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: config.puppeteer,
    webVersionCache: config.webVersionCache
});

// Bot state
let botStats = {
    startTime: new Date(),
    messagesProcessed: 0,
    commandsExecuted: 0,
    activeUsers: new Set(),
    isReady: false
};

// Command cooldowns
const cooldowns = new Map();

// Bot responses and configurations (simplified)
const botConfig = {
    ...config,
    languages: {
        id: {
            welcome: '👋 Selamat datang di grup! Ketik *menu* untuk melihat fitur bot.',
            goodbye: '👋 Sampai jumpa! Terima kasih sudah bergabung.'
        },
        en: {
            welcome: '👋 Welcome to the group! Type *menu* to see bot features.',
            goodbye: '👋 Goodbye! Thanks for being part of our group.'
        }
    }
};

// Utility functions (optimized)
function isAdmin(userId) {
    return adminSystem.isAdmin(userId);
}

function checkCooldown(userId, command) {
    const key = `${userId}_${command}`;
    const now = Date.now();
    const lastUsed = cooldowns.get(key);
    
    if (lastUsed && (now - lastUsed) < botConfig.cooldownTime) {
        return false;
    }
    
    cooldowns.set(key, now);
    return true;
}

function addExp(userId, amount = 5) { // Reduced from 10 to 5 for optimization
    db.updateUserExp(userId, amount);
    db.updateUserPoints(userId, Math.floor(amount / 2));
}

// Truth or Dare function (kept separate as it's not a competitive game)
async function truthOrDare() {
    const truths = [
        'Apa rahasia yang belum pernah kamu ceritakan ke siapa pun?',
        'Siapa crush kamu saat ini?',
        'Apa hal paling memalukan yang pernah kamu lakukan?',
        'Kalau bisa jadi invisible selama sehari, apa yang akan kamu lakukan?',
        'Apa kebohongan terbesar yang pernah kamu katakan?'
    ];
    
    const dares = [
        'Kirim voice note sambil nyanyi lagu anak-anak',
        'Ganti nama grup jadi nama yang lucu selama 10 menit',
        'Kirim foto selfie dengan ekspresi paling aneh',
        'Ceritakan joke terburuk yang kamu tahu',
        'Kirim pesan ke kontak terakhir dengan kata "Aku kangen kamu"'
    ];
    
    const type = Math.random() > 0.5 ? 'truth' : 'dare';
    const questions = type === 'truth' ? truths : dares;
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    return `🎭 *TRUTH OR DARE*\n\n${type === 'truth' ? '🤔 TRUTH:' : '😈 DARE:'}\n${question}`;
}

// Command handlers
const commands = {
    async help(args, msg) {
        if (args.length > 0) {
            const command = args[0].toLowerCase();
            return menuSystem.getCommandHelp(command);
        }
        
        return menuSystem.getMainMenu();
    },
    
    async menu(args, msg) {
        if (args.length > 0) {
            const category = args[0].toLowerCase();
            return menuSystem.getCategoryMenu(category);
        }
        
        return menuSystem.getMainMenu();
    },
    
    async admin(args, msg) {
        const isAdmin = adminSystem.isAdmin(msg.author);
        if (!isAdmin && args[0] !== 'help') {
            return '❌ Kamu bukan admin!';
        }
        
        return await adminSystem.handleCommand(args, msg);
    },
    
    // Direct admin commands
    async addadmin(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['addadmin', ...args], msg);
    },
    
    async removeadmin(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['removeadmin', ...args], msg);
    },
    
    async listadmin(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['listadmin', ...args], msg);
    },
    
    async setapikey(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['setapikey', ...args], msg);
    },

    async removeapikey(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['removeapikey', ...args], msg);
    },

    async addapikey(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['addapikey', ...args], msg);
    },

    async listapikeys(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['listapikeys', ...args], msg);
    },

    // Monitoring and optimization commands
    async systemstatus(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return monitoring.getStatsForAdmin();
    },
    
    async optimizationreport(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return optimizer.getOptimizationReport();
    },
    
    async forcegc(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        
        if (global.gc) {
            try {
                global.gc();
                return '✅ Garbage collection berhasil dipaksa. Memory dibersihkan.';
            } catch (error) {
                return `❌ Garbage collection gagal: ${error.message}`;
            }
        } else {
            return '❌ Garbage collection tidak tersedia. Jalankan Node.js dengan flag --expose-gc';
        }
    },
    
    async cleancache(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        
        try {
            if (global.cache && typeof global.cache.flushAll === 'function') {
                global.cache.flushAll();
                return '✅ Cache berhasil dibersihkan.';
            } else {
                return '❌ Cache tidak tersedia atau tidak dapat dibersihkan.';
            }
        } catch (error) {
            return `❌ Gagal membersihkan cache: ${error.message}`;
        }
    },
    
    async ai(args, msg) {
         if (args.length === 0) {
             return '❌ Masukkan pertanyaan\n💡 Contoh: /ai Apa itu JavaScript?';
         }
         
         const question = args.join(' ');
         return await aiSystem.generateResponse(msg.from, question, msg.author);
     },
     
     async gemini(args, msg) {
         if (args.length === 0) {
             return '❌ Masukkan pertanyaan\n💡 Contoh: /gemini Jelaskan tentang AI';
         }
         
         const question = args.join(' ');
         return await aiSystem.generateResponse(msg.from, question, msg.author);
     },
    
    async kuis(args, msg) {
        return await gameEngine.startGame('kuis', msg.from);
    },
    
    async tebakkata(args, msg) {
        return await gameEngine.startGame('tebakkata', msg.from);
    },
    
    async suit(args, msg) {
        if (args.length === 0) {
            return '❌ Pilih: gunting, batu, atau kertas\n💡 Contoh: /suit batu';
        }
        return await gameEngine.startGame('suit', msg.from, { choice: args[0] });
    },
    
    async slot(args, msg) {
        return await gameEngine.startGame('slot', msg.from);
    },
    
    async truth(args, msg) {
        return await truthOrDare();
    },
    
    async qr(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan text untuk QR code\n💡 Contoh: /qr https://google.com';
        }
        
        const text = args.join(' ');
        const result = await utils.generateQR(text);
        
        if (result.success) {
            try {
                const qrMedia = MessageMedia.fromFilePath(result.filePath);
                await msg.reply(qrMedia, undefined, { 
                    caption: `📱 *QR CODE*\n\n📝 Text/URL: ${text}` 
                });
                return '✅ QR Code berhasil dikirim!';
            } catch (error) {
                console.error('QR Code sending error:', error);
                return `❌ Gagal mengirim QR code: ${error.message}`;
            }
        } else {
            return result.message;
        }
    },
    
    async short(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan URL yang ingin dipendekkan\n💡 Contoh: /short https://google.com';
        }
        
        const url = args[0];
        const result = await utils.shortenUrl(url);
        
        if (result.success) {
            return `🔗 *URL SHORTENER*\n\n🌐 URL Asli: ${url}\n📎 URL Pendek: ${result.shortUrl}`;
        } else {
            return `❌ Gagal mempendekkan URL: ${result.message}`;
        }
    }
};

// Event handlers
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
    
    // Save QR code to file for easier access
    const qrDir = path.join(__dirname, 'qr_codes');
    if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
    }
    
    const qrFilePath = path.join(qrDir, 'latest_qr.txt');
    fs.writeFileSync(qrFilePath, qr);
    console.log(`QR code saved to ${qrFilePath}`);
});

client.on('ready', () => {
    console.log('Client is ready!');
    botStats.isReady = true;
    
    // Log startup info
    const memoryUsage = monitoring.getMemoryUsage();
    console.log(`Bot started with ${memoryUsage.rss}MB RAM usage`);
    
    // Schedule daily database vacuum
    cron.schedule('0 3 * * *', () => {
        console.log('Running scheduled database vacuum...');
        db.vacuum();
    });
    
    // Schedule daily cache cleanup
    cron.schedule('0 4 * * *', () => {
        console.log('Running scheduled cache cleanup...');
        if (global.cache && typeof global.cache.flushAll === 'function') {
            global.cache.flushAll();
        }
    });
    
    // Schedule memory cleanup
    cron.schedule('0 */3 * * *', () => { // Every 3 hours
        console.log('Running scheduled memory cleanup...');
        optimizer.forceGC();
    });
});

client.on('message', async (msg) => {
    try {
        // Increment message counter
        botStats.messagesProcessed++;
        
        // Track active users
        botStats.activeUsers.add(msg.author || msg.from);
        
        // Process message
        const chat = await msg.getChat();
        const sender = await msg.getContact();
        const userId = sender.id.user;
        
        // Save user to database if not exists
        db.createUser(userId, sender.pushname || 'Unknown', sender.id.user);
        
        // Save message to database (optimized - only save if needed)
        if (process.env.SAVE_MESSAGES === 'true') {
            db.saveMessage(msg.id.id || `${userId}_${msg.from}_${Date.now()}`, userId, msg.from, msg.body, msg.type);
        }
        
        // Check if message is a command
        if (msg.body.startsWith(botConfig.prefix)) {
            const [commandName, ...args] = msg.body.slice(botConfig.prefix.length).trim().split(' ');
            
            // Check if command exists
            if (commands[commandName]) {
                // Check cooldown
                if (!checkCooldown(userId, commandName) && !isAdmin(userId)) {
                    await msg.reply(`⏳ Mohon tunggu beberapa detik sebelum menggunakan perintah lagi.`);
                    return;
                }
                
                // Execute command
                try {
                    console.log(`Executing command: ${commandName} by ${userId}`);
                    botStats.commandsExecuted++;
                    
                    // Add experience points
                    addExp(userId);
                    
                    // Execute command and get response
                    const response = await commands[commandName](args, msg);
                    
                    // Send response if not empty
                    if (response && typeof response === 'string') {
                        await msg.reply(response);
                    }
                } catch (error) {
                    console.error(`Error executing command ${commandName}:`, error);
                    await msg.reply(`❌ Terjadi kesalahan saat menjalankan perintah: ${error.message}`);
                }
            }
        } else {
            // Process game answers
            const gameResponse = await gameEngine.processAnswer(msg.from, msg.body, userId);
            if (gameResponse) {
                await msg.reply(gameResponse);
            }
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

client.on('group_join', async (notification) => {
    try {
        const chat = await notification.getChat();
        const contact = await notification.getContact();
        
        // Send welcome message
        chat.sendMessage(botConfig.languages.id.welcome);
        
        // Save user to database
        db.createUser(contact.id.user, contact.pushname || 'Unknown', contact.id.user);
    } catch (error) {
        console.error('Error on group_join:', error);
    }
});

client.on('group_leave', async (notification) => {
    try {
        const chat = await notification.getChat();
        const contact = await notification.getContact();
        
        // Send goodbye message
        chat.sendMessage(botConfig.languages.id.goodbye);
    } catch (error) {
        console.error('Error on group_leave:', error);
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
    botStats.isReady = false;
    
    // Attempt to reconnect
    setTimeout(() => {
        console.log('Attempting to reconnect...');
        client.initialize();
    }, 10000); // Wait 10 seconds before reconnecting
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    monitoring.log('error', `Uncaught Exception: ${error.message}\n${error.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    monitoring.log('error', `Unhandled Rejection: ${reason}`);
});

// Memory warning
process.on('warning', (warning) => {
    console.warn('Warning:', warning.name, warning.message);
    monitoring.log('warn', `Process Warning: ${warning.name} - ${warning.message}`);
    
    // If memory warning, trigger cleanup
    if (warning.name === 'MemoryWarning') {
        optimizer.emergencyMemoryCleanup();
    }
});

// Initialize client
console.log('Starting WhatsApp bot...');
client.initialize();

// Export for external access
module.exports = {
    client,
    botStats,
    commands,
    monitoring,
    optimizer
};