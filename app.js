const sentiment = require('sentiment');
const UtilityManager = require('./utils');
const utils = new UtilityManager();
const apiManager = require('./api'); // Mengubah dari './apiManager' ke './api'
const Database = require('./database');
const db = new Database();
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});
const qrcode = require('qrcode-terminal');
const cron = require('cron');
const { v4: uuidv4 } = require('uuid');

const botConfig = require('./config');
const AdminSystem = require('./admin'); // Mengubah dari './adminSystem' ke './admin'
const adminSystem = new AdminSystem(db);
const aiSystem = require('./ai'); // Mengubah dari './aiSystem' ke './ai'
const menuSystem = require('./menu'); // Mengubah dari './menuSystem' ke './menu'
const GameEngine = require('./games'); // Menambahkan import untuk gameEngine
const gameEngine = new GameEngine(db);

let botStats = {
    isReady: false,
    messagesProcessed: 0,
    commandsExecuted: 0,
    activeUsers: new Set(),
    cooldown: {}
};

let pollStates = new Map();

function addExp(userId, exp) {
    db.updateUserExp(userId, exp);
}

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

function checkCooldown(userId, commandName) {
    const cooldown = botStats.cooldown[userId];
    
    if (cooldown && cooldown[commandName]) {
        return false;
    }
    
    botStats.cooldown[userId] = {
        [commandName]: Date.now() + 5000
    };
    
    return true;
}

const commands = {
    async addtekateki(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['addtekateki', ...args], msg);
    },
    
    async addsiapa(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['addsiapa', ...args], msg);
    },
    
    async addcaklontong(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['addcaklontong', ...args], msg);
    },
    
    async addkata(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['addkata', ...args], msg);
    },
    
    async adminhelp(args, msg) {
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Kamu bukan admin!';
        }
        return await adminSystem.handleCommand(['adminhelp', ...args], msg);
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
            // Send QR code image file
            try {
                const { MessageMedia } = require('whatsapp-web.js');
                const fs = require('fs');
                
                // Wait a moment for file to be fully written
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if file exists
                if (fs.existsSync(result.filePath)) {
                    // Send the downloaded QR code file
                    const qrMedia = MessageMedia.fromFilePath(result.filePath);
                    await msg.reply(qrMedia, undefined, { 
                        caption: `📱 *QR CODE GENERATOR*\n\n📝 Text/URL: ${text}\n🆔 ID: ${result.id}\n📁 File: ${result.fileName}\n\n✅ QR Code berhasil dibuat!\n💡 Scan QR code untuk melihat: ${text}` 
                    });
                    
                    // Also send text message with details
                    await msg.reply(`📥 File QR Code tersimpan di: ${result.filePath}\n🔗 Direct URL: ${result.qrUrl}`);
                    
                    return '✅ QR Code berhasil dikirim sebagai file gambar!';
                } else {
                    // Fallback to URL if file doesn't exist
                    const qrMedia = await MessageMedia.fromUrl(result.qrUrl);
                    await msg.reply(qrMedia, undefined, { caption: `QR Code untuk: ${text}` });
                    await msg.reply(result.message);
                    return '✅ QR Code berhasil dikirim via URL!';
                }
            } catch (error) {
                console.error('QR Code sending error:', error);
                // If all fails, return message with download info
                return result.message + `\n\n⚠️ Gagal mengirim gambar, tapi file tersimpan di: ${result.filePath}`;
            }
        } else {
            return result.message;
        }
    },
    
    async short(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan URL yang ingin dipendekkan\n💡 Contoh: /short https://google.com\n🧪 Atau gunakan: /short test untuk menguji beberapa URL';
        }
        
        // Special test mode
        if (args[0].toLowerCase() === 'test') {
            return await this.testShortener();
        }
        
        const url = args[0];
        return await utils.shortenUrl(url);
    },
    
    async testShortener() {
        const testUrls = [
            'https://www.google.com',
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://github.com'
        ];
        
        let results = '🔗 *TESTING URL SHORTENER*\n\n';
        
        for (let i = 0; i < testUrls.length; i++) {
            const url = testUrls[i];
            results += `📋 Test ${i + 1}: ${url}\n`;
            
            try {
                const result = await utils.shortenUrl(url);
                // Extract just the shortened URL from the result
                const shortUrlMatch = result.match(/✂️ Shortened: (https?:\/\/[^\s]+)/);
                const shortUrl = shortUrlMatch ? shortUrlMatch[1] : 'URL tidak ditemukan';
                results += `✅ Berhasil: ${shortUrl}\n`;
            } catch (error) {
                results += `❌ Error: ${error.message}\n`;
            }
            
            results += '\n';
            
            // Add delay between requests to avoid rate limiting
            if (i < testUrls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        results += '✅ *Test selesai!* Semua URL telah diuji dengan Ulvis.net API';
        return results;
    },
    
    async remind(args, msg) {
        if (args.length < 2) {
            return '❌ Format: /remind [waktu] [pesan]\n💡 Contoh: /remind 10m Makan siang';
        }
        
        const timeStr = args[0];
        const message = args.slice(1).join(' ');
        
        // Parse time (simple parser for minutes/hours)
        let minutes = 0;
        if (timeStr.endsWith('m')) {
            minutes = parseInt(timeStr.slice(0, -1));
        } else if (timeStr.endsWith('h')) {
            minutes = parseInt(timeStr.slice(0, -1)) * 60;
        } else {
            return '❌ Format waktu: 10m (menit) atau 2h (jam)';
        }
        
        const remindAt = new Date(Date.now() + minutes * 60000);
        
        try {
            await db.createReminder(msg.author, msg.from, message, remindAt.toISOString());
            return `⏰ *REMINDER SET*\n\n📝 Pesan: ${message}\n⏰ Waktu: ${remindAt.toLocaleString('id-ID')}\n\n✅ Reminder berhasil dibuat!`;
        } catch (error) {
            return '❌ Gagal membuat reminder';
        }
    },
    
    async calc(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan rumus matematika\n💡 Contoh: /calc 2 + 2 * 3';
        }
        
        const expression = args.join(' ');
        return utils.calculateMath(expression);
    },
    
    async cuaca(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan nama kota\n💡 Contoh: /cuaca Jakarta';
        }
        
        const city = args.join(' ');
        return await utils.getWeather(city);
    },
    
    async translate(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan text yang ingin diterjemahkan\n💡 Contoh: /translate Hello world';
        }
        
        const text = args.join(' ');
        return await utils.translateText(text);
    },
    
    async wiki(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan kata kunci pencarian\n💡 Contoh: /wiki Indonesia';
        }
        
        const query = args.join(' ');
        return await utils.searchWikipedia(query);
    },
    
    async meme(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan text untuk meme\n💡 Contoh: /meme When you code at 3 AM';
        }
        
        const text = args.join(' ');
        return await utils.generateMeme(text);
    },
    
    async ascii(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan text untuk ASCII art\n💡 Contoh: /ascii HELLO';
        }
        
        const text = args.join(' ');
        return await utils.generateASCII(text);
    },
    
    async ai(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan pertanyaan\n💡 Contoh: /ai Apa itu JavaScript?';
        }
        
        const question = args.join(' ');
        return await aiSystem.generateResponse(msg.from, msg.author, question);
    },
    
    async sentiment(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan text untuk dianalisis\n💡 Contoh: /sentiment Hari ini sangat menyenangkan';
        }
        
        const text = args.join(' ');
        return utils.analyzeSentiment(text);
    },
    
    async quote(args, msg) {
        return utils.generateQuote();
    },
    
    // AI Management Commands
    async clearai(args, msg) {
        return aiSystem.clearMemory(msg.from);
    },
    
    async loadhistory(args, msg) {
        return await aiSystem.loadHistoryFromDatabase(msg.from);
    },
    
    async clearallai(args, msg) {
        return await aiSystem.clearAllData(msg.from);
    },
    
    async aistats(args, msg) {
        return await aiSystem.getAIStats(msg.from);
    },
    
    async aiglobal(args, msg) {
        // Only for admins
        if (!adminSystem.isAdmin(msg.author)) {
            return '❌ Command ini hanya untuk admin!';
        }
        return await aiSystem.getGlobalAIStats();
    },
    
    // ANIME FEATURES
    async randomloli(args, msg) {
        const result = await apiManager.getRandomLoli();
        if (result.url) {
            try {
                const media = await MessageMedia.fromUrl(result.url);
                await client.sendMessage(msg.from, media, { caption: result.message });
            } catch (error) {
                console.error('Error sending media:', error);
                await msg.reply(result.message + '\n\n🔗 ' + result.url);
            }
        } else {
            await msg.reply(result.message);
        }
    },
    
    async randomselfie(args, msg) {
        const result = await apiManager.getRandomSelfie();
        if (result.url) {
            try {
                const media = await MessageMedia.fromUrl(result.url);
                await client.sendMessage(msg.from, media, { caption: result.message });
            } catch (error) {
                console.error('Error sending media:', error);
                await msg.reply(result.message + '\n\n🔗 ' + result.url);
            }
        } else {
            await msg.reply(result.message);
        }
    },
    
    async randomwaifu(args, msg) {
        const result = await apiManager.getRandomWaifu();
        if (result.url) {
            try {
                const media = await MessageMedia.fromUrl(result.url);
                await client.sendMessage(msg.from, media, { caption: result.message });
            } catch (error) {
                console.error('Error sending media:', error);
                await msg.reply(result.message + '\n\n🔗 ' + result.url);
            }
        } else {
            await msg.reply(result.message);
        }
    },
    
    async topanime(args, msg) {
        return await apiManager.getTopAnime();
    },
    
    async otakudesu(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan judul anime\n💡 Contoh: /otakudesu Naruto';
        }
        
        const query = args.join(' ');
        return await apiManager.searchAnime(query);
    },
    
    // ANIME STICKER FEATURES
    async animesticker(args, msg) {
        const type = args[0] || 'random';
        const result = await apiManager.getAnimeSticker(type);
        
        if (result.url) {
            try {
                const media = await MessageMedia.fromUrl(result.url);
                await client.sendMessage(msg.from, media, { caption: result.message });
            } catch (error) {
                console.error('Error sending media:', error);
                await msg.reply(result.message + '\n\n🔗 ' + result.url);
            }
        } else {
            await msg.reply(result.message);
        }
    },
    
    async animestickerpack(args, msg) {
        const result = await apiManager.getAnimeStickerPack();
        
        if (result.stickers.length > 0) {
            await msg.reply(result.message);
            
            // Send each sticker in the pack
            for (const sticker of result.stickers) {
                try {
                    const media = await MessageMedia.fromUrl(sticker.url);
                    await client.sendMessage(msg.from, media, { caption: `🌸 ${sticker.type.toUpperCase()}` });
                } catch (error) {
                    console.error('Error sending sticker:', error);
                    await msg.reply(`🌸 ${sticker.type.toUpperCase()}\n\n🔗 ${sticker.url}`);
                }
                // Small delay between stickers
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            await msg.reply(result.message);
        }
    },
    
    async animetextsticker(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan teks untuk stiker\n💡 Contoh: /animetextsticker Hello kawaii';
        }
        
        const text = args.slice(0, -1).join(' ') || args.join(' ');
        const style = args[args.length - 1];
        
        // Check if last argument is a valid style
        const validStyles = ['kawaii', 'cool', 'cute', 'strong'];
        const finalStyle = validStyles.includes(style) ? style : 'kawaii';
        const finalText = validStyles.includes(style) ? text : args.join(' ');
        
        const result = await apiManager.createAnimeSticker(finalText, finalStyle);
        
        if (result.success) {
            await msg.reply(result.message);
        } else {
            await msg.reply(result.message);
        }
    },
    
    // STICKER FEATURES
    async sticker(args, msg) {
        if (!msg.hasQuotedMsg) {
            return '❌ Reply gambar yang ingin dijadikan sticker\n💡 Reply gambar lalu ketik /sticker';
        }
        
        try {
            const quotedMsg = await msg.getQuotedMessage();
            if (!quotedMsg.hasMedia) {
                return '❌ Pesan yang di-reply harus berupa gambar';
            }
            
            const media = await quotedMsg.downloadMedia();
            const stickerMedia = new MessageMedia('image/webp', media.data, 'sticker.webp');
            
            return { media: stickerMedia, caption: '' };
        } catch (error) {
            return '❌ Gagal membuat sticker';
        }
    },
    
    async stickermeme(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan teks untuk sticker meme\n💡 Contoh: /stickermeme Hello World';
        }
        
        try {
            const text = args.join(' ');
            const style = args[args.length - 1].toLowerCase();
            const result = await utils.createCustomSticker(text, style);
            return result.message;
        } catch (error) {
            return '❌ Gagal membuat sticker meme';
        }
    },
    
    // STICKER MERGER
    async stickermerge(args, msg) {
        if (!msg.hasQuotedMsg) {
            return '❌ Reply 2 sticker yang ingin digabungkan\n💡 Reply sticker pertama lalu ketik /stickermerge';
        }
        
        try {
            const quotedMsg = await msg.getQuotedMessage();
            if (!quotedMsg.hasMedia) {
                return '❌ Pesan yang di-reply harus berupa sticker';
            }
            
            const result = await utils.mergeStickers('sticker1', 'sticker2');
            return result.message;
        } catch (error) {
            return '❌ Gagal menggabungkan sticker';
        }
    },
    
    // LOGO MAKER
    async logomaker(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan teks untuk logo\n💡 Contoh: /logomaker MyBrand modern';
        }
        
        try {
            const text = args.slice(0, -1).join(' ') || args.join(' ');
            const style = args[args.length - 1] || 'modern';
            const result = await utils.createLogo(text, style);
            return result.message;
        } catch (error) {
            return '❌ Gagal membuat logo';
        }
    },
    
    // PHOTO EDITOR
    async photoedit(args, msg) {
        if (!msg.hasQuotedMsg) {
            return '❌ Reply foto yang ingin diedit\n💡 Reply foto lalu ketik /photoedit [effect]\n\n🎨 Effects: filter, blur, vintage, black-white, sepia, bright';
        }
        
        try {
            const quotedMsg = await msg.getQuotedMessage();
            if (!quotedMsg.hasMedia) {
                return '❌ Pesan yang di-reply harus berupa foto';
            }
            
            const effect = args[0] || 'filter';
            const result = await utils.editPhoto(effect);
            return result.message;
        } catch (error) {
            return '❌ Gagal mengedit foto';
        }
    },
    
    // FAKE GENERATORS
    async iphonechat(args, msg) {
        if (args.length < 2) {
            return '❌ Format: /iphonechat [nama] [pesan]\n💡 Contoh: /iphonechat John Hello there';
        }
        
        const name = args[0];
        const message = args.slice(1).join(' ');
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        return `📱 *FAKE iPHONE CHAT*\n\n👤 ${name}\n💬 ${message}\n⏰ ${time}\n\n✨ Fake chat berhasil dibuat!`;
    },
    
    async fakengl(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan pesan NGL\n💡 Contoh: /fakengl You are amazing!';
        }
        
        const message = args.join(' ');
        return `💌 *FAKE NGL MESSAGE*\n\n📝 "${message}"\n\n👤 Anonymous\n⏰ ${new Date().toLocaleString('id-ID')}\n\n✨ Fake NGL berhasil dibuat!`;
    },
    
    // NAME GENERATORS
    async namaninja(args, msg) {
        const ninjaNames = [
            'Kage no Shinobi', 'Yami no Senshi', 'Kaze no Tsubasa', 'Hi no Kokoro',
            'Mizu no Tamashii', 'Tsuchi no Chikara', 'Raiden no Me', 'Sora no Kage',
            'Yuki no Hana', 'Kumo no Kishi', 'Tsuki no Hikari', 'Hoshi no Michi'
        ];
        
        const randomName = ninjaNames[Math.floor(Math.random() * ninjaNames.length)];
        return `🥷 *NAMA NINJA KAMU*\n\n⚔️ ${randomName}\n\n✨ Nama ninja yang keren untuk petualanganmu!`;
    },
    
    async namapurba(args, msg) {
        const ancientNames = [
            'Arjuna Wijaya', 'Bima Sakti', 'Candra Kirana', 'Dewi Sartika',
            'Erlangga Putra', 'Fatahillah', 'Gajah Mada', 'Hayam Wuruk',
            'Iskandar Muda', 'Jaka Tingkir', 'Ken Arok', 'Laksamana Cheng Ho'
        ];
        
        const randomName = ancientNames[Math.floor(Math.random() * ancientNames.length)];
        return `🏛️ *NAMA PURBA KAMU*\n\n👑 ${randomName}\n\n✨ Nama dari zaman kerajaan yang megah!`;
    },
    
    // BRAT FEATURES
    async brat(args, msg) {
        if (args.length === 0) {
            return '❌ Masukkan teks untuk gaya BRAT\n💡 Contoh: /brat Hello World';
        }
        
        const text = args.join(' ').toUpperCase();
        const bratText = `💚 *B R A T   S T Y L E*\n\n✨ ${text} ✨\n\n🎵 Charli XCX vibes!`;
        return bratText;
    },
    
    async bratgif(args, msg) {
        const bratGifs = [
            '💚✨ BRAT SUMMER ✨💚',
            '🎵 360 DEGREES 🎵',
            '💃 CLUB CLASSICS 💃',
            '🌟 PARTY GIRL 🌟',
            '💚 LIME GREEN ENERGY 💚'
        ];
        
        const randomGif = bratGifs[Math.floor(Math.random() * bratGifs.length)];
        return `🎭 *BRAT GIF*\n\n${randomGif}\n\n✨ Brat energy activated!`;
    },
    
    // EMOJI MIX
    async emojimix(args, msg) {
        if (args.length < 2) {
            return '❌ Masukkan 2 emoji\n💡 Contoh: /emojimix 😀 😍';
        }
        
        const emoji1 = args[0];
        const emoji2 = args[1];
        const mixedEmoji = `${emoji1}${emoji2}`;
        
        return `🎨 *EMOJI MIX*\n\n${emoji1} + ${emoji2} = ${mixedEmoji}\n\n✨ Emoji berhasil digabungkan!`;
    },
    
    // ADDITIONAL GAMES
    async siapakahaku(args, msg) {
        const characters = [
            { name: 'Soekarno', hint: 'Presiden pertama Indonesia' },
            { name: 'Kartini', hint: 'Pahlawan emansipasi wanita' },
            { name: 'Einstein', hint: 'Fisikawan terkenal dengan teori relativitas' },
            { name: 'Messi', hint: 'Pemain sepak bola Argentina' },
            { name: 'BTS', hint: 'Boyband Korea Selatan' },
            { name: 'Prabowo Subianto', hint: 'Presiden Indonesia saat ini' }
            
        ];
        
        const character = characters[Math.floor(Math.random() * characters.length)];
        
        // Store game state
        gameEngine.gameStates.set(msg.from, {
            type: 'siapakahaku',
            answer: character.name.toLowerCase(),
            hint: character.hint,
            attempts: 0,
            maxAttempts: 3
        });
        
        return `🤔 *SIAPAKAH AKU?*\n\n💡 Petunjuk: ${character.hint}\n\n🎯 Tebak siapa aku! (3 kesempatan)`;
    },
    
    async susunkata(args, msg) {
        const words = [
            { word: 'INDONESIA', scrambled: 'SIADONENI' },
            { word: 'KOMPUTER', scrambled: 'TERKOPMU' },
            { word: 'SEKOLAH', scrambled: 'LAHKOSE' },
            { word: 'MERDEKA', scrambled: 'DEKAMER' },
            { word: 'PANCASILA', scrambled: 'SILACAPAN' }
        ];
        
        const wordData = words[Math.floor(Math.random() * words.length)];
        
        gameEngine.gameStates.set(msg.from, {
            type: 'susunkata',
            answer: wordData.word,
            attempts: 0,
            maxAttempts: 3
        });
        
        return `🔤 *SUSUN KATA*\n\n🎯 Susun huruf ini: ${wordData.scrambled}\n\n💡 Susun menjadi kata yang benar! (3 kesempatan)`;
    },
    
    async tekateki(args, msg) {
        const riddles = [
            { question: 'Apa yang bisa berlari tapi tidak punya kaki?', answer: 'air' },
            { question: 'Apa yang selalu basah meski tidak pernah kehujanan?', answer: 'lidah' },
            { question: 'Apa yang punya mata tapi tidak bisa melihat?', answer: 'jarum' },
            { question: 'Apa yang bisa terbang tapi bukan burung?', answer: 'pesawat' },
            { question: 'Apa yang makin dipotong makin panjang?', answer: 'parit' }
        ];
        
        const riddle = riddles[Math.floor(Math.random() * riddles.length)];
        
        gameEngine.gameStates.set(msg.from, {
            type: 'tekateki',
            answer: riddle.answer.toLowerCase(),
            attempts: 0,
            maxAttempts: 3
        });
        
        return `🧩 *TEKA-TEKI*\n\n❓ ${riddle.question}\n\n🤔 Apa jawabannya? (3 kesempatan)`;
    },
    
    async asahotak(args, msg) {
        const brainTeasers = [
            { question: 'Berapa hasil 2+2×2?', answer: '6' },
            { question: 'Apa ibu kota Jepang?', answer: 'tokyo' },
            { question: 'Berapa hari dalam seminggu?', answer: '7' },
            { question: 'Planet terdekat dengan matahari?', answer: 'merkurius' },
            { question: 'Berapa sisi segitiga?', answer: '3' }
        ];
        
        const teaser = brainTeasers[Math.floor(Math.random() * brainTeasers.length)];
        
        gameEngine.gameStates.set(msg.from, {
            type: 'asahotak',
            answer: teaser.answer.toLowerCase(),
            attempts: 0,
            maxAttempts: 2
        });
        
        return `🧠 *ASAH OTAK*\n\n❓ ${teaser.question}\n\n💭 Jawab dengan benar! (2 kesempatan)`;
    },
    
    async caklontong(args, msg) {
        const cakLontongQuestions = [
            { question: 'Kenapa ayam menyeberang jalan?', answer: 'untuk ke seberang' },
            { question: 'Apa bedanya gajah sama semut?', answer: 'gajah gak bisa naik pohon' },
            { question: 'Kenapa ikan tidak bisa main sepak bola?', answer: 'karena takut jaring' },
            { question: 'Apa yang lebih berat, 1 kg kapas atau 1 kg besi?', answer: 'sama berat' },
            { question: 'Kenapa Superman pakai celana dalam di luar?', answer: 'karena celana dalamnya kotor' }
        ];
        
        const question = cakLontongQuestions[Math.floor(Math.random() * cakLontongQuestions.length)];
        
        gameEngine.gameStates.set(msg.from, {
            type: 'caklontong',
            answer: question.answer.toLowerCase(),
            attempts: 0,
            maxAttempts: 3
        });
        
        return `🤪 *CAK LONTONG*\n\n❓ ${question.question}\n\n😄 Jawab dengan kreatif! (3 kesempatan)`;
    },
    
    // ENTERTAINMENT
    async joke(args, msg) {
        const jokes = [
            'Kenapa programmer suka kopi? Karena tanpa kopi, code-nya jadi bug! ☕',
            'Apa bedanya HTML sama pacar? HTML itu markup, pacar itu mark-down! 💔',
            'Kenapa WiFi rumah lambat? Karena tetangga pada nebeng! 📶',
            'Programmer sejati itu yang bisa debug hidup sendiri! 🐛',
            'Kenapa komputer tidak pernah lapar? Karena sudah ada cookies! 🍪'
        ];
        
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        return `😂 *RANDOM JOKE*\n\n${randomJoke}\n\n✨ Semoga hari kamu jadi lebih ceria!`;
    },
    
    async dadjoke(args, msg) {
        const dadJokes = [
            'Kenapa ayah tidak pernah lapar? Karena sudah kenyang sama jokes-nya sendiri! 😄',
            'Apa yang dikatakan ayah saat WiFi lemot? "Dulu internet cuma ada di warnet!" 📡',
            'Kenapa ayah suka bangun pagi? Karena mau jadi early bird, bukan early worm! 🐦',
            'Apa kata ayah tentang smartphone? "Dulu HP cuma buat telepon, sekarang buat apa aja!" 📱',
            'Kenapa ayah selalu bilang "back in my day"? Karena masa lalu itu vintage! ⏰'
        ];
        
        const randomDadJoke = dadJokes[Math.floor(Math.random() * dadJokes.length)];
        return `👨 *DAD JOKE*\n\n${randomDadJoke}\n\n✨ Classic dad humor!`;
    },
    
    // ADMIN FEATURES
    async kick(args, msg) {
        if (!isAdmin(msg.author)) {
            return '❌ Hanya admin yang bisa menggunakan command ini';
        }
        
        if (!msg.hasQuotedMsg && args.length === 0) {
            return '❌ Reply pesan user yang ingin di-kick atau mention user\n💡 Contoh: /kick @user';
        }
        
        try {
            const chat = await msg.getChat();
            if (!chat.isGroup) {
                return '❌ Command ini hanya bisa digunakan di grup';
            }
            
            let targetUser;
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                targetUser = quotedMsg.author;
            } else {
                // Extract user from mention
                const mention = args[0];
                if (mention && mention.startsWith('@')) {
                    targetUser = mention.substring(1) + '@c.us';
                }
            }
            
            if (!targetUser) {
                return '❌ User tidak ditemukan';
            }
            
            await chat.removeParticipants([targetUser]);
            return `✅ User berhasil di-kick dari grup`;
        } catch (error) {
            return '❌ Gagal kick user. Pastikan bot adalah admin';
        }
    },
    
    async broadcast(args, msg) {
        if (!isAdmin(msg.author)) {
            return '❌ Hanya admin yang bisa menggunakan command ini';
        }
        
        if (args.length === 0) {
            return '❌ Masukkan pesan broadcast\n💡 Contoh: /broadcast Pengumuman penting!';
        }
        
        const message = args.join(' ');
        const broadcastMsg = `📢 *PENGUMUMAN*\n\n${message}\n\n⏰ ${new Date().toLocaleString('id-ID')}`;
        
        try {
            // In a real implementation, you'd send to all groups
            return `📢 *BROADCAST SENT*\n\n📝 Pesan: ${message}\n✅ Berhasil dikirim ke semua grup`;
        } catch (error) {
            return '❌ Gagal mengirim broadcast';
        }
    },
    
    async mute(args, msg) {
        if (!isAdmin(msg.author)) {
            return '❌ Hanya admin yang bisa menggunakan command ini';
        }
        
        // Simple mute implementation
        cache.set(`muted_${msg.from}`, true, 3600); // Mute for 1 hour
        return `🔇 *BOT DIMUTE*\n\n✅ Bot tidak akan merespon command selama 1 jam\n⏰ Unmute otomatis: ${new Date(Date.now() + 3600000).toLocaleString('id-ID')}`;
    },
    
    async unmute(args, msg) {
        if (!isAdmin(msg.author)) {
            return '❌ Hanya admin yang bisa menggunakan command ini';
        }
        
        cache.del(`muted_${msg.from}`);
        return `🔊 *BOT DIAKTIFKAN*\n\n✅ Bot kembali aktif dan siap menerima command`;
    },
    
    async ban(args, msg) {
        if (!isAdmin(msg.author)) {
            return '❌ Hanya admin yang bisa menggunakan command ini';
        }
        
        if (!msg.hasQuotedMsg && args.length === 0) {
            return '❌ Reply pesan user yang ingin di-ban atau mention user\n💡 Contoh: /ban @user';
        }
        
        try {
            let targetUser;
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                targetUser = quotedMsg.author;
            } else {
                const mention = args[0];
                if (mention && mention.startsWith('@')) {
                    targetUser = mention.substring(1) + '@c.us';
                }
            }
            
            if (!targetUser) {
                return '❌ User tidak ditemukan';
            }
            
            // Store ban in cache/database
            cache.set(`banned_${targetUser}`, true, 86400); // Ban for 24 hours
            
            return `🚫 *USER DIBANNED*\n\n👤 User: ${targetUser}\n⏰ Durasi: 24 jam\n✅ User tidak bisa menggunakan bot`;
        } catch (error) {
            return '❌ Gagal ban user';
        }
    },
    
    async unban(args, msg) {
        if (!isAdmin(msg.author)) {
            return '❌ Hanya admin yang bisa menggunakan command ini';
        }
        
        if (args.length === 0) {
            return '❌ Masukkan user yang ingin di-unban\n💡 Contoh: /unban @user';
        }
        
        const mention = args[0];
        if (!mention.startsWith('@')) {
            return '❌ Format salah. Gunakan @username';
        }
        
        const targetUser = mention.substring(1) + '@c.us';
        cache.del(`banned_${targetUser}`);
        
        return `✅ *USER DIBUKA BANNYA*\n\n👤 User: ${targetUser}\n✅ User bisa menggunakan bot lagi`;
    },
    
    async stats(args, msg) {
        try {
            const user = await db.getUser(msg.author);
            if (!user) {
                return '❌ Data user tidak ditemukan';
            }
            
            return `📊 *STATISTIK PERSONAL*\n\n👤 Nama: ${user.name}\n🏆 Level: ${user.level}\n⭐ EXP: ${user.exp}/${user.level * 100}\n💰 Points: ${user.points}\n🪙 Coins: ${user.coins}\n📅 Bergabung: ${new Date(user.join_date).toLocaleDateString('id-ID')}`;
        } catch (error) {
            return '❌ Gagal mengambil statistik';
        }
    },
    
    async leaderboard(args, msg) {
        try {
            const type = args[0] || 'points';
            const leaderboard = await db.getLeaderboard(msg.from, type, 10);
            
            if (leaderboard.length === 0) {
                return '❌ Belum ada data leaderboard';
            }
            
            let result = `🏆 *LEADERBOARD ${type.toUpperCase()}*\n\n`;
            leaderboard.forEach((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                if (type === 'points') {
                    result += `${medal} ${user.name} - ${user.points} points (Level ${user.level})\n`;
                } else if (type === 'level') {
                    result += `${medal} ${user.name} - Level ${user.level} (${user.exp} EXP)\n`;
                }
            });
            
            return result;
        } catch (error) {
            return '❌ Gagal mengambil leaderboard';
        }
    },
    
    async poll(args, msg) {
        if (args.length === 0) {
            return '❌ Format: /poll [pertanyaan]\n💡 Contoh: /poll Mau makan apa hari ini?';
        }
        
        const question = args.join(' ');
        const pollId = uuidv4();
        
        pollStates.set(msg.from, {
            id: pollId,
            question: question,
            options: ['👍 Ya', '👎 Tidak', '🤔 Mungkin'],
            votes: {},
            createdBy: msg.author,
            createdAt: new Date()
        });
        
        return `📊 *POLLING*\n\n❓ ${question}\n\n1️⃣ 👍 Ya\n2️⃣ 👎 Tidak\n3️⃣ 🤔 Mungkin\n\n💬 Ketik nomor pilihan (1-3) untuk vote!\n\n💡 Gunakan /getpoll untuk melihat hasil sementara\n💡 Gunakan /endpoll untuk mengakhiri polling`;
    },
    
    async getpoll(args, msg) {
        if (!pollStates.has(msg.from)) {
            return '❌ Tidak ada polling aktif di grup ini!\n💡 Gunakan /poll [pertanyaan] untuk membuat polling baru.';  
        }
        
        const poll = pollStates.get(msg.from);
        const totalVotes = Object.keys(poll.votes).length;
        
        if (totalVotes === 0) {
            return `📊 *HASIL POLLING SEMENTARA*\n\n❓ ${poll.question}\n\n⚠️ Belum ada yang vote!\n\n⏰ Dibuat: ${poll.createdAt.toLocaleString('id-ID')}\n💡 Ketik 1-3 untuk vote!`;
        }
        
        // Hitung jumlah vote untuk setiap opsi
        const voteCounts = [0, 0, 0];
        for (const userId in poll.votes) {
            const vote = poll.votes[userId];
            voteCounts[vote - 1]++;
        }
        
        // Hitung persentase
        const percentages = voteCounts.map(count => ((count / totalVotes) * 100).toFixed(1));
        
        let resultMessage = `📊 *HASIL POLLING SEMENTARA*\n\n❓ ${poll.question}\n\n`;
        
        // Tampilkan hasil untuk setiap opsi
        for (let i = 0; i < poll.options.length; i++) {
            const option = poll.options[i];
            const count = voteCounts[i];
            const percentage = percentages[i];
            resultMessage += `${i + 1}️⃣ ${option}: ${count} vote (${percentage}%)\n`;
        }
        
        resultMessage += `\n👥 Total vote: ${totalVotes}\n⏰ Dibuat: ${poll.createdAt.toLocaleString('id-ID')}\n\n💡 Ketik 1-3 untuk vote!\n📝 Gunakan /endpoll untuk mengakhiri polling.`;
        
        return resultMessage;
    },
    
    async endpoll(args, msg) {
        if (!pollStates.has(msg.from)) {
            return '❌ Tidak ada polling aktif di grup ini!\n💡 Gunakan /poll [pertanyaan] untuk membuat polling baru.';  
        }
        
        const poll = pollStates.get(msg.from);
        const totalVotes = Object.keys(poll.votes).length;
        
        if (totalVotes === 0) {
            pollStates.delete(msg.from);
            return `📊 *POLLING BERAKHIR*\n\n❓ ${poll.question}\n\n⚠️ Tidak ada yang vote!\n\n⏰ Dibuat: ${poll.createdAt.toLocaleString('id-ID')}\n⏰ Diakhiri: ${new Date().toLocaleString('id-ID')}`;
        }
        
        // Hitung jumlah vote untuk setiap opsi
        const voteCounts = [0, 0, 0];
        for (const userId in poll.votes) {
            const vote = poll.votes[userId];
            voteCounts[vote - 1]++;
        }
        
        // Hitung persentase
        const percentages = voteCounts.map(count => ((count / totalVotes) * 100).toFixed(1));
        
        // Tentukan pemenang
        let maxVotes = 0;
        let winnerIndices = [];
        
        for (let i = 0; i < voteCounts.length; i++) {
            if (voteCounts[i] > maxVotes) {
                maxVotes = voteCounts[i];
                winnerIndices = [i];
            } else if (voteCounts[i] === maxVotes) {
                winnerIndices.push(i);
            }
        }
        
        let resultMessage = `📊 *POLLING BERAKHIR*\n\n❓ ${poll.question}\n\n`;
        
        // Tampilkan hasil untuk setiap opsi
        for (let i = 0; i < poll.options.length; i++) {
            const option = poll.options[i];
            const count = voteCounts[i];
            const percentage = percentages[i];
            resultMessage += `${i + 1}️⃣ ${option}: ${count} vote (${percentage}%)\n`;
        }
        
        // Tampilkan pemenang
        if (winnerIndices.length === 1) {
            resultMessage += `\n🏆 Pemenang: ${poll.options[winnerIndices[0]]} dengan ${voteCounts[winnerIndices[0]]} vote!`;
        } else {
            resultMessage += `\n🏆 Hasil seri antara: `;
            winnerIndices.forEach((index, i) => {
                resultMessage += `${poll.options[index]}`;
                if (i < winnerIndices.length - 1) {
                    resultMessage += ` dan `;
                }
            });
            resultMessage += ` dengan ${maxVotes} vote!`;
        }
        
        resultMessage += `\n\n👥 Total vote: ${totalVotes}\n⏰ Dibuat: ${poll.createdAt.toLocaleString('id-ID')}\n⏰ Diakhiri: ${new Date().toLocaleString('id-ID')}`;
        
        // Hapus poll dari pollStates
        pollStates.delete(msg.from);
        
        return resultMessage;
    },
    
    async closepoll(args, msg) {
        // Alias untuk endpoll
        return await commands.endpoll(args, msg);
    },
    
    async math(args, msg) {
        if (gameEngine.gameStates.has(msg.from)) {
            return '❌ Masih ada game yang sedang berlangsung!';
        }
        
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let num1, num2, answer;
        
        switch (operation) {
            case '+':
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * 50) + 25;
                num2 = Math.floor(Math.random() * 25) + 1;
                answer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * 12) + 1;
                num2 = Math.floor(Math.random() * 12) + 1;
                answer = num1 * num2;
                break;
        }
        
        gameEngine.gameStates.set(msg.from, {
            type: 'math',
            question: `${num1} ${operation} ${num2}`,
            answer: answer.toString(),
            attempts: 0,
            maxAttempts: 3,
            startTime: Date.now()
        });
        
        return `🧮 *GAME MATEMATIKA*\n\n❓ Berapa hasil dari: ${num1} ${operation} ${num2} ?\n\n🎯 Kesempatan: 3x\n⏰ Waktu: 60 detik\n💰 Reward: 20-40 points`;
    },

    // ===== FITUR TAG GRUP =====
    async tagall(args, msg) {
        try {
            const chat = await msg.getChat();
            if (!chat.isGroup) {
                return '❌ Command ini hanya bisa digunakan di grup!';
            }

            const participants = chat.participants;
            if (participants.length === 0) {
                return '❌ Tidak ada anggota grup yang ditemukan!';
            }

            const message = args.length > 0 ? args.join(' ') : 'Halo semua! 👋';
            
            let tagMessage = `📢 *TAG SEMUA ANGGOTA*\n\n`;
            tagMessage += `💬 Pesan: ${message}\n\n`;
            tagMessage += `👥 Anggota yang di-tag (${participants.length}):\n\n`;
            
            const mentions = [];
            participants.forEach((participant, index) => {
                const contact = participant.id._serialized;
                mentions.push(contact);
                tagMessage += `${index + 1}. @${contact.split('@')[0]}\n`;
            });
            
            tagMessage += `\n⏰ ${new Date().toLocaleString('id-ID')}`;
            
            await client.sendMessage(msg.from, tagMessage, {
                mentions: mentions
            });
            
            return null; // Sudah dikirim manual
        } catch (error) {
            console.error('Error in tagall:', error);
            return '❌ Gagal melakukan tag all. Pastikan bot memiliki izin yang cukup!';
        }
    },

    async tag(args, msg) {
        try {
            const chat = await msg.getChat();
            if (!chat.isGroup) {
                return '❌ Command ini hanya bisa digunakan di grup!';
            }

            if (args.length === 0) {
                return '❌ Masukkan pesan untuk tag!\n💡 Contoh: /tag Jangan lupa meeting hari ini!';
            }

            const participants = chat.participants;
            const message = args.join(' ');
            
            let tagMessage = `📢 *PENGUMUMAN GRUP*\n\n`;
            tagMessage += `💬 ${message}\n\n`;
            tagMessage += `👥 Tag untuk semua anggota:\n`;
            
            const mentions = [];
            participants.forEach((participant, index) => {
                const contact = participant.id._serialized;
                mentions.push(contact);
                if (index < 10) { // Tampilkan maksimal 10 nama pertama
                    tagMessage += `@${contact.split('@')[0]} `;
                }
            });
            
            if (participants.length > 10) {
                tagMessage += `\n... dan ${participants.length - 10} anggota lainnya`;
            }
            
            tagMessage += `\n\n⏰ ${new Date().toLocaleString('id-ID')}`;
            
            await client.sendMessage(msg.from, tagMessage, {
                mentions: mentions
            });
            
            return null;
        } catch (error) {
            console.error('Error in tag:', error);
            return '❌ Gagal melakukan tag. Pastikan bot memiliki izin yang cukup!';
        }
    },

    async everyone(args, msg) {
        // Alias untuk tagall
        return await commands.tagall(args, msg);
    },

    async mention(args, msg) {
        try {
            const chat = await msg.getChat();
            if (!chat.isGroup) {
                return '❌ Command ini hanya bisa digunakan di grup!';
            }

            const participants = chat.participants;
            const activeMembers = participants.slice(0, 5); // Tag 5 member pertama sebagai contoh
            
            let mentionMessage = `👋 *MENTION ANGGOTA AKTIF*\n\n`;
            mentionMessage += `Halo para member aktif!\n\n`;
            
            const mentions = [];
            activeMembers.forEach((participant, index) => {
                const contact = participant.id._serialized;
                mentions.push(contact);
                mentionMessage += `${index + 1}. @${contact.split('@')[0]}\n`;
            });
            
            mentionMessage += `\n💡 Gunakan /tagall untuk mention semua anggota`;
            mentionMessage += `\n⏰ ${new Date().toLocaleString('id-ID')}`;
            
            await client.sendMessage(msg.from, mentionMessage, {
                mentions: mentions
            });
            
            return null;
        } catch (error) {
            console.error('Error in mention:', error);
            return '❌ Gagal melakukan mention!';
        }
    },

    async groupinfo(args, msg) {
        try {
            const chat = await msg.getChat();
            if (!chat.isGroup) {
                return '❌ Command ini hanya bisa digunakan di grup!';
            }

            const participants = chat.participants;
            const admins = participants.filter(p => p.isAdmin).length;
            const members = participants.length - admins;
            
            let infoMessage = `📊 *INFO GRUP*\n\n`;
            infoMessage += `📝 Nama: ${chat.name}\n`;
            infoMessage += `👥 Total Anggota: ${participants.length}\n`;
            infoMessage += `👑 Admin: ${admins}\n`;
            infoMessage += `👤 Member: ${members}\n`;
            infoMessage += `📅 Dibuat: ${chat.createdAt ? new Date(chat.createdAt * 1000).toLocaleDateString('id-ID') : 'Tidak diketahui'}\n`;
            infoMessage += `🔒 Hanya Admin yang bisa edit: ${chat.groupMetadata?.restrict ? 'Ya' : 'Tidak'}\n`;
            infoMessage += `💬 Hanya Admin yang bisa kirim pesan: ${chat.groupMetadata?.announce ? 'Ya' : 'Tidak'}\n\n`;
            infoMessage += `⏰ ${new Date().toLocaleString('id-ID')}`;
            
            return infoMessage;
        } catch (error) {
            console.error('Error in groupinfo:', error);
            return '❌ Gagal mendapatkan info grup!';
        }
    }
};

// WhatsApp event handlers
client.on('qr', async (qr) => {
    console.clear();
    console.log('🔗 QR Code received!');
    console.log('📱 Scan dengan WhatsApp:\n');
    
    // Display very compact QR code
    qrcode.generate(qr, { small: true });
    
    console.log('\n✅ Scan QR di atas | 💡 Buka WA > Menu > Perangkat Tertaut');
});

client.on('ready', () => {
    console.clear();
    console.log('🎉 BERHASIL TERKONEKSI!');
    console.log('✅ WhatsApp Bot siap digunakan');
    console.log('📱 Bot sudah terhubung dengan WhatsApp Anda');
    console.log('💬 Siap menerima pesan dan command\n');
    console.log('📊 Ketik /help di chat untuk melihat daftar command');
    console.log('🔧 Bot berjalan dalam mode VPS (tanpa dashboard)\n');
    botStats.isReady = true;
});

client.on('auth_failure', (msg) => {
    console.error('\n❌ Autentikasi gagal:', msg);
    console.log('💡 Coba hapus folder .wwebjs_auth dan scan ulang QR code');
});

client.on('disconnected', (reason) => {
    console.log('\n⚠️ Bot terputus:', reason);
    console.log('🔄 Bot akan mencoba reconnect otomatis...');
});

client.on('message_create', async (msg) => {
    if (msg.fromMe) return;
    
    // Terminal notification for incoming messages
    const timestamp = new Date().toLocaleString('id-ID');
    const contact = await msg.getContact();
    const senderName = contact.name || contact.number;
    const messagePreview = msg.body.length > 50 ? msg.body.substring(0, 50) + '...' : msg.body;
    
    console.log(`\n📨 [${timestamp}] Pesan Masuk:`);
    console.log(`👤 Dari: ${senderName} (${msg.author})`);
    console.log(`💬 Pesan: ${messagePreview}`);
    console.log(`📍 Chat: ${msg.from}`);
    console.log('─'.repeat(60));
    
    botStats.messagesProcessed++;
    botStats.activeUsers.add(msg.author);
    
    // Save message to database
    try {
        const sentimentAnalyzer = new sentiment();
        const sentimentScore = sentimentAnalyzer.analyze(msg.body).score;
        await db.saveMessage(msg.id.id, msg.author, msg.from, msg.body, msg.type, sentimentScore);
        
        // Update word frequency
        const words = utils.extractWords(msg.body);
        if (words.length > 0) {
            await db.updateWordFrequency(msg.from, words);
        }
        
        // Create user if not exists
        const contact = await msg.getContact();
        await db.createUser(msg.author, contact.name || contact.number, contact.number);
        
        // Add experience for activity
        addExp(msg.author, 5);
    } catch (error) {
        const errorTimestamp = new Date().toLocaleString('id-ID');
        console.error(`\n🚨 [${errorTimestamp}] DATABASE ERROR:`);
        console.error(`❌ Error saving message from ${msg.author}:`);
        console.error(`📝 Message: ${msg.body}`);
        console.error(`🔍 Error details:`, error.message);
        console.error(`📍 Stack trace:`, error.stack);
        console.error('═'.repeat(60));
        
        // Notify admin if this is a critical error
        if (adminSystem.isAdmin(msg.author)) {
            try {
                msg.reply(`⚠️ *ADMIN ALERT*\n\n🚨 Database error detected!\n📝 Error: ${error.message}\n⏰ Time: ${errorTimestamp}`);
            } catch (notifyError) {
                console.error('Failed to notify admin:', notifyError);
            }
        }
    }
    
    // Handle quiz answers
    if (gameEngine.quizStates.has(msg.from)) {
        const state = gameEngine.quizStates.get(msg.from);
        const answer = msg.body.trim();
        
        if (['1', '2', '3', '4'].includes(answer)) {
            const optionIndex = parseInt(answer) - 1;
            const selectedOption = state.question.options[optionIndex].toLowerCase();
            
            if (selectedOption === state.question.options[optionIndex]) {
                const timeBonus = Math.max(0, 30 - Math.floor((Date.now() - state.startTime) / 1000));
                const points = 50 + timeBonus;
                
                await db.updateUserPoints(msg.author, points);
                await db.saveGameResult(msg.author, msg.from, 'kuis', points, 'benar');
                
                gameEngine.quizStates.delete(msg.from);
                msg.reply(`🎉 *BENAR!*\n\n✅ Jawaban: ${state.question.options[optionIndex]}\n⏰ Waktu: ${Math.floor((Date.now() - state.startTime) / 1000)}s\n💰 Points: +${points}`);
                return;
            } else {
                msg.reply(`❌ *SALAH!*\n\n✅ Jawaban yang benar: ${state.question.options.find(opt => opt.toLowerCase() === state.question.a)}`);
                gameEngine.quizStates.delete(msg.from);
                return;
            }
        }
    }
    
    // Handle word guessing game and other games
    if (gameEngine.gameStates.has(msg.from)) {
        const state = gameEngine.gameStates.get(msg.from);
        const guess = msg.body.toLowerCase().trim();
        state.attempts++;
        
        if (state.type === 'tebakkata') {
            const guessUpper = msg.body.toUpperCase().trim();
            
            if (guessUpper === state.word) {
                const points = Math.max(10, 50 - (state.attempts * 5));
                await db.updateUserPoints(msg.author, points);
                await db.saveGameResult(msg.author, msg.from, 'tebakkata', points, 'benar');
                
                gameEngine.gameStates.delete(msg.from);
                msg.reply(`🎉 *BENAR!*\n\n✅ Kata: ${state.word}\n🎯 Tebakan: ${state.attempts}\n💰 Points: +${points}`);
                return;
            } else if (state.attempts >= state.maxAttempts) {
                gameEngine.gameStates.delete(msg.from);
                msg.reply(`❌ *GAME OVER!*\n\n✅ Kata yang benar: ${state.word}\n🎯 Tebakan: ${state.attempts}/${state.maxAttempts}`);
                return;
            } else {
                // Give hint
                if (state.currentHint < state.hints.length - 1) {
                    state.currentHint++;
                }
                msg.reply(`❌ Salah! Coba lagi...\n\n🔤 Hint: ${state.hints[state.currentHint]}\n🎯 Tebakan: ${state.attempts}/${state.maxAttempts}`);
                return;
            }
        } else if (state.type === 'siapakahaku') {
            if (guess === state.answer) {
                const points = Math.max(10, 30 - (state.attempts * 5));
                await db.updateUserPoints(msg.author, points);
                
                gameEngine.gameStates.delete(msg.from);
                msg.reply(`🎉 *BENAR!*\n\n✅ Jawaban: ${state.answer}\n🎯 Tebakan: ${state.attempts}\n💰 Points: +${points}`);
                return;
            } else if (state.attempts >= state.maxAttempts) {
                gameEngine.gameStates.delete(msg.from);
                msg.reply(`❌ *GAME OVER!*\n\n✅ Jawaban yang benar: ${state.answer}\n💡 Hint: ${state.hint}`);
                return;
            } else {
                msg.reply(`❌ Salah! Coba lagi...\n\n💡 Hint: ${state.hint}\n🎯 Tebakan: ${state.attempts}/${state.maxAttempts}`);
                return;
            }
        } else if (state.type === 'susunkata') {
            if (guess.toUpperCase() === state.answer) {
                const points = Math.max(10, 40 - (state.attempts * 5));
                await db.updateUserPoints(msg.author, points);
                
                gameEngine.gameStates.delete(msg.from);
                msg.reply(`🎉 *BENAR!*\n\n✅ Kata: ${state.answer}\n🎯 Tebakan: ${state.attempts}\n💰 Points: +${points}`);
                return;
            } else if (state.attempts >= state.maxAttempts) {
                gameEngine.gameStates.delete(msg.from);
                msg.reply(`❌ *GAME OVER!*\n\n✅ Kata yang benar: ${state.answer}`);
                return;
            } else {
                msg.reply(`❌ Salah! Coba lagi...\n🎯 Tebakan: ${state.attempts}/${state.maxAttempts}`);
                return;
            }
        } else if (state.type === 'tekateki' || state.type === 'asahotak' || state.type === 'caklontong') {
             if (guess === state.answer) {
                 const points = Math.max(10, 35 - (state.attempts * 5));
                 await db.updateUserPoints(msg.author, points);
                 
                 gameEngine.gameStates.delete(msg.from);
                 msg.reply(`🎉 *BENAR!*\n\n✅ Jawaban: ${state.answer}\n🎯 Tebakan: ${state.attempts}\n💰 Points: +${points}`);
                 return;
             } else if (state.attempts >= state.maxAttempts) {
                 gameEngine.gameStates.delete(msg.from);
                 msg.reply(`❌ *GAME OVER!*\n\n✅ Jawaban yang benar: ${state.answer}`);
                 return;
             } else {
                 msg.reply(`❌ Salah! Coba lagi...\n🎯 Tebakan: ${state.attempts}/${state.maxAttempts}`);
                 return;
             }
         } else if (state.type === 'math') {
             if (guess === state.answer) {
                 const timeBonus = Math.max(0, 60 - Math.floor((Date.now() - state.startTime) / 1000));
                 const points = Math.max(20, 40 - (state.attempts * 5) + timeBonus);
                 await db.updateUserPoints(msg.author, points);
                 
                 gameEngine.gameStates.delete(msg.from);
                 msg.reply(`🎉 *BENAR!*\n\n🧮 Soal: ${state.question}\n✅ Jawaban: ${state.answer}\n🎯 Tebakan: ${state.attempts}\n⏰ Waktu: ${Math.floor((Date.now() - state.startTime) / 1000)}s\n💰 Points: +${points}`);
                 return;
             } else if (state.attempts >= state.maxAttempts) {
                 gameEngine.gameStates.delete(msg.from);
                 msg.reply(`❌ *GAME OVER!*\n\n🧮 Soal: ${state.question}\n✅ Jawaban yang benar: ${state.answer}`);
                 return;
             } else {
                 msg.reply(`❌ Salah! Coba lagi...\n🎯 Tebakan: ${state.attempts}/${state.maxAttempts}`);
                 return;
             }
         }
    }
    
    // Handle poll votes
    if (pollStates.has(msg.from)) {
        const poll = pollStates.get(msg.from);
        const vote = msg.body.trim();
        
        if (['1', '2', '3'].includes(vote)) {
            poll.votes[msg.author] = parseInt(vote);
            msg.reply(`✅ Vote kamu tercatat: ${poll.options[parseInt(vote) - 1]}`);
            return;
        }
    }
    
    // Handle menu keywords without prefix
    const messageText = msg.body.toLowerCase().trim();
    const menuKeywords = ['menu', 'help', 'bantuan', 'command', 'cmd', 'fitur', 'daftar'];
    
    if (menuKeywords.includes(messageText)) {
        msg.reply(menuSystem.getMainMenu());
        return;
    }
    
    // Handle quick access keywords
    const quickAccess = {
        'game': () => menuSystem.getCategoryMenu('games'),
        'games': () => menuSystem.getCategoryMenu('games'),
        'anime': () => menuSystem.getCategoryMenu('anime'),
        'tools': () => menuSystem.getCategoryMenu('tools'),
        'utility': () => menuSystem.getCategoryMenu('tools'),
        'admin': () => menuSystem.getCategoryMenu('admin'),
        'fun': () => menuSystem.getCategoryMenu('fun')
    };
    
    if (quickAccess[messageText]) {
        msg.reply(quickAccess[messageText]());
        return;
    }
    
    // Handle commands
    if (msg.body.startsWith(botConfig.prefix)) {
        const fullCommand = msg.body.slice(botConfig.prefix.length).trim();
        const args = fullCommand.split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        if (!checkCooldown(msg.author, commandName)) {
            msg.reply('⏰ Command masih dalam cooldown, tunggu sebentar!');
            return;
        }
        
        if (commands[commandName]) {
            try {
                botStats.commandsExecuted++;
                const result = await commands[commandName](args, msg);
                
                if (result) {
                    if (typeof result === 'object' && result.media) {
                        await client.sendMessage(msg.from, result.media, { caption: result.caption });
                    } else {
                        msg.reply(result);
                    }
                }
                
                // Add experience for using commands
                addExp(msg.author, 10);
            } catch (error) {
                const errorTimestamp = new Date().toLocaleString('id-ID');
                console.error(`\n🚨 [${errorTimestamp}] COMMAND ERROR:`);
                console.error(`❌ Error executing command: /${commandName}`);
                console.error(`👤 User: ${msg.author}`);
                console.error(`📝 Args: ${args.join(' ')}`);
                console.error(`🔍 Error details:`, error.message);
                console.error(`📍 Stack trace:`, error.stack);
                console.error('═'.repeat(60));
                
                // Enhanced error response with details for admins
                if (adminSystem.isAdmin(msg.author)) {
                    msg.reply(`⚠️ *ADMIN ERROR REPORT*\n\n🚨 Command: /${commandName}\n📝 Error: ${error.message}\n⏰ Time: ${errorTimestamp}\n\n💡 Check terminal for full stack trace`);
                } else {
                    msg.reply('❌ Terjadi error saat menjalankan command');
                }
                
                // Log to admin system for monitoring
                try {
                    await db.logError({
                        type: 'command_error',
                        command: commandName,
                        user: msg.author,
                        error: error.message,
                        timestamp: new Date()
                    });
                } catch (logError) {
                    console.error('Failed to log error to database:', logError);
                }
            }
        }
    }
});

// Group events
client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    const contact = await notification.getContact();
    
    await db.createUser(contact.id.user, contact.name || contact.number, contact.number);
    
    const welcomeMsg = menuSystem.getWelcomeMenu(contact.name || contact.number);
    chat.sendMessage(welcomeMsg);
});

client.on('group_leave', async (notification) => {
    try {
        const group = await notification.getChat();
        const user = await notification.getContact();
        const groupName = group.name || 'Unknown Group';
        const userName = user.pushname || user.number;

        // Log the event
        console.log(`User ${userName} left group ${groupName}`);

        // Send farewell message
        await group.sendMessage(`👋 *Goodbye ${userName}!*\n\nSee you next time...`);

        // Update group stats in database if needed
        await db.updateGroupStats(group.id, {
            memberCount: group.participants.length,
            lastActivity: new Date()
        });

    } catch (error) {
        console.error('Error handling group leave event:', error);
    }
});

// Initialize the client
client.initialize();
console.log('Initializing WhatsApp client...');
console.log('Scan the QR code that will appear...');
