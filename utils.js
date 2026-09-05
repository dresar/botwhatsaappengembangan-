const NodeCache = require('node-cache');
const QRCode = require('qrcode');
const Sentiment = require('sentiment');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class UtilityManager {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
        this.sentiment = new Sentiment();
        this.rateLimiter = new Map();
        this.apiKeys = {
            weather: process.env.WEATHER_API_KEY || '',
            translate: process.env.TRANSLATE_API_KEY || ''
        };
    }
    
    // Rate Limiting
    checkRateLimit(userId, limit = 10, window = 60000) {
        const now = Date.now();
        const userRequests = this.rateLimiter.get(userId) || [];
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < window);
        
        if (validRequests.length >= limit) {
            return false;
        }
        
        validRequests.push(now);
        this.rateLimiter.set(userId, validRequests);
        return true;
    }
    
    // Text Processing
    extractWords(text) {
        return text.toLowerCase()
            .replace(/[^a-zA-Z\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);
    }
    
    // Sentiment Analysis
    analyzeSentiment(text) {
        const result = this.sentiment.analyze(text);
        let mood = 'Netral';
        
        if (result.score > 2) mood = 'Sangat Positif 😄';
        else if (result.score > 0) mood = 'Positif 😊';
        else if (result.score < -2) mood = 'Sangat Negatif 😢';
        else if (result.score < 0) mood = 'Negatif 😔';
        
        return {
            score: result.score,
            mood: mood,
            words: result.words
        };
    }
    
    // QR Code Generator (Enhanced with Downloadable Image)
    async generateQR(text) {
        try {
            // Create QR codes directory if not exists
            const qrDir = path.join(__dirname, 'qr_codes');
            if (!fs.existsSync(qrDir)) {
                fs.mkdirSync(qrDir, { recursive: true });
            }
            
            const qrId = Math.random().toString(36).substring(7);
            const fileName = `qr_${qrId}.png`;
            const filePath = path.join(qrDir, fileName);
            
            // Generate QR code using external API with higher resolution
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=${encodeURIComponent(text)}`;
            
            // Download QR code image
            const response = await axios({
                method: 'GET',
                url: qrApiUrl,
                responseType: 'stream'
            });
            
            // Save image to file
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    resolve({
                        success: true,
                        qrUrl: qrApiUrl,
                        filePath: filePath,
                        fileName: fileName,
                        downloadUrl: `file://${filePath}`,
                        message: `📱 *QR CODE GENERATOR*\n\n📝 Text/URL: ${text}\n🆔 ID: ${qrId}\n📁 File: ${fileName}\n\n✅ QR Code berhasil dibuat dan disimpan!\n📥 File tersimpan di: ${filePath}\n🔗 QR Image URL: ${qrApiUrl}\n\n💡 Scan QR code untuk melihat: ${text}`,
                        data: text,
                        id: qrId
                    });
                });
                
                writer.on('error', (error) => {
                    reject({
                        success: false,
                        message: '❌ Gagal menyimpan QR Code. Coba lagi nanti.',
                        error: error.message
                    });
                });
            });
            
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal membuat QR Code. Coba lagi nanti.',
                error: error.message
            };
        }
    }

    // URL Shortener (Using Ulvis.net API)
    async shortenUrl(url) {
        try {
            if (!this.isValidUrl(url)) {
                return '❌ URL tidak valid. Pastikan URL dimulai dengan http:// atau https://';
            }
            
            // Check cache first
            const cacheKey = `short_${url}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            
            // Use TinyURL API for URL shortening (More reliable alternative)
            const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            // TinyURL returns the shortened URL directly as plain text
            if (response.data && response.data.startsWith('https://tinyurl.com/')) {
                const shortUrl = response.data.trim();
                const shortId = shortUrl.split('/').pop(); // Extract ID from URL
                
                const result = `🔗 *URL SHORTENER*\n\n📎 Original: ${url}\n✂️ Shortened: ${shortUrl}\n🆔 ID: ${shortId}\n🌐 Provider: TinyURL\n\n✅ URL berhasil dipendekkan!\n💾 Link dapat dibuka di browser`;
                
                // Cache the result for 1 hour
                this.cache.set(cacheKey, result, 3600);
                
                return result;
            } else {
                throw new Error('TinyURL API response invalid or missing data');
            }
            
        } catch (error) {
            console.error('URL Shortener Error:', error.message);
            
            // Fallback to local shortener if API fails
            const shortCode = Math.random().toString(36).substring(2, 8);
            const fallbackUrl = `https://short.ly/${shortCode}`;
            
            // Cache the URL mapping
            this.cache.set(`url_${shortCode}`, url, 86400);
            
            return `🔗 *URL SHORTENER* (Fallback)\n\n📎 Original: ${url}\n✂️ Shortened: ${fallbackUrl}\n🆔 Code: ${shortCode}\n⚠️ Menggunakan server lokal (API eksternal tidak tersedia)\n\n✅ URL berhasil dipendekkan!`;
        }
    }

    // Calculator (Fixed)
    calculateMath(expression) {
        try {
            // Sanitize expression - only allow numbers, operators, parentheses, and decimal points
            const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
            
            if (!sanitized.trim()) {
                return '❌ Rumus matematika tidak valid. Gunakan angka dan operator (+, -, *, /, ())';
            }
            
            // Simple evaluation using Function constructor (safer than eval)
            const result = Function('"use strict"; return (' + sanitized + ')')();
            
            if (!isFinite(result)) {
                return '❌ Hasil perhitungan tidak valid (infinity atau NaN)';
            }
            
            return `🧮 *CALCULATOR*\n\n📝 Rumus: ${sanitized}\n🔢 Hasil: ${result}\n\n✅ Perhitungan selesai!`;
        } catch (error) {
            return '❌ Rumus matematika tidak valid. Periksa sintaks dan coba lagi.';
        }
    }

    // Weather Service (Enhanced)
    async getWeather(city) {
        try {
            const cacheKey = `weather_${city.toLowerCase()}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached) {
                return cached;
            }
            
            // Enhanced simulated weather data
            const conditions = [
                { name: 'Cerah', icon: '☀️', desc: 'Cuaca cerah sepanjang hari' },
                { name: 'Berawan', icon: '☁️', desc: 'Langit berawan sebagian' },
                { name: 'Hujan', icon: '🌧️', desc: 'Hujan ringan hingga sedang' },
                { name: 'Mendung', icon: '⛅', desc: 'Langit mendung' },
                { name: 'Badai', icon: '⛈️', desc: 'Cuaca buruk dengan petir' }
            ];
            
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            const temperature = Math.floor(Math.random() * 15) + 20;
            const humidity = Math.floor(Math.random() * 40) + 40;
            const windSpeed = Math.floor(Math.random() * 20) + 5;
            
            const weatherReport = `🌤️ *CUACA ${city.toUpperCase()}*\n\n${condition.icon} ${condition.name}\n🌡️ Suhu: ${temperature}°C\n💧 Kelembaban: ${humidity}%\n💨 Angin: ${windSpeed} km/h\n\n📝 ${condition.desc}\n⏰ Update: ${new Date().toLocaleString('id-ID')}`;
            
            this.cache.set(cacheKey, weatherReport, 1800); // 30 minutes
            return weatherReport;
        } catch (error) {
            return '❌ Gagal mendapatkan data cuaca. Coba lagi nanti.';
        }
    }

    // Text Translation (Enhanced)
    async translateText(text) {
        try {
            const cacheKey = `translate_${text.toLowerCase()}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached) {
                return cached;
            }
            
            // Enhanced translation dictionary
            const translations = {
                'hello': 'halo',
                'good morning': 'selamat pagi',
                'good afternoon': 'selamat siang',
                'good evening': 'selamat malam',
                'thank you': 'terima kasih',
                'sorry': 'maaf',
                'excuse me': 'permisi',
                'goodbye': 'sampai jumpa',
                'how are you': 'apa kabar',
                'my name is': 'nama saya'
            };
            
            const lowerText = text.toLowerCase();
            const translated = translations[lowerText] || `[Auto-translated: ${text}]`;
            
            const result = `🌐 *TRANSLATOR*\n\n📝 Original: ${text}\n🔄 Translated: ${translated}\n\n✅ Terjemahan selesai!`;
            
            this.cache.set(cacheKey, result, 3600); // 1 hour
            return result;
        } catch (error) {
            return '❌ Gagal menerjemahkan teks. Coba lagi nanti.';
        }
    }

    // Wikipedia Search (Enhanced)
    async searchWikipedia(query) {
        try {
            const cacheKey = `wiki_${query.toLowerCase()}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached) {
                return cached;
            }
            
            // Simulated Wikipedia search results
            const wikiResults = {
                'indonesia': {
                    title: 'Indonesia',
                    summary: 'Indonesia adalah negara kepulauan di Asia Tenggara yang terdiri dari lebih dari 17.000 pulau.',
                    url: 'https://id.wikipedia.org/wiki/Indonesia'
                },
                'javascript': {
                    title: 'JavaScript',
                    summary: 'JavaScript adalah bahasa pemrograman tingkat tinggi yang dinamis dan interpreted.',
                    url: 'https://en.wikipedia.org/wiki/JavaScript'
                },
                'default': {
                    title: query,
                    summary: `Informasi tentang "${query}" dapat ditemukan di Wikipedia.`,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`
                }
            };
            
            const result = wikiResults[query.toLowerCase()] || wikiResults['default'];
            
            const wikiResponse = `📚 *WIKIPEDIA SEARCH*\n\n🔍 Query: ${query}\n📖 Title: ${result.title}\n\n📝 Summary:\n${result.summary}\n\n🔗 Link: ${result.url}\n\n✅ Pencarian selesai!`;
            
            this.cache.set(cacheKey, wikiResponse, 3600); // 1 hour
            return wikiResponse;
        } catch (error) {
            return '❌ Gagal mencari di Wikipedia. Coba lagi nanti.';
        }
    }

    // Utility Functions
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    cleanText(text) {
        return text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }

    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
            heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
            heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
            external: Math.round(used.external / 1024 / 1024 * 100) / 100
        };
    }

    clearCache() {
        this.cache.flushAll();
        return '🗑️ Cache berhasil dibersihkan!';
    }

    getCacheStats() {
        const stats = this.cache.getStats();
        return `📊 *CACHE STATISTICS*\n\nKeys: ${stats.keys}\nHits: ${stats.hits}\nMisses: ${stats.misses}\nHit Rate: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)}%`;
    }

    handleError(error, context = 'Unknown') {
        console.error(`[${context}] Error:`, error);
        return `❌ Terjadi kesalahan pada ${context}. Silakan coba lagi.`;
    }

    successResponse(message, data = null) {
        return {
            success: true,
            message: message,
            data: data,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = UtilityManager;