const figlet = require('figlet');

class MenuSystem {
    constructor() {
        this.menuData = {
            main: {
                title: '🤖 BOT GRUP CANGGIH',
                subtitle: '✨ Your Ultimate WhatsApp Assistant',
                categories: [
                    { id: 'games', name: '🎮 Games & Entertainment', icon: '🎯' },
                    { id: 'anime', name: '🌸 Anime Features', icon: '🎭' },
                    { id: 'creative', name: '🎨 Creative Tools', icon: '✨' },
                    { id: 'utility', name: '🛠️ Utility & Tools', icon: '⚙️' },
                    { id: 'ai', name: '🤖 AI & Smart Features', icon: '🧠' },
                    { id: 'analytics', name: '📊 Analytics & Stats', icon: '📈' },
                    { id: 'group', name: '👥 Group Management', icon: '🏢' },
                    { id: 'admin', name: '🛡️ Admin Features', icon: '👑' }
                ]
            },
            
            games: {
                title: '🎮 GAMES & ENTERTAINMENT',
                commands: [
                    { cmd: '/kuis', desc: 'Mulai kuis interaktif dengan berbagai topik' },
                    { cmd: '/tebakkata', desc: 'Game tebak kata dengan hint bertahap' },
                    { cmd: '/suit [pilihan]', desc: 'Gunting batu kertas melawan bot' },
                    { cmd: '/slot', desc: 'Mesin slot virtual berhadiah' },
                    { cmd: '/truth', desc: 'Truth or dare untuk grup' },
                    { cmd: '/math', desc: 'Permainan matematika dengan level' },
                    { cmd: '/siapakahaku', desc: 'Tebak tokoh terkenal dunia' },
                    { cmd: '/susunkata', desc: 'Susun kata dari huruf acak' },
                    { cmd: '/tekateki', desc: 'Teka-teki lucu dan menantang' },
                    { cmd: '/asahotak', desc: 'Asah otak dengan tebakan logika' },
                    { cmd: '/caklontong', desc: 'Kuis Cak Lontong khas Indonesia' },
                    { cmd: '/joke', desc: 'Dapatkan lelucon acak yang lucu' },
                    { cmd: '/dadjoke', desc: 'Dad joke klasik yang menghibur' }
                ]
            },
            
            anime: {
                title: '🌸 ANIME FEATURES',
                commands: [
                    { cmd: '/randomloli', desc: 'Gambar anime loli random kawaii' },
        { cmd: '/randomselfie', desc: 'Selfie anime character random' },
        { cmd: '/randomwaifu', desc: 'Waifu anime random terbaik' },
        { cmd: '/animesticker', desc: 'Stiker anime dengan berbagai emosi' },
        { cmd: '/animestickerpack', desc: 'Paket lengkap stiker anime' },
        { cmd: '/animetextsticker', desc: 'Buat stiker teks dengan style anime' },
                    { cmd: '/topanime', desc: 'Daftar anime terpopuler saat ini' },
                    { cmd: '/otakudesu [judul]', desc: 'Cari informasi anime lengkap' }
                ]
            },
            
            creative: {
                title: '🎨 CREATIVE TOOLS',
                commands: [
                    { cmd: '/sticker', desc: 'Buat stiker dari gambar/foto' },
                    { cmd: '/stickermeme [text] [style]', desc: 'Buat stiker dengan teks custom' },
                    { cmd: '/stickermerge', desc: 'Gabungkan 2 sticker jadi satu (reply sticker)' },
                    { cmd: '/meme [text]', desc: 'Generate meme dengan template random' },
                    { cmd: '/logomaker [text] [style]', desc: 'Buat logo custom dengan berbagai style' },
                    { cmd: '/photoedit [effect]', desc: 'Edit foto dengan berbagai effect (reply foto)' },
                    { cmd: '/ascii [text]', desc: 'Ubah teks jadi ASCII art keren' },
                    { cmd: '/brat [text]', desc: 'Ubah teks jadi gaya BRAT aesthetic' },
                    { cmd: '/bratgif', desc: 'Dapatkan GIF BRAT random' },
                    { cmd: '/emojimix [emoji1] [emoji2]', desc: 'Gabungkan dua emoji jadi satu' },
                    { cmd: '/iphonechat [nama] [pesan]', desc: 'Buat fake chat iPhone realistis' },
                    { cmd: '/fakengl [pesan]', desc: 'Buat fake pesan NGL anonymous' },
                    { cmd: '/namaninja', desc: 'Generate nama ninja unik' },
                    { cmd: '/namapurba', desc: 'Generate nama purba kuno' }
                ]
            },
            
            utility: {
                title: '🛠️ UTILITY & TOOLS',
                commands: [
                    { cmd: '/qr [text]', desc: 'Generate QR code dari teks/URL' },
                    { cmd: '/short [url]', desc: 'Pendekkan URL panjang (gunakan "/short test" untuk uji coba)' },
                    { cmd: '/remind [waktu] [pesan]', desc: 'Set reminder dengan notifikasi' },
                    { cmd: '/calc [rumus]', desc: 'Kalkulator matematika canggih' },
                    { cmd: '/cuaca [kota]', desc: 'Cek cuaca real-time kota' },
                    { cmd: '/translate [text]', desc: 'Translate ke berbagai bahasa' },
                    { cmd: '/wiki [query]', desc: 'Cari informasi di Wikipedia' }
                ]
            },
            
            ai: {
                title: '🤖 AI ASSISTANT EKA - SMART FEATURES',
                subtitle: '🧠 Asisten Pribadi Eka Syarif Maulana',
                commands: [
                    { cmd: '/ai [pertanyaan]', desc: 'Tanya AI Assistant Eka untuk jawaban cerdas' },
                    { cmd: '/chat [pesan]', desc: 'Chat santai dengan AI Assistant Eka' },
                    { cmd: '/gemini [pertanyaan]', desc: 'Akses langsung ke Gemini AI' },
                    { cmd: '/sentiment [text]', desc: 'Analisis mood dan emosi teks' },
                    { cmd: '/quote', desc: 'Quote inspiratif dan motivasi' },
                    { cmd: '/aistats', desc: 'Statistik chat AI untuk nomor ini' },
                    { cmd: '/clearai', desc: 'Hapus memori chat AI (sesi ini)' },
                    { cmd: '/loadhistory', desc: 'Muat history chat dari database' },
                    { cmd: '/clearallai', desc: 'Hapus semua data chat AI (permanen)' }
                ]
            },
            
            analytics: {
                title: '📊 ANALYTICS & STATS',
                commands: [
                    { cmd: '/stats', desc: 'Statistik personal aktivitas kamu' },
                    { cmd: '/groupstats', desc: 'Statistik lengkap grup ini' },
                    { cmd: '/leaderboard', desc: 'Ranking member paling aktif' },
                    { cmd: '/wordcloud', desc: 'Kata-kata populer di grup' }
                ]
            },
            
            group: {
                title: '👥 GROUP MANAGEMENT',
                subtitle: '🏢 Kelola grup dengan mudah',
                commands: [
                    { cmd: '/tagall [pesan]', desc: 'Tag semua anggota grup dengan pesan' },
                    { cmd: '/tag [pesan]', desc: 'Buat pengumuman dengan tag semua anggota' },
                    { cmd: '/everyone [pesan]', desc: 'Alias untuk tagall - tag semua orang' },
                    { cmd: '/mention', desc: 'Mention beberapa anggota aktif' },
                    { cmd: '/groupinfo', desc: 'Informasi lengkap tentang grup' },
                    { cmd: '/kick [@user]', desc: 'Kick anggota dari grup (admin only)' },
                    { cmd: '/ban [@user]', desc: 'Ban anggota dari grup (admin only)' },
                    { cmd: '/unban [@user]', desc: 'Unban anggota grup (admin only)' },
                    { cmd: '/mute', desc: 'Mute bot sementara (admin only)' },
                    { cmd: '/unmute', desc: 'Unmute bot (admin only)' },
                    { cmd: '/broadcast [pesan]', desc: 'Broadcast pesan ke semua grup (admin only)' },
                    { cmd: '/poll [pertanyaan]', desc: 'Buat polling untuk grup' },
                    { cmd: '/getpoll', desc: 'Lihat hasil polling sementara' },
                    { cmd: '/endpoll', desc: 'Akhiri polling dan lihat hasil akhir' },
                    { cmd: '/closepoll', desc: 'Alias untuk /endpoll' }
                ]
            },
            
            admin: {
                title: '🛡️ ADMIN FEATURES',
                subtitle: '👑 Khusus untuk admin grup',
                commands: [
                    { cmd: '/addadmin [@user]', desc: 'Tambah admin baru ke sistem' },
                    { cmd: '/removeadmin [@user]', desc: 'Hapus admin dari sistem' },
                    { cmd: '/listadmin', desc: 'Lihat daftar semua admin' },
                    { cmd: '/setapikey [key]', desc: 'Set Gemini AI API key (legacy)' },
                    { cmd: '/addapikey [provider] [key]', desc: 'Tambah API key baru (unlimited)' },
                    { cmd: '/listapikeys [provider?]', desc: 'Lihat daftar semua API keys' },
                    { cmd: '/removeapikey2 [id]', desc: 'Hapus API key berdasarkan ID' },
                    { cmd: '/resetapiusage', desc: 'Reset usage counter semua API keys' },
                    { cmd: '/removedailylimit', desc: 'Hapus daily limit semua API key' },
                    { cmd: '/checkai', desc: 'Cek status sistem AI' },
                    { cmd: '/botperformance', desc: 'Monitor performa bot real-time' },
                    { cmd: '/systemhealth', desc: 'Cek kesehatan sistem lengkap' },
                    { cmd: '/adminstats', desc: 'Statistik admin dan konten' },
                    { cmd: '/addquiz [soal|jawaban|opsi]', desc: 'Tambah soal kuis custom' },
                    { cmd: '/addtekateki [soal|jawaban|hint]', desc: 'Tambah teka-teki custom' },
                    { cmd: '/addsiapa [clue|jawaban|nama]', desc: 'Tambah siapakah aku custom' },
                    { cmd: '/addcaklontong [soal|jawaban|hint]', desc: 'Tambah cak lontong custom' },
                    { cmd: '/addkata [kata]', desc: 'Tambah kata untuk tebak kata' },
                    { cmd: '/aiglobal', desc: 'Statistik global AI Assistant Eka' },
                    { cmd: '/adminhelp', desc: 'Panduan lengkap admin' }
                ]
            }
        };
    }
    
    async generateMainMenu() {
        const { title, subtitle, categories } = this.menuData.main;
        
        let menu = `╭─────────────────────────╮
`;
        menu += `│     ${title}     │
`;
        menu += `│  ${subtitle}  │
`;
        menu += `╰─────────────────────────╯

`;
        
        menu += `🌟 *KATEGORI FITUR TERSEDIA:*

`;
        
        categories.forEach((cat, index) => {
            menu += `${cat.icon} *${cat.name}*
`;
            menu += `   📝 Ketik: *menu ${cat.id}*

`;
        });
        
        menu += `💡 *CARA PENGGUNAAN:*
`;
        menu += `• Ketik *menu [kategori]* untuk melihat commands
`;
        menu += `• Contoh: *menu games* atau *menu anime*
`;
        menu += `• Ketik *help [command]* untuk detail command

`;
        
        menu += `📊 *INFO BOT:*
`;
        menu += `• 🎯 Total Commands: 50+
`;
        menu += `• ⚡ Response Time: <1s
`;
        menu += `• 🔄 Uptime: 24/7
`;
        menu += `• 🛡️ Status: Online & Ready
`;
        menu += `• 👥 NEW: Group Management Features!

`;
        
        menu += `✨ *Selamat menggunakan bot!*`;
        
        return menu;
    }
    
    async getMainMenu() {
        return this.generateMainMenu();
    }

    async getCategoryMenu(category) {
        return this.generateCategoryMenu(category);
    }
    
    async generateCategoryMenu(category) {
        if (!this.menuData[category]) {
            return this.generateMainMenu();
        }
        
        const { title, subtitle, commands } = this.menuData[category];
        
        let menu = `╭─────────────────────────╮
`;
        menu += `│       ${title}       │
`;
        if (subtitle) {
            menu += `│    ${subtitle}    │
`;
        }
        menu += `╰─────────────────────────╯

`;
        
        commands.forEach((cmd, index) => {
            menu += `${index + 1}. *${cmd.cmd}*
`;
            menu += `   📝 ${cmd.desc}

`;
        });
        
        menu += `💡 *Tips:*
`;
        menu += `• Ketik *menu* untuk kembali ke menu utama
`;
        menu += `• Ketik *help [command]* untuk detail lengkap

`;
        
        menu += `🔙 Ketik *menu* untuk menu utama`;
        
        return menu;
    }
    
    async generateWelcomeMenu() {
        let welcome = `🎉 *SELAMAT DATANG!* 🎉

`;
        welcome += `╭─────────────────────────╮
`;
        welcome += `│    🤖 BOT GRUP CANGGIH    │
`;
        welcome += `│   ✨ Siap Melayani Anda   │
`;
        welcome += `╰─────────────────────────╯

`;
        
        welcome += `🚀 *MULAI SEKARANG:*
`;
        welcome += `• Ketik *menu* - Lihat semua fitur
`;
        welcome += `• Ketik *games* - Langsung ke games
`;
        welcome += `• Ketik *anime* - Fitur anime
`;
        welcome += `• Ketik *help* - Bantuan lengkap

`;
        
        welcome += `🎯 *FITUR UNGGULAN:*
`;
        welcome += `🎮 40+ Games & Entertainment
`;
        welcome += `🌸 Anime & Waifu Collection
`;
        welcome += `🎨 Creative Tools & Generators
`;
        welcome += `🤖 AI Assistant & Analytics
`;
        welcome += `🛡️ Advanced Admin Features

`;
        
        welcome += `✨ *Ketik 'menu' untuk memulai!*`;
        
        return welcome;
    }
    
    async generateQuickMenu() {
        let quick = `⚡ *QUICK ACCESS MENU* ⚡

`;
        
        const quickCommands = [
            { category: '🎮 GAMES', commands: ['/kuis', '/tebakkata', '/suit', '/math'] },
            { category: '🌸 ANIME', commands: ['/randomwaifu', '/animesticker', '/topanime', '/otakudesu'] },
            { category: '🎨 CREATIVE', commands: ['/sticker', '/meme', '/ascii', '/brat'] },
            { category: '🛠️ UTILITY', commands: ['/qr', '/calc', '/translate', '/cuaca'] }
        ];
        
        quickCommands.forEach(cat => {
            quick += `${cat.category}
`;
            quick += `${cat.commands.join(' • ')}

`;
        });
        
        quick += `💡 Ketik *menu* untuk menu lengkap`;
        
        return quick;
    }
    
    async generateHelpCommand(command) {
        const helpData = {
            '/kuis': {
                desc: 'Mulai kuis interaktif dengan berbagai topik menarik',
                usage: '/kuis',
                example: '/kuis',
                features: ['Multiple choice questions', 'Timer 30 detik', 'Point system', 'Leaderboard']
            },
            '/tebakkata': {
                desc: 'Game tebak kata dengan sistem hint bertahap',
                usage: '/tebakkata',
                example: '/tebakkata',
                features: ['Progressive hints', '5 attempts', 'Various categories', 'Difficulty levels']
            },
            '/suit': {
                desc: 'Permainan gunting batu kertas melawan bot',
                usage: '/suit [pilihan]',
                example: '/suit batu',
                features: ['Real-time battle', 'Point rewards', 'Win/lose tracking', 'Statistics']
            },
            '/poll': {
                desc: 'Buat polling interaktif untuk grup',
                usage: '/poll [pertanyaan]',
                example: '/poll Mau makan apa hari ini?',
                features: ['Opsi default: Ya, Tidak, Mungkin', 'Voting dengan angka 1-3', 'Hasil real-time', 'Penghitungan persentase']
            },
            '/getpoll': {
                desc: 'Lihat hasil polling sementara',
                usage: '/getpoll',
                example: '/getpoll',
                features: ['Tampilkan hasil sementara', 'Hitung persentase suara', 'Tampilkan total vote', 'Informasi waktu pembuatan']
            },
            '/endpoll': {
                desc: 'Akhiri polling dan lihat hasil akhir',
                usage: '/endpoll',
                example: '/endpoll',
                features: ['Tutup polling aktif', 'Tampilkan hasil akhir', 'Tentukan pemenang', 'Hapus polling dari sistem']
            },
            '/closepoll': {
                desc: 'Alias untuk /endpoll',
                usage: '/closepoll',
                example: '/closepoll',
                features: ['Sama dengan /endpoll', 'Tutup polling aktif', 'Tampilkan hasil akhir', 'Tentukan pemenang']
            }
        };
        
        if (!helpData[command]) {
            return `❌ Command '${command}' tidak ditemukan.\n\n💡 Ketik *menu* untuk melihat semua command yang tersedia.`;
        }
        
        const help = helpData[command];
        let response = `📖 *HELP: ${command.toUpperCase()}*\n\n`;
        response += `📝 **Deskripsi:**\n${help.desc}\n\n`;
        response += `💻 **Penggunaan:**\n\`${help.usage}\`\n\n`;
        response += `📋 **Contoh:**\n\`${help.example}\`\n\n`;
        response += `✨ **Fitur:**\n${help.features.map(f => `• ${f}`).join('\n')}\n\n`;
        response += `🔙 Ketik *menu* untuk kembali ke menu utama`;
        
        return response;
    }
}

module.exports = MenuSystem;