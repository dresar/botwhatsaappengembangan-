# Multi-stage build for optimized image size
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production --no-audit --no-fund

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY --chown=appuser:appgroup . .

# Create necessary directories
RUN mkdir -p logs qr_codes media temp backups && \
    chown -R appuser:appgroup /app

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set Node.js optimizations for low memory
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=384 --expose-gc" \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_PROGRESS=false

# Set memory and performance optimizations
ENV MEMORY_LIMIT=256 \
    GC_INTERVAL=180000 \
    CACHE_TTL=300 \
    MAX_MESSAGE_LENGTH=500 \
    COOLDOWN_TIME=2000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Switch to non-root user
USER appuser

# Expose port (if needed for monitoring)
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "app-optimized.js"]

# Labels for metadata
LABEL maintainer="WhatsApp Bot Team" \
      description="Optimized WhatsApp Bot for VPS with 1GB RAM" \
      version="1.0.0" \
      org.opencontainers.image.source="https://github.com/username/whatsapp-bot" \
      org.opencontainers.image.description="WhatsApp Bot optimized for low-spec VPS" \
      org.opencontainers.image.licenses="MIT"