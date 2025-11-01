# Triple Captain - Production Deployment Guide

## Overview

Complete production deployment guide for **triplecaptain.in** using Hetzner server, GoDaddy domain, and GitHub Actions CI/CD.

---

## Your Infrastructure

- **Domain**: triplecaptain.in (GoDaddy)
- **Server**: Hetzner VPS
- **CI/CD**: GitHub Actions
- **Stack**: Next.js 15, Docker, Nginx, Let's Encrypt SSL

---

## Architecture

```
GitHub Repository (feature/m3-polish → main)
    ↓
GitHub Actions CI/CD
    ├─ TypeScript check
    ├─ ESLint
    ├─ Build Next.js app
    ├─ Build Docker image
    ├─ Push to GHCR (GitHub Container Registry)
    └─ Deploy to Hetzner
        ↓
Hetzner Server (Ubuntu 22.04)
    ├─ Docker (runs Next.js container)
    ├─ Nginx (reverse proxy, SSL termination)
    └─ Let's Encrypt (SSL certificates)
        ↓
triplecaptain.in (HTTPS)
```

---

## Phase 1: DNS Setup (GoDaddy)

### Step 1: Get Hetzner Server IP

```bash
# SSH to your Hetzner server to get IP
ssh root@your-hetzner-ip

# Note your public IP address
curl ifconfig.me
```

### Step 2: Configure DNS on GoDaddy

1. Log in to [GoDaddy](https://dcc.godaddy.com/domains)
2. Select `triplecaptain.in` → Manage DNS
3. Add/Edit A Records:

```
Type    Name    Value               TTL
A       @       YOUR_HETZNER_IP     600
A       www     YOUR_HETZNER_IP     600
```

4. Remove any default parked domain records
5. Wait 5-10 minutes for DNS propagation

### Verify DNS:
```bash
# On your local machine
dig triplecaptain.in
dig www.triplecaptain.in

# Both should return your Hetzner IP
```

---

## Phase 2: Hetzner Server Setup

### Step 1: Initial Server Hardening

```bash
# SSH as root
ssh root@YOUR_HETZNER_IP

# Update system
apt update && apt upgrade -y

# Create deployment user
adduser deploy
usermod -aG sudo deploy

# Set up SSH key authentication
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Copy your public key (from local machine)
# Local: cat ~/.ssh/id_ed25519.pub
# Then paste it to server:
nano /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Disable root login and password auth
nano /etc/ssh/sshd_config
```

Update these lines in `sshd_config`:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
# Restart SSH
systemctl restart sshd

# Test new user (from local machine)
ssh deploy@YOUR_HETZNER_IP
```

### Step 2: Install Docker

```bash
# Switch to deploy user
su - deploy

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker deploy

# Re-login to apply group changes
exit
ssh deploy@YOUR_HETZNER_IP

# Verify Docker
docker --version

# Install Docker Compose
sudo apt install docker-compose-plugin -y
docker compose version
```

### Step 3: Install Nginx

```bash
# Install Nginx
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Verify Nginx
curl http://localhost
```

### Step 4: Set up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate for your domain
sudo certbot --nginx -d triplecaptain.in -d www.triplecaptain.in

# Follow prompts:
# - Enter email for renewal notifications
# - Agree to terms
# - Choose option 2 (redirect HTTP to HTTPS)

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Step 5: Create Deployment Directory

```bash
# Create app directory
mkdir -p /home/deploy/triple-captain
cd /home/deploy/triple-captain

# Create environment file
nano .env.production
```

Add to `.env.production`:
```bash
NODE_ENV=production
PORT=3000
```

---

## Phase 3: Nginx Configuration

### Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/triplecaptain
```

Paste this configuration:

```nginx
# Upstream to Next.js app
upstream triple_captain_app {
    server 127.0.0.1:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name triplecaptain.in www.triplecaptain.in;
    return 301 https://triplecaptain.in$request_uri;
}

# Redirect www to non-www
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.triplecaptain.in;

    ssl_certificate /etc/letsencrypt/live/triplecaptain.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/triplecaptain.in/privkey.pem;

    return 301 https://triplecaptain.in$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name triplecaptain.in;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/triplecaptain.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/triplecaptain.in/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/triplecaptain.in/chain.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Max upload size
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/triplecaptain.access.log;
    error_log /var/log/nginx/triplecaptain.error.log;

    # Proxy to Next.js
    location / {
        proxy_pass http://triple_captain_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Cache Next.js static files
    location /_next/static {
        proxy_pass http://triple_captain_app;
        proxy_cache_valid 200 60d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://triple_captain_app;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/triplecaptain /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Phase 4: Docker Setup

### Create Dockerfile

```bash
# On your local machine, in project root
nano Dockerfile
```

```dockerfile
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js app (standalone output)
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Create .dockerignore

```bash
nano .dockerignore
```

```
node_modules
.next
.git
.github
.vscode
*.md
.env.local
.env*.local
Dockerfile
.dockerignore
README.md
DEPLOYMENT_PLAN.md
theme.md
```

### Update next.config.ts for Standalone

```bash
nano next.config.ts
```

Ensure it has:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Add this line
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "resources.premierleague.com",
        pathname: "/premierleague/photos/players/**",
      },
    ],
  },
};

export default nextConfig;
```

---

## Phase 5: GitHub Actions CI/CD

### Step 1: Generate Deployment SSH Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Add public key to Hetzner server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@YOUR_HETZNER_IP

# Verify
ssh -i ~/.ssh/github_deploy_key deploy@YOUR_HETZNER_IP
```

### Step 2: Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/triple-captain/settings/secrets/actions`

Add these secrets:

```
SECRET NAME              VALUE
-----------------        ----------------------------------------
SERVER_HOST              YOUR_HETZNER_IP_ADDRESS
SERVER_USER              deploy
SERVER_SSH_KEY           (paste content of ~/.ssh/github_deploy_key - PRIVATE KEY)
GHCR_TOKEN               (GitHub Personal Access Token - see below)
```

**To create GHCR_TOKEN:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Select scopes: `write:packages`, `read:packages`, `delete:packages`
4. Copy token and save as `GHCR_TOKEN` secret

### Step 3: Create GitHub Actions Workflow

```bash
mkdir -p .github/workflows
nano .github/workflows/deploy.yml
```

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript check
        run: pnpm typecheck

      - name: ESLint check
        run: pnpm lint

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix={{branch}}-
            type=raw,value=latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Deploy to Hetzner server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            # Login to GitHub Container Registry
            echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin

            # Navigate to app directory
            cd /home/deploy/triple-captain

            # Pull new image
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

            # Stop old container
            docker stop triple-captain || true
            docker rm triple-captain || true

            # Start new container
            docker run -d \
              --name triple-captain \
              --restart unless-stopped \
              -p 3000:3000 \
              --env-file .env.production \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

            # Wait for app to start
            sleep 5

            # Health check
            curl -f http://localhost:3000 || exit 1

            # Cleanup old images
            docker image prune -af --filter "until=24h"

      - name: Notify success
        if: success()
        run: |
          echo "🚀 Deployment successful!"
          echo "Visit: https://triplecaptain.in"

      - name: Notify failure
        if: failure()
        run: |
          echo "❌ Deployment failed!"
          exit 1
```

---

## Phase 6: Deployment Script (Optional - Advanced)

For zero-downtime blue-green deployment:

```bash
# On Hetzner server
nano /home/deploy/deploy.sh
```

```bash
#!/bin/bash
set -e

IMAGE="ghcr.io/YOUR_GITHUB_USERNAME/triple-captain:latest"
CONTAINER_NAME="triple-captain"
PORT_BLUE=3000
PORT_GREEN=3001

echo "🚀 Starting deployment..."

# Determine which port is currently active
CURRENT_PORT=$(docker port $CONTAINER_NAME 3000 2>/dev/null | cut -d':' -f2 || echo $PORT_BLUE)

if [ "$CURRENT_PORT" == "$PORT_BLUE" ]; then
    NEW_PORT=$PORT_GREEN
    OLD_PORT=$PORT_BLUE
else
    NEW_PORT=$PORT_BLUE
    OLD_PORT=$PORT_GREEN
fi

echo "📦 Pulling latest image..."
docker pull $IMAGE

echo "🟢 Starting new container on port $NEW_PORT..."
docker run -d \
    --name "${CONTAINER_NAME}-new" \
    -p $NEW_PORT:3000 \
    --env-file /home/deploy/triple-captain/.env.production \
    $IMAGE

echo "⏳ Waiting for new container to be healthy..."
sleep 5

# Health check
if curl -f http://localhost:$NEW_PORT > /dev/null 2>&1; then
    echo "✅ Health check passed!"

    # Update Nginx upstream
    echo "🔄 Switching Nginx to new container..."
    sudo sed -i "s/server 127.0.0.1:$OLD_PORT/server 127.0.0.1:$NEW_PORT/" /etc/nginx/sites-available/triplecaptain
    sudo nginx -t && sudo systemctl reload nginx

    echo "🛑 Stopping old container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true

    echo "✨ Renaming new container..."
    docker rename "${CONTAINER_NAME}-new" $CONTAINER_NAME

    echo "🧹 Cleaning up old images..."
    docker image prune -af --filter "until=24h"

    echo "✅ Deployment complete!"
else
    echo "❌ Health check failed! Rolling back..."
    docker stop "${CONTAINER_NAME}-new"
    docker rm "${CONTAINER_NAME}-new"
    exit 1
fi
```

```bash
chmod +x /home/deploy/deploy.sh
```

---

## Phase 7: First Deployment

### Step 1: Commit Deployment Files

```bash
# On local machine
git add Dockerfile .dockerignore .github/workflows/deploy.yml next.config.ts
git commit -m "chore: add production deployment configuration"
git push origin feature/m3-polish
```

### Step 2: Merge to Main

```bash
# Create PR and merge to main
# Or merge directly:
git checkout main
git merge feature/m3-polish
git push origin main
```

### Step 3: Monitor Deployment

1. Go to GitHub → Actions tab
2. Watch the "Deploy to Production" workflow
3. Monitor logs for each step
4. Verify at: https://triplecaptain.in

### Step 4: Verify Deployment

```bash
# Check Docker container
ssh deploy@YOUR_HETZNER_IP
docker ps

# Check logs
docker logs triple-captain

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/triplecaptain.access.log

# Test locally
curl http://localhost:3000
curl https://triplecaptain.in
```

---

## Monitoring & Maintenance

### Health Check Endpoint

Create health check:

```bash
mkdir -p app/api/health
nano app/api/health/route.ts
```

```typescript
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
}
```

### Uptime Monitoring

1. Sign up for [UptimeRobot](https://uptimerobot.com) (free)
2. Add monitor:
   - Type: HTTPS
   - URL: https://triplecaptain.in/api/health
   - Interval: 5 minutes
3. Set up email/SMS alerts

### Log Management

```bash
# View Nginx logs
sudo tail -f /var/log/nginx/triplecaptain.access.log
sudo tail -f /var/log/nginx/triplecaptain.error.log

# View Docker logs
docker logs -f triple-captain

# View last 100 lines
docker logs --tail 100 triple-captain
```

### Backup Strategy

```bash
# Backup Nginx config
sudo cp /etc/nginx/sites-available/triplecaptain ~/backups/nginx-$(date +%Y%m%d).conf

# Backup environment file
cp /home/deploy/triple-captain/.env.production ~/backups/env-$(date +%Y%m%d)
```

---

## Rollback Procedure

### Quick Rollback (If Deployment Fails)

```bash
# SSH to server
ssh deploy@YOUR_HETZNER_IP

# Stop current container
docker stop triple-captain
docker rm triple-captain

# Start previous version (Docker keeps old images)
docker run -d \
  --name triple-captain \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /home/deploy/triple-captain/.env.production \
  ghcr.io/YOUR_GITHUB_USERNAME/triple-captain:main-PREVIOUS_SHA

# Or restore from backup
docker start triple-captain-backup
```

### GitHub Actions Re-run

1. Go to GitHub Actions
2. Find the last successful deployment
3. Click "Re-run all jobs"

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs triple-captain

# Check if port is in use
sudo lsof -i :3000

# Check environment
docker exec triple-captain env
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
docker ps
curl http://localhost:3000

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/triplecaptain.error.log
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# Check certificate
sudo certbot certificates
```

### DNS Not Resolving

```bash
# Check DNS propagation
dig triplecaptain.in
nslookup triplecaptain.in

# Try from different DNS
dig @8.8.8.8 triplecaptain.in
```

---

## Cost Breakdown

### Monthly Costs
- **Hetzner CX22**: €4.51/month (~$5)
- **Domain (GoDaddy)**: ~$15/year (~$1.25/month)
- **SSL Certificate**: Free (Let's Encrypt)
- **GitHub Actions**: Free (2000 minutes/month)

**Total**: ~$6.25/month 🎉

---

## Security Checklist

- ✅ SSH key-based authentication only
- ✅ Root login disabled
- ✅ UFW firewall enabled
- ✅ SSL/TLS with Let's Encrypt
- ✅ HSTS enabled
- ✅ Security headers configured
- ✅ Non-root Docker user
- ✅ GitHub secrets for sensitive data
- ✅ Automated SSL renewal
- ✅ Regular system updates

---

## Performance Optimization

### Enable Cloudflare (Optional)

1. Sign up at [Cloudflare](https://cloudflare.com)
2. Add site: triplecaptain.in
3. Update GoDaddy nameservers to Cloudflare's
4. Enable:
   - Always Use HTTPS
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - HTTP/3
5. Free CDN + DDoS protection!

---

## Next Steps

### Immediate
1. ✅ Set up DNS on GoDaddy
2. ✅ Configure Hetzner server
3. ✅ Install Docker, Nginx, SSL
4. ✅ Add GitHub secrets
5. ✅ Push to main and deploy

### Short-term
1. Set up UptimeRobot monitoring
2. Configure error tracking (Sentry)
3. Set up automated backups
4. Add analytics (Plausible/Umami)

### Long-term
1. Consider Cloudflare CDN
2. Add database if needed
3. Implement caching strategy
4. Scale horizontally if traffic grows

---

**Last Updated**: 2025-11-01
**Status**: Ready for Production
**Domain**: triplecaptain.in
**Server**: Hetzner
**Owner**: Siddharth Jaswal

🚀 Ready to deploy!
