const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'bot_data.db'));
        this.initTables();
    }

    initTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                phone TEXT,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                points INTEGER DEFAULT 0,
                coins INTEGER DEFAULT 100,
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
                join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_banned BOOLEAN DEFAULT 0,
                warning_count INTEGER DEFAULT 0
            )`,
            
            // Groups table
            `CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                settings TEXT DEFAULT '{}',
                is_active BOOLEAN DEFAULT 1
            )`,
            
            // Messages table
            `CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id TEXT UNIQUE,
                user_id TEXT,
                group_id TEXT,
                content TEXT,
                type TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                sentiment_score REAL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )`,
            
            // Games table
            `CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                group_id TEXT,
                game_type TEXT,
                score INTEGER DEFAULT 0,
                result TEXT,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )`,
            
            // Quiz table
            `CREATE TABLE IF NOT EXISTS quiz_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT,
                question TEXT,
                correct_answer TEXT,
                options TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                winner_id TEXT,
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )`,
            
            // Reminders table
            `CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                group_id TEXT,
                message TEXT,
                remind_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_sent BOOLEAN DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            
            // Achievements table
            `CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                achievement_type TEXT,
                achievement_name TEXT,
                earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            
            // URL Shortener table
            `CREATE TABLE IF NOT EXISTS short_urls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                short_code TEXT UNIQUE,
                original_url TEXT,
                user_id TEXT,
                clicks INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            
            // Word frequency table
            `CREATE TABLE IF NOT EXISTS word_frequency (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT,
                word TEXT,
                count INTEGER DEFAULT 1,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, word),
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )`,
            
            // Bot settings table
            `CREATE TABLE IF NOT EXISTS bot_settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Polls table
            `CREATE TABLE IF NOT EXISTS polls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT,
                question TEXT,
                options TEXT,
                votes TEXT DEFAULT '{}',
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )`,
            
            // Habits table
            `CREATE TABLE IF NOT EXISTS habits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                habit_name TEXT,
                streak INTEGER DEFAULT 0,
                last_completed DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            
            // Expenses table
            `CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT,
                user_id TEXT,
                description TEXT,
                amount REAL,
                category TEXT,
                date DATE DEFAULT CURRENT_DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            
            // Admin users table
            `CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE,
                added_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (added_by) REFERENCES users(id)
            )`,
            
            // Custom questions table for admin-added content
            `CREATE TABLE IF NOT EXISTS custom_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT, -- quiz, tekateki, siapakahaku, caklontong, tebakkata
                question TEXT,
                answer TEXT,
                options TEXT, -- JSON for quiz options
                hint TEXT,
                clue TEXT,
                name TEXT, -- for siapakahaku
                word TEXT, -- for tebakkata
                added_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (added_by) REFERENCES users(id)
            )`,
            
            // AI conversations table
            `CREATE TABLE IF NOT EXISTS ai_conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT,
                user_name TEXT,
                user_message TEXT,
                ai_response TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Error logs table
            `CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT, -- command_error, database_error, system_error
                command TEXT,
                user_id TEXT,
                error_message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            
            // AI configuration table
            `CREATE TABLE IF NOT EXISTS ai_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key TEXT,
                is_active BOOLEAN DEFAULT 1,
                set_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (set_by) REFERENCES users(id)
            )`,
            
            // API Keys management table
            `CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL, -- 'gemini', 'groq', etc
                api_key TEXT NOT NULL,
                name TEXT, -- friendly name for the key
                is_active BOOLEAN DEFAULT 1,
                usage_count INTEGER DEFAULT 0,
                daily_limit INTEGER DEFAULT 1000,
                monthly_limit INTEGER DEFAULT 30000,
                last_used DATETIME,
                last_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
                error_count INTEGER DEFAULT 0,
                set_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (set_by) REFERENCES users(id)
            )`
        ];

        // Create tables first
        const createTablesPromises = tables.map(sql => {
            return new Promise((resolve, reject) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });

        // Wait for all tables to be created before creating indexes
        Promise.all(createTablesPromises).then(() => {
            // Create indexes for better performance
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)',
                'CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id)',
                'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
                'CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)',
                'CREATE INDEX IF NOT EXISTS idx_word_frequency_group_id ON word_frequency(group_id)',
                'CREATE INDEX IF NOT EXISTS idx_users_level ON users(level)',
                'CREATE INDEX IF NOT EXISTS idx_users_points ON users(points)'
            ];

            indexes.forEach(sql => {
                this.db.run(sql, (err) => {
                    if (err) console.error('Error creating index:', err);
                });
            });
        }).catch(err => {
            console.error('Error creating tables:', err);
        });
    }

    // User methods
    async getUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async createUser(userId, name, phone) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR IGNORE INTO users (id, name, phone) VALUES (?, ?, ?)',
                [userId, name, phone],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async updateUserExp(userId, exp) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET exp = exp + ?, level = CASE WHEN (exp + ?) >= (level * 100) THEN level + 1 ELSE level END WHERE id = ?',
                [exp, exp, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async updateUserPoints(userId, points) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET points = points + ? WHERE id = ?',
                [points, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Message methods
    async saveMessage(messageId, userId, groupId, content, type, sentiment = 0) {
        return new Promise((resolve, reject) => {
            // Generate a unique message ID if not provided or if it's null/undefined
            const uniqueMessageId = messageId || `${userId}_${groupId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.db.run(
                'INSERT OR IGNORE INTO messages (message_id, user_id, group_id, content, type, sentiment_score) VALUES (?, ?, ?, ?, ?, ?)',
                [uniqueMessageId, userId, groupId, content, type, sentiment],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    // Game methods
    async saveGameResult(userId, groupId, gameType, score, result) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO games (user_id, group_id, game_type, score, result) VALUES (?, ?, ?, ?, ?)',
                [userId, groupId, gameType, score, result],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    // Leaderboard methods
    async getLeaderboard(groupId, type = 'points', limit = 10) {
        return new Promise((resolve, reject) => {
            let query;
            if (type === 'points') {
                query = 'SELECT name, points, level FROM users ORDER BY points DESC LIMIT ?';
            } else if (type === 'level') {
                query = 'SELECT name, level, exp FROM users ORDER BY level DESC, exp DESC LIMIT ?';
            } else if (type === 'games') {
                query = `SELECT u.name, COUNT(g.id) as games_played, AVG(g.score) as avg_score 
                        FROM users u JOIN games g ON u.id = g.user_id 
                        WHERE g.group_id = ? 
                        GROUP BY u.id ORDER BY games_played DESC LIMIT ?`;
            }
            
            const params = type === 'games' ? [groupId, limit] : [limit];
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Statistics methods
    async getGroupStats(groupId) {
        return new Promise((resolve, reject) => {
            const queries = {
                totalMessages: 'SELECT COUNT(*) as count FROM messages WHERE group_id = ?',
                activeUsers: 'SELECT COUNT(DISTINCT user_id) as count FROM messages WHERE group_id = ? AND date(timestamp) = date("now")',
                topWords: `SELECT word, count FROM word_frequency WHERE group_id = ? ORDER BY count DESC LIMIT 10`,
                avgSentiment: 'SELECT AVG(sentiment_score) as avg FROM messages WHERE group_id = ? AND sentiment_score != 0'
            };

            const results = {};
            let completed = 0;
            const total = Object.keys(queries).length;

            Object.entries(queries).forEach(([key, query]) => {
                this.db.all(query, [groupId], (err, rows) => {
                    if (err) {
                        results[key] = null;
                    } else {
                        results[key] = key === 'topWords' ? rows : rows[0];
                    }
                    completed++;
                    if (completed === total) {
                        resolve(results);
                    }
                });
            });
        });
    }

    // Word frequency methods
    async updateWordFrequency(groupId, words) {
        const promises = words.map(word => {
            return new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT INTO word_frequency (group_id, word, count) 
                     VALUES (?, ?, 1) 
                     ON CONFLICT(group_id, word) DO UPDATE SET 
                     count = count + 1, last_used = CURRENT_TIMESTAMP`,
                    [groupId, word.toLowerCase()],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    }
                );
            });
        });
        return Promise.all(promises);
    }

    // Reminder methods
    async createReminder(userId, groupId, message, remindAt) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO reminders (user_id, group_id, message, remind_at) VALUES (?, ?, ?, ?)',
                [userId, groupId, message, remindAt],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getPendingReminders() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM reminders WHERE remind_at <= datetime("now") AND is_sent = 0',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async markReminderSent(reminderId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE reminders SET is_sent = 1 WHERE id = ?',
                [reminderId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // URL shortener methods
    async createShortUrl(shortCode, originalUrl, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO short_urls (short_code, original_url, user_id) VALUES (?, ?, ?)',
                [shortCode, originalUrl, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getShortUrl(shortCode) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM short_urls WHERE short_code = ?',
                [shortCode],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async incrementUrlClicks(shortCode) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE short_urls SET clicks = clicks + 1 WHERE short_code = ?',
                [shortCode],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Admin methods
    async getAdminUsers() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM admin_users WHERE is_active = 1', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async addAdminUser(userId, addedBy) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO admin_users (user_id, added_by) VALUES (?, ?)',
                [userId, addedBy],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async removeAdminUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE admin_users SET is_active = 0 WHERE user_id = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Custom questions methods
    async addCustomQuestion(type, questionData) {
        return new Promise((resolve, reject) => {
            const { question, answer, options, hint, clue, name, word, added_by } = questionData;
            this.db.run(
                'INSERT INTO custom_questions (type, question, answer, options, hint, clue, name, word, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [type, question, answer, JSON.stringify(options), hint, clue, name, word, added_by],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getCustomQuestions(type) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM custom_questions WHERE type = ? AND is_active = 1',
                [type],
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        // Parse JSON options
                        const questions = rows.map(row => {
                            if (row.options) {
                                try {
                                    row.options = JSON.parse(row.options);
                                } catch (e) {
                                    row.options = null;
                                }
                            }
                            return row;
                        });
                        resolve(questions);
                    }
                }
            );
        });
    }

    async getAdminStats() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT type, COUNT(*) as count FROM custom_questions WHERE is_active = 1 GROUP BY type',
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        const stats = {};
                        rows.forEach(row => {
                            stats[row.type] = row.count;
                        });
                        resolve(stats);
                    }
                }
            );
        });
    }

    // AI conversation methods
    async saveAIConversation(chatId, userName, userMessage, aiResponse) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO ai_conversations (chat_id, user_name, user_message, ai_response) VALUES (?, ?, ?, ?)',
                [chatId, userName, userMessage, aiResponse],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getAIConversationHistory(chatId, limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM ai_conversations WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?',
                [chatId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async clearAIConversationHistory(chatId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM ai_conversations WHERE chat_id = ?',
                [chatId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Get bot statistics for monitoring
    async getBotStats() {
        return new Promise((resolve, reject) => {
            const queries = [
                'SELECT COUNT(*) as totalUsers FROM users',
                'SELECT COUNT(*) as totalMessages FROM messages',
                'SELECT COUNT(*) as totalGames FROM games',
                'SELECT COUNT(*) as activeSessions FROM quiz_sessions WHERE is_active = 1'
            ];
            
            const stats = {};
            let completed = 0;
            
            queries.forEach((query, index) => {
                this.db.get(query, (err, row) => {
                    if (err) {
                        console.error('Error getting stats:', err);
                        completed++;
                    } else {
                        const key = Object.keys(row)[0];
                        stats[key] = row[key];
                        completed++;
                    }
                    
                    if (completed === queries.length) {
                        resolve(stats);
                    }
                });
            });
        });
    }
    
    // Test database connection
    async testConnection() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT 1', (err, row) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }

    // Error logging methods
    async logError(errorData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO error_logs (type, command, user_id, error_message, timestamp) VALUES (?, ?, ?, ?, ?)',
                [errorData.type, errorData.command, errorData.user, errorData.error, errorData.timestamp.toISOString()],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getErrorLogs(limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getErrorLogsByType(type, limit = 20) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM error_logs WHERE type = ? ORDER BY timestamp DESC LIMIT ?',
                [type, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // AI Configuration methods
    async setAIConfig(apiKey, setBy) {
        return new Promise((resolve, reject) => {
            // First, deactivate all existing configs
            this.db.run(
                'UPDATE ai_config SET is_active = 0',
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Insert new config
                    this.db.run(
                        'INSERT INTO ai_config (api_key, set_by) VALUES (?, ?)',
                        [apiKey, setBy],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                }
            );
        });
    }

    async getActiveAIConfig() {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM ai_config WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1',
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async removeAIConfig() {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE ai_config SET is_active = 0',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getAIConfigHistory(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM ai_config ORDER BY created_at DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // API Keys Management Methods
    async addAPIKey(provider, apiKey, name, setBy, dailyLimit = 1000, monthlyLimit = 30000) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO api_keys (provider, api_key, name, daily_limit, monthly_limit, set_by) VALUES (?, ?, ?, ?, ?, ?)',
                [provider, apiKey, name, dailyLimit, monthlyLimit, setBy],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getAPIKeys(provider = null) {
        return new Promise((resolve, reject) => {
            const query = provider 
                ? 'SELECT * FROM api_keys WHERE provider = ? AND is_active = 1 ORDER BY created_at DESC'
                : 'SELECT * FROM api_keys WHERE is_active = 1 ORDER BY provider, created_at DESC';
            const params = provider ? [provider] : [];
            
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getActiveAPIKey(provider) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM api_keys WHERE provider = ? AND is_active = 1 AND error_count < 5 ORDER BY usage_count ASC, created_at ASC LIMIT 1',
                [provider],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async updateAPIKeyUsage(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE api_keys SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async incrementAPIKeyError(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE api_keys SET error_count = error_count + 1 WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async removeAPIKey(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE api_keys SET is_active = 0 WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async resetAPIKeyUsage() {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE api_keys SET usage_count = 0, error_count = 0, last_reset = CURRENT_TIMESTAMP WHERE is_active = 1',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // Remove daily limit for all API keys (set to unlimited)
    async removeDailyLimitAllKeys() {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE api_keys SET daily_limit = 999999999 WHERE is_active = 1',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async checkAndRemoveExceededKeys() {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE api_keys SET is_active = 0 WHERE (usage_count >= daily_limit OR error_count >= 5) AND is_active = 1',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // Close database connection
    close() {
        this.db.close((err) => {
            if (err) console.error('Error closing database:', err);
            else console.log('Database connection closed.');
        });
    }
}

module.exports = Database;