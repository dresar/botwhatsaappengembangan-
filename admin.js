const fs = require('fs');
const path = require('path');

class AdminSystem {
    constructor(database) {
        this.db = database;
        this.adminUsers = new Set();
        this.loadAdminUsers();
        
        // Add super admin from environment
        const superAdmin = process.env.SUPER_ADMIN;
        if (superAdmin) {
            this.adminUsers.add(superAdmin);
            console.log(`✅ Super admin loaded: ${superAdmin}`);
            console.log(`📋 Admin users set:`, Array.from(this.adminUsers));
        } else {
            console.log(`❌ Super admin not found in environment variables`);
        }
    }

    // Load admin users from database
    async loadAdminUsers() {
        try {
            const admins = await this.db.getAdminUsers();
            admins.forEach(admin => this.adminUsers.add(admin.user_id));
        } catch (error) {
            console.log('Loading default admin users...');
        }
    }

    // Check if user is admin
    isAdmin(userId) {
        // Remove @c.us suffix if present to match stored format
        const cleanUserId = userId.replace('@c.us', '');
        return this.adminUsers.has(cleanUserId) || this.adminUsers.has(userId);
    }

    // Add admin user
    async addAdmin(userId, addedBy) {
        if (!this.isAdmin(addedBy)) {
            return '❌ Hanya admin yang bisa menambah admin baru!';
        }
        
        this.adminUsers.add(userId);
        await this.db.addAdminUser(userId, addedBy);
        return `✅ User ${userId} berhasil ditambahkan sebagai admin!`;
    }

    // Remove admin user
    async removeAdmin(userId, removedBy) {
        if (!this.isAdmin(removedBy)) {
            return '❌ Hanya admin yang bisa menghapus admin!';
        }
        
        if (userId === removedBy) {
            return '❌ Tidak bisa menghapus diri sendiri sebagai admin!';
        }
        
        this.adminUsers.delete(userId);
        await this.db.removeAdminUser(userId);
        return `✅ User ${userId} berhasil dihapus dari admin!`;
    }

    // Add quiz question
    async addQuizQuestion(question, answer, options, addedBy) {
        if (!this.isAdmin(addedBy)) {
            return '❌ Hanya admin yang bisa menambah soal kuis!';
        }
        
        const questionData = {
            question: question,
            answer: answer.toLowerCase(),
            options: options,
            added_by: addedBy,
            created_at: new Date().toISOString()
        };
        
        await this.db.addCustomQuestion('quiz', questionData);
        return `✅ Soal kuis berhasil ditambahkan!\n\n📝 Soal: ${question}\n✅ Jawaban: ${answer}`;
    }

    // Add teka-teki
    async addTekaTeki(question, answer, hint, addedBy) {
        if (!this.isAdmin(addedBy)) {
            return '❌ Hanya admin yang bisa menambah teka-teki!';
        }
        
        const tekaTekiData = {
            question: question,
            answer: answer.toLowerCase(),
            hint: hint,
            added_by: addedBy,
            created_at: new Date().toISOString()
        };
        
        await this.db.addCustomQuestion('tekateki', tekaTekiData);
        return `✅ Teka-teki berhasil ditambahkan!\n\n🤔 Soal: ${question}\n✅ Jawaban: ${answer}\n💡 Hint: ${hint}`;
    }

    // Add siapakah aku
    async addSiapakahAku(clue, answer, name, addedBy) {
        if (!this.isAdmin(addedBy)) {
            return '❌ Hanya admin yang bisa menambah siapakah aku!';
        }
        
        const siapakahData = {
            clue: clue,
            answer: answer.toLowerCase(),
            name: name,
            added_by: addedBy,
            created_at: new Date().toISOString()
        };
        
        await this.db.addCustomQuestion('siapakahaku', siapakahData);
        return `✅ Siapakah aku berhasil ditambahkan!\n\n🕵️ Clue: ${clue}\n✅ Jawaban: ${answer}\n👤 Nama: ${name}`;
    }

    // Add cak lontong
    async addCakLontong(question, answer, hint, addedBy) {
        if (!this.isAdmin(addedBy)) {
            return '❌ Hanya admin yang bisa menambah cak lontong!';
        }
        
        const cakLontongData = {
            question: question,
            answer: answer.toLowerCase(),
            hint: hint,
            added_by: addedBy,
            created_at: new Date().toISOString()
        };
        
        await this.db.addCustomQuestion('caklontong', cakLontongData);
        return `✅ Cak lontong berhasil ditambahkan!\n\n😄 Soal: ${question}\n✅ Jawaban: ${answer}\n💡 Hint: ${hint}`;
    }

    // Add word for tebak kata
    async addTebakKata(word, addedBy) {
        if (!this.isAdmin(addedBy)) {
            return '❌ Hanya admin yang bisa menambah kata!';
        }
        
        const wordData = {
            word: word.toUpperCase(),
            added_by: addedBy,
            created_at: new Date().toISOString()
        };
        
        await this.db.addCustomQuestion('tebakkata', wordData);
        return `✅ Kata berhasil ditambahkan untuk tebak kata!\n\n🔤 Kata: ${word.toUpperCase()}`;
    }

    // Get admin statistics
    async getAdminStats() {
        const stats = await this.db.getAdminStats();
        let response = `📊 *STATISTIK ADMIN*\n\n`;
        response += `👥 Total Admin: ${this.adminUsers.size}\n`;
        response += `📝 Total Custom Quiz: ${stats.quiz || 0}\n`;
        response += `🤔 Total Custom Teka-teki: ${stats.tekateki || 0}\n`;
        response += `🕵️ Total Custom Siapakah Aku: ${stats.siapakahaku || 0}\n`;
        response += `😄 Total Custom Cak Lontong: ${stats.caklontong || 0}\n`;
        response += `🔤 Total Custom Kata: ${stats.tebakkata || 0}\n`;
        
        return response;
    }

    // Get bot performance stats
    async getBotPerformance() {
        try {
            const stats = await this.db.getBotStats();
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            
            let response = `🚀 *PERFORMA BOT*\n\n`;
            response += `⏱️ *Uptime:* ${this.formatUptime(uptime)}\n`;
            response += `💾 *Memory Usage:* ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
            response += `📊 *Total Memory:* ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB\n\n`;
            
            response += `📈 *STATISTIK PENGGUNAAN:*\n`;
            response += `👥 Total Users: ${stats.totalUsers || 0}\n`;
            response += `💬 Total Messages: ${stats.totalMessages || 0}\n`;
            response += `🎮 Total Games: ${stats.totalGames || 0}\n`;
            response += `🏆 Active Sessions: ${stats.activeSessions || 0}\n\n`;
            
            response += `📱 *SISTEM:*\n`;
            response += `🔧 Node.js: ${process.version}\n`;
            response += `💻 Platform: ${process.platform}\n`;
            response += `🏗️ Architecture: ${process.arch}`;
            
            return response;
        } catch (error) {
            return '❌ Gagal mengambil data performa bot!';
        }
    }
    
    // Format uptime to readable string
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        result += `${secs}s`;
        
        return result;
    }
    
    // Get system health check
    async getSystemHealth() {
        try {
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            
            let response = `🏥 *KESEHATAN SISTEM*\n\n`;
            
            // Memory health
            const memoryStatus = memoryPercent < 70 ? '🟢 Baik' : memoryPercent < 85 ? '🟡 Perhatian' : '🔴 Kritis';
            response += `💾 Memory: ${memoryStatus} (${memoryPercent.toFixed(1)}%)\n`;
            
            // Uptime health
            const uptimeStatus = uptime > 86400 ? '🟢 Stabil' : uptime > 3600 ? '🟡 Normal' : '🔴 Baru Restart';
            response += `⏱️ Uptime: ${uptimeStatus}\n`;
            
            // Database health
            try {
                await this.db.testConnection();
                response += `🗄️ Database: 🟢 Terhubung\n`;
            } catch (error) {
                response += `🗄️ Database: 🔴 Error\n`;
            }
            
            // AI health
            const aiStatus = process.env.GEMINI_API_KEY ? '🟢 Aktif' : '🔴 Tidak Aktif';
            response += `🤖 AI System: ${aiStatus}\n\n`;
            
            response += `📊 *REKOMENDASI:*\n`;
            if (memoryPercent > 85) {
                response += `⚠️ Memory usage tinggi, pertimbangkan restart\n`;
            }
            if (uptime < 3600) {
                response += `ℹ️ Bot baru saja restart\n`;
            }
            if (!process.env.GEMINI_API_KEY) {
                response += `💡 Set Gemini API key untuk fitur AI\n`;
            }
            
            return response;
        } catch (error) {
            return '❌ Gagal mengecek kesehatan sistem!';
        }
    }

    // Get admin help
    getAdminHelp() {
        return `🔧 *PANDUAN ADMIN*\n\n` +
               `👥 *MANAJEMEN ADMIN:*\n` +
               `• /addadmin @user - Tambah admin\n` +
               `• /removeadmin @user - Hapus admin\n` +
               `• /listadmin - Lihat daftar admin\n\n` +
               `🤖 *AI MANAGEMENT:*\n` +
               `• /setapikey [key] - Set Gemini API key\n` +
               `• /checkai - Check AI status\n` +
               `• /removeapikey - Remove AI key\n` +
               `• /aihistory - View AI config history\n\n` +
               `📝 *TAMBAH KONTEN:*\n` +
               `• /addquiz [soal]|[jawaban]|[opsi1,opsi2,opsi3,opsi4]\n` +
               `• /addtekateki [soal]|[jawaban]|[hint]\n` +
               `• /addsiapa [clue]|[jawaban]|[nama]\n` +
               `• /addcaklontong [soal]|[jawaban]|[hint]\n` +
               `• /addkata [kata]\n\n` +
               `📊 *MONITORING:*\n` +
               `• /botperformance - Lihat performa bot\n` +
               `• /systemhealth - Cek kesehatan sistem\n` +
               `• /adminstats - Lihat statistik admin\n` +
               `• /errorlogs - Lihat log error terbaru\n\n` +
               `❓ *BANTUAN:*\n` +
               `• /adminhelp - Panduan ini`;
    }

    // Set Gemini API key
    async setGeminiApiKey(apiKey, setBy) {
        if (!this.isAdmin(setBy)) {
            return '❌ Hanya admin yang bisa mengatur API key!';
        }
        
        try {
            // Validate API key format
            if (!apiKey || apiKey.length < 10) {
                return '❌ API key tidak valid! Pastikan key memiliki format yang benar.';
            }
            
            // Save API key to database
            await this.db.setAIConfig(apiKey, setBy);
             
             // Reinitialize AI system with new key
             if (global.aiSystem) {
                 global.aiSystem.setAPIKey(apiKey);
             }
             
             return '✅ Gemini API key berhasil diatur dan disimpan ke database!';
        } catch (error) {
            return '❌ Gagal mengatur API key: ' + error.message;
        }
    }

    // Remove AI key
    async removeAIKey(removedBy) {
        if (!this.isAdmin(removedBy)) {
            return '❌ Hanya admin yang bisa menghapus API key!';
        }
        
        try {
            await this.db.removeAIConfig();
            
            // Reinitialize AI system without key
            if (global.aiSystem) {
                global.aiSystem.clearAPIKey();
            }
            
            return '✅ API key berhasil dihapus dari database!';
        } catch (error) {
            return '❌ Gagal menghapus API key: ' + error.message;
        }
    }

    // Get AI configuration history
    async getAIHistory() {
        try {
            const history = await this.db.getAIConfigHistory(5);
            
            if (history.length === 0) {
                return '📋 Belum ada riwayat konfigurasi AI.';
            }
            
            let response = `📋 *RIWAYAT KONFIGURASI AI*\n\n`;
            
            history.forEach((config, index) => {
                const status = config.is_active ? '🟢 Aktif' : '🔴 Nonaktif';
                const keyPreview = config.api_key ? config.api_key.substring(0, 10) + '...' : 'N/A';
                const date = new Date(config.created_at).toLocaleString('id-ID');
                
                response += `${index + 1}. ${status}\n`;
                response += `   🔑 Key: ${keyPreview}\n`;
                response += `   👤 Oleh: ${config.set_by}\n`;
                response += `   📅 ${date}\n\n`;
            });
            
            return response;
        } catch (error) {
            return '❌ Gagal mengambil riwayat AI!';
        }
    }

    // Check AI status
    async checkAIStatus() {
        try {
             const aiConfig = await this.db.getActiveAIConfig();
             const hasApiKey = !!aiConfig?.api_key;
             
             let response = `🤖 *STATUS AI*\n\n`;
             response += `🔑 API Key: ${hasApiKey ? '✅ Tersedia' : '❌ Tidak tersedia'}\n`;
             response += `💾 Sumber: Database\n`;
             
             if (hasApiKey) {
                 const keyPreview = aiConfig.api_key.substring(0, 10) + '...';
                 response += `🔍 Key Preview: ${keyPreview}\n`;
                 response += `👤 Diatur oleh: ${aiConfig.set_by}\n`;
                 response += `📅 Tanggal: ${new Date(aiConfig.created_at).toLocaleString('id-ID')}\n`;
             }
             
             response += `\n💡 Untuk mengatur API key: /setapikey YOUR_KEY`;
             
             return response;
        } catch (error) {
            return '❌ Gagal mengecek status AI!';
        }
    }

    // List all admins
    async listAdmins() {
        const adminList = Array.from(this.adminUsers);
        if (adminList.length === 0) {
            return '❌ Belum ada admin yang terdaftar!';
        }
        
        let response = `👥 *DAFTAR ADMIN*\n\n`;
        adminList.forEach((admin, index) => {
            response += `${index + 1}. ${admin}\n`;
        });
        
        return response;
    }

    // Handle admin commands
    async handleCommand(args, msg) {
        const userId = msg.author;
        
        if (!this.isAdmin(userId)) {
            return '❌ Anda tidak memiliki akses admin!';
        }
        
        const command = args[0]?.toLowerCase();
        
        switch (command) {
            case 'addadmin':
                if (args.length < 2) return '❌ Format: /addadmin @user';
                return await this.addAdmin(args[1], userId);
                
            case 'removeadmin':
                if (args.length < 2) return '❌ Format: /removeadmin @user';
                return await this.removeAdmin(args[1], userId);
                
            case 'listadmin':
                return await this.listAdmins();
                
            case 'setapikey':
                if (args.length < 2) return '❌ Format: /setapikey YOUR_API_KEY';
                return await this.setGeminiApiKey(args[1], userId);
                
            case 'checkai':
                return await this.checkAIStatus();
                
            case 'removeapikey':
                return await this.removeAIKey(userId);
                
            case 'addapikey':
                if (args.length < 3) return '❌ Format: /addapikey [provider] [api_key]';
                const provider = args[1].toLowerCase();
                const apiKey = args[2];
                const name = args[3] || `${provider.toUpperCase()}_${Date.now()}`; // Auto generate name if not provided
                const dailyLimit = 999999999; // Unlimited by default
                const monthlyLimit = 999999999; // Unlimited by default
                return await this.addAPIKey(provider, apiKey, name, userId, dailyLimit, monthlyLimit);
                
            case 'listapikeys':
                const listProvider = args[1] ? args[1].toLowerCase() : null;
                return await this.listAPIKeys(listProvider);
                
            case 'removeapikey2':
                if (args.length < 2) return '❌ Format: /removeapikey2 [id]';
                const keyId = parseInt(args[1]);
                return await this.removeAPIKeyById(keyId, userId);
                
            case 'resetapiusage':
                return await this.resetAPIUsage(userId);
                
            case 'removedailylimit':
                return await this.removeDailyLimit(userId);
                
            case 'aihistory':
                return await this.getAIHistory();
                
            case 'botperformance':
                return await this.getBotPerformance();
                
            case 'systemhealth':
                return await this.getSystemHealth();
                
            case 'adminstats':
                return await this.getAdminStats();
                
            case 'errorlogs':
                return await this.getErrorLogs();
                
            case 'addquiz':
                if (args.length < 2) return '❌ Format: /addquiz [soal]|[jawaban]|[opsi1,opsi2,opsi3,opsi4]';
                const quizParts = args.slice(1).join(' ').split('|');
                if (quizParts.length !== 3) return '❌ Format salah! Gunakan: /addquiz [soal]|[jawaban]|[opsi1,opsi2,opsi3,opsi4]';
                return await this.addQuizQuestion(quizParts[0], quizParts[1], quizParts[2].split(','), userId);
                
            case 'addtekateki':
                if (args.length < 2) return '❌ Format: /addtekateki [soal]|[jawaban]|[hint]';
                const tekaParts = args.slice(1).join(' ').split('|');
                if (tekaParts.length !== 3) return '❌ Format salah! Gunakan: /addtekateki [soal]|[jawaban]|[hint]';
                return await this.addTekaTeki(tekaParts[0], tekaParts[1], tekaParts[2], userId);
                
            case 'addsiapa':
                if (args.length < 2) return '❌ Format: /addsiapa [clue]|[jawaban]|[nama]';
                const siapaParts = args.slice(1).join(' ').split('|');
                if (siapaParts.length !== 3) return '❌ Format salah! Gunakan: /addsiapa [clue]|[jawaban]|[nama]';
                return await this.addSiapakahAku(siapaParts[0], siapaParts[1], siapaParts[2], userId);
                
            case 'addcaklontong':
                if (args.length < 2) return '❌ Format: /addcaklontong [soal]|[jawaban]|[hint]';
                const cakParts = args.slice(1).join(' ').split('|');
                if (cakParts.length !== 3) return '❌ Format salah! Gunakan: /addcaklontong [soal]|[jawaban]|[hint]';
                return await this.addCakLontong(cakParts[0], cakParts[1], cakParts[2], userId);
                
            case 'addkata':
                if (args.length < 2) return '❌ Format: /addkata [kata]';
                return await this.addTebakKata(args[1], userId);
                
            case 'adminhelp':
            case 'help':
                return this.getAdminHelp();
                
            default:
                return '❌ Command tidak dikenal! Ketik /adminhelp untuk melihat daftar command.';
        }
    }

    // Add new API key
    async addAPIKey(provider, apiKey, name, setBy, dailyLimit = 1000, monthlyLimit = 30000) {
        try {
            if (!['gemini', 'groq'].includes(provider)) {
                return '❌ Provider tidak didukung! Gunakan: gemini atau groq';
            }
            
            const id = await this.db.addAPIKey(provider, apiKey, name, setBy, dailyLimit, monthlyLimit);
            
            // Reinitialize AI if this is the first key for this provider
            if (global.aiSystem) {
                global.aiSystem.reinitialize();
            }
            
            return `✅ *API KEY DITAMBAHKAN*\n\n` +
                   `🔑 Provider: ${provider.toUpperCase()}\n` +
                   `📝 Nama: ${name}\n` +
                   `📊 Daily Limit: ${dailyLimit}\n` +
                   `📈 Monthly Limit: ${monthlyLimit}\n` +
                   `🆔 ID: ${id}\n\n` +
                   `💡 AI akan otomatis menggunakan key ini jika diperlukan.`;
        } catch (error) {
            console.error('Error adding API key:', error);
            return '❌ Gagal menambahkan API key!';
        }
    }

    // List API keys
    async listAPIKeys(provider = null) {
        try {
            const keys = await this.db.getAPIKeys(provider);
            
            if (keys.length === 0) {
                const providerText = provider ? ` untuk ${provider.toUpperCase()}` : '';
                return `📋 *API KEYS${providerText.toUpperCase()}*\n\n❌ Tidak ada API key yang tersedia.\n\n💡 Tambahkan dengan: /addapikey [provider] [key] [name]`;
            }
            
            let response = `📋 *API KEYS LIST*\n\n`;
            
            const groupedKeys = {};
            keys.forEach(key => {
                if (!groupedKeys[key.provider]) {
                    groupedKeys[key.provider] = [];
                }
                groupedKeys[key.provider].push(key);
            });
            
            Object.keys(groupedKeys).forEach(prov => {
                response += `🔸 *${prov.toUpperCase()}*\n`;
                groupedKeys[prov].forEach(key => {
                    const status = key.error_count >= 5 ? '❌' : '✅';
                    const maskedKey = key.api_key.substring(0, 8) + '...' + key.api_key.slice(-4);
                    response += `${status} ID: ${key.id} | ${key.name}\n`;
                    response += `   Key: ${maskedKey}\n`;
                    response += `   Usage: ${key.usage_count}/${key.daily_limit}\n`;
                    response += `   Errors: ${key.error_count}/5\n`;
                    response += `   Added: ${new Date(key.created_at).toLocaleDateString()}\n\n`;
                });
            });
            
            response += `💡 Hapus key: /removeapikey2 [id]\n`;
            response += `🔄 Reset usage: /resetapiusage`;
            
            return response;
        } catch (error) {
            console.error('Error listing API keys:', error);
            return '❌ Gagal mengambil daftar API keys!';
        }
    }

    // Remove API key by ID
    async removeAPIKeyById(keyId, removedBy) {
        try {
            await this.db.removeAPIKey(keyId);
            
            // Reinitialize AI to use next available key
            if (global.aiSystem) {
                global.aiSystem.reinitialize();
            }
            
            return `✅ *API KEY DIHAPUS*\n\n🆔 Key ID ${keyId} berhasil dihapus!\n💡 AI akan menggunakan key lain yang tersedia.`;
        } catch (error) {
            console.error('Error removing API key:', error);
            return '❌ Gagal menghapus API key!';
        }
    }

    // Reset API usage counters
    async resetAPIUsage(resetBy) {
        try {
            await this.db.resetAPIKeyUsage();
            
            return `✅ *USAGE RESET BERHASIL*\n\n` +
                   `🔄 Semua API key usage telah direset ke 0\n` +
                   `📊 Error count juga telah direset\n` +
                   `⏰ Reset time: ${new Date().toLocaleString()}\n\n` +
                   `💡 Semua API key kembali aktif dan siap digunakan!`;
        } catch (error) {
            console.error('Error resetting API usage:', error);
            return '❌ Gagal mereset API usage!';
        }
    }

    // Remove daily limit for all API keys
    async removeDailyLimit(removedBy) {
        try {
            await this.db.removeDailyLimitAllKeys();
            
            return `✅ *DAILY LIMIT DIHAPUS*\n\n` +
                   `🚫 Daily limit untuk semua API key telah dihapus\n` +
                   `♾️ Sekarang semua API key unlimited per hari\n` +
                   `⏰ Updated: ${new Date().toLocaleString()}\n\n` +
                   `💡 API keys tidak akan dibatasi penggunaan harian!`;
        } catch (error) {
            console.error('Error removing daily limit:', error);
            return '❌ Gagal menghapus daily limit!';
        }
    }

    // Get error logs
    async getErrorLogs() {
        try {
            const errors = await this.db.getErrorLogs(20);
            
            if (errors.length === 0) {
                return '✅ *ERROR LOGS*\n\n📊 Tidak ada error yang tercatat!';
            }
            
            let response = `🚨 *ERROR LOGS* (20 Terbaru)\n\n`;
            
            errors.forEach((error, index) => {
                const timestamp = new Date(error.timestamp).toLocaleString('id-ID');
                response += `${index + 1}. 🔴 **${error.type.toUpperCase()}**\n`;
                response += `   ⏰ ${timestamp}\n`;
                if (error.command) response += `   🔧 Command: /${error.command}\n`;
                if (error.user_id) response += `   👤 User: ${error.user_id}\n`;
                response += `   📝 Error: ${error.error_message.substring(0, 100)}${error.error_message.length > 100 ? '...' : ''}\n\n`;
            });
            
            response += `📊 Total errors: ${errors.length}\n`;
            response += `💡 Gunakan terminal untuk detail lengkap`;
            
            return response;
        } catch (error) {
            return '❌ Gagal mengambil error logs!';
        }
    }

}

module.exports = AdminSystem;