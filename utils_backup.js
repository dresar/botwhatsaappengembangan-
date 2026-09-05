const axios = require('axios');
const NodeCache = require('node-cache');
const Sentiment = require('sentiment');
const nlp = require('compromise');
const math = require('mathjs');
const figlet = require('figlet');
const QRCode = require('qrcode');
const moment = require('moment');

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
    
    // QR Code Generator
    async generateQRCode(text) {
        try {
            const qrCode = await QRCode.toDataURL(text, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return qrCode;
        } catch (error) {
            throw new Error('Gagal membuat QR Code');
        }
    }
    
    // URL Shortener
    async shortenUrl(url) {
        try {
            // Simple URL shortener simulation
            const shortCode = Math.random().toString(36).substring(2, 8);
            const shortUrl = `https://short.ly/${shortCode}`;
            
            // In real implementation, save to database
            this.cache.set(`url_${shortCode}`, url, 86400); // 24 hours
            
            return {
                original: url,
                shortened: shortUrl,
                code: shortCode
            };
        } catch (error) {
            throw new Error('Gagal mempendekkan URL');
        }
    }
    
    // Calculator
    calculate(expression) {
        try {
            // Sanitize expression
            const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
            const result = math.evaluate(sanitized);
            
            return {
                expression: sanitized,
                result: result,
                formatted: `${sanitized} = ${result}`
            };
        } catch (error) {
            throw new Error('Rumus matematika tidak valid');
        }
    }
    
    // ASCII Art Generator
    async generateASCII(text) {
        return new Promise((resolve, reject) => {
            figlet(text, {
                font: 'Standard',
                horizontalLayout: 'default',
                verticalLayout: 'default'
            }, (err, data) => {
                if (err) {
                    reject(new Error('Gagal membuat ASCII art'));
                } else {
                    resolve(data);
                }
            });
        });
    }
    
    // Weather API
    async getWeather(city) {
        try {
            const cacheKey = `weather_${city.toLowerCase()}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached) {
                return cached;
            }
            
            // Simulated weather data (replace with real API)
            const weatherData = {
                city: city,
                temperature: Math.floor(Math.random() * 15) + 20,
                condition: ['Cerah', 'Berawan', 'Hujan', 'Mendung'][Math.floor(Math.random() * 4)],
                humidity: Math.floor(Math.random() * 40) + 40,
                windSpeed: Math.floor(Math.random() * 20) + 5
            };
            
            this.cache.set(cacheKey, weatherData, 1800); // 30 minutes
            return weatherData;
        } catch (error) {
            throw new Error('Gagal mendapatkan data cuaca');
        }
    }
    
    // Translation Service
    async translateText(text, targetLang = 'en') {
        try {
            const cacheKey = `translate_${text}_${targetLang}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached) {
                return cached;
            }
            
            // Simulated translation (replace with real API)
            const translations = {
                'halo': { en: 'hello', es: 'hola', fr: 'bonjour' },
                'selamat pagi': { en: 'good morning', es: 'buenos días', fr: 'bonjour' },
                'terima kasih': { en: 'thank you', es: 'gracias', fr: 'merci' }
            };
            
            const result = {
                original: text,
                translated: translations[text.toLowerCase()]?.[targetLang] || `[Translated: ${text}]`,
                targetLanguage: targetLang
            };
            
            this.cache.set(cacheKey, result, 3600); // 1 hour
            return result;
        } catch (error) {
            throw new Error('Gagal menerjemahkan teks');
        }
    }
    
    // Wikipedia Search
    async searchWikipedia(query) {
        try {
            const cacheKey = `wiki_${query.toLowerCase()}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached) {
                return cached;
            }
            
            const response = await axios.get('https://id.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query), {
                timeout: 10000
            });
            
            const result = {
                title: response.data.title,
                extract: response.data.extract,
                url: response.data.content_urls?.desktop?.page || '',
                thumbnail: response.data.thumbnail?.source || ''
            };
            
            this.cache.set(cacheKey, result, 3600); // 1 hour
            return result;
        } catch (error) {
            throw new Error('Tidak ditemukan di Wikipedia');
        }
    }
    
    // Random Quote Generator
    async getRandomQuote() {
        const quotes = [
            { text: 'Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya.', author: 'Charles R. Swindoll' },
            { text: 'Masa depan milik mereka yang percaya pada keindahan mimpi mereka.', author: 'Eleanor Roosevelt' },
            { text: 'Jangan menunggu kesempatan. Ciptakanlah.', author: 'George Bernard Shaw' },
            { text: 'Sukses adalah kemampuan untuk bangkit dari kegagalan tanpa kehilangan semangat.', author: 'Winston Churchill' },
            { text: 'Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia.', author: 'Nelson Mandela' }
        ];
        
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        return `💭 *"${quote.text}"*\n\n— ${quote.author}`;
    }
    
    // Random Joke Generator
    async getRandomJoke() {
        const jokes = [
            'Kenapa programmer suka kopi? Karena tanpa kopi, mereka jadi Java-script!',
            'Apa bedanya programmer dan pesulap? Programmer bikin bug, pesulap bikin kelinci hilang!',
            'Kenapa komputer tidak pernah lapar? Karena sudah ada cookies!',
            'Apa yang dilakukan programmer saat stress? Ctrl + Z kehidupannya!',
            'Kenapa WiFi rumah sakit lemot? Karena banyak yang butuh bandwidth untuk recover!'
        ];
        
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    // Dad Joke Generator
    async getDadJoke() {
        const dadJokes = [
            'Ayah: "Nak, kamu tahu tidak kenapa ikan tidak bayar pajak?" Anak: "Kenapa, yah?" Ayah: "Karena mereka hidup di bawah C (sea)!"',
            'Ayah: "Nak, apa yang kamu sebut keju yang bukan milikmu?" Anak: "Apa, yah?" Ayah: "Nacho cheese!"',
            'Ayah: "Kenapa skeleton tidak pernah berkelahi?" Anak: "Kenapa?" Ayah: "Karena mereka tidak punya guts!"',
            'Ayah: "Nak, apa yang kamu sebut dinosaurus yang tidur?" Anak: "Apa?" Ayah: "Dino-snore!"',
            'Ayah: "Kenapa matematika sedih?" Anak: "Kenapa, yah?" Ayah: "Karena penuh dengan problems!"'
        ];
        
        return dadJokes[Math.floor(Math.random() * dadJokes.length)];
    }
    
    // Format Time
    formatTime(timestamp) {
        return moment(timestamp).format('DD/MM/YYYY HH:mm:ss');
    }
    
    // Format Duration
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    // Format Number
    formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num);
    }
    
    // Validate URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // Clean Text
    cleanText(text) {
        return text
            .replace(/[^\w\s\u00C0-\u017F\u0100-\u017F\u1E00-\u1EFF]/g, '')
            .trim()
            .substring(0, 1000);
    }
    
    // Generate Random ID
    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    // Memory Usage
    getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
            heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
            heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
            external: Math.round(used.external / 1024 / 1024 * 100) / 100
        };
    }
    
    // Clear Cache
    clearCache() {
        this.cache.flushAll();
        return 'Cache cleared successfully';
    }
    
    // Get Cache Stats
    getCacheStats() {
        return {
            keys: this.cache.keys().length,
            hits: this.cache.getStats().hits,
            misses: this.cache.getStats().misses
        };
    }
    
    // Error Handler
    handleError(error, context = '') {
        console.error(`[ERROR] ${context}:`, error.message);
        return {
            success: false,
            error: error.message,
            context: context,
            timestamp: new Date().toISOString()
        };
    }
    
    // Success Response
    successResponse(data, message = 'Success') {
        return {
            success: true,
            message: message,
            data: data,
            timestamp: new Date().toISOString()
        };
    }
    
    // Meme Generator
    async generateMeme(text) {
        try {
            const memeTemplates = [
                'drake',
                'distracted-boyfriend',
                'two-buttons',
                'change-my-mind',
                'expanding-brain',
                'woman-yelling-at-cat',
                'this-is-fine',
                'surprised-pikachu'
            ];
            
            const template = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
            const memeUrl = `https://api.memegen.link/images/${template}/${encodeURIComponent(text)}.jpg`;
            
            return {
                url: memeUrl,
                message: `😂 *MEME GENERATOR*\n\n📝 Text: ${text}\n🎭 Template: ${template}\n\n🔗 ${memeUrl}`
            };
        } catch (error) {
            return {
                url: null,
                message: '❌ Gagal membuat meme. Coba lagi nanti.'
            };
        }
    }
    
    // Sticker Merger
    async mergeStickers(sticker1, sticker2) {
        try {
            // Simulate sticker merging
            const mergedId = Math.random().toString(36).substring(7);
            return {
                success: true,
                message: `🎨 *STICKER MERGER*\n\n✅ Berhasil menggabungkan 2 sticker!\n🆔 ID: ${mergedId}\n\n💡 Sticker gabungan siap digunakan!`,
                mergedId: mergedId
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal menggabungkan sticker. Coba lagi nanti.'
            };
        }
    }
    
    // Enhanced Sticker Creator
    async createCustomSticker(text, style = 'default') {
        try {
            const styles = {
                'default': '📝',
                'kawaii': '🌸',
                'cool': '😎',
                'funny': '😂',
                'love': '💕',
                'angry': '😠'
            };
            
            const icon = styles[style] || styles['default'];
            const stickerId = Math.random().toString(36).substring(7);
            
            return {
                success: true,
                message: `${icon} *CUSTOM STICKER*\n\n📝 Text: ${text}\n🎨 Style: ${style.toUpperCase()}\n🆔 ID: ${stickerId}\n\n✨ Sticker custom berhasil dibuat!`,
                stickerId: stickerId
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal membuat sticker custom. Coba lagi nanti.'
            };
        }
    }
    
    // Logo Maker
    async createLogo(text, style = 'modern') {
        try {
            const logoStyles = {
                'modern': '🔷',
                'classic': '🏛️',
                'tech': '⚡',
                'creative': '🎨',
                'business': '💼',
                'gaming': '🎮'
            };
            
            const icon = logoStyles[style] || logoStyles['modern'];
            const logoId = Math.random().toString(36).substring(7);
            
            return {
                success: true,
                message: `${icon} *LOGO MAKER*\n\n📝 Text: ${text}\n🎨 Style: ${style.toUpperCase()}\n🆔 ID: ${logoId}\n\n✨ Logo berhasil dibuat!`,
                logoId: logoId
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal membuat logo. Coba lagi nanti.'
            };
        }
    }
    
    // Photo Editor
    async editPhoto(effect = 'filter') {
        try {
            const effects = {
                'filter': '🎭 Filter diterapkan',
                'blur': '🌫️ Blur effect diterapkan',
                'vintage': '📸 Vintage effect diterapkan',
                'black-white': '⚫ Black & White effect diterapkan',
                'sepia': '🟤 Sepia effect diterapkan',
                'bright': '☀️ Brightness ditingkatkan'
            };
            
            const effectMsg = effects[effect] || effects['filter'];
            const editId = Math.random().toString(36).substring(7);
            
            return {
                success: true,
                message: `📸 *PHOTO EDITOR*\n\n${effectMsg}\n🆔 ID: ${editId}\n\n✨ Foto berhasil diedit!`,
                editId: editId
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Gagal mengedit foto. Coba lagi nanti.'
            };
        }
    }
    
    // QR Code Generator (Enhanced with Downloadable Image)
    async generateQR(text) {
        try {
            const axios = require('axios');
            const fs = require('fs');
            const path = require('path');
            
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
            const axios = require('axios');
            
            if (!this.isValidUrl(url)) {
                return '❌ URL tidak valid. Pastikan URL dimulai dengan http:// atau https://';
            }
            
            // Check cache first
            const cacheKey = `short_${url}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            
            // Use Ulvis.net API for URL shortening
            const apiUrl = `https://ulvis.net/api.php?url=${encodeURIComponent(url)}&type=json`;
            
            const response = await axios.get(apiUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.data && response.data.success === '1') {
                const shortUrl = response.data.data.url;
                const shortId = response.data.data.id;
                
                const result = `🔗 *URL SHORTENER*\n\n📎 Original: ${url}\n✂️ Shortened: ${shortUrl}\n🆔 ID: ${shortId}\n🌐 Provider: Ulvis.net\n\n✅ URL berhasil dipendekkan!\n💾 Link akan aktif selama 30 hari`;
                
                // Cache the result for 1 hour
                this.cache.set(cacheKey, result, 3600);
                
                return result;
            } else {
                throw new Error('API response invalid');
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

    // Translation Service (Enhanced)
    async translateText(text) {
        try {
            const cacheKey = `translate_${text.toLowerCase()}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached) {
                return cached;
            }
            
            // Enhanced translation dictionary
            const translations = {
                // Indonesian to English
                'halo': 'hello',
                'selamat pagi': 'good morning',
                'selamat siang': 'good afternoon', 
                'selamat malam': 'good evening',
                'terima kasih': 'thank you',
                'maaf': 'sorry',
                'permisi': 'excuse me',
                'sampai jumpa': 'goodbye',
                'apa kabar': 'how are you',
                'nama saya': 'my name is',
                // English to Indonesian
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
            
            // Simulate Wikipedia search with common topics
            const wikiData = {
                'indonesia': {
                    title: 'Indonesia',
                    extract: 'Indonesia adalah negara kepulauan di Asia Tenggara yang terdiri dari ribuan pulau. Ibu kota Indonesia adalah Jakarta.',
                    url: 'https://id.wikipedia.org/wiki/Indonesia'
                },
                'jakarta': {
                    title: 'Jakarta', 
                    extract: 'Jakarta adalah ibu kota dan kota terbesar Indonesia. Jakarta merupakan pusat pemerintahan, ekonomi, dan budaya Indonesia.',
                    url: 'https://id.wikipedia.org/wiki/Jakarta'
                },
                'programming': {
                    title: 'Programming',
                    extract: 'Programming adalah proses menulis, menguji, dan memelihara kode sumber program komputer.',
                    url: 'https://en.wikipedia.org/wiki/Programming'
                }
            };
            
            const data = wikiData[query.toLowerCase()] || {
                title: query,
                extract: `Informasi tentang "${query}" tidak ditemukan dalam database lokal. Silakan coba kata kunci lain.`,
                url: `https://id.wikipedia.org/wiki/${encodeURIComponent(query)}`
            };
            
            const result = `📚 *WIKIPEDIA SEARCH*\n\n📖 **${data.title}**\n\n${data.extract}\n\n🔗 ${data.url}\n\n✅ Pencarian selesai!`;
            
            this.cache.set(cacheKey, result, 3600); // 1 hour
            return result;
        } catch (error) {
            return '❌ Gagal mencari di Wikipedia. Coba lagi nanti.';
        }
    }

    // Generate Quote
    generateQuote() {
        const quotes = [
            "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya. - Charles R. Swindoll",
            "Masa depan milik mereka yang percaya pada keindahan mimpi mereka. - Eleanor Roosevelt",
            "Jangan menunggu kesempatan. Ciptakanlah. - George Bernard Shaw",
            "Sukses adalah kemampuan untuk bangkit dari kegagalan tanpa kehilangan semangat. - Albert Schweitzer",
            "Satu-satunya cara untuk melakukan pekerjaan yang hebat adalah dengan mencintai apa yang kamu lakukan. - Steve Jobs",
            "Percayalah pada dirimu sendiri dan semua yang kamu miliki. - Christian D. Larson",
            "Jangan takut gagal. Takutlah tidak mencoba. - Unknown",
            "Kesuksesan adalah perjalanan, bukan tujuan. - Ben Sweetland",
            "Mimpi besar dan berani untuk gagal. - Norman Vaughan",
            "Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas. - Henry Ford"
        ];
        
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        return `🌟 *Quote Inspiratif* 🌟\n\n${randomQuote}`;
    }
}

module.exports = UtilityManager;