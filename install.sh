#!/bin/bash

# install.sh - Script instalasi WhatsApp Bot untuk VPS Debian 12
# Optimized for 1 Core, 1GB RAM, 20GB Storage
# Compatible dengan Debian 12 (Bookworm)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

print_debian() {
    echo -e "${PURPLE}[DEBIAN 12]${NC} $1"
}

# Print banner
print_banner() {
    echo -e "${PURPLE}"
    echo "================================================="
    echo "    WhatsApp Bot VPS Installer (Optimized)    "
    echo "    For Debian 12 with 1GB RAM, 1 Core, 20GB  "
    echo "================================================="
    echo -e "${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Script berjalan sebagai root"
        print_warning "Beberapa operasi akan dilakukan dengan sudo"
    fi
}

# Check Debian version
check_debian() {
    if [ ! -f /etc/os-release ]; then
        print_error "Tidak dapat mendeteksi OS. Script ini untuk Debian 12."
        exit 1
    fi
    
    . /etc/os-release
    
    if [ "$ID" != "debian" ]; then
        print_error "Script ini hanya untuk Debian 12. OS terdeteksi: $ID"
        exit 1
    fi
    
    # Check Debian version specifically
    if [[ "$VERSION_ID" != "12" ]]; then
        print_warning "Script ini dioptimalkan untuk Debian 12. Versi saat ini: $VERSION_ID"
    else
        print_debian "Debian 12 (Bookworm) terdeteksi - Perfect!"
    fi
    
    print_success "Debian $VERSION_ID terdeteksi"
}

# Check system resources
check_resources() {
    print_header "Checking System Resources"
    
    # Check RAM
    TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    FREE_RAM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    
    print_status "Total RAM: ${TOTAL_RAM}MB"
    print_status "Free RAM: ${FREE_RAM}MB"
    
    if [ "$TOTAL_RAM" -lt 900 ]; then
        print_warning "RAM total kurang dari 1GB (${TOTAL_RAM}MB). Bot mungkin tidak stabil."
    fi
    
    # Check CPU
    CPU_CORES=$(nproc)
    print_status "CPU Cores: ${CPU_CORES}"
    
    # Check disk space
    DISK_AVAIL=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    print_status "Available disk space: ${DISK_AVAIL}GB"
    
    if [ "$DISK_AVAIL" -lt 5 ]; then
        print_error "Disk space tidak cukup (${DISK_AVAIL}GB). Minimal 5GB diperlukan."
        exit 1
    fi
    
    print_success "System resources check passed"
}

# Update system
update_system() {
    print_header "Updating System"
    
    print_status "Updating package list..."
    sudo apt update
    
    print_status "Upgrading packages..."
    sudo apt upgrade -y
    
    print_success "System updated"
}

# Install basic dependencies untuk Debian 12
install_dependencies() {
    print_header "Installing Dependencies for Debian 12"
    
    print_status "Installing basic packages..."
    sudo apt install -y \
        curl \
        wget \
        git \
        build-essential \
        python3 \
        python3-pip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        unzip \
        htop \
        nano \
        vim \
        screen \
        tmux
    
    # Install additional fonts untuk emoji support
    print_status "Installing additional fonts..."
    sudo apt install -y \
        fonts-noto \
        fonts-noto-cjk \
        fonts-noto-extra \
        fonts-noto-color-emoji \
        fonts-dejavu-core \
        fonts-freefont-ttf \
        fonts-symbola
    
    print_success "Basic dependencies installed for Debian 12"
}

# Setup swap file untuk Debian 12
setup_swap() {
    print_header "Setting Up Swap File for Debian 12"
    
    # Check current memory
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    print_status "Current memory: ${TOTAL_MEM}MB"
    
    # Check if swap already exists
    if swapon --show | grep -q '/swapfile'; then
        CURRENT_SWAP=$(swapon --show --noheadings | awk '{print $3}' | head -1)
        print_success "Swap file already exists: $CURRENT_SWAP"
        return
    fi
    
    # Determine swap size based on memory
    if [ "$TOTAL_MEM" -lt 1000 ]; then
        SWAP_SIZE="1G"
        print_status "Low memory detected, creating 1GB swap..."
    elif [ "$TOTAL_MEM" -lt 2000 ]; then
        SWAP_SIZE="1G"
        print_status "Creating 1GB swap for optimal performance..."
    else
        SWAP_SIZE="512M"
        print_status "Creating 512MB swap..."
    fi
    
    # Create swap file
    print_status "Creating ${SWAP_SIZE} swap file..."
    sudo fallocate -l $SWAP_SIZE /swapfile || {
        print_warning "fallocate failed, using dd instead..."
        sudo dd if=/dev/zero of=/swapfile bs=1M count=1024 status=progress
    }
    
    # Set proper permissions
    sudo chmod 600 /swapfile
    
    # Setup swap
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Make swap permanent
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    # Optimize swap settings untuk Debian 12
    print_status "Optimizing swap settings for Debian 12..."
    
    # Remove old settings if exist
    sudo sed -i '/vm.swappiness/d' /etc/sysctl.conf
    sudo sed -i '/vm.vfs_cache_pressure/d' /etc/sysctl.conf
    sudo sed -i '/vm.dirty_ratio/d' /etc/sysctl.conf
    sudo sed -i '/vm.dirty_background_ratio/d' /etc/sysctl.conf
    
    # Add optimized settings
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
    echo 'vm.dirty_ratio=15' | sudo tee -a /etc/sysctl.conf
    echo 'vm.dirty_background_ratio=5' | sudo tee -a /etc/sysctl.conf
    
    # Apply settings immediately
    sudo sysctl -p
    
    # Verify swap
    SWAP_TOTAL=$(free -h | awk 'NR==3{print $2}')
    print_success "Swap file created and configured: $SWAP_TOTAL"
    
    # Show current memory status
    print_status "Current memory status:"
    free -h
}

# Install Node.js 20 untuk Debian 12
install_nodejs() {
    print_header "Installing Node.js 20 for Debian 12"
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 20 ]; then
            print_success "Node.js $(node --version) already installed"
            return
        else
            print_warning "Node.js version too old ($(node --version)). Updating..."
        fi
    fi
    
    # Remove any existing Node.js
    print_status "Removing any existing Node.js..."
    sudo apt remove -y nodejs npm || true
    
    # Add NodeSource repository untuk Node.js 20
    print_debian "Adding NodeSource repository for Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    
    # Install Node.js 20
    print_status "Installing Node.js 20..."
    sudo apt-get install -y nodejs
    
    # Verify installation
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        print_success "Node.js installed: $NODE_VERSION"
        print_success "npm installed: $NPM_VERSION"
        
        # Update npm to latest version
        print_status "Updating npm to latest version..."
        sudo npm install -g npm@latest
        
        # Optimize npm for Debian 12
        print_status "Optimizing npm configuration..."
        npm config set fund false
        npm config set audit false
        npm config set progress false
        
        print_success "Node.js 20 installation completed for Debian 12"
    else
        print_error "Node.js installation failed"
        exit 1
    fi
}

# Install PM2
install_pm2() {
    print_header "Installing PM2"
    
    if command -v pm2 &> /dev/null; then
        print_success "PM2 $(pm2 --version) already installed"
        return
    fi
    
    print_status "Installing PM2 globally..."
    sudo npm install -g pm2
    
    # Setup PM2 startup
    print_status "Setting up PM2 startup..."
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
    
    print_success "PM2 installed and configured"
}

# Install Puppeteer dependencies untuk Debian 12
install_puppeteer_deps() {
    print_header "Installing Puppeteer Dependencies for Debian 12"
    
    # Install Chromium dan dependencies
    print_debian "Installing Chromium and core dependencies..."
    sudo apt install -y \
        chromium \
        chromium-driver \
        chromium-sandbox
    
    # Install library dependencies
    print_status "Installing library dependencies..."
    sudo apt install -y \
        fonts-liberation \
        fonts-dejavu-core \
        fonts-freefont-ttf \
        fonts-noto-color-emoji \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libatspi2.0-0 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libx11-xcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libxss1 \
        libxtst6 \
        xdg-utils \
        libu2f-udev \
        libvulkan1
    
    # Install additional dependencies untuk Debian 12
    print_status "Installing additional Debian 12 dependencies..."
    sudo apt install -y \
        libgbm1 \
        libxkbcommon0 \
        libwayland-client0 \
        libwayland-server0 \
        libegl1-mesa \
        libgl1-mesa-glx
    
    # Set Chromium path untuk Puppeteer di Debian 12
    CHROMIUM_PATH="/usr/bin/chromium"
    if [ -f "$CHROMIUM_PATH" ]; then
        export PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH
        echo "export PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH" >> ~/.bashrc
        print_success "Chromium path set: $CHROMIUM_PATH"
    else
        print_error "Chromium not found at expected path: $CHROMIUM_PATH"
        exit 1
    fi
    
    # Test Chromium installation
    print_status "Testing Chromium installation..."
    if $CHROMIUM_PATH --version &> /dev/null; then
        CHROMIUM_VERSION=$($CHROMIUM_PATH --version)
        print_success "Chromium test passed: $CHROMIUM_VERSION"
    else
        print_warning "Chromium test failed, but continuing..."
    fi
    
    # Set additional environment variables untuk Debian 12
    echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc
    echo "export PUPPETEER_CACHE_DIR=/tmp/.puppeteer_cache" >> ~/.bashrc
    
    print_success "Puppeteer dependencies installed for Debian 12"
}

# Create bot user (optional)
create_bot_user() {
    print_header "Creating Bot User (Optional)"
    
    read -p "Create dedicated user for bot? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter username for bot (default: botuser): " BOT_USER
        BOT_USER=${BOT_USER:-botuser}
        
        if id "$BOT_USER" &>/dev/null; then
            print_warning "User $BOT_USER already exists"
        else
            print_status "Creating user $BOT_USER..."
            sudo useradd -m -s /bin/bash "$BOT_USER"
            sudo usermod -aG sudo "$BOT_USER"
            print_success "User $BOT_USER created"
        fi
        
        print_status "To switch to bot user: sudo su - $BOT_USER"
    else
        print_status "Continuing with current user: $USER"
    fi
}

# Setup bot directory
setup_bot_directory() {
    print_header "Setting Up Bot Directory"
    
    read -p "Enter bot directory path (default: ~/whatsapp-bot): " BOT_DIR
    BOT_DIR=${BOT_DIR:-~/whatsapp-bot}
    
    # Expand tilde
    BOT_DIR=$(eval echo "$BOT_DIR")
    
    if [ -d "$BOT_DIR" ]; then
        print_warning "Directory $BOT_DIR already exists"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Installation cancelled"
            exit 1
        fi
    else
        print_status "Creating directory $BOT_DIR..."
        mkdir -p "$BOT_DIR"
    fi
    
    cd "$BOT_DIR"
    print_success "Working directory: $(pwd)"
    
    # Create subdirectories
    print_status "Creating subdirectories..."
    mkdir -p logs qr_codes media temp backups
    
    export BOT_DIR
}

# Clone or copy bot files
setup_bot_files() {
    print_header "Setting Up Bot Files"
    
    read -p "Do you want to clone from Git repository? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter Git repository URL: " GIT_REPO
        if [ -n "$GIT_REPO" ]; then
            print_status "Cloning repository..."
            git clone "$GIT_REPO" .
            print_success "Repository cloned"
        else
            print_error "No repository URL provided"
            exit 1
        fi
    else
        print_warning "Please copy your bot files to: $BOT_DIR"
        print_warning "Required files: package.json, app.js (or app-optimized.js), config.js, etc."
        read -p "Press Enter when files are ready..." -r
    fi
}

# Install bot dependencies
install_bot_dependencies() {
    print_header "Installing Bot Dependencies"
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please ensure bot files are in place."
        exit 1
    fi
    
    print_status "Installing Node.js dependencies..."
    npm install --production --no-optional
    
    print_success "Bot dependencies installed"
}

# Setup environment file
setup_environment() {
    print_header "Setting Up Environment"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_status "Copying .env.example to .env..."
            cp .env.example .env
        else
            print_status "Creating basic .env file..."
            cat > .env << EOF
# WhatsApp Bot Environment Configuration
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=512

# Bot Configuration
BOT_NAME=WhatsApp Bot VPS
BOT_PREFIX=/

# Admin Configuration (REQUIRED)
SUPER_ADMIN=628123456789

# AI Configuration (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DB_PATH=./bot_data.db

# Performance Settings
MEMORY_LIMIT=256
GC_INTERVAL=180000
CACHE_TTL=300

# Monitoring
MEMORY_WARNING_THRESHOLD=350
MEMORY_CRITICAL_THRESHOLD=400
AUTO_RESTART_ENABLED=true
EOF
        fi
        
        print_success ".env file created"
    else
        print_warning ".env file already exists"
    fi
    
    print_warning "IMPORTANT: Edit .env file and configure:"
    echo "  - SUPER_ADMIN: Your WhatsApp number (format: 628123456789)"
    echo "  - GEMINI_API_KEY: Your Google Gemini API key"
    echo "  - Other settings as needed"
    
    read -p "Open .env file for editing now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env
    fi
}

# Setup systemd service (alternative to PM2)
setup_systemd_service() {
    print_header "Setting Up Systemd Service (Optional)"
    
    read -p "Create systemd service? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SERVICE_NAME="whatsapp-bot"
        SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
        
        print_status "Creating systemd service..."
        
        sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=WhatsApp Bot Optimized
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BOT_DIR
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/node app-optimized.js
Restart=always
RestartSec=10
KillMode=process
TimeoutSec=300
TimeoutStopSec=300
KillSignal=SIGINT

# Resource limits
MemoryMax=500M
MemoryHigh=400M

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=whatsapp-bot

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable "$SERVICE_NAME"
        
        print_success "Systemd service created: $SERVICE_NAME"
        print_status "Use 'sudo systemctl start $SERVICE_NAME' to start"
        print_status "Use 'sudo systemctl status $SERVICE_NAME' to check status"
    fi
}

# Setup firewall
setup_firewall() {
    print_header "Setting Up Firewall (Optional)"
    
    if command -v ufw &> /dev/null; then
        read -p "Configure UFW firewall? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Configuring UFW..."
            sudo ufw --force enable
            sudo ufw default deny incoming
            sudo ufw default allow outgoing
            sudo ufw allow ssh
            
            print_success "UFW firewall configured"
        fi
    else
        print_warning "UFW not installed. Consider installing: sudo apt install ufw"
    fi
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting Up Monitoring"
    
    # Create monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script

echo "=== WhatsApp Bot Status ==="
echo "Date: $(date)"
echo ""

echo "=== PM2 Status ==="
pm2 status 2>/dev/null || echo "PM2 not running"
echo ""

echo "=== Memory Usage ==="
free -h
echo ""

echo "=== Disk Usage ==="
df -h .
echo ""

echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
echo ""

echo "=== Bot Logs (last 10 lines) ==="
tail -n 10 logs/combined.log 2>/dev/null || echo "No logs found"
EOF
    
    chmod +x monitor.sh
    
    print_success "Monitoring script created: ./monitor.sh"
}

# Final setup
final_setup() {
    print_header "Final Setup"
    
    # Make scripts executable
    if [ -f "start.sh" ]; then
        chmod +x start.sh
        print_success "start.sh made executable"
    fi
    
    if [ -f "deploy.sh" ]; then
        chmod +x deploy.sh
        print_success "deploy.sh made executable"
    fi
    
    # Set proper permissions
    chmod 755 .
    chmod -R 755 logs qr_codes media temp backups 2>/dev/null || true
    
    print_success "Permissions set"
}

# Show completion message
show_completion() {
    print_header "Installation Complete!"
    
    echo -e "${GREEN}"
    echo "================================================="
    echo "    WhatsApp Bot Installation Completed!       "
    echo "================================================="
    echo -e "${NC}"
    
    echo "Next steps:"
    echo "1. Edit .env file and configure API keys:"
    echo "   nano .env"
    echo ""
    echo "2. Start the bot:"
    echo "   ./start.sh --pm2"
    echo ""
    echo "3. Monitor the bot:"
    echo "   pm2 status"
    echo "   pm2 logs whatsapp-bot-optimized"
    echo "   ./monitor.sh"
    echo ""
    echo "4. Useful commands:"
    echo "   ./start.sh --status    # Check status"
    echo "   ./start.sh --restart   # Restart bot"
    echo "   ./start.sh --stop      # Stop bot"
    echo "   ./start.sh --cleanup   # Cleanup files"
    echo ""
    echo "Bot directory: $BOT_DIR"
    echo "Log files: $BOT_DIR/logs/"
    echo ""
    print_warning "Remember to configure .env file before starting!"
}

# Main installation function untuk Debian 12
main() {
    print_banner
    
    # System checks
    print_debian "Starting WhatsApp Bot installation for Debian 12..."
    check_root
    check_debian
    check_resources
    
    # System updates and core installations
    update_system
    install_dependencies
    setup_swap
    install_nodejs
    install_pm2
    install_puppeteer_deps
    
    # Bot setup
    create_bot_user
    setup_bot_directory
    setup_bot_files
    install_bot_dependencies
    setup_environment
    
    # Final configuration
    setup_systemd_service
    setup_firewall
    setup_monitoring
    final_setup
    
    # Show completion status
    show_completion
    
    # Show final status for Debian 12
    show_final_status
}

# Show final installation status
show_final_status() {
    echo
    print_success "🎉 Installation completed successfully for Debian 12!"
    echo
    print_debian "Bot Status:"
    pm2 status 2>/dev/null || echo "PM2 not running yet"
    echo
    print_status "📊 System Resources:"
    free -h
    echo
    print_status "💾 Disk Usage:"
    df -h /
    echo
    print_status "🔧 Useful Commands:"
    echo "  • Check bot status: pm2 status"
    echo "  • View bot logs: pm2 logs whatsapp-bot"
    echo "  • Restart bot: pm2 restart whatsapp-bot"
    echo "  • Stop bot: pm2 stop whatsapp-bot"
    echo "  • Monitor resources: htop"
    echo "  • Check memory: free -h"
    echo "  • Check swap: swapon --show"
    echo
    print_success "🐧 Bot is now ready to run optimally on Debian 12!"
    print_status "📱 Configure .env file and start the bot to scan QR code."
    echo
}

# Run main function
main "$@"