const axios = require('axios');
const math = require('mathjs');

class GameEngine {
    constructor(database) {
        this.db = database;
        this.gameStates = new Map();
        this.quizStates = new Map();
        
        // Game data
        this.gameData = {
            words: ['PROGRAMMING', 'JAVASCRIPT', 'WHATSAPP', 'INDONESIA', 'COMPUTER', 'INTERNET', 'MOBILE', 'ANDROID', 'TECHNOLOGY', 'ARTIFICIAL', 'INTELLIGENCE', 'MACHINE', 'LEARNING', 'DATABASE', 'ALGORITHM'],
            
            quizQuestions: [
                { q: 'Apa ibu kota Indonesia?', a: 'jakarta', options: ['Jakarta', 'Bandung', 'Surabaya', 'Medan'] },
                { q: 'Siapa presiden pertama Indonesia?', a: 'soekarno', options: ['Soekarno', 'Soeharto', 'Habibie', 'Megawati'] },
                { q: 'Berapa hasil 15 x 8?', a: '120', options: ['120', '110', '130', '140'] },
                { q: 'Planet terdekat dengan matahari?', a: 'merkurius', options: ['Merkurius', 'Venus', 'Bumi', 'Mars'] },
                { q: 'Bahasa pemrograman yang dibuat oleh Google?', a: 'go', options: ['Go', 'Python', 'Java', 'C++'] },
                { q: 'Siapa penemu lampu pijar?', a: 'edison', options: ['Edison', 'Tesla', 'Einstein', 'Newton'] },
                { q: 'Negara dengan populasi terbesar di dunia?', a: 'china', options: ['China', 'India', 'Amerika', 'Indonesia'] },
                { q: 'Berapa jumlah benua di dunia?', a: '7', options: ['5', '6', '7', '8'] }
            ],
            
            siapakahaku: [
                { clue: 'Saya adalah presiden Amerika yang terkenal dengan pidato "I Have a Dream"', answer: 'martin luther king', name: 'Martin Luther King Jr.' },
                { clue: 'Saya penemu teori relativitas dan rumus E=mc²', answer: 'einstein', name: 'Albert Einstein' },
                { clue: 'Saya pendiri Microsoft dan salah satu orang terkaya di dunia', answer: 'bill gates', name: 'Bill Gates' },
                { clue: 'Saya penemu Facebook dan CEO Meta', answer: 'mark zuckerberg', name: 'Mark Zuckerberg' },
                { clue: 'Saya presiden pertama Indonesia yang memproklamirkan kemerdekaan', answer: 'soekarno', name: 'Soekarno' }
            ],
            
            tekateki: [
                { q: 'Apa yang bisa berlari tapi tidak punya kaki?', a: 'air', hint: 'Mengalir dari atas ke bawah' },
                { q: 'Apa yang punya mata tapi tidak bisa melihat?', a: 'jarum', hint: 'Digunakan untuk menjahit' },
                { q: 'Apa yang bisa terbang tapi bukan burung?', a: 'pesawat', hint: 'Kendaraan transportasi udara' },
                { q: 'Apa yang makin dipotong makin panjang?', a: 'parit', hint: 'Lubang di tanah' },
                { q: 'Apa yang bisa bicara tapi tidak punya mulut?', a: 'gema', hint: 'Suara yang memantul' }
            ],
            
            asahotak: [
                { q: 'Jika 2 + 2 = 4, 3 + 3 = 6, maka 4 + 4 = ?', a: '8', hint: 'Penjumlahan sederhana' },
                { q: 'Apa yang selalu naik tapi tidak pernah turun?', a: 'umur', hint: 'Sesuatu tentang waktu' },
                { q: 'Berapa banyak bulan yang memiliki 28 hari?', a: '12', hint: 'Semua bulan punya minimal 28 hari' },
                { q: 'Apa yang bisa kamu pecahkan tanpa menyentuhnya?', a: 'janji', hint: 'Sesuatu yang abstrak' }
            ],
            
            caklontong: [
                { q: 'Kenapa ayam jago tidak pernah telat bangun pagi?', a: 'karena dia punya alarm', hint: 'Suara khas ayam jago' },
                { q: 'Apa bedanya semut dengan orang kaya?', a: 'semut punya rumah', hint: 'Tentang tempat tinggal' },
                { q: 'Kenapa ikan tidak pernah bayar pajak?', a: 'karena dia hidup di air', hint: 'Tempat tinggal ikan' },
                { q: 'Apa persamaan antara uang dan rahasia?', a: 'sama-sama susah dipegang', hint: 'Sifat keduanya' }
            ]
        };
    }
    
    // Quiz Game
    async startKuis(chatId) {
        const question = this.gameData.quizQuestions[Math.floor(Math.random() * this.gameData.quizQuestions.length)];
        const timer = 30;
        
        this.quizStates.set(chatId, {
            question: question,
            startTime: Date.now(),
            timer: timer,
            participants: new Map()
        });
        
        setTimeout(() => {
            const state = this.quizStates.get(chatId);
            if (state) {
                this.quizStates.delete(chatId);
            }
        }, timer * 1000);
        
        return `🧠 *KUIS INTERAKTIF*\n\n❓ ${question.q}\n\n${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\n⏰ Waktu: ${timer} detik\n💡 Ketik nomor jawaban (1-4)\n🏳️ Ketik "menyerah" untuk menyerah`;
    }
    
    // Word Guessing Game
    async startTebakKata(chatId) {
        const word = this.gameData.words[Math.floor(Math.random() * this.gameData.words.length)];
        const hints = [
            word.charAt(0) + '_'.repeat(word.length - 1),
            word.substring(0, 2) + '_'.repeat(word.length - 2),
            word.substring(0, 3) + '_'.repeat(word.length - 3)
        ];
        
        this.gameStates.set(chatId, {
            type: 'tebakkata',
            word: word,
            hints: hints,
            currentHint: 0,
            attempts: 0,
            maxAttempts: 5,
            startTime: Date.now()
        });
        
        return `🎯 *TEBAK KATA*\n\n🔤 Kata: ${hints[0]}\n💡 Hint: ${word.length} huruf\n🎯 Tebakan: 0/5\n\n💬 Ketik jawaban kamu!\n🏳️ Ketik "menyerah" untuk menyerah`;
    }
    
    // Rock Paper Scissors
    async playSuit(choice) {
        const choices = ['gunting', 'batu', 'kertas'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        const userChoice = choice.toLowerCase();
        
        if (!choices.includes(userChoice)) {
            return '❌ Pilihan tidak valid! Gunakan: gunting, batu, atau kertas';
        }
        
        let result;
        let points = 0;
        
        if (userChoice === botChoice) {
            result = 'SERI';
            points = 10;
        } else if (
            (userChoice === 'gunting' && botChoice === 'kertas') ||
            (userChoice === 'batu' && botChoice === 'gunting') ||
            (userChoice === 'kertas' && botChoice === 'batu')
        ) {
            result = 'MENANG';
            points = 20;
        } else {
            result = 'KALAH';
            points = 5;
        }
        
        const emojis = {
            gunting: '✂️',
            batu: '🗿',
            kertas: '📄'
        };
        
        return {
            message: `🎮 *SUIT GAME*\n\n👤 Kamu: ${emojis[userChoice]} ${userChoice}\n🤖 Bot: ${emojis[botChoice]} ${botChoice}\n\n🏆 Hasil: *${result}*\n💰 +${points} points!`,
            points: points,
            result: result
        };
    }
    
    // Slot Machine
    async playSlot() {
        const symbols = ['🍎', '🍊', '🍋', '🍇', '🍓', '💎', '⭐', '🔔'];
        const reels = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];
        
        let points = 0;
        let result = '';
        
        if (reels[0] === reels[1] && reels[1] === reels[2]) {
            if (reels[0] === '💎') {
                points = 100;
                result = 'JACKPOT DIAMOND!';
            } else if (reels[0] === '⭐') {
                points = 75;
                result = 'SUPER WIN!';
            } else {
                points = 50;
                result = 'BIG WIN!';
            }
        } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
            points = 20;
            result = 'SMALL WIN!';
        } else {
            points = 5;
            result = 'Try Again!';
        }
        
        return {
            message: `🎰 *SLOT MACHINE*\n\n[ ${reels.join(' | ')} ]\n\n🏆 ${result}\n💰 +${points} points!`,
            points: points
        };
    }
    
    // Math Game
    async startMathGame(chatId) {
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
        
        this.gameStates.set(chatId, {
            type: 'math',
            question: `${num1} ${operation} ${num2}`,
            answer: answer,
            attempts: 0,
            maxAttempts: 3,
            startTime: Date.now(),
            timeLimit: 30000
        });
        
        setTimeout(() => {
            const state = this.gameStates.get(chatId);
            if (state && state.type === 'math') {
                this.gameStates.delete(chatId);
            }
        }, 30000);
        
        return `🧮 *MATH CHALLENGE*\n\n❓ Berapa hasil dari: *${num1} ${operation} ${num2}* ?\n\n⏰ Waktu: 30 detik\n🎯 Kesempatan: 3x\n\n💬 Ketik jawaban angka!\n🏳️ Ketik "menyerah" untuk menyerah`;
    }
    
    // Siapa Kah Aku Game
    async startSiapaKahAku(chatId) {
        const character = this.gameData.siapakahaku[Math.floor(Math.random() * this.gameData.siapakahaku.length)];
        
        this.gameStates.set(chatId, {
            type: 'siapakahaku',
            character: character,
            attempts: 0,
            maxAttempts: 3,
            startTime: Date.now()
        });
        
        return `🤔 *SIAPA KAH AKU?*\n\n💭 Clue: ${character.clue}\n\n🎯 Tebakan: 0/3\n💡 Ketik nama tokoh yang kamu tebak!\n🏳️ Ketik "menyerah" untuk menyerah`;
    }
    
    // Susun Kata Game
    async startSusunKata(chatId) {
        const word = this.gameData.words[Math.floor(Math.random() * this.gameData.words.length)];
        const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
        
        this.gameStates.set(chatId, {
            type: 'susunkata',
            word: word,
            scrambled: scrambled,
            attempts: 0,
            maxAttempts: 5,
            startTime: Date.now()
        });
        
        return `🔤 *SUSUN KATA*\n\n🎯 Susun huruf ini: *${scrambled}*\n💡 Hint: ${word.length} huruf\n🎯 Tebakan: 0/5\n\n💬 Ketik kata yang benar!\n🏳️ Ketik "menyerah" untuk menyerah`;
    }
    
    // Teka Teki Game
    async startTekaTeki(chatId) {
        const riddle = this.gameData.tekateki[Math.floor(Math.random() * this.gameData.tekateki.length)];
        
        this.gameStates.set(chatId, {
            type: 'tekateki',
            riddle: riddle,
            attempts: 0,
            maxAttempts: 3,
            startTime: Date.now()
        });
        
        return `🧩 *TEKA-TEKI*\n\n❓ ${riddle.q}\n\n🎯 Tebakan: 0/3\n💡 Ketik 'hint' untuk petunjuk\n🏳️ Ketik "menyerah" untuk menyerah\n\n💬 Ketik jawaban kamu!`;
    }
    
    // Asah Otak Game
    async startAsahOtak(chatId) {
        const puzzle = this.gameData.asahotak[Math.floor(Math.random() * this.gameData.asahotak.length)];
        
        this.gameStates.set(chatId, {
            type: 'asahotak',
            puzzle: puzzle,
            attempts: 0,
            maxAttempts: 3,
            startTime: Date.now()
        });
        
        return `🧠 *ASAH OTAK*\n\n🤔 ${puzzle.q}\n\n🎯 Tebakan: 0/3\n💡 Ketik 'hint' untuk petunjuk\n🏳️ Ketik "menyerah" untuk menyerah\n\n💬 Ketik jawaban kamu!`;
    }
    
    // Cak Lontong Game
    async startCakLontong(chatId) {
        const joke = this.gameData.caklontong[Math.floor(Math.random() * this.gameData.caklontong.length)];
        
        this.gameStates.set(chatId, {
            type: 'caklontong',
            joke: joke,
            attempts: 0,
            maxAttempts: 3,
            startTime: Date.now()
        });
        
        return `😄 *CAK LONTONG QUIZ*\n\n❓ ${joke.q}\n\n🎯 Tebakan: 0/3\n💡 Ketik 'hint' untuk petunjuk\n🏳️ Ketik "menyerah" untuk menyerah\n\n💬 Ketik jawaban kamu!`;
    }
    
    // Handle Game Answers
    async handleGameAnswer(chatId, userId, answer) {
        const gameState = this.gameStates.get(chatId);
        if (!gameState) return null;
        
        const lowerAnswer = answer.toLowerCase().trim();
        
        // Handle surrender command
        if (lowerAnswer === 'menyerah' || lowerAnswer === 'surrender' || lowerAnswer === 'give up') {
            return this.surrenderGame(chatId, gameState, userId);
        }
        
        gameState.attempts++;
        
        let response = null;
        let points = 0;
        
        switch (gameState.type) {
            case 'tebakkata':
                if (lowerAnswer === gameState.word.toLowerCase()) {
                    points = Math.max(25 - (gameState.attempts * 5), 5);
                    response = `🎉 *BENAR!*\n\nJawaban: *${gameState.word}*\n💰 +${points} points!\n⏱️ Waktu: ${Math.floor((Date.now() - gameState.startTime) / 1000)}s`;
                    this.gameStates.delete(chatId);
                } else if (gameState.attempts >= gameState.maxAttempts) {
                    response = `❌ *GAME OVER!*\n\nJawaban yang benar: *${gameState.word}*\n💰 +5 points untuk mencoba!`;
                    points = 5;
                    this.gameStates.delete(chatId);
                } else {
                    const hintIndex = Math.min(gameState.currentHint + 1, gameState.hints.length - 1);
                    gameState.currentHint = hintIndex;
                    response = `❌ Salah! Coba lagi...\n\n🔤 Hint: ${gameState.hints[hintIndex]}\n🎯 Sisa tebakan: ${gameState.maxAttempts - gameState.attempts}`;
                }
                break;
                
            case 'math':
                if (parseInt(lowerAnswer) === gameState.answer) {
                    const timeBonus = Math.max(30 - Math.floor((Date.now() - gameState.startTime) / 1000), 0);
                    points = 20 + timeBonus;
                    response = `🎉 *BENAR!*\n\n${gameState.question} = *${gameState.answer}*\n💰 +${points} points!\n⚡ Time bonus: +${timeBonus}`;
                    this.gameStates.delete(chatId);
                } else if (gameState.attempts >= gameState.maxAttempts) {
                    response = `❌ *GAME OVER!*\n\n${gameState.question} = *${gameState.answer}*\n💰 +5 points untuk mencoba!`;
                    points = 5;
                    this.gameStates.delete(chatId);
                } else {
                    response = `❌ Salah! Coba lagi...\n🎯 Sisa kesempatan: ${gameState.maxAttempts - gameState.attempts}`;
                }
                break;
                
            case 'siapakahaku':
                if (lowerAnswer.includes(gameState.character.answer)) {
                    points = Math.max(30 - (gameState.attempts * 5), 10);
                    response = `🎉 *BENAR!*\n\nJawabannya: *${gameState.character.name}*\n💰 +${points} points!`;
                    this.gameStates.delete(chatId);
                } else if (gameState.attempts >= gameState.maxAttempts) {
                    response = `❌ *GAME OVER!*\n\nJawabannya: *${gameState.character.name}*\n💰 +5 points untuk mencoba!`;
                    points = 5;
                    this.gameStates.delete(chatId);
                } else {
                    response = `❌ Salah! Coba lagi...\n🎯 Sisa tebakan: ${gameState.maxAttempts - gameState.attempts}`;
                }
                break;
                
            case 'susunkata':
                if (lowerAnswer === gameState.word.toLowerCase()) {
                    points = Math.max(25 - (gameState.attempts * 3), 10);
                    response = `🎉 *BENAR!*\n\nKata: *${gameState.word}*\nDari: ${gameState.scrambled}\n💰 +${points} points!`;
                    this.gameStates.delete(chatId);
                } else if (gameState.attempts >= gameState.maxAttempts) {
                    response = `❌ *GAME OVER!*\n\nKata yang benar: *${gameState.word}*\n💰 +5 points untuk mencoba!`;
                    points = 5;
                    this.gameStates.delete(chatId);
                } else {
                    response = `❌ Salah! Coba lagi...\n🎯 Sisa tebakan: ${gameState.maxAttempts - gameState.attempts}`;
                }
                break;
                
            case 'tekateki':
                if (lowerAnswer === 'hint') {
                    response = `💡 *HINT:* ${gameState.riddle.hint}`;
                } else if (lowerAnswer === gameState.riddle.a.toLowerCase()) {
                    points = Math.max(20 - (gameState.attempts * 3), 8);
                    response = `🎉 *BENAR!*\n\nJawaban: *${gameState.riddle.a}*\n💰 +${points} points!`;
                    this.gameStates.delete(chatId);
                } else if (gameState.attempts >= gameState.maxAttempts) {
                    response = `❌ *GAME OVER!*\n\nJawaban: *${gameState.riddle.a}*\n💰 +5 points untuk mencoba!`;
                    points = 5;
                    this.gameStates.delete(chatId);
                } else {
                    response = `❌ Salah! Coba lagi...\n🎯 Sisa tebakan: ${gameState.maxAttempts - gameState.attempts}`;
                }
                break;
                
            case 'asahotak':
                if (lowerAnswer === 'hint') {
                    response = `💡 *HINT:* ${gameState.puzzle.hint}`;
                } else if (lowerAnswer === gameState.puzzle.a.toLowerCase()) {
                    points = Math.max(25 - (gameState.attempts * 4), 10);
                    response = `🎉 *BENAR!*\n\nJawaban: *${gameState.puzzle.a}*\n💰 +${points} points!`;
                    this.gameStates.delete(chatId);
                } else if (gameState.attempts >= gameState.maxAttempts) {
                    response = `❌ *GAME OVER!*\n\nJawaban: *${gameState.puzzle.a}*\n💰 +5 points untuk mencoba!`;
                    points = 5;
                    this.gameStates.delete(chatId);
                } else {
                    response = `❌ Salah! Coba lagi...\n🎯 Sisa tebakan: ${gameState.maxAttempts - gameState.attempts}`;
                }
                break;
                
            case 'caklontong':
                if (lowerAnswer === 'hint') {
                    response = `💡 *HINT:* ${gameState.joke.hint}`;
                } else if (lowerAnswer.includes(gameState.joke.a.toLowerCase())) {
                    points = Math.max(15 - (gameState.attempts * 2), 8);
                    response = `🎉 *BENAR!*\n\nJawaban: *${gameState.joke.a}*\n💰 +${points} points!`;
                    this.gameStates.delete(chatId);
                } else if (gameState.attempts >= gameState.maxAttempts) {
                    response = `❌ *GAME OVER!*\n\nJawaban: *${gameState.joke.a}*\n💰 +5 points untuk mencoba!`;
                    points = 5;
                    this.gameStates.delete(chatId);
                } else {
                    response = `❌ Salah! Coba lagi...\n🎯 Sisa tebakan: ${gameState.maxAttempts - gameState.attempts}`;
                }
                break;
        }
        
        if (points > 0 && this.db) {
            this.db.updateUserPoints(userId, points);
            this.db.updateUserExp(userId, points);
        }
        
        return response;
    }
    
    // Surrender Game
    surrenderGame(chatId, gameState, userId) {
        let response = '';
        let correctAnswer = '';
        
        switch (gameState.type) {
            case 'tebakkata':
                correctAnswer = gameState.word;
                response = `🏳️ *MENYERAH!*\n\n🔤 Jawaban yang benar: *${correctAnswer}*\n💰 +3 points untuk mencoba!`;
                break;
            case 'math':
                correctAnswer = gameState.answer;
                response = `🏳️ *MENYERAH!*\n\n🧮 ${gameState.question} = *${correctAnswer}*\n💰 +3 points untuk mencoba!`;
                break;
            case 'siapakahaku':
                correctAnswer = gameState.character.name;
                response = `🏳️ *MENYERAH!*\n\n👤 Jawabannya: *${correctAnswer}*\n💰 +3 points untuk mencoba!`;
                break;
            case 'susunkata':
                correctAnswer = gameState.word;
                response = `🏳️ *MENYERAH!*\n\n🔤 Kata yang benar: *${correctAnswer}*\nDari: ${gameState.scrambled}\n💰 +3 points untuk mencoba!`;
                break;
            case 'tekateki':
                correctAnswer = gameState.riddle.a;
                response = `🏳️ *MENYERAH!*\n\n🧩 Jawaban: *${correctAnswer}*\n💰 +3 points untuk mencoba!`;
                break;
            case 'asahotak':
                correctAnswer = gameState.puzzle.a;
                response = `🏳️ *MENYERAH!*\n\n🧠 Jawaban: *${correctAnswer}*\n💰 +3 points untuk mencoba!`;
                break;
            case 'caklontong':
                correctAnswer = gameState.joke.a;
                response = `🏳️ *MENYERAH!*\n\n😄 Jawaban: *${correctAnswer}*\n💰 +3 points untuk mencoba!`;
                break;
            default:
                response = `🏳️ *MENYERAH!*\n\n💰 +3 points untuk mencoba!`;
        }
        
        // Give surrender points
        if (this.db && userId) {
            this.db.updateUserPoints(userId, 3);
            this.db.updateUserExp(userId, 3);
        }
        
        // Remove game state
        this.gameStates.delete(chatId);
        
        return response;
    }

    // Handle Quiz Answers
    async handleQuizAnswer(chatId, userId, answer) {
        const quizState = this.quizStates.get(chatId);
        if (!quizState) return null;
        
        // Handle surrender for quiz
        const lowerAnswer = answer.toLowerCase().trim();
        if (lowerAnswer === 'menyerah' || lowerAnswer === 'surrender' || lowerAnswer === 'give up') {
            const correctOption = quizState.question.options.find(opt => opt.toLowerCase() === quizState.question.a.toLowerCase());
            const response = `🏳️ *MENYERAH!*\n\n❓ ${quizState.question.q}\n✅ Jawaban yang benar: *${correctOption}*\n💰 +3 points untuk mencoba!`;
            
            if (this.db) {
                this.db.updateUserPoints(userId, 3);
                this.db.updateUserExp(userId, 3);
            }
            
            this.quizStates.delete(chatId);
            return response;
        }
        
        const answerNum = parseInt(answer);
        if (answerNum < 1 || answerNum > 4) {
            return '❌ Jawaban harus berupa angka 1-4!\n💡 Ketik "menyerah" jika ingin menyerah';
        }
        
        const selectedOption = quizState.question.options[answerNum - 1];
        const isCorrect = selectedOption.toLowerCase() === quizState.question.a.toLowerCase();
        
        let points = 0;
        let response = '';
        
        if (isCorrect) {
            const timeElapsed = Math.floor((Date.now() - quizState.startTime) / 1000);
            const timeBonus = Math.max(30 - timeElapsed, 0);
            points = 25 + timeBonus;
            response = `🎉 *BENAR!*\n\nJawaban: ${selectedOption}\n💰 +${points} points!\n⚡ Time bonus: +${timeBonus}`;
        } else {
            points = 5;
            response = `❌ *SALAH!*\n\nJawaban yang benar: ${quizState.question.options.find(opt => opt.toLowerCase() === quizState.question.a.toLowerCase())}\n💰 +${points} points untuk mencoba!`;
        }
        
        if (this.db) {
            this.db.updateUserPoints(userId, points);
            this.db.updateUserExp(userId, points);
        }
        
        this.quizStates.delete(chatId);
        return response;
    }
    
    // Start Game - Universal game starter
    async startGame(gameType, chatId, options = {}) {
        switch (gameType) {
            case 'kuis':
                return this.startKuis(chatId);
            case 'tebakkata':
                return this.startTebakKata(chatId);
            case 'suit':
                return this.playSuit(options.choice);
            case 'slot':
                return this.playSlot();
            case 'siapakahaku':
                return this.startSiapaKahAku(chatId);
            case 'tekateki':
                return this.startTekaTeki(chatId);
            case 'asahotak':
                return this.startAsahOtak(chatId);
            case 'caklontong':
                return this.startCakLontong(chatId);
            case 'susunkata':
                return this.startSusunKata(chatId);
            case 'math':
                return this.startMathGame(chatId);
            default:
                return '❌ Game tidak ditemukan!';
        }
    }

    // Get active games
    getActiveGames() {
        return {
            games: this.gameStates.size,
            quizzes: this.quizStates.size
        };
    }
    
    // Clear expired games
    clearExpiredGames() {
        const now = Date.now();
        const expireTime = 5 * 60 * 1000; // 5 minutes
        
        for (const [chatId, state] of this.gameStates.entries()) {
            if (now - state.startTime > expireTime) {
                this.gameStates.delete(chatId);
            }
        }
        
        for (const [chatId, state] of this.quizStates.entries()) {
            if (now - state.startTime > expireTime) {
                this.quizStates.delete(chatId);
            }
        }
    }
}

module.exports = GameEngine;