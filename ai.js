const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

class AISystem {
    constructor(database) {
        this.db = database;
        this.genAI = null;
        this.groq = null;
        this.model = null;
        this.currentProvider = 'gemini'; // Default provider
        this.conversations = new Map(); // Local memory per chat
        this.maxHistory = 15; // Keep last 15 messages per chat
        this.responseLimit = 1000; // Limit response length (increased for more detailed responses)
        this.isInitialized = false;
        // Delay initialization to allow database tables to be created
        setTimeout(() => {
            this.initializeAI().catch(err => {
                console.error('❌ Failed to initialize AI during delayed startup:', err.message);
            });
        }, 2000);
    }
    
    // Initialize AI with API keys from database
    async initializeAI() {
        try {
            // Check and remove exceeded API keys
            await this.db.checkAndRemoveExceededKeys();
            
            // Try to initialize Gemini first
            const geminiKey = await this.db.getActiveAPIKey('gemini');
            if (geminiKey?.api_key) {
                this.genAI = new GoogleGenerativeAI(geminiKey.api_key);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                this.currentProvider = 'gemini';
                console.log(`✅ Gemini AI initialized successfully (${geminiKey.name})`);
                this.isInitialized = true;
                return;
            }
            
            // Try to initialize Groq if Gemini not available
            const groqKey = await this.db.getActiveAPIKey('groq');
            if (groqKey?.api_key) {
                this.groq = new Groq({ apiKey: groqKey.api_key });
                this.currentProvider = 'groq';
                console.log(`✅ Groq AI initialized successfully (${groqKey.name})`);
                this.isInitialized = true;
                return;
            }
            
            // Fallback to old AI config for backward compatibility
            const aiConfig = await this.db.getActiveAIConfig();
            if (aiConfig?.api_key) {
                this.genAI = new GoogleGenerativeAI(aiConfig.api_key);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                this.currentProvider = 'gemini';
                console.log('✅ Gemini AI initialized from legacy config');
                this.isInitialized = true;
                return;
            }
            
            // Fallback to environment variable
            if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
                this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                this.currentProvider = 'gemini';
                console.log('✅ Gemini AI initialized from environment variable');
                console.log('⚠️ Consider adding API keys to database using /addapikey command');
                this.isInitialized = true;
                return;
            }
            
            console.log('⚠️ No AI API keys found. AI features disabled.');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Failed to initialize AI:', error.message);
        }
    }
    
    // Reinitialize AI (called when API key is updated)
    reinitialize() {
        this.initializeAI();
    }

   

    // Clean phone numbers and WhatsApp IDs from messages
    cleanPhoneNumbers(message) {
        if (!message || typeof message !== 'string') return message;
        
        // Remove various Indonesian phone number formats and WhatsApp IDs
        return message
            .replace(/\b(\+62|62|0)\d{8,13}@c\.us\b/g, '') // Remove WhatsApp IDs
            .replace(/\b(\+62|62|0)\d{8,13}\b/g, '') // Remove phone numbers
            .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4,6}\b/g, '') // Remove formatted numbers
            .replace(/\b08\d{8,10}\b/g, '') // Remove 08xx numbers
            .replace(/\b\+62\s?8\d{8,10}\b/g, '') // Remove +62 8xx numbers
            .replace(/\b62\s?8\d{8,10}\b/g, '') // Remove 62 8xx numbers
            .replace(/\[NOMOR\]@c\.us/g, '') // Remove [NOMOR]@c.us patterns
            .replace(/\[NOMOR\]/g, '') // Remove [NOMOR] patterns
            .replace(/\s+/g, ' ') // Clean up multiple spaces
            .trim(); // Remove leading/trailing spaces
    }

    // Add message to conversation memory
    addToMemory(chatId, role, message) {
        if (!this.conversations.has(chatId)) {
            this.conversations.set(chatId, []);
        }
        
        // Clean message from phone numbers before storing
        const cleanedMessage = role === 'user' ? this.cleanPhoneNumbers(message) : message;
        
        const conversation = this.conversations.get(chatId);
        conversation.push({
            role: role, // 'user' or 'assistant'
            content: cleanedMessage,
            timestamp: Date.now(),
            chatId: chatId // Store chatId for better separation
        });
        
        // Keep only last N messages per chat
        if (conversation.length > this.maxHistory) {
            conversation.shift();
        }
        
        this.conversations.set(chatId, conversation);
    }

    // Get conversation history (from memory and database)
    async getConversationHistory(chatId, loadFromDB = false) {
        // If requested, load from database first
        if (loadFromDB && this.db) {
            try {
                const dbHistory = await this.db.getAIConversationHistory(chatId, 20);
                if (dbHistory && dbHistory.length > 0) {
                    // Convert database format to memory format
                    const formattedHistory = [];
                    dbHistory.reverse().forEach(row => {
                        formattedHistory.push({
                            role: 'user',
                            content: row.user_message,
                            timestamp: new Date(row.created_at).getTime(),
                            chatId: chatId
                        });
                        formattedHistory.push({
                            role: 'assistant', 
                            content: row.ai_response,
                            timestamp: new Date(row.created_at).getTime() + 1,
                            chatId: chatId
                        });
                    });
                    
                    // Update memory with database history
                    this.conversations.set(chatId, formattedHistory.slice(-this.maxHistory));
                }
            } catch (error) {
                console.error('Error loading chat history from database:', error);
            }
        }
        
        return this.conversations.get(chatId) || [];
    }
    
    // Get conversation history (sync version for backward compatibility)
    getConversationHistorySync(chatId) {
        return this.conversations.get(chatId) || [];
    }

    // Clear conversation memory
    clearMemory(chatId) {
        this.conversations.delete(chatId);
        return '🧠 Memori percakapan telah dihapus!';
    }
    
    // Load conversation history from database
    async loadHistoryFromDatabase(chatId) {
        try {
            const history = await this.getConversationHistory(chatId, true);
            return `🔄 *HISTORY DIMUAT*\n\n📊 Berhasil memuat ${history.length} pesan dari database\n💭 Chat ID: ${chatId.substring(0, 10)}...\n\n💡 History sekarang tersedia di memori untuk konteks percakapan yang lebih baik.`;
        } catch (error) {
            console.error('Error loading history:', error);
            return '❌ Gagal memuat history dari database.';
        }
    }
    
    // Clear all conversation data (memory + database)
    async clearAllData(chatId) {
        try {
            // Clear memory
            this.conversations.delete(chatId);
            
            // Clear database if available
            if (this.db) {
                await this.db.clearAIConversationHistory(chatId);
            }
            
            return '🗑️ *DATA DIHAPUS*\n\n✅ Memori percakapan dihapus\n✅ History database dihapus\n\n💡 Chat dimulai dari awal.';
        } catch (error) {
            console.error('Error clearing all data:', error);
            return '❌ Gagal menghapus semua data percakapan.';
        }
    }

    // Generate AI response with multiple providers
    async generateResponse(chatId, userMessage, userName = 'User') {
        try {
            if (!this.model && !this.groq) {
                return '❌ AI belum dikonfigurasi. Admin perlu menambahkan API key dengan command:\n/addapikey [provider] [key] [name]';
            }

            // Add user message to memory
            this.addToMemory(chatId, 'user', userMessage);
            
            // Get conversation history (load from database if memory is empty)
            const memoryHistory = this.getConversationHistorySync(chatId);
            const history = memoryHistory.length === 0 
                ? await this.getConversationHistory(chatId, true)
                : memoryHistory;
            
            // Clean user message from phone numbers
            const cleanedMessage = this.cleanPhoneNumbers(userMessage);
            
            // Build context from conversation history
            let context = `Kamu adalah AI Assistant Eka, asisten pribadi untuk Eka Syarif Maulana. Kamu adalah AI yang cerdas, membantu, dan ramah.

KARAKTER & GAYA:
- Gunakan bahasa Indonesia yang natural dan tidak terlalu formal
- Berikan jawaban yang informatif dan detail (minimal 2-3 kalimat)
- Gunakan emoji yang sesuai untuk membuat percakapan lebih menarik
- Ingat konteks percakapan sebelumnya untuk memberikan respons yang relevan
- Jika ditanya tentang identitas, kamu adalah asisten pribadi Eka Syarif Maulana

User yang sedang chat: ${userName}\n\n`;
            
            if (history.length > 1) {
                context += 'RIWAYAT PERCAKAPAN:\n';
                history.slice(0, -1).forEach(msg => {
                    const cleanContent = this.cleanPhoneNumbers(msg.content);
                    context += `${msg.role === 'user' ? userName : 'AI Assistant Eka'}: ${cleanContent}\n`;
                });
                context += '\n';
            }
            
            context += `PERTANYAAN TERBARU: ${cleanedMessage}\n\nBerikan jawaban yang informatif, detail, dan membantu. Pastikan jawaban minimal 2-3 kalimat dan gunakan emoji yang sesuai.`;
            
            let response;
            let currentApiKey;
            
            // Try current provider first
            if (this.currentProvider === 'gemini' && this.model) {
                try {
                    currentApiKey = await this.db.getActiveAPIKey('gemini');
                    if (currentApiKey) {
                        await this.db.updateAPIKeyUsage(currentApiKey.id);
                    }
                    
                    const result = await this.model.generateContent(context);
                    response = result.response.text();
                } catch (error) {
                    console.error('Gemini API error:', error.message);
                    if (currentApiKey) {
                        await this.db.incrementAPIKeyError(currentApiKey.id);
                    }
                    // Try Groq as fallback
                    if (this.groq) {
                        console.log('Switching to Groq as fallback...');
                        response = await this.generateGroqResponse(context);
                    } else {
                        throw error;
                    }
                }
            } else if (this.currentProvider === 'groq' && this.groq) {
                try {
                    response = await this.generateGroqResponse(context);
                } catch (error) {
                    console.error('Groq API error:', error.message);
                    currentApiKey = await this.db.getActiveAPIKey('groq');
                    if (currentApiKey) {
                        await this.db.incrementAPIKeyError(currentApiKey.id);
                    }
                    // Try Gemini as fallback
                    if (this.model) {
                        console.log('Switching to Gemini as fallback...');
                        currentApiKey = await this.db.getActiveAPIKey('gemini');
                        if (currentApiKey) {
                            await this.db.updateAPIKeyUsage(currentApiKey.id);
                        }
                        const result = await this.model.generateContent(context);
                        response = result.response.text();
                    } else {
                        throw error;
                    }
                }
            } else {
                throw new Error('No AI provider available');
            }
            
            // Clean AI response from phone numbers and IDs
            const cleanedResponse = this.cleanPhoneNumbers(response);
            
            // Limit response length
            const limitedResponse = cleanedResponse.length > this.responseLimit 
                ? cleanedResponse.substring(0, this.responseLimit) + '...' 
                : cleanedResponse;
            
            // Add AI response to memory
            this.addToMemory(chatId, 'assistant', limitedResponse);
            
            // Save to database (with cleaned message)
            if (this.db) {
                await this.db.saveAIConversation(chatId, userName, cleanedMessage, limitedResponse);
            }
            
            return limitedResponse;
            
        } catch (error) {
            console.error('AI Error:', error);
            if (error.message.includes('API_KEY')) {
                return '❌ API key tidak valid. Admin perlu mengatur ulang API key dengan:\n/admin setapikey YOUR_VALID_API_KEY';
            }
            return this.generateLocalResponse(userMessage);
        }
    }

    // Generate response using Groq API
    async generateGroqResponse(context) {
        try {
            const currentApiKey = await this.db.getActiveAPIKey('groq');
            if (currentApiKey) {
                await this.db.updateAPIKeyUsage(currentApiKey.id);
            }
            
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: context
                    }
                ],
                model: "llama3-8b-8192",
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 1,
                stream: false
            });
            
            return completion.choices[0]?.message?.content || 'Maaf, tidak ada respons dari AI.';
        } catch (error) {
            console.error('Groq API error:', error.message);
            const currentApiKey = await this.db.getActiveAPIKey('groq');
            if (currentApiKey) {
                await this.db.incrementAPIKeyError(currentApiKey.id);
            }
            throw error;
        }
    }

    // Generate local response when AI is not available
    generateLocalResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Greeting responses
        if (lowerMessage.includes('halo') || lowerMessage.includes('hai') || lowerMessage.includes('hello')) {
            return '👋 Halo juga! Gimana kabarnya hari ini? Ada yang bisa aku bantu?';
        }
        
        // How are you responses
        if (lowerMessage.includes('apa kabar') || lowerMessage.includes('gimana kabar')) {
            return '😊 Aku baik-baik aja nih! Makasih udah nanya. Kamu gimana? Lagi ngapain?';
        }
        
        // Thank you responses
        if (lowerMessage.includes('terima kasih') || lowerMessage.includes('makasih') || lowerMessage.includes('thanks')) {
            return '😄 Sama-sama! Seneng bisa bantu kamu. Ada lagi yang mau ditanyain?';
        }
        
        // Help responses
        if (lowerMessage.includes('bantuan') || lowerMessage.includes('help') || lowerMessage.includes('tolong')) {
            return '🤝 Tentu! Aku siap bantu kamu. Coba ceritain apa yang lagi kamu butuhin?';
        }
        
        // Time responses
        if (lowerMessage.includes('jam berapa') || lowerMessage.includes('waktu')) {
            const now = new Date();
            return `🕐 Sekarang jam ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
        }
        
        // Weather responses
        if (lowerMessage.includes('cuaca') || lowerMessage.includes('hujan') || lowerMessage.includes('panas')) {
            return '🌤️ Maaf, aku gak bisa cek cuaca secara real-time. Coba deh liat di aplikasi cuaca atau keluar rumah sebentar! 😅';
        }
        
        // Bot questions
        if (lowerMessage.includes('siapa kamu') || lowerMessage.includes('kamu siapa')) {
            return '🤖 Aku adalah AI assistant yang ada di bot WhatsApp ini! Aku bisa ngobrol sama kamu, main games, dan bantuin berbagai hal. Kamu bisa panggil aku AI aja! 😊';
        }
        
        // Default responses
        const defaultResponses = [
            '🤔 Hmm, menarik banget nih yang kamu bilang! Bisa jelasin lebih detail gak?',
            '😊 Aku dengar kok! Coba ceritain lebih lanjut deh.',
            '💭 Wah, aku lagi mikir nih... Bisa kasih info lebih banyak gak?',
            '🎯 Oke, aku paham maksud kamu. Ada yang lain yang mau dibahas?',
            '✨ Interesting! Kamu punya pendapat lain tentang hal ini gak?',
            '🚀 Cool banget! Aku suka cara kamu mikir. Ada lagi gak yang mau dishare?'
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // Get AI statistics for specific chat
    async getAIStats(chatId) {
        const history = this.getConversationHistorySync(chatId);
        const totalMessages = history.length;
        const userMessages = history.filter(msg => msg.role === 'user').length;
        const aiMessages = history.filter(msg => msg.role === 'assistant').length;
        
        let response = `🤖 *AI ASSISTANT EKA - STATISTIK CHAT*\n\n`;
        response += `💬 Total Pesan: ${totalMessages}\n`;
        response += `👤 Pesan User: ${userMessages}\n`;
        response += `🤖 Respon AI: ${aiMessages}\n`;
        response += `📝 Memori Aktif: ${totalMessages}/${this.maxHistory}\n`;
        response += `🔒 Chat ID: ${chatId.substring(0, 10)}...\n\n`;
        
        if (totalMessages > 0) {
            const firstMessage = history[0];
            const lastMessage = history[history.length - 1];
            const duration = lastMessage.timestamp - firstMessage.timestamp;
            const minutes = Math.floor(duration / 60000);
            response += `⏱️ Durasi Chat: ${minutes} menit\n`;
        }
        
        // Get database stats if available
        if (this.db) {
            try {
                const dbHistory = await this.db.getAIConversationHistory(chatId, 1000);
                response += `💾 Total di Database: ${dbHistory.length} percakapan\n`;
            } catch (error) {
                response += `💾 Database: Error loading\n`;
            }
        }
        
        response += `\n💡 Ketik */clearai* untuk hapus memori chat`;
        response += `\n🔄 Ketik */loadhistory* untuk muat history dari database`;
        
        return response;
    }
    
    // Get global AI statistics
    async getGlobalAIStats() {
        let response = `🤖 *AI ASSISTANT EKA - STATISTIK GLOBAL*\n\n`;
        
        // Memory statistics
        const totalChats = this.conversations.size;
        let totalMemoryMessages = 0;
        this.conversations.forEach(chat => {
            totalMemoryMessages += chat.length;
        });
        
        response += `💭 Chat Aktif di Memori: ${totalChats}\n`;
        response += `📝 Total Pesan di Memori: ${totalMemoryMessages}\n`;
        
        // Database statistics if available
        if (this.db) {
            try {
                const dbStats = await this.db.getBotStats();
                response += `💾 Total Chat di Database: ${dbStats.totalAIChats || 'N/A'}\n`;
                response += `💬 Total Percakapan: ${dbStats.totalAIMessages || 'N/A'}\n`;
            } catch (error) {
                response += `💾 Database: Error loading stats\n`;
            }
        }
        
        response += `\n🎯 AI Model: Gemini (Asisten Pribadi Eka)\n`;
        response += `⚡ Status: ${this.isInitialized ? 'Aktif' : 'Tidak Aktif'}\n`;
        
        return response;
    }

    // Get AI help
    getAIHelp() {
        return `🤖 *PANDUAN AI CHAT*\n\n` +
               `💬 *CARA PAKAI:*\n` +
               `• !ai [pesan] - Chat dengan AI\n` +
               `• !clearai - Hapus memori chat\n` +
               `• !aistats - Lihat statistik chat\n` +
               `• !aihelp - Panduan ini\n\n` +
               `🧠 *FITUR AI:*\n` +
               `• Mengingat percakapan sebelumnya\n` +
               `• Bahasa Indonesia santai\n` +
               `• Powered by Gemini AI\n` +
               `• Fallback ke respons lokal\n\n` +
               `💡 *TIPS:*\n` +
               `• AI akan ingat ${this.maxMemoryLength} pesan terakhir\n` +
               `• Gunakan bahasa yang jelas\n` +
               `• AI bisa jawab berbagai topik`;
    }

    // Set API key for Gemini
    setAPIKey(apiKey) {
        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            console.log('✅ Gemini AI API key updated successfully');
            return '✅ Gemini AI API key berhasil diatur!';
        } catch (error) {
            console.error('❌ Error setting API key:', error.message);
            return '❌ Error setting API key: ' + error.message;
        }
    }

    clearAPIKey() {
        try {
            this.genAI = null;
            this.model = null;
            console.log('✅ Gemini AI API key cleared successfully');
            return '✅ Gemini AI API key berhasil dihapus!';
        } catch (error) {
            console.error('❌ Error clearing API key:', error.message);
            return '❌ Error clearing API key: ' + error.message;
        }
    }

    // Check if Gemini is available
    isGeminiAvailable() {
        return this.model !== null;
    }
}

module.exports = AISystem;