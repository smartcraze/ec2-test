
# 🚀 GCP VM CI/CD Pipeline (Bun + Nginx + GitHub Actions)

This project runs a **Bun** application on a **Google Cloud VM**, automatically deployed via **GitHub Actions** using the `appleboy/ssh-action`.

---

## 🧩 Project Overview
- **Runtime:** Bun v1.x  
- **Server:** Ubuntu on GCP Compute Engine  
- **Reverse Proxy:** Nginx (handles SSL + HTTPS)  
- **CI/CD:** GitHub Actions → SSH deploy to VM  
- **Service Manager:** systemd  

---

## ⚙️ 1. VM Setup

### Install required packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl
````

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

---

## 🛠️ 2. Application Setup

Clone your repository:

```bash
cd ~
git clone https://github.com/<username>/<repo>.git
cd <repo>
bun install
```

Verify app works:

```bash
bun run start
```

App should listen on port **3000**.

---

## 🧾 3. Create a systemd Service

```bash
sudo nano /etc/systemd/system/bun-app.service
```

Paste:

```ini
[Unit]
Description=Bun App Service
After=network.target

[Service]
User=dev_surajv
WorkingDirectory=/home/dev_surajv/ci-cd-piplines-action-jenkins
ExecStart=/home/dev_surajv/.bun/bin/bun run start
Restart=always
Environment=PORT=3000
Environment=NODE_ENV=production
Environment=PATH=/home/dev_surajv/.bun/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bun-app.service
sudo systemctl start bun-app.service
sudo systemctl status bun-app.service
```

---

## 🌐 4. Configure Nginx (Reverse Proxy + SSL)

### Basic reverse proxy

```bash
sudo nano /etc/nginx/sites-available/bun-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/bun-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Add SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot renew --dry-run
```

---

## 🔁 5. GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCP VM

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: SSH into GCP VM and deploy Bun app
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.PORT }}
          script: |
            cd ~/ci-cd-piplines-action-jenkins
            git fetch --all
            git reset --hard origin/main
            bun install --production
            sudo systemctl restart bun-app.service
            echo "✅ Bun app updated and restarted"
```

### Required Secrets

| Name              | Description                                   |
| ----------------- | --------------------------------------------- |
| `HOST`            | External IP of GCP VM                         |
| `USERNAME`        | Linux username (`dev_surajv`)                 |
| `PORT`            | SSH port (default 22)                         |
| `SSH_PRIVATE_KEY` | Private key matching your VM’s authorized key |

---

## 🧰 6. Troubleshooting

| Problem                          | Fix                                                   |
| -------------------------------- | ----------------------------------------------------- |
| **502 Bad Gateway (Nginx)**      | Check if Bun app is running on port 3000              |
| **Systemd service fails**        | `journalctl -u bun-app.service -n 30`                 |
| **Express not found**            | Run `bun install`                                     |
| **Local changes block git pull** | Use `git fetch --all && git reset --hard origin/main` |
| **SSL expired**                  | `sudo certbot renew --dry-run`                        |

---

## ✅ Deployment Flow

1. Push to `main` on GitHub
2. GitHub Action SSHs into VM
3. Code pulled + dependencies installed
4. Bun service restarted
5. Nginx serves latest build with SSL

---

### 🧠 Notes

* Bun path: `/home/dev_surajv/.bun/bin/bun`
* Working directory: `/home/dev_surajv/ci-cd-piplines-action-jenkins`
* Port: `3000` (proxied via Nginx → 80/443)

---

### 🔍 Verify Deployment

```bash
sudo systemctl status bun-app.service
sudo lsof -i :3000
curl http://127.0.0.1:3000
```


