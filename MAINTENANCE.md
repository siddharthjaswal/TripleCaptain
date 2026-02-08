# Triple Captain - Maintenance & Operations

This guide covers common operational tasks and troubleshooting for the **triplecaptain.in** production environment.

## 🔑 GitHub Container Registry (GHCR) Token

The server requires a valid GitHub Personal Access Token (classic) to pull the latest Docker images. If the token expires, the CI/CD will fail to update the server.

### How to Renew
1. Go to **GitHub Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Generate a new token with the `read:packages` scope.
3. On the **Gulmarg** server, run:
   ```bash
   echo <YOUR_NEW_TOKEN> | sudo docker login ghcr.io -u siddharthjaswal --password-stdin
   ```
4. Update the `GHCR_TOKEN` secret in your GitHub repository settings (**Settings** -> **Secrets and variables** -> **Actions**).

---

## 🚀 Manual Deployment / Restart

If the automated CI/CD fails or the site is showing old code:

### 1. Verify Current Version
Check the internal version string:
```bash
curl http://localhost:3000/api/health
```

### 2. Force Manual Update
Run these commands on the server:
```bash
# Login (if not already authorized)
# echo <TOKEN> | sudo docker login ghcr.io -u siddharthjaswal --password-stdin

# Pull latest image
sudo docker pull ghcr.io/siddharthjaswal/triplecaptain:latest

# Stop and recreate container
sudo docker stop triple-captain || true
sudo docker rm triple-captain || true
sudo docker run -d \
  --name triple-captain \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /home/deploy/triple-captain/.env.production \
  ghcr.io/siddharthjaswal/triplecaptain:latest
```

---

## 🧹 Caching Issues

If the site code is updated but the UI looks old in your browser:

### 1. Nginx Cache
Restart Nginx to clear the reverse proxy cache:
```bash
sudo systemctl restart nginx
```

### 2. Browser Cache
Perform a **Hard Refresh**:
- **Mac**: `Cmd` + `Shift` + `R`
- **Windows/Linux**: `Ctrl` + `F5`

---

## 📊 Monitoring

- **Health Check**: [https://triplecaptain.in/api/health](https://triplecaptain.in/api/health)
- **Container Logs**: `sudo docker logs -f triple-captain`
- **Nginx Logs**: `sudo tail -f /var/log/nginx/triplecaptain.error.log`
