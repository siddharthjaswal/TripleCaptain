# Triple Captain - CI/CD Deployment Plan

## Overview

Automated deployment pipeline for Triple Captain FPL application to production server using GitHub Actions.

---

## Goals

- ✅ **Automated Deployments**: Push to main/production branch triggers deployment
- ✅ **Quality Gates**: Run tests, linting, and type-checking before deployment
- ✅ **Zero Downtime**: Deploy without service interruption
- ✅ **Rollback Capability**: Quick revert to previous version if issues arise
- ✅ **Security**: Secure handling of secrets and environment variables
- ✅ **Monitoring**: Health checks and deployment notifications

---

## Technology Stack

### CI/CD Platform
- **GitHub Actions** - Native integration, free for public repos
- Alternative: GitLab CI, CircleCI, Jenkins

### Deployment Target Options

#### Option 1: VPS/Dedicated Server (Recommended for Full Control)
- **Providers**: DigitalOcean, Linode, Hetzner, AWS EC2
- **Requirements**:
  - Ubuntu 22.04 LTS
  - 2GB+ RAM
  - 20GB+ Storage
  - Node.js 20+
  - PM2 or Docker for process management
  - Nginx reverse proxy

#### Option 2: Platform as a Service (Easiest)
- **Vercel** (Next.js native, automatic)
- **Netlify** (Simple, good DX)
- **Railway** (Docker support)
- **Render** (Free tier available)

#### Option 3: Container Platform
- **Docker** + **Docker Compose**
- **Kubernetes** (overkill for single app)
- **AWS ECS/Fargate**

---

## Recommended Approach: VPS + Docker + GitHub Actions

### Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓ (on push to main)
1. Run Tests & Linting
2. Build Docker Image
3. Push to Registry (GitHub Container Registry)
4. SSH to Server
5. Pull Image & Deploy
6. Health Check
7. Notify (Slack/Discord/Email)
```

---

## Infrastructure Requirements

### Server Specifications (Minimum)
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2 vCPUs
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB SSD
- **Network**: 1TB bandwidth/month

### Estimated Costs
- **DigitalOcean**: $12/month (2GB RAM droplet)
- **Hetzner**: €4.51/month (CX22 - 2 vCPU, 4GB RAM)
- **Linode**: $12/month (Nanode 2GB)

### Software Stack on Server
```bash
- Ubuntu 22.04 LTS
- Docker & Docker Compose
- Nginx (reverse proxy)
- Certbot (SSL certificates via Let's Encrypt)
- UFW (firewall)
```

---

## Deployment Strategy

### Blue-Green Deployment

**Current Setup:**
```
Port 3000: Current Production (Blue)
Port 3001: New Version (Green)
```

**Process:**
1. Pull new Docker image
2. Start new container on port 3001
3. Health check new container
4. Switch Nginx upstream to port 3001
5. Reload Nginx
6. Stop old container on port 3000
7. Keep old image for rollback

**Advantages:**
- Zero downtime
- Instant rollback (switch Nginx back)
- Test new version before switching

---

## CI/CD Pipeline Stages

### Stage 1: Code Quality Checks
```yaml
- Checkout code
- Install dependencies (pnpm)
- Run TypeScript type checking
- Run ESLint
- Run unit tests (if available)
```

### Stage 2: Build
```yaml
- Build Next.js application
- Build Docker image
- Tag image with commit SHA and 'latest'
```

### Stage 3: Push to Registry
```yaml
- Login to GitHub Container Registry
- Push Docker image with tags
```

### Stage 4: Deploy to Server
```yaml
- SSH to production server
- Pull latest Docker image
- Run deployment script
- Health check
```

### Stage 5: Post-Deployment
```yaml
- Verify deployment
- Send notification (success/failure)
- Update deployment status
```

---

## Environment Variables & Secrets

### GitHub Secrets (Required)
```
SERVER_HOST          # Server IP address
SERVER_USER          # SSH user (e.g., deploy)
SERVER_SSH_KEY       # Private SSH key for deployment
GHCR_TOKEN           # GitHub token for container registry
```

### Application Environment Variables
```
NODE_ENV=production
PORT=3000
FPL_API_BASE_URL=https://fantasy.premierleague.com/api
# Add any other app-specific variables
```

---

## Security Considerations

### SSH Access
- ✅ Use dedicated deployment user (not root)
- ✅ SSH key-based authentication only
- ✅ Disable password authentication
- ✅ Configure UFW firewall (allow 80, 443, 22)

### Docker Security
- ✅ Run containers as non-root user
- ✅ Use official base images
- ✅ Scan images for vulnerabilities
- ✅ Minimize image layers

### SSL/TLS
- ✅ Use Let's Encrypt for free SSL certificates
- ✅ Auto-renewal with Certbot
- ✅ Force HTTPS redirect
- ✅ HSTS headers

### Secrets Management
- ✅ Store secrets in GitHub Secrets
- ✅ Never commit secrets to repository
- ✅ Use environment variables for configuration
- ✅ Rotate SSH keys periodically

---

## Implementation Steps

### Phase 1: Server Setup (1-2 hours)

#### Step 1: Provision Server
```bash
# Create droplet/VPS with Ubuntu 22.04
# Note server IP address
# Set up DNS A record pointing to server IP
```

#### Step 2: Initial Server Configuration
```bash
# SSH as root
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Create deployment user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Set up SSH keys
mkdir -p /home/deploy/.ssh
# Add your public key to authorized_keys

# Disable root SSH login
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
systemctl restart sshd
```

#### Step 3: Install Docker
```bash
# Switch to deploy user
su - deploy

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

#### Step 4: Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Step 5: Set up SSL
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

### Phase 2: Docker Setup (30 minutes)

#### Step 1: Create Dockerfile
```dockerfile
# See implementation in Phase 3
```

#### Step 2: Create docker-compose.yml
```yaml
# See implementation in Phase 3
```

#### Step 3: Create .dockerignore
```
node_modules
.next
.git
.env.local
*.md
```

### Phase 3: GitHub Actions Setup (1 hour)

#### Step 1: Generate SSH Key for Deployment
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key

# Add public key to server
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server-ip
```

#### Step 2: Add GitHub Secrets
```
Go to: Repository → Settings → Secrets and variables → Actions

Add secrets:
- SERVER_HOST: your-server-ip
- SERVER_USER: deploy
- SERVER_SSH_KEY: (paste private key from ~/.ssh/deploy_key)
- GHCR_TOKEN: (GitHub personal access token with packages:write)
```

#### Step 3: Create GitHub Actions Workflow
```yaml
# See .github/workflows/deploy.yml in Phase 3
```

### Phase 4: Nginx Configuration (30 minutes)

#### Create Nginx Config
```nginx
# /etc/nginx/sites-available/triple-captain

upstream triple_captain {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy settings
    location / {
        proxy_pass http://triple_captain;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://triple_captain;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/triple-captain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Phase 5: Deployment Scripts (30 minutes)

#### Create deployment script on server
```bash
# /home/deploy/deploy.sh
```

See implementation files in Phase 6.

---

## Monitoring & Health Checks

### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.DEPLOY_VERSION || 'unknown'
  });
}
```

### Uptime Monitoring
- **UptimeRobot** (free, 50 monitors)
- **Pingdom**
- **StatusCake**

### Application Monitoring
- **Sentry** (error tracking)
- **LogRocket** (session replay)
- **Plausible/Umami** (privacy-friendly analytics)

---

## Rollback Strategy

### Automatic Rollback Triggers
- Health check fails after deployment
- Error rate exceeds threshold
- Manual trigger via GitHub Actions

### Rollback Process
```bash
# On server
cd /home/deploy/triple-captain
docker-compose down
docker tag triple-captain:previous triple-captain:latest
docker-compose up -d
```

### Manual Rollback via GitHub
```bash
# Trigger workflow with previous commit SHA
gh workflow run deploy.yml -f version=<previous-commit-sha>
```

---

## Cost Breakdown

### Monthly Costs (Estimated)
- **VPS Server**: $12/month (DigitalOcean 2GB)
- **Domain Name**: $12/year (~$1/month)
- **SSL Certificate**: Free (Let's Encrypt)
- **GitHub Actions**: Free (2000 minutes/month)
- **Monitoring**: Free (UptimeRobot, Sentry free tier)

**Total**: ~$13/month

---

## Alternative: Vercel Deployment (Simplest)

### Pros
- ✅ Zero configuration
- ✅ Automatic deployments
- ✅ Built-in CDN
- ✅ Edge functions
- ✅ Preview deployments
- ✅ Free hobby tier

### Cons
- ❌ Less control
- ❌ Vendor lock-in
- ❌ Function execution limits
- ❌ More expensive at scale

### Setup (5 minutes)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

---

## Next Steps

### Immediate (Phase 1)
1. ✅ Decide on deployment platform (VPS vs PaaS)
2. ✅ Purchase/provision server
3. ✅ Set up domain name and DNS
4. ✅ Complete server initial setup

### Short-term (Phase 2-3)
1. ✅ Create Dockerfile and docker-compose.yml
2. ✅ Set up GitHub Actions workflow
3. ✅ Configure Nginx and SSL
4. ✅ Test deployment pipeline

### Long-term (Phase 4-5)
1. ✅ Set up monitoring and alerts
2. ✅ Implement automated backups
3. ✅ Add performance monitoring
4. ✅ Configure CDN (Cloudflare)

---

## Questions to Answer

1. **Deployment Target**: VPS or PaaS (Vercel/Netlify)?
2. **Domain Name**: Do you already have one?
3. **Budget**: What's the monthly budget?
4. **Scale**: Expected traffic/users?
5. **Database**: Will you need a database in the future?
6. **Backup**: Automated backups required?

---

## Resources

### Documentation
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Tutorials
- [DigitalOcean: Deploy Next.js with Docker](https://www.digitalocean.com/community/tutorials)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)

---

## Support & Maintenance

### Regular Tasks
- **Weekly**: Review deployment logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Yearly**: Review and optimize costs

### Backup Strategy
- Database: Daily automated backups (if applicable)
- Configuration: Version controlled
- Docker images: Tagged and stored in registry
- Nginx configs: Backed up to repository

---

**Last Updated**: 2025-10-31
**Status**: Planning Phase
**Owner**: Siddharth Jaswal
