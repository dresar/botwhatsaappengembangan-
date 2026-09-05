/**
 * optimasi.js - Modul untuk mengoptimalkan penggunaan resource pada VPS dengan spesifikasi rendah
 * Didesain untuk VPS 1 Core, 1GB RAM, 20GB Storage
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

class ResourceOptimizer {
    constructor(config = {}) {
        // Default configuration
        this.config = {
            memoryLimit: parseInt(process.env.MEMORY_LIMIT) || 256, // MB
            gcInterval: parseInt(process.env.GC_INTERVAL) || 180000, // 3 menit
            cacheCleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL) || 300000, // 5 menit
            logCleanupInterval: parseInt(process.env.LOG_CLEANUP_INTERVAL) || 86400000, // 1 hari
            logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 7,
            mediaCleanupInterval: parseInt(process.env.MEDIA_CLEANUP_INTERVAL) || 86400000, // 1 hari
            mediaRetentionDays: parseInt(process.env.MEDIA_RETENTION_DAYS) || 3,
            dbVacuumInterval: parseInt(process.env.DB_VACUUM_INTERVAL) || 604800000, // 1 minggu
            ...config
        };

        // Statistik
        this.stats = {
            gcCalls: 0,
            cacheCleanups: 0,
            logCleanups: 0,
            mediaCleanups: 0,
            dbVacuums: 0,
            memoryWarnings: 0,
            startTime: Date.now()
        };

        // Inisialisasi
        this.setupMemoryMonitoring();
        this.setupIntervals();
        this.applyNodeOptimizations();
    }

    /**
     * Mendapatkan penggunaan memori saat ini
     * @returns {Object} Informasi penggunaan memori
     */
    getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            rss: Math.round(used.rss / 1024 / 1024), // MB
            heapTotal: Math.round(used.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(used.heapUsed / 1024 / 1024), // MB
            external: Math.round(used.external / 1024 / 1024), // MB
            systemTotal: Math.round(os.totalmem() / 1024 / 1024), // MB
            systemFree: Math.round(os.freemem() / 1024 / 1024), // MB
            systemUsed: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024) // MB
        };
    }

    /**
     * Mengatur interval untuk monitoring dan optimasi
     */
    setupIntervals() {
        // Garbage collection interval
        if (global.gc) {
            setInterval(() => this.forceGC(), this.config.gcInterval);
        } else {
            console.warn('Garbage collection tidak tersedia. Jalankan Node.js dengan flag --expose-gc untuk mengaktifkan fitur ini.');
        }

        // Interval lainnya
        setInterval(() => this.cleanupLogs(), this.config.logCleanupInterval);
        setInterval(() => this.cleanupMedia(), this.config.mediaCleanupInterval);
        setInterval(() => this.vacuumDatabase(), this.config.dbVacuumInterval);
    }

    /**
     * Mengatur monitoring penggunaan memori
     */
    setupMemoryMonitoring() {
        // Monitor memory setiap 1 menit
        setInterval(() => {
            const memoryUsage = this.getMemoryUsage();
            
            // Jika penggunaan memori melebihi batas
            if (memoryUsage.rss > this.config.memoryLimit) {
                this.stats.memoryWarnings++;
                console.warn(`[MEMORY WARNING] Penggunaan memori tinggi: ${memoryUsage.rss}MB (batas: ${this.config.memoryLimit}MB)`);
                
                // Paksa garbage collection
                this.forceGC();
                
                // Jika masih tinggi setelah GC, lakukan tindakan tambahan
                const afterGCMemory = this.getMemoryUsage();
                if (afterGCMemory.rss > this.config.memoryLimit) {
                    this.emergencyMemoryCleanup();
                }
            }
        }, 60000); // Cek setiap 1 menit
    }

    /**
     * Memaksa garbage collection jika tersedia
     */
    forceGC() {
        if (global.gc) {
            try {
                global.gc();
                this.stats.gcCalls++;
                console.log(`[OPTIMIZER] Garbage collection dipaksa. Penggunaan memori sekarang: ${this.getMemoryUsage().rss}MB`);
            } catch (error) {
                console.error('[OPTIMIZER] Gagal melakukan garbage collection:', error.message);
            }
        }
    }

    /**
     * Membersihkan file log lama
     */
    cleanupLogs() {
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) return;

        try {
            const cutoffTime = Date.now() - (this.config.logRetentionDays * 24 * 60 * 60 * 1000);
            const files = fs.readdirSync(logDir);
            let deletedCount = 0;

            files.forEach(file => {
                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            });

            if (deletedCount > 0) {
                this.stats.logCleanups++;
                console.log(`[OPTIMIZER] Membersihkan ${deletedCount} file log lama`);
            }
        } catch (error) {
            console.error('[OPTIMIZER] Gagal membersihkan log:', error.message);
        }
    }

    /**
     * Membersihkan file media lama (gambar, audio, dll)
     */
    cleanupMedia() {
        const mediaFolders = [
            path.join(__dirname, 'media'),
            path.join(__dirname, 'qr_codes'),
            path.join(__dirname, 'temp')
        ];

        mediaFolders.forEach(folder => {
            if (!fs.existsSync(folder)) return;

            try {
                const cutoffTime = Date.now() - (this.config.mediaRetentionDays * 24 * 60 * 60 * 1000);
                const files = fs.readdirSync(folder);
                let deletedCount = 0;

                files.forEach(file => {
                    const filePath = path.join(folder, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                });

                if (deletedCount > 0) {
                    this.stats.mediaCleanups++;
                    console.log(`[OPTIMIZER] Membersihkan ${deletedCount} file media lama dari ${folder}`);
                }
            } catch (error) {
                console.error(`[OPTIMIZER] Gagal membersihkan media di ${folder}:`, error.message);
            }
        });
    }

    /**
     * Melakukan vacuum pada database SQLite
     */
    vacuumDatabase() {
        try {
            // Ini hanya placeholder, implementasi sebenarnya memerlukan koneksi database
            // Dalam implementasi nyata, Anda perlu mengakses instance database dan menjalankan VACUUM
            console.log('[OPTIMIZER] Database vacuum dijadwalkan');
            this.stats.dbVacuums++;
            
            // Contoh implementasi jika menggunakan sqlite3:
            // this.db.exec('VACUUM;', (err) => {
            //     if (err) {
            //         console.error('[OPTIMIZER] Gagal melakukan vacuum database:', err.message);
            //     } else {
            //         console.log('[OPTIMIZER] Database vacuum selesai');
            //     }
            // });
        } catch (error) {
            console.error('[OPTIMIZER] Gagal melakukan vacuum database:', error.message);
        }
    }

    /**
     * Pembersihan memori darurat saat penggunaan sangat tinggi
     */
    emergencyMemoryCleanup() {
        console.warn('[OPTIMIZER] Melakukan pembersihan memori darurat');
        
        // 1. Paksa garbage collection
        this.forceGC();
        
        // 2. Bersihkan cache jika ada
        if (global.cache && typeof global.cache.flushAll === 'function') {
            global.cache.flushAll();
            console.log('[OPTIMIZER] Cache dibersihkan');
        }
        
        // 3. Bersihkan media temporary
        this.cleanupMedia();
        
        // 4. Jika masih tinggi, pertimbangkan restart
        const memoryAfterCleanup = this.getMemoryUsage();
        if (memoryAfterCleanup.rss > this.config.memoryLimit * 1.5) {
            console.error(`[OPTIMIZER] Penggunaan memori masih sangat tinggi (${memoryAfterCleanup.rss}MB) setelah pembersihan darurat. Pertimbangkan untuk restart bot.`);
            
            // Jika auto-restart diaktifkan
            if (process.env.AUTO_RESTART_ENABLED === 'true') {
                console.log('[OPTIMIZER] Menjadwalkan restart dalam 30 detik...');
                setTimeout(() => {
                    console.log('[OPTIMIZER] Melakukan restart karena penggunaan memori tinggi...');
                    process.exit(1); // PM2 akan me-restart proses
                }, 30000);
            }
        }
    }

    /**
     * Menerapkan optimasi Node.js
     */
    applyNodeOptimizations() {
        // Mengatur ukuran heap maksimum jika belum diatur
        if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
            console.log('[OPTIMIZER] Mengatur ukuran heap maksimum ke 512MB');
            process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=512`;
        }
        
        // Nonaktifkan debugging
        process.env.NODE_ENV = 'production';
        
        // Optimasi V8
        // Catatan: Ini hanya berlaku untuk proses baru, tidak untuk proses yang sudah berjalan
        console.log('[OPTIMIZER] Optimasi Node.js diterapkan');
    }

    /**
     * Mendapatkan statistik optimizer
     * @returns {Object} Statistik optimizer
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            ...this.stats,
            uptime: `${days}d ${hours}h ${minutes}m`,
            currentMemory: this.getMemoryUsage(),
            config: this.config
        };
    }

    /**
     * Mendapatkan laporan optimasi untuk admin
     * @returns {String} Laporan optimasi dalam format string
     */
    getOptimizationReport() {
        const stats = this.getStats();
        const memory = stats.currentMemory;
        
        return `🔧 *Laporan Optimasi Resource*\n\n` +
               `⏱️ *Uptime:* ${stats.uptime}\n` +
               `💾 *Memory:* ${memory.rss}MB / ${memory.systemTotal}MB (${Math.round((memory.rss/memory.systemTotal)*100)}%)\n` +
               `🧹 *GC Calls:* ${stats.gcCalls}\n` +
               `🗑️ *Cleanups:* Logs: ${stats.logCleanups}, Media: ${stats.mediaCleanups}, DB: ${stats.dbVacuums}\n` +
               `⚠️ *Memory Warnings:* ${stats.memoryWarnings}\n` +
               `⚙️ *Memory Limit:* ${this.config.memoryLimit}MB\n` +
               `🔄 *GC Interval:* ${this.config.gcInterval/1000}s\n` +
               `📊 *Heap:* ${memory.heapUsed}MB / ${memory.heapTotal}MB`;
    }
}

// Export singleton instance
const optimizer = new ResourceOptimizer();
module.exports = optimizer;