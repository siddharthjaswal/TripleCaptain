# Triple Captain - Production Deployment Guide

## Overview

Complete production deployment guide for **triplecaptain.in** using existing Hetzner server (currently hosting digitalgears.in), GoDaddy domain, and GitHub Actions CI/CD.

---

## Your Infrastructure

- **Domain**: triplecaptain.in (GoDaddy) + digitalgears.in (existing)
- **Server**: Hetzner VPS (shared server)
- **CI/CD**: GitHub Actions
- **Stack**: Next.js 15, Docker, Nginx, Let's Encrypt SSL

---

## Multi-Domain Architecture

```
Hetzner Server (Single IP Address)
    ↓
Nginx (Port 80/443) - Reverse Proxy
    ├─ digitalgears.in → Docker Container (Port 3001)
    └─ triplecaptain.in → Docker Container (Port 3000)
        ↓
GitHub Actions CI/CD
    ├─ TypeScript check
    ├─ ESLint
    ├─ Build Docker image
    ├─ Push to GHCR
    └─ Deploy to Hetzner
```

**Key Points:**
- ✅ One server hosts multiple domains
- ✅ Each domain has its own Nginx virtual host
- ✅ Each app runs in separate Docker container on different port
- ✅ Separate SSL certificates per domain
- ✅ Nginx routes traffic based on domain name

---

## Phase 1: DNS Setup (GoDaddy)

### Step 1: Get Hetzner Server IP

```bash
# SSH to your Hetzner server
ssh deploy@YOUR_HETZNER_IP  # or root if deploy user doesn't exist

# Get your public IP address
curl ifconfig.me
# Note: This is the SAME IP used by digitalgears.in
```

### Step 2: Configure DNS on GoDaddy

1. Log in to [GoDaddy](https://dcc.godaddy.com/domains)
2. Select `triplecaptain.in` → Manage DNS
3. Add/Edit A Records (using the SAME IP as digitalgears.in):

```
Type    Name    Value                      TTL
A       @       YOUR_HETZNER_IP            600
A       www     YOUR_HETZNER_IP            600
```

4. Remove any default parked domain records
5. Wait 5-10 minutes for DNS propagation

### Step 3: Verify DNS

```bash
# On your local machine
dig triplecaptain.in
dig digitalgears.in

# Both should return the SAME IP address
# This confirms both domains point to your Hetzner server

# Alternative verification
nslookup triplecaptain.in
nslookup digitalgears.in
```

---

## Phase 2: Assess Existing Server Setup

### Step 1: Check Current Configuration

```bash
# SSH to server
ssh deploy@YOUR_HETZNER_IP

# Check what's currently running
docker ps

# Check existing Nginx configurations
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Check which ports are in use
sudo lsof -i :3000
sudo lsof -i :3001

# Check existing SSL certificates
sudo certbot certificates
```

### Step 2: Document Existing Setup

Make note of:
- Current app name/container for digitalgears.in
- Which port it's using (likely 3000)
- Nginx config file name
- Any custom configurations

---

## Phase 3: Port Reassignment (If Needed)

### Goal: Assign Unique Ports

**Port Assignment:**
- **digitalgears.in** → Port 3001
- **triplecaptain.in** → Port 3000 (new)

### Step 1: Check Current digitalgears.in Port

```bash
# Check which port digitalgears is using
docker ps | grep digitalgears
# or
docker port <digitalgears-container-name>
```

### Step 2: Move digitalgears.in to Port 3001 (If on 3000)

**Only do this if digitalgears.in is currently on port 3000:**

```bash
# Stop existing digitalgears container
docker stop <digitalgears-container-name>
docker rm <digitalgears-container-name>

# Restart on port 3001
docker run -d \
  --name digitalgears \
  --restart unless-stopped \
  -p 3001:3000 \
  --env-file /path/to/digitalgears/.env \
  <digitalgears-image-name>

# Verify it's running
curl http://localhost:3001
docker ps
```

### Step 3: Update digitalgears.in Nginx Config

```bash
# Edit existing Nginx config
sudo nano /etc/nginx/sites-available/digitalgears
```

Update the upstream section:

```nginx
# Change from port 3000 to 3001
upstream digitalgears_app {
    server 127.0.0.1:3001;  # Updated port
}
```

Test and reload:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Verify digitalgears.in still works
curl https://digitalgears.in
```

---

## Phase 4: Server Preparation (If Not Already Done)

### Skip This Phase If You Already Have:
- ✅ Deploy user created
- ✅ Docker installed
- ✅ Nginx installed
- ✅ UFW firewall configured

### Step 1: Create Deploy User (If Needed)

```bash
# SSH as root (if deploy user doesn't exist)
ssh root@YOUR_HETZNER_IP

# Create deployment user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Set up SSH key authentication
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Copy your public key (from local machine)
# Local: cat ~/.ssh/id_ed25519.pub
# Then paste it to server:
nano /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Test new user (from local machine)
ssh deploy@YOUR_HETZNER_IP
```

### Step 2: Verify Docker Installation

```bash
# Check Docker version
docker --version

# If not installed:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy

# Re-login to apply group changes
exit
ssh deploy@YOUR_HETZNER_IP
```

### Step 3: Verify Nginx Installation

```bash
# Check Nginx status
sudo systemctl status nginx

# If not installed:
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 4: Verify Firewall

```bash
# Check UFW status
sudo ufw status

# If not configured:
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## Phase 5: Create Nginx Configuration for triplecaptain.in

### Step 1: Create Nginx Config File

```bash
sudo nano /etc/nginx/sites-available/triplecaptain
```

### Step 2: Add Configuration

Paste this configuration:

```nginx
# Upstream to Triple Captain Next.js app
upstream triple_captain_app {
    server 127.0.0.1:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name triplecaptain.in www.triplecaptain.in;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect everything else to HTTPS
    location / {
        return 301 https://triplecaptain.in$request_uri;
    }
}

# Redirect www to non-www (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.triplecaptain.in;

    # SSL certificates (will be created by certbot)
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
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256;
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

### Step 3: Enable Site (Don't Test Yet - SSL Not Configured)

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/triplecaptain /etc/nginx/sites-enabled/

# Don't reload Nginx yet - we need SSL certificates first
```

---

## Phase 6: SSL Certificate Setup

### Important: Temporarily Disable SSL Redirects

Before getting the certificate, we need to allow HTTP temporarily:

```bash
# Edit the config to comment out SSL sections temporarily
sudo nano /etc/nginx/sites-available/triplecaptain
```

Comment out the HTTPS server blocks (add # at the start of lines):

```nginx
# Upstream to Triple Captain Next.js app
upstream triple_captain_app {
    server 127.0.0.1:3000;
}

# HTTP server (for Let's Encrypt verification)
server {
    listen 80;
    listen [::]:80;
    server_name triplecaptain.in www.triplecaptain.in;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        root /var/www/html;
        index index.html;
    }
}

# Comment out HTTPS blocks for now
# server {
#     listen 443 ssl http2;
#     ...
# }
```

Test and reload:

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

### Get SSL Certificate

```bash
# Install Certbot (if not already installed)
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate for triplecaptain.in
sudo certbot --nginx -d triplecaptain.in -d www.triplecaptain.in

# Follow prompts:
# 1. Enter email for renewal notifications
# 2. Agree to terms of service
# 3. Choose whether to share email with EFF (optional)
# 4. Certbot will automatically configure Nginx
```

### Restore Full Nginx Configuration

Now uncomment the HTTPS blocks and restore the full config:

```bash
sudo nano /etc/nginx/sites-available/triplecaptain
```

Restore the full configuration (paste the complete config from Phase 5, Step 2).

Test and reload:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Verify SSL Certificate

```bash
# Check certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run

# Test HTTPS
curl https://triplecaptain.in
```

---

## Phase 7: Create Application Directory

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

```bash
# Set proper permissions
chmod 600 .env.production
```

---

## Phase 8: GitHub Secrets Configuration

### Step 1: Generate Deployment SSH Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Add public key to Hetzner server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@YOUR_HETZNER_IP

# Verify SSH key works
ssh -i ~/.ssh/github_deploy_key deploy@YOUR_HETZNER_IP

# Copy private key content (for GitHub secret)
cat ~/.ssh/github_deploy_key
# Copy the ENTIRE output including BEGIN and END lines
```

### Step 2: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: `Triple Captain GHCR`
4. Select scopes:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### Step 3: Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/triple-captain/settings/secrets/actions`

Click "New repository secret" and add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `SERVER_HOST` | Your Hetzner IP address (e.g., 65.108.xxx.xxx) |
| `SERVER_USER` | `deploy` |
| `SERVER_SSH_KEY` | Paste the ENTIRE private key from `~/.ssh/github_deploy_key` |
| `GHCR_TOKEN` | Your GitHub Personal Access Token |

**Important for SERVER_SSH_KEY:**
- Include the full key with headers:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz...
...
-----END OPENSSH PRIVATE KEY-----
```

---

## Phase 9: First Deployment

### Step 1: Verify All Prerequisites

**Checklist:**
- ✅ DNS configured (triplecaptain.in → Hetzner IP)
- ✅ Nginx config created and enabled
- ✅ SSL certificate obtained
- ✅ Port 3000 available (not in use)
- ✅ Application directory created (`/home/deploy/triple-captain`)
- ✅ Environment file created (`.env.production`)
- ✅ GitHub secrets added (all 4)
- ✅ Deploy user has Docker permissions

### Step 2: Test Server Readiness

```bash
# SSH to server
ssh deploy@YOUR_HETZNER_IP

# Verify Docker access (should work without sudo)
docker ps

# Verify port 3000 is free
sudo lsof -i :3000
# Should return nothing

# Verify Nginx is running
sudo systemctl status nginx

# Verify SSL
curl -I https://triplecaptain.in
# Should show 503 (app not running yet) or connection error
```

### Step 3: Push to GitHub and Deploy

```bash
# On your local machine, in project directory

# Ensure all deployment files are committed
git status

# Push to feature branch
git push origin feature/m3-polish

# Merge to main (or create PR)
git checkout main
git merge feature/m3-polish
git push origin main

# This triggers GitHub Actions automatically
```

### Step 4: Monitor Deployment

1. Go to your GitHub repository
2. Click "Actions" tab
3. Click on the running workflow "Deploy to Production"
4. Watch each step:
   - ✅ Checkout code
   - ✅ Install dependencies
   - ✅ TypeScript check
   - ✅ ESLint check
   - ✅ Build and push Docker image
   - ✅ Deploy to Hetzner server
   - ✅ Health check

### Step 5: Verify Deployment

```bash
# On Hetzner server
ssh deploy@YOUR_HETZNER_IP

# Check container is running
docker ps
# Should see: triple-captain container on port 3000

# Check logs
docker logs triple-captain

# Test locally
curl http://localhost:3000
curl http://localhost:3000/api/health

# Test externally
curl https://triplecaptain.in
curl https://triplecaptain.in/api/health
```

### Step 6: Test in Browser

Open in your browser:
- https://triplecaptain.in
- https://www.triplecaptain.in (should redirect to non-www)
- http://triplecaptain.in (should redirect to HTTPS)

---

## Managing Multiple Domains

### View All Sites

```bash
# List all Nginx configurations
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# View all running containers
docker ps

# Check all SSL certificates
sudo certbot certificates
```

### Port Allocation Reference

| Domain | Port | Container Name |
|--------|------|----------------|
| digitalgears.in | 3001 | digitalgears |
| triplecaptain.in | 3000 | triple-captain |

### View Logs Per Site

```bash
# Nginx logs
sudo tail -f /var/log/nginx/digitalgears.access.log
sudo tail -f /var/log/nginx/triplecaptain.access.log

# Application logs
docker logs -f digitalgears
docker logs -f triple-captain
```

### Restart Specific Site

```bash
# Restart just triplecaptain.in
docker restart triple-captain

# Restart Nginx (affects all sites)
sudo systemctl restart nginx
```

### Update Specific Site

```bash
# Deploy new version (GitHub Actions does this automatically)
# Or manually:
cd /home/deploy/triple-captain
docker pull ghcr.io/YOUR_USERNAME/triple-captain:latest
docker stop triple-captain
docker rm triple-captain
docker run -d \
  --name triple-captain \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  ghcr.io/YOUR_USERNAME/triple-captain:latest
```

---

## Monitoring & Maintenance

### Health Check Endpoints

Your app includes a health check endpoint at `/api/health`:

```bash
# Test locally
curl http://localhost:3000/api/health

# Test externally
curl https://triplecaptain.in/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-01T...","env":"production"}
```

### Set Up Uptime Monitoring

1. Sign up for [UptimeRobot](https://uptimerobot.com) (free)
2. Add monitor:
   - **Monitor Type**: HTTPS
   - **URL**: `https://triplecaptain.in/api/health`
   - **Friendly Name**: Triple Captain
   - **Monitoring Interval**: 5 minutes
3. Add alert contacts (email, SMS, Slack, etc.)
4. Repeat for digitalgears.in if not already monitored

### Server Resource Monitoring

```bash
# Check overall server resources
htop

# Check Docker container resources
docker stats

# Check disk usage
df -h

# Check memory usage
free -h

# Check Nginx connections
sudo systemctl status nginx
```

### Log Rotation

Nginx logs are automatically rotated. Docker logs need configuration:

```bash
# Edit Docker daemon config
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Restart Docker
sudo systemctl restart docker

# Restart containers
docker restart triple-captain digitalgears
```

---

## SSL Certificate Management

### Auto-Renewal

Certbot automatically renews certificates. Verify:

```bash
# Check renewal configuration
sudo systemctl status certbot.timer

# Test renewal process
sudo certbot renew --dry-run

# Check all certificates
sudo certbot certificates
```

### Manual Renewal

```bash
# Renew all certificates
sudo certbot renew

# Renew specific certificate
sudo certbot renew --cert-name triplecaptain.in

# Force renewal (testing)
sudo certbot renew --force-renewal
```

### Certificate Expiry Monitoring

Let's Encrypt certificates expire after 90 days. Certbot renews at 30 days.

Set up email alerts:
- Certbot sends expiry warnings to the email you provided
- UptimeRobot will alert if SSL certificate becomes invalid

---

## Troubleshooting

### Issue: Container Won't Start

```bash
# Check logs
docker logs triple-captain

# Common issues:
# 1. Port already in use
sudo lsof -i :3000

# 2. Environment file missing
ls -la /home/deploy/triple-captain/.env.production

# 3. Docker image not pulled
docker images | grep triple-captain

# Solution: Remove and recreate
docker stop triple-captain
docker rm triple-captain
docker run -d \
  --name triple-captain \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /home/deploy/triple-captain/.env.production \
  ghcr.io/YOUR_USERNAME/triple-captain:latest
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check if app is running
docker ps | grep triple-captain
curl http://localhost:3000

# Check Nginx config
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/triplecaptain.error.log

# Check upstream connection
sudo netstat -tuln | grep 3000

# Solution: Restart app or Nginx
docker restart triple-captain
sudo systemctl restart nginx
```

### Issue: SSL Certificate Errors

```bash
# Check certificate status
sudo certbot certificates

# Check certificate expiry
openssl s_client -connect triplecaptain.in:443 -servername triplecaptain.in | openssl x509 -noout -dates

# Renew certificate
sudo certbot renew --cert-name triplecaptain.in

# If renewal fails, check DNS
dig triplecaptain.in
```

### Issue: GitHub Actions Deployment Fails

**Common causes:**

1. **SSH Key Issue:**
```bash
# Test SSH key locally
ssh -i ~/.ssh/github_deploy_key deploy@YOUR_HETZNER_IP

# If fails, regenerate and re-add to server
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@YOUR_HETZNER_IP
# Update SERVER_SSH_KEY secret on GitHub
```

2. **GHCR Authentication:**
```bash
# On server, test login
echo "YOUR_GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# If fails, regenerate token on GitHub
# Update GHCR_TOKEN secret
```

3. **Health Check Fails:**
```bash
# Check if health endpoint works
curl http://localhost:3000/api/health

# Check app logs
docker logs triple-captain
```

### Issue: Domain Not Resolving

```bash
# Check DNS propagation
dig triplecaptain.in
nslookup triplecaptain.in

# Try different DNS servers
dig @8.8.8.8 triplecaptain.in
dig @1.1.1.1 triplecaptain.in

# Check DNS on the server itself
host triplecaptain.in

# If not resolving, wait longer or check GoDaddy DNS settings
```

### Issue: Port Conflict

```bash
# Find what's using a port
sudo lsof -i :3000

# Kill process using port
sudo kill -9 <PID>

# Or use a different port (update Nginx config)
```

---

## Rollback Procedure

### Quick Rollback (Emergency)

If the new deployment breaks:

```bash
# SSH to server
ssh deploy@YOUR_HETZNER_IP

# Stop current container
docker stop triple-captain
docker rm triple-captain

# List available images
docker images | grep triple-captain

# Start previous version
docker run -d \
  --name triple-captain \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /home/deploy/triple-captain/.env.production \
  ghcr.io/YOUR_USERNAME/triple-captain:main-PREVIOUS_SHA

# Verify
curl http://localhost:3000
curl https://triplecaptain.in
```

### Rollback via GitHub Actions

1. Go to GitHub → Actions
2. Find the last successful deployment
3. Click "Re-run all jobs"

Or manually trigger with specific commit:

```bash
# Locally, revert to previous commit
git revert HEAD
git push origin main

# GitHub Actions will deploy the reverted version
```

---

## Security Best Practices

### Implemented Security Measures

- ✅ **SSH Key Authentication**: Password auth disabled
- ✅ **Non-root User**: Deploy user for operations
- ✅ **Firewall**: UFW restricts ports to 22, 80, 443
- ✅ **SSL/TLS**: HTTPS enforced with Let's Encrypt
- ✅ **Security Headers**: HSTS, X-Frame-Options, etc.
- ✅ **Docker Non-root**: App runs as unprivileged user
- ✅ **GitHub Secrets**: Sensitive data encrypted
- ✅ **Auto SSL Renewal**: Certbot handles renewals

### Additional Recommendations

1. **Keep System Updated:**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Monitor Failed SSH Attempts:**
```bash
sudo tail -f /var/log/auth.log
```

3. **Use Fail2Ban (Optional):**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

4. **Regular Backups:**
```bash
# Backup Nginx configs
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/sites-available/

# Backup environment files
tar -czf env-backup-$(date +%Y%m%d).tar.gz /home/deploy/*/\.env.production
```

---

## Performance Optimization

### Current Setup Performance

With 2 apps on one server:
- **CPU**: Monitor with `htop`
- **Memory**: Each Next.js app uses ~150-300MB
- **Disk**: Monitor with `df -h`

### Enable Cloudflare CDN (Optional)

Free CDN + DDoS protection:

1. Sign up at [Cloudflare](https://cloudflare.com)
2. Add site: triplecaptain.in
3. Cloudflare provides nameservers (e.g., `ns1.cloudflare.com`)
4. Update GoDaddy:
   - Go to Domain Settings → Nameservers
   - Change to custom nameservers
   - Enter Cloudflare nameservers
5. In Cloudflare dashboard:
   - Enable "Always Use HTTPS"
   - Enable "Auto Minify" (JS, CSS, HTML)
   - Enable "Brotli" compression
   - Set SSL/TLS mode to "Full (strict)"
   - Enable HTTP/3

**Benefits:**
- Global CDN (faster page loads worldwide)
- DDoS protection
- Free SSL (but keep Let's Encrypt as backup)
- Analytics
- Firewall rules

### Nginx Caching (Already Configured)

Your Nginx config already includes:
- Static file caching (60 days)
- Image caching (30 days)
- Gzip compression

### Docker Resource Limits (Optional)

Limit resources per container:

```bash
docker run -d \
  --name triple-captain \
  --restart unless-stopped \
  -p 3000:3000 \
  --memory="512m" \
  --cpus="0.5" \
  --env-file /home/deploy/triple-captain/.env.production \
  ghcr.io/YOUR_USERNAME/triple-captain:latest
```

---

## Cost Breakdown

### Monthly Costs

| Item | Cost | Notes |
|------|------|-------|
| Hetzner CX22 | €4.51/mo (~$5) | Shared with digitalgears.in |
| Domain (GoDaddy) | $15/year (~$1.25/mo) | triplecaptain.in |
| SSL Certificate | Free | Let's Encrypt |
| GitHub Actions | Free | 2000 minutes/month included |
| Cloudflare CDN | Free | Optional |
| **Total** | **~$6.25/month** | For triplecaptain.in |

**Compared to Vercel/Netlify:**
- Vercel Pro: $20/month per project
- **Savings: ~$14/month** ✅

---

## Backup Strategy

### What to Backup

1. **Nginx Configurations**
2. **Environment Files**
3. **SSL Certificates** (optional - auto-renewed)
4. **Docker Images** (stored in GHCR)

### Backup Script

Create `/home/deploy/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Backup Nginx configs
sudo tar -czf $BACKUP_DIR/nginx-$DATE.tar.gz /etc/nginx/sites-available/

# Backup environment files
tar -czf $BACKUP_DIR/envs-$DATE.tar.gz /home/deploy/*/.env.production

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x /home/deploy/backup.sh

# Test
./backup.sh

# Schedule with cron (daily at 2 AM)
crontab -e
# Add:
0 2 * * * /home/deploy/backup.sh
```

---

## Future Scaling

### When to Upgrade Server

Monitor these metrics:

```bash
# CPU usage
htop
# If consistently >80%, consider upgrade

# Memory usage
free -h
# If swap is being used heavily, add RAM

# Disk usage
df -h
# Keep at least 20% free
```

### Hetzner Server Upgrade Path

| Plan | vCPU | RAM | Disk | Price | Use Case |
|------|------|-----|------|-------|----------|
| CX22 | 2 | 4GB | 40GB | €4.51 | Current (2 apps) |
| CX32 | 4 | 8GB | 80GB | €8.46 | 3-4 apps |
| CX42 | 8 | 16GB | 160GB | €15.50 | 5-8 apps |

### Horizontal Scaling

For very high traffic:
1. Keep static files on CDN (Cloudflare)
2. Add load balancer
3. Run multiple app instances
4. Consider managed Next.js hosting (Vercel)

---

## Quick Reference Commands

### Daily Operations

```bash
# Check all sites are running
docker ps

# View logs
docker logs -f triple-captain
docker logs -f digitalgears

# Restart a site
docker restart triple-captain

# Restart Nginx
sudo systemctl restart nginx

# Check SSL certificates
sudo certbot certificates
```

### Health Checks

```bash
# Test all sites locally
curl http://localhost:3000/api/health  # triplecaptain
curl http://localhost:3001             # digitalgears

# Test all sites externally
curl https://triplecaptain.in/api/health
curl https://digitalgears.in
```

### Emergency Commands

```bash
# Stop all containers
docker stop $(docker ps -q)

# Restart Docker
sudo systemctl restart docker

# Restart Nginx
sudo systemctl restart nginx

# Check what's using ports
sudo lsof -i :3000
sudo lsof -i :3001

# Check server resources
htop
docker stats
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] DNS configured (A records pointing to server IP)
- [ ] Server accessible via SSH
- [ ] Docker installed and working
- [ ] Nginx installed and running
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Existing digitalgears.in moved to port 3001
- [ ] Port 3000 is free

### SSL & Nginx
- [ ] Nginx config created (`/etc/nginx/sites-available/triplecaptain`)
- [ ] Nginx config enabled (symlink in sites-enabled)
- [ ] SSL certificate obtained via certbot
- [ ] HTTPS redirect working
- [ ] www redirect working
- [ ] Security headers configured

### Application
- [ ] App directory created (`/home/deploy/triple-captain`)
- [ ] Environment file created (`.env.production`)
- [ ] GitHub secrets configured (all 4)
- [ ] GitHub Actions workflow committed

### First Deploy
- [ ] Code pushed to main branch
- [ ] GitHub Actions workflow succeeded
- [ ] Container running (`docker ps`)
- [ ] Health check passing (`curl http://localhost:3000/api/health`)
- [ ] Site accessible via HTTPS

### Post-Deployment
- [ ] Test in browser (https://triplecaptain.in)
- [ ] Test www redirect (https://www.triplecaptain.in)
- [ ] Test HTTP redirect (http://triplecaptain.in)
- [ ] Check logs for errors
- [ ] Set up uptime monitoring
- [ ] Configure backups
- [ ] Document any custom changes

---

## Support & Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Docs](https://letsencrypt.org/docs/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

### Common Issues
- [Nginx Troubleshooting](https://www.nginx.com/resources/wiki/start/topics/tutorials/debugging/)
- [Docker Troubleshooting](https://docs.docker.com/config/daemon/)
- [Certbot FAQ](https://certbot.eff.org/faq)

### Community
- [Hetzner Community](https://community.hetzner.com/)
- [Next.js Discord](https://nextjs.org/discord)
- [Docker Forums](https://forums.docker.com/)

---

**Last Updated**: 2025-11-01
**Status**: Ready for Multi-Domain Deployment
**Primary Domain**: triplecaptain.in
**Secondary Domain**: digitalgears.in
**Server**: Hetzner VPS (Shared)
**Owner**: Siddharth Jaswal

🚀 Ready to deploy triplecaptain.in alongside digitalgears.in!
