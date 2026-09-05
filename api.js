const axios = require('axios');
const NodeCache = require('node-cache');

class APIManager {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 600 });
        this.rateLimiter = new Map();
        this.apiEndpoints = {
            anime: {
                waifu: 'https://api.waifu.im/search?included_tags=waifu',
                neko: 'https://api.waifu.im/search?included_tags=waifu', // neko tag tidak tersedia, gunakan waifu
                selfie: 'https://api.waifu.im/search?included_tags=waifu', // selfies tag tidak tersedia, gunakan waifu
                maid: 'https://api.waifu.im/search?included_tags=maid',
                uniform: 'https://api.waifu.im/search?included_tags=uniform',
                topAnime: 'https://api.jikan.moe/v4/top/anime',
                // Backup endpoints using waifu.pics
                waifuPics: 'https://api.waifu.pics/sfw/waifu',
                nekoPics: 'https://api.waifu.pics/sfw/neko'
            },
            meme: {
                random: 'https://meme-api.herokuapp.com/gimme',
                template: 'https://api.imgflip.com/get_memes'
            },
            sticker: {
                maker: 'https://api.memegen.link/images'
            },
            fake: {
                ngl: 'https://api.fake-ngl.com/generate',
                chat: 'https://api.fake-chat.com/iphone'
            }
        };
    }
    
    // Rate limiting check
    checkRateLimit(endpoint, limit = 30, window = 60000) {
        const now = Date.now();
        const requests = this.rateLimiter.get(endpoint) || [];
        
        const validRequests = requests.filter(time => now - time < window);
        
        if (validRequests.length >= limit) {
            return false;
        }
        
        validRequests.push(now);
        this.rateLimiter.set(endpoint, validRequests);
        return true;
    }
    
    // Generic API request with caching
    async makeRequest(url, options = {}, cacheKey = null, cacheTTL = 300) {
        try {
            // Check cache first
            if (cacheKey) {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            
            // Check rate limit
            if (!this.checkRateLimit(url)) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            
            const config = {
                timeout: 10000,
                headers: {
                    'User-Agent': 'WhatsApp-Bot/1.0',
                    'Accept': 'application/json'
                },
                ...options
            };
            
            const response = await axios.get(url, config);
            
            // Cache successful response
            if (cacheKey && response.data) {
                this.cache.set(cacheKey, response.data, cacheTTL);
            }
            
            return response.data;
        } catch (error) {
            console.error(`API Request failed for ${url}:`, error.message);
            throw new Error(`API request failed: ${error.message}`);
        }
    }
    
    // Anime APIs
    async getRandomWaifu() {
        try {
            const data = await this.makeRequest(
                this.apiEndpoints.anime.waifu,
                {},
                null, // No caching for random images
                0
            );
            
            // Handle waifu.im response format
            if (data.images && data.images.length > 0) {
                return {
                    url: data.images[0].url,
                    message: '🌸 *Random Waifu*\n\n✨ Waifu cantik untukmu!'
                };
            }
            
            // Fallback to waifu.pics if waifu.im fails
            const fallbackData = await this.makeRequest(
                this.apiEndpoints.anime.waifuPics,
                {},
                null, // No caching for random images
                0
            );
            
            return {
                url: fallbackData.url,
                message: '🌸 *Random Waifu*\n\n✨ Waifu cantik untukmu!'
            };
        } catch (error) {
            return {
                url: null,
                message: '❌ Gagal mendapatkan waifu. Coba lagi nanti.'
            };
        }
    }
    
    async getRandomLoli() {
        try {
            const data = await this.makeRequest(
                this.apiEndpoints.anime.neko,
                {},
                null, // No caching for random images
                0
            );
            
            // Handle waifu.im response format
            if (data.images && data.images.length > 0) {
                return {
                    url: data.images[0].url,
                    message: '🐱 *Random Neko*\n\n✨ Neko kawaii untukmu!'
                };
            }
            
            // Fallback to waifu.pics if waifu.im fails
            const fallbackData = await this.makeRequest(
                this.apiEndpoints.anime.nekoPics,
                {},
                null, // No caching for random images
                0
            );
            
            return {
                url: fallbackData.url,
                message: '🐱 *Random Neko*\n\n✨ Neko kawaii untukmu!'
            };
        } catch (error) {
            return {
                url: null,
                message: '❌ Gagal mendapatkan neko. Coba lagi nanti.'
            };
        }
    }
    
    async getRandomSelfie() {
        try {
            // Try selfie endpoint first
            const data = await this.makeRequest(
                this.apiEndpoints.anime.selfie,
                {},
                null, // No caching for random images
                0
            );
            
            // Handle waifu.im response format
            if (data.images && data.images.length > 0) {
                return {
                    url: data.images[0].url,
                    message: '📸 *Random Anime Selfie*\n\n✨ Selfie anime cantik!'
                };
            }
            
            // Fallback to waifu endpoint if selfie fails
            const fallbackData = await this.makeRequest(
                this.apiEndpoints.anime.waifuPics,
                {},
                null, // No caching for random images
                0
            );
            
            return {
                url: fallbackData.url,
                message: '📸 *Random Anime Selfie*\n\n✨ Selfie anime cantik!'
            };
        } catch (error) {
            return {
                url: null,
                message: '❌ Gagal mendapatkan selfie. Coba lagi nanti.'
            };
        }
    }
    
    async getTopAnime() {
        try {
            const data = await this.makeRequest(
                this.apiEndpoints.anime.topAnime,
                {},
                'top_anime',
                3600 // 1 hour cache
            );
            
            const topAnime = data.data.slice(0, 10);
            let message = '🏆 *TOP 10 ANIME TERPOPULER*\n\n';
            
            topAnime.forEach((anime, index) => {
                message += `${index + 1}. *${anime.title}*\n`;
                message += `   ⭐ Score: ${anime.score}\n`;
                message += `   📺 Episodes: ${anime.episodes || 'Ongoing'}\n\n`;
            });
            
            return message;
        } catch (error) {
            return '❌ Gagal mendapatkan data anime. Coba lagi nanti.';
        }
    }
    
    async searchAnime(query) {
        try {
            const searchUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`;
            const data = await this.makeRequest(
                searchUrl,
                {},
                `anime_search_${query.toLowerCase()}`,
                1800
            );
            
            if (!data.data || data.data.length === 0) {
                return '❌ Anime tidak ditemukan.';
            }
            
            const anime = data.data[0];
            let message = `🎌 *${anime.title}*\n\n`;
            message += `📝 **Synopsis:**\n${anime.synopsis?.substring(0, 200) || 'No synopsis available'}...\n\n`;
            message += `⭐ **Score:** ${anime.score || 'N/A'}\n`;
            message += `📺 **Episodes:** ${anime.episodes || 'Ongoing'}\n`;
            message += `📅 **Year:** ${anime.year || 'N/A'}\n`;
            message += `🎭 **Status:** ${anime.status || 'N/A'}\n\n`;
            
            if (anime.genres && anime.genres.length > 0) {
                message += `🏷️ **Genres:** ${anime.genres.map(g => g.name).join(', ')}\n\n`;
            }
            
            message += `🔗 **URL:** ${anime.url}`;
            
            return {
                message: message,
                image: anime.images?.jpg?.large_image_url || null
            };
        } catch (error) {
            return '❌ Gagal mencari anime. Coba lagi nanti.';
        }
    }
    
    // Meme and Sticker APIs
    async getRandomMeme() {
        try {
            const data = await this.makeRequest(
                this.apiEndpoints.meme.random,
                {},
                'random_meme',
                300
            );
            
            return {
                url: data.url,
                title: data.title,
                message: `😂 *${data.title}*\n\n📱 From: r/${data.subreddit}`
            };
        } catch (error) {
            return {
                url: null,
                message: '❌ Gagal mendapatkan meme. Coba lagi nanti.'
            };
        }
    }
    
    async generateMeme(topText, bottomText = '', template = 'drake') {
        try {
            const memeUrl = `https://api.memegen.link/images/${template}/${encodeURIComponent(topText)}/${encodeURIComponent(bottomText)}.jpg`;
            
            return {
                url: memeUrl,
                message: `😂 *Custom Meme Generated*\n\n📝 Text: ${topText}${bottomText ? ` / ${bottomText}` : ''}`
            };
        } catch (error) {
            return {
                url: null,
                message: '❌ Gagal membuat meme. Coba lagi nanti.'
            };
        }
    }
    
    // Fake Generators
    async generateFakeNGL(message) {
        try {
            // Simulate fake NGL generation
            const fakeData = {
                message: message,
                timestamp: new Date().toISOString(),
                id: Math.random().toString(36).substring(7)
            };
            
            return {
                success: true,
                message: `📱 *Fake NGL Generated*\n\n💬 Message: "${message}"\n🕐 Time: ${new Date().toLocaleString()}\n🆔 ID: ${fakeData.id}`,
                data: fakeData
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal membuat fake NGL.'
            };
        }
    }
    
    async generateFakeChat(name, message) {
        try {
            // Simulate fake iPhone chat generation
            const chatData = {
                sender: name,
                message: message,
                timestamp: new Date().toLocaleString(),
                platform: 'iPhone'
            };
            
            return {
                success: true,
                message: `📱 *Fake iPhone Chat*\n\n👤 From: ${name}\n💬 Message: "${message}"\n🕐 Time: ${chatData.timestamp}\n📱 Platform: iPhone`,
                data: chatData
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal membuat fake chat.'
            };
        }
    }
    
    // Name Generators
    generateNinjaNama() {
        const prefixes = ['Shadow', 'Silent', 'Swift', 'Dark', 'Storm', 'Fire', 'Ice', 'Wind', 'Thunder', 'Mystic'];
        const suffixes = ['Blade', 'Fang', 'Claw', 'Strike', 'Walker', 'Runner', 'Jumper', 'Master', 'Warrior', 'Assassin'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `🥷 *Nama Ninja Kamu:*\n\n⚔️ **${prefix} ${suffix}**\n\n🌟 Kekuatan khusus: ${this.getNinjaAbility()}`;
    }
    
    generateNamaPurba() {
        const prefixes = ['Arga', 'Bima', 'Candra', 'Dewa', 'Eka', 'Guna', 'Hadi', 'Indra', 'Jaya', 'Karna'];
        const suffixes = ['Wijaya', 'Kusuma', 'Pratama', 'Utama', 'Dharma', 'Satria', 'Putra', 'Wira', 'Buana', 'Nata'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `🏛️ *Nama Purba Kamu:*\n\n👑 **${prefix} ${suffix}**\n\n📜 Arti: ${this.getPurbaeMeaning()}`;
    }
    
    getNinjaAbility() {
        const abilities = [
            'Menghilang dalam bayangan',
            'Berlari di atas air',
            'Mengendalikan elemen api',
            'Telepati dengan hewan',
            'Kecepatan super sonic',
            'Kekuatan spiritual tinggi',
            'Menguasai ilmu kloning',
            'Manipulasi waktu singkat'
        ];
        
        return abilities[Math.floor(Math.random() * abilities.length)];
    }
    
    getPurbaeMeaning() {
        const meanings = [
            'Pemimpin yang bijaksana',
            'Pejuang kebenaran',
            'Pelindung rakyat',
            'Penguasa yang adil',
            'Ksatria pemberani',
            'Raja yang mulia',
            'Pangeran yang terhormat',
            'Guru spiritual agung'
        ];
        
        return meanings[Math.floor(Math.random() * meanings.length)];
    }
    
    // BRAT Style Generator
    generateBratText(text) {
        const bratText = text.toUpperCase().split('').join(' ');
        return `✨ *BRAT STYLE* ✨\n\n🎀 ${bratText} 🎀\n\n💅 *That's so BRAT!*`;
    }
    
    async getBratGif() {
        const bratGifs = [
            'https://media.giphy.com/media/3o7TKnO6Wve6502iJ2/giphy.gif',
            'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
            'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif'
        ];
        
        const randomGif = bratGifs[Math.floor(Math.random() * bratGifs.length)];
        
        return {
            url: randomGif,
            message: '✨ *Random BRAT GIF* ✨\n\n💅 So iconic, so BRAT!'
        };
    }
    
    // Emoji Mix
    async mixEmojis(emoji1, emoji2) {
        try {
            // Simulate emoji mixing
            const mixedEmoji = `${emoji1}${emoji2}`;
            
            return {
                success: true,
                message: `🎨 *Emoji Mix Result*\n\n${emoji1} + ${emoji2} = ${mixedEmoji}\n\n✨ Your unique emoji combo!`,
                result: mixedEmoji
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal menggabungkan emoji.'
            };
        }
    }
    
    // API Health Check
    async healthCheck() {
        const endpoints = [
            { name: 'Waifu API', url: this.apiEndpoints.anime.waifu },
            { name: 'Meme API', url: this.apiEndpoints.meme.random }
        ];
        
        const results = [];
        
        for (const endpoint of endpoints) {
            try {
                const start = Date.now();
                await axios.get(endpoint.url, { timeout: 5000 });
                const responseTime = Date.now() - start;
                
                results.push({
                    name: endpoint.name,
                    status: '✅ Online',
                    responseTime: `${responseTime}ms`
                });
            } catch (error) {
                results.push({
                    name: endpoint.name,
                    status: '❌ Offline',
                    error: error.message
                });
            }
        }
        
        let message = '🔍 *API Health Check*\n\n';
        results.forEach(result => {
            message += `${result.status} ${result.name}\n`;
            if (result.responseTime) {
                message += `   ⚡ Response: ${result.responseTime}\n`;
            }
            if (result.error) {
                message += `   ❌ Error: ${result.error}\n`;
            }
            message += '\n';
        });
        
        return message;
    }
    
    // Anime Sticker APIs
    async getAnimeSticker(type = 'random') {
        try {
            // Tags yang tersedia di waifu.im
            const stickerTypes = {
                'kawaii': 'https://api.waifu.im/search?included_tags=waifu',
                'happy': 'https://api.waifu.im/search?included_tags=waifu',
                'sad': 'https://api.waifu.im/search?included_tags=waifu',
                'angry': 'https://api.waifu.im/search?included_tags=waifu',
                'love': 'https://api.waifu.im/search?included_tags=kiss',
                'maid': 'https://api.waifu.im/search?included_tags=maid',
                'uniform': 'https://api.waifu.im/search?included_tags=uniform',
                'cute': 'https://api.waifu.im/search?included_tags=waifu',
                'blush': 'https://api.waifu.im/search?included_tags=waifu',
                'wave': 'https://api.waifu.im/search?included_tags=waifu',
                'random': 'https://api.waifu.im/search?included_tags=waifu'
            };
            
            // Tags yang tidak tersedia di waifu.im, langsung gunakan fallback
            const fallbackOnlyTypes = [];
            
            // Fallback types untuk waifu.pics
            const fallbackTypes = {
                'kawaii': 'https://api.waifu.pics/sfw/awoo',
                'happy': 'https://api.waifu.pics/sfw/happy',
                'sad': 'https://api.waifu.pics/sfw/cry',
                'angry': 'https://api.waifu.pics/sfw/angry',
                'love': 'https://api.waifu.pics/sfw/kiss',
                'cute': 'https://api.waifu.pics/sfw/waifu',
                'random': 'https://api.waifu.pics/sfw/waifu'
            };
            
            // Cek apakah perlu langsung ke fallback
            if (fallbackOnlyTypes.includes(type)) {
                const fallbackUrl = fallbackTypes[type] || fallbackTypes['random'];
                const fallbackData = await this.makeRequest(
                    fallbackUrl,
                    {},
                    null, // No caching for random stickers
                    0
                );
                
                return {
                    url: fallbackData.url,
                    type: type,
                    message: `🌸 *Anime Sticker - ${type.toUpperCase()}*\n\n✨ Stiker anime ${type} untukmu!`
                };
            }
            
            // Coba waifu.im terlebih dahulu
            const apiUrl = stickerTypes[type] || stickerTypes['random'];
            const data = await this.makeRequest(
                apiUrl,
                {},
                null, // No caching for random stickers
                0
            );
            
            // Handle waifu.im response format
            if (data.images && data.images.length > 0) {
                return {
                    url: data.images[0].url,
                    type: type,
                    message: `🌸 *Anime Sticker - ${type.toUpperCase()}*\n\n✨ Stiker anime ${type} untukmu!`
                };
            }
            
            // Fallback to waifu.pics jika waifu.im gagal
            const fallbackUrl = fallbackTypes[type] || fallbackTypes['random'];
            const fallbackData = await this.makeRequest(
                fallbackUrl,
                {},
                null, // No caching for random stickers
                0
            );
            
            return {
                url: fallbackData.url,
                type: type,
                message: `🌸 *Anime Sticker - ${type.toUpperCase()}*\n\n✨ Stiker anime ${type} untukmu!`
            };
        } catch (error) {
            return {
                url: null,
                message: '❌ Gagal mendapatkan stiker anime. Coba lagi nanti.'
            };
        }
    }
    
    async getAnimeStickerPack() {
        try {
            const stickerTypes = ['kawaii', 'happy', 'sad', 'angry', 'love'];
            const stickers = [];
            
            for (const type of stickerTypes) {
                const sticker = await this.getAnimeSticker(type);
                if (sticker.url) {
                    stickers.push({
                        type: type,
                        url: sticker.url
                    });
                }
            }
            
            return {
                stickers: stickers,
                message: `🎁 *Anime Sticker Pack*\n\n📦 ${stickers.length} stiker anime siap digunakan!\n\n${stickers.map((s, i) => `${i+1}. ${s.type.toUpperCase()}`).join('\n')}`
            };
        } catch (error) {
            return {
                stickers: [],
                message: '❌ Gagal mendapatkan stiker pack anime.'
            };
        }
    }
    
    async createAnimeSticker(text, style = 'kawaii') {
        try {
            // Generate anime-style text sticker
            const styles = {
                'kawaii': { emoji: '🌸', border: '✨', color: 'pink' },
                'cool': { emoji: '⚡', border: '🔥', color: 'blue' },
                'cute': { emoji: '💕', border: '🎀', color: 'purple' },
                'strong': { emoji: '💪', border: '⚔️', color: 'red' }
            };
            
            const selectedStyle = styles[style] || styles['kawaii'];
            const styledText = `${selectedStyle.border} ${selectedStyle.emoji} ${text.toUpperCase()} ${selectedStyle.emoji} ${selectedStyle.border}`;
            
            return {
                success: true,
                text: styledText,
                message: `🎨 *Anime Text Sticker*\n\n${styledText}\n\n✨ Style: ${style.toUpperCase()}`
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal membuat stiker teks anime.'
            };
        }
    }

    // Clear API cache
    clearCache() {
        this.cache.flushAll();
        return '🗑️ API cache cleared successfully!';
    }
    
    // Get API stats
    getStats() {
        const cacheStats = this.cache.getStats();
        const rateLimitStats = this.rateLimiter.size;
        
        return {
            cache: {
                keys: this.cache.keys().length,
                hits: cacheStats.hits,
                misses: cacheStats.misses
            },
            rateLimit: {
                activeEndpoints: rateLimitStats
            }
        };
    }
}

module.exports = APIManager;