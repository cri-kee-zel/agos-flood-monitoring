# SSH Key Setup for Digital Ocean

## Generate SSH Key Pair (Windows PowerShell)

# 1. Generate new SSH key

ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# When prompted for file location, press Enter for default

# When prompted for passphrase, enter a secure passphrase

# 2. Add SSH key to ssh-agent

Get-Service ssh-agent | Set-Service -StartupType Manual
Start-Service ssh-agent
ssh-add ~/.ssh/id_rsa

# 3. Copy public key to clipboard

Get-Content ~/.ssh/id_rsa.pub | Set-Clipboard

# 4. In Digital Ocean console:

# - Go to Settings → Security → SSH Keys

# - Click "Add SSH Key"

# - Paste your public key

# - Give it a meaningful name like "AGOS-Development-Key"

# 5. When creating droplet, select your SSH key under "Authentication"

## Connect to Server

ssh root@YOUR_SERVER_IP

## Create non-root user

adduser agos
usermod -aG sudo agos

## Setup SSH for new user

mkdir /home/agos/.ssh
cp ~/.ssh/authorized_keys /home/agos/.ssh/
chown -R agos:agos /home/agos/.ssh
chmod 700 /home/agos/.ssh
chmod 600 /home/agos/.ssh/authorized_keys

## Test connection with new user

ssh agos@YOUR_SERVER_IP

## Disable root login (after testing new user works)

sudo nano /etc/ssh/sshd_config

# Set: PermitRootLogin no

sudo systemctl restart sshd
