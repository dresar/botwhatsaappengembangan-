# Panduan Instalasi Bot WhatsApp di VPS Ubuntu

Dokumen ini berisi panduan lengkap untuk menginstal dan menjalankan bot WhatsApp di VPS dengan sistem operasi Ubuntu.

## Daftar Isi
- [Persiapan VPS](#persiapan-vps)
- [Instalasi Dependensi](#instalasi-dependensi)
- [Instalasi Bot WhatsApp](#instalasi-bot-whatsapp)
- [Konfigurasi Bot](#konfigurasi-bot)
- [Menjalankan Bot dengan PM2](#menjalankan-bot-dengan-pm2)
- [Pemeliharaan](#pemeliharaan)
- [Troubleshooting](#troubleshooting)

## Persiapan VPS

### 1. Login ke VPS
```bash
ssh username@alamat_ip_vps
```

### 2. Update dan Upgrade Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Instalasi Paket Dasar
```bash
sudo apt install -y git curl wget build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 4. Atur Zona Waktu
```bash
sudo timedatectl set-timezone Asia/Jakarta
```

### 5. Konfigurasi Firewall (Opsional)
```bash
sudo apt install ufw -y
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

## Instalasi Dependensi

### 1. Instalasi Node.js dan NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Verifikasi instalasi Node.js
npm -v   # Verifikasi instalasi NPM
```

### 2. Instalasi PM2
```bash
sudo npm install -g pm2
```

### 3. Instalasi Dependensi Tambahan (jika diperlukan)
```bash
sudo apt install -y ffmpeg imagemagick
```

## Instalasi Bot WhatsApp

### 1. Buat Direktori untuk Bot
```bash
mkdir -p ~/botwa
cd ~/botwa
```

### 2. Clone Repository Bot
```bash
git clone https://github.com/username/repo-bot-wa.git .
# ATAU jika menggunakan repository lokal
# Upload file project ke server menggunakan SCP atau SFTP
```

### 3. Instalasi Dependensi Bot
```bash
npm install
```

## Konfigurasi Bot

### 1. Salin File Konfigurasi
```bash
cp .env.example .env
```

### 2. Edit File Konfigurasi
```bash
nano .env
```

Sesuaikan parameter berikut:
- `SESSION_ID`: Nama sesi WhatsApp
- `PREFIX`: Awalan perintah bot (misalnya: !)
- Dan parameter lainnya sesuai kebutuhan

## Menjalankan Bot dengan PM2

### 1. Menjalankan Bot untuk Pertama Kali
```bash
node app.js
```

Scan QR code yang muncul dengan aplikasi WhatsApp di ponsel Anda. Setelah berhasil, tekan CTRL+C untuk menghentikan bot.

### 2. Menjalankan Bot dengan PM2
```bash
pm2 start app.js --name "botwa"
```

### 3. Mengatur Bot Agar Berjalan Otomatis Saat Startup
```bash
pm2 save
pm2 startup
# Jalankan perintah yang ditampilkan oleh PM2
```

### 4. Perintah PM2 Lainnya
```bash
pm2 list                  # Melihat daftar aplikasi yang berjalan
pm2 logs                  # Melihat log semua aplikasi
pm2 logs botwa            # Melihat log aplikasi botwa
pm2 restart botwa         # Restart bot
pm2 stop botwa            # Menghentikan bot
pm2 delete botwa          # Menghapus bot dari daftar PM2
pm2 monit                 # Monitoring aplikasi
```

## Pemeliharaan

### 1. Update Bot
```bash
cd ~/botwa
git pull
npm install
pm2 restart botwa
```

### 2. Backup Data
```bash
# Backup file penting seperti database dan sesi
cp -r ~/botwa/bot_data.db ~/backup/
cp -r ~/botwa/session ~/backup/
```

## Troubleshooting

### 1. Bot Tidak Berjalan
Periksa log dengan perintah:
```bash
pm2 logs botwa
```

### 2. Masalah Koneksi WhatsApp
Jika bot terputus dari WhatsApp:
```bash
pm2 stop botwa
rm -rf ./session  # Hapus sesi lama
pm2 start botwa
# Scan QR code kembali
```

### 3. Update Sistem
Lakukan update sistem secara berkala:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Catatan Penting
- Pastikan VPS memiliki spesifikasi minimal: 1 CPU, 1GB RAM, dan 20GB penyimpanan
- Jangan menjalankan bot sebagai user root untuk alasan keamanan
- Lakukan backup data secara berkala
- Periksa log secara rutin untuk memantau kinerja bot

---

**Selamat! Bot WhatsApp Anda sekarang berjalan di VPS dengan PM2.**