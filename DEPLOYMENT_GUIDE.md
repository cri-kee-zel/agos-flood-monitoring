# AGOS Deployment Guide

## Digital Ocean Server Setup & Deployment

### 1. Server Preparation & SSH Setup

#### Initial Server Access

```bash
# Connect to your Digital Ocean droplet
ssh root@YOUR_SERVER_IP
```

#### Create Non-Root User

```bash
# Create new user (replace 'agos' with your preferred username)
adduser agos
usermod -aG sudo agos

# Setup SSH for new user
mkdir /home/agos/.ssh
cp ~/.ssh/authorized_keys /home/agos/.ssh/
chown -R agos:agos /home/agos/.ssh
chmod 700 /home/agos/.ssh
chmod 600 /home/agos/.ssh/authorized_keys
```

#### Configure SSH Keys (On Your Local Machine)

```bash
# Generate SSH key pair if you don't have one
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id agos@YOUR_SERVER_IP
```

### 2. Server Environment Setup

#### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Node.js & npm

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install PM2 Process Manager

```bash
sudo npm install -g pm2
```

#### Install Nginx (Reverse Proxy)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Install UFW Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw --force enable
```

### 3. SSL Certificate Setup

#### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### Get SSL Certificate (after domain is pointed to server)

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 4. Nginx Configuration

Create Nginx config for your domain:

```bash
sudo nano /etc/nginx/sites-available/agos
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/agos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Application Deployment

#### Method A: GitHub (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/agos-flood-monitoring.git
cd agos-flood-monitoring

# Install dependencies
npm install --production

# Setup environment
cp .env.production .env
nano .env  # Edit with your values

# Create logs directory
mkdir logs

# Start with PM2
npm run pm2:start
```

#### Method B: Manual Upload

```bash
# On your local machine, create deployment package
tar -czf agos-deploy.tar.gz --exclude=node_modules --exclude=.git .

# Upload to server
scp agos-deploy.tar.gz agos@YOUR_SERVER_IP:~/

# On server
tar -xzf agos-deploy.tar.gz
cd agos-flood-monitoring
npm install --production
# ... continue with environment setup and PM2 start
```

### 6. Security Hardening

#### Configure Automatic Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### Setup Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

#### Configure SSH Security

```bash
sudo nano /etc/ssh/sshd_config
```

Add/modify these settings:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Change default port
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

### 7. Monitoring & Maintenance

#### PM2 Monitoring

```bash
pm2 status
pm2 logs agos-server
pm2 monit
```

#### Setup PM2 Startup

```bash
pm2 startup
pm2 save
```

#### Log Rotation

```bash
pm2 install pm2-logrotate
```

### 8. Environment Variables to Update

Before deployment, update `.env` file with:

```bash
# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 9. Domain Configuration

1. Point your domain's A record to your Digital Ocean server IP
2. Update `.env` file with your actual domain
3. Run SSL certificate setup
4. Test the deployment

### 10. Final Testing

Test all endpoints:

- `https://your-domain.com/` - Main gateway
- `https://your-domain.com/dashboard` - Real-time dashboard
- `https://your-domain.com/mapping` - AI mapping
- `https://your-domain.com/analytics` - Analytics
- `https://your-domain.com/emergency` - Emergency response

## Troubleshooting

### Common Issues

1. **Port 3000 blocked**: Check UFW firewall settings
2. **Nginx 502 error**: Ensure Node.js app is running with PM2
3. **WebSocket connection issues**: Verify Nginx WebSocket configuration
4. **SSL certificate issues**: Ensure domain is properly pointed to server

### Useful Commands

```bash
# Check server status
sudo systemctl status nginx
pm2 status

# View logs
sudo tail -f /var/log/nginx/error.log
pm2 logs agos-server

# Restart services
sudo systemctl restart nginx
pm2 restart agos-server
```
