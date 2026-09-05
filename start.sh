#!/bin/bash

# start.sh - Script untuk menjalankan WhatsApp Bot di VPS Ubuntu
# Optimized for 1 Core, 1GB RAM, 20GB Storage

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Tidak disarankan menjalankan bot sebagai root user"
    print_warning "Pertimbangkan untuk membuat user khusus untuk bot"
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_status "Starting WhatsApp Bot Optimized for VPS..."
print_status "Working directory: $SCRIPT_DIR"

# Check system resources
print_status "Checking system resources..."
TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
FREE_RAM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
CPU_CORES=$(nproc)
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')

print_status "System Info:"
echo "  - Total RAM: ${TOTAL_RAM}MB"
echo "  - Free RAM: ${FREE_RAM}MB"
echo "  - CPU Cores: ${CPU_CORES}"
echo "  - Disk Usage: ${DISK_USAGE}%"

# Check if we have enough RAM
if [ "$FREE_RAM" -lt 200 ]; then
    print_warning "RAM tersedia rendah (${FREE_RAM}MB). Bot mungkin tidak stabil."
    print_warning "Pertimbangkan untuk menambah swap atau menghentikan proses lain."
fi

# Check if disk usage is too high
if [ "$DISK_USAGE" -gt 85 ]; then
    print_warning "Penggunaan disk tinggi (${DISK_USAGE}%). Pertimbangkan untuk membersihkan file."
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js tidak terinstall. Silakan install Node.js 18 atau lebih baru."
    print_status "Untuk install Node.js:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version terlalu lama ($NODE_VERSION). Minimal Node.js 16."
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 tidak terinstall. Menginstall PM2..."
    npm install -g pm2
fi

print_success "PM2 version: $(pm2 --version)"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p qr_codes
mkdir -p media
mkdir -p temp
mkdir -p backups

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file tidak ditemukan. Menyalin dari .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Silakan edit file .env dan isi API keys yang diperlukan"
        print_warning "Minimal isi GEMINI_API_KEY dan SUPER_ADMIN"
    else
        print_error ".env.example tidak ditemukan. Buat file .env secara manual."
        exit 1
    fi
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json tidak ditemukan. Pastikan Anda berada di direktori yang benar."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install --production --no-optional
else
    print_status "Dependencies already installed. Checking for updates..."
    npm update --production --no-optional
fi

# Set memory optimization environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=512 --expose-gc"

# Check if we should use optimized version
USE_OPTIMIZED=${USE_OPTIMIZED:-true}
if [ "$USE_OPTIMIZED" = "true" ] && [ -f "app-optimized.js" ]; then
    APP_FILE="app-optimized.js"
    print_status "Using optimized version: $APP_FILE"
else
    APP_FILE="app.js"
    print_status "Using standard version: $APP_FILE"
fi

# Function to start bot with PM2
start_with_pm2() {
    print_status "Starting bot with PM2..."
    
    # Stop existing instance if running
    pm2 stop whatsapp-bot-optimized 2>/dev/null || true
    pm2 delete whatsapp-bot-optimized 2>/dev/null || true
    
    # Start with ecosystem config if exists, otherwise use direct command
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env production
    else
        pm2 start "$APP_FILE" --name "whatsapp-bot-optimized" \
            --max-memory-restart 400M \
            --node-args="--max-old-space-size=512 --expose-gc" \
            --log-file "./logs/combined.log" \
            --error-file "./logs/error.log" \
            --out-file "./logs/out.log" \
            --time
    fi
    
    # Save PM2 configuration
    pm2 save
    
    print_success "Bot started with PM2"
    print_status "Use 'pm2 status' to check bot status"
    print_status "Use 'pm2 logs whatsapp-bot-optimized' to view logs"
    print_status "Use 'pm2 monit' to monitor resources"
}

# Function to start bot directly (for development)
start_direct() {
    print_status "Starting bot directly..."
    print_warning "This is for development only. Use PM2 for production."
    
    # Set memory limit
    export NODE_OPTIONS="--max-old-space-size=512 --expose-gc"
    
    # Start bot
    node "$APP_FILE"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --pm2          Start with PM2 (recommended for production)"
    echo "  --direct       Start directly (for development)"
    echo "  --stop         Stop bot"
    echo "  --restart      Restart bot"
    echo "  --status       Show bot status"
    echo "  --logs         Show bot logs"
    echo "  --monitor      Monitor bot resources"
    echo "  --cleanup      Cleanup old files"
    echo "  --help         Show this help"
    echo ""
    echo "Environment variables:"
    echo "  USE_OPTIMIZED=true   Use app-optimized.js (default)"
    echo "  USE_OPTIMIZED=false  Use app.js"
}

# Function to stop bot
stop_bot() {
    print_status "Stopping bot..."
    pm2 stop whatsapp-bot-optimized 2>/dev/null || print_warning "Bot not running"
    print_success "Bot stopped"
}

# Function to restart bot
restart_bot() {
    print_status "Restarting bot..."
    pm2 restart whatsapp-bot-optimized 2>/dev/null || {
        print_warning "Bot not running. Starting new instance..."
        start_with_pm2
    }
    print_success "Bot restarted"
}

# Function to show status
show_status() {
    print_status "Bot status:"
    pm2 status whatsapp-bot-optimized 2>/dev/null || print_warning "Bot not running"
    
    print_status "System resources:"
    echo "Memory usage:"
    free -h
    echo ""
    echo "Disk usage:"
    df -h .
}

# Function to show logs
show_logs() {
    print_status "Showing bot logs (press Ctrl+C to exit):"
    pm2 logs whatsapp-bot-optimized --lines 50
}

# Function to monitor resources
monitor_resources() {
    print_status "Monitoring bot resources (press Ctrl+C to exit):"
    pm2 monit
}

# Function to cleanup old files
cleanup_files() {
    print_status "Cleaning up old files..."
    
    # Cleanup logs older than 7 days
    find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Cleanup QR codes older than 1 day
    find qr_codes/ -name "*.png" -mtime +1 -delete 2>/dev/null || true
    
    # Cleanup temp files older than 1 day
    find temp/ -type f -mtime +1 -delete 2>/dev/null || true
    
    # Cleanup media files older than 3 days
    find media/ -type f -mtime +3 -delete 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Parse command line arguments
case "${1:-}" in
    --pm2)
        start_with_pm2
        ;;
    --direct)
        start_direct
        ;;
    --stop)
        stop_bot
        ;;
    --restart)
        restart_bot
        ;;
    --status)
        show_status
        ;;
    --logs)
        show_logs
        ;;
    --monitor)
        monitor_resources
        ;;
    --cleanup)
        cleanup_files
        ;;
    --help)
        show_help
        ;;
    "")
        # Default action: start with PM2
        start_with_pm2
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

print_success "Script completed successfully"