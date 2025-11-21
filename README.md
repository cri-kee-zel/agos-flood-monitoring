# AGOS - Advanced Ground Observation System

## Real-time Flood Monitoring & Emergency Response for Puerto Princesa

![AGOS System](https://img.shields.io/badge/AGOS-v2.1.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Arduino](https://img.shields.io/badge/Arduino-R4_WiFi-00979D) ![License](https://img.shields.io/badge/License-MIT-yellow)

A comprehensive flood monitoring system using **Arduino R4 WiFi**, water level sensors, and real-time web interface designed specifically for Puerto Princesa City flood-prone areas.

## 🌊 System Overview

AGOS is a complete flood monitoring solution featuring:

**Main Gateway** (`main/`): Central hub for system navigation and overview

**Active Modules:**

1. **Real-time Dashboard** (`module_1/`): Live water level monitoring with 5-second WebSocket updates
2. **Emergency Response** (`module_4/`): SMS alert system with Android SMS Gateway integration
3. **Water Level Control Panel** (`public/water-level-control.html`): Testing interface for simulating water levels (0", 2", 10", 19")

**System Features:**

- Arduino R4 WiFi with two-way communication
- Real-time sensor data transmission via HTTP
- WebSocket broadcasting for live dashboard updates
- Command polling system (Arduino checks server every 2 seconds)
- SMS alerts via Android SMS Gateway (sms-gate.app)
- Restricted access emergency panel with operator authentication

## 🏗️ Hardware Components

**Current Active Setup:**

- **Arduino R4 WiFi** - Main controller with WiFi connectivity (WiFiS3 library)
- **3x TSOP38238 IR Receivers** - Water level detection sensors
  - Sensor 1: Half Knee (10 inches)
  - Sensor 2: Knee Level (19 inches)
  - Sensor 3: Waist Level (37 inches)
- **3x IR LEDs** - Optical water level sensing
- **ULN2803 Darlington Array** - LED driver circuit

**Communication:**

- WiFi connection to server (178.128.83.244 for production, localhost for testing)
- HTTP POST for sensor data transmission (every 5 seconds)
- HTTP GET for command polling (every 2 seconds)
- WebSocket for real-time dashboard updates

## 🚀 Quick Start - Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/agos-flood-monitoring.git
   cd agos-flood-monitoring
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   - **Main Gateway**: http://localhost:3000
   - **Real-time Dashboard**: http://localhost:3000/dashboard
   - **Emergency Response**: http://localhost:3000/emergency
   - **Water Level Control**: http://localhost:3000/water-control (Testing interface)

## 🌐 Production Deployment on DigitalOcean

### Prerequisites

1. **DigitalOcean Account**: Create a droplet (Ubuntu 22.04 LTS recommended)
2. **GitHub Repository**: Fork this repository or create your own
3. **Domain Name** (optional): For SSL and custom domain

### Step 1: DigitalOcean Droplet Setup

1. **Create a new droplet**:

   - Ubuntu 22.04 LTS
   - Minimum: 2GB RAM, 1 vCPU, 50GB SSD
   - Recommended: 4GB RAM, 2 vCPU, 80GB SSD

2. **Connect to your droplet**:

   ```bash
   ssh root@your-droplet-ip
   ```

3. **Run the setup script**:
   ```bash
   wget https://raw.githubusercontent.com/yourusername/agos-flood-monitoring/main/scripts/setup-digitalocean.sh
   chmod +x setup-digitalocean.sh
   ./setup-digitalocean.sh
   ```

### Step 2: GitHub Repository Setup

1. **Fork this repository** or create a new one with your AGOS code

2. **Add repository secrets** in GitHub Settings > Secrets and variables > Actions:

   ```
   DIGITALOCEAN_HOST=your-droplet-ip
   DIGITALOCEAN_USERNAME=your-username
   DIGITALOCEAN_SSH_KEY=your-private-ssh-key
   DIGITALOCEAN_PORT=22
   ```

3. **Update the deploy.yml workflow** with your repository URL

### Step 3: Automatic Deployment Setup

1. **Push your code to the main branch**:

   ```bash
   git add .
   git commit -m "Initial AGOS deployment"
   git push origin main
   ```

2. **GitHub Actions will automatically**:

   - Run tests and build checks
   - Deploy to your DigitalOcean droplet
   - Start the application with Docker
   - Perform health checks

3. **Monitor deployment** in GitHub Actions tab

### Step 4: Domain and SSL Setup (Optional)

1. **Point your domain** to your droplet IP:

   ```
   A record: @ -> your-droplet-ip
   A record: www -> your-droplet-ip
   ```

2. **Enable SSL** on your droplet:

   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Update nginx configuration** in `nginx/nginx.conf` with your domain

## 🔄 Continuous Deployment Workflow

Once set up, your deployment workflow becomes:

1. **Make changes** to your AGOS code locally
2. **Test locally** using `npm run dev`
3. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Your changes description"
   git push origin main
   ```
4. **GitHub Actions automatically**:
   - Tests your code
   - Deploys to DigitalOcean
   - Restarts services
   - Confirms deployment success

## 📊 Monitoring and Management

### Check system status

```bash
# On your droplet
agos-status
```

### View logs

```bash
# Application logs
docker-compose logs -f agos-app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Manual deployment

```bash
# On your droplet
cd /var/www/agos
sudo docker-compose restart
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
WEATHER_API_KEY=your-api-key
```

### Hardware Configuration

**Arduino R4 WiFi Setup:**

1. **WiFi Configuration** (in `arduino_r4_wifi_agos.ino`):

   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* SERVER_HOST = "178.128.83.244";  // Production
   // const char* SERVER_HOST = "192.168.1.5";  // Testing (localhost)
   const int SERVER_PORT = 3000;
   ```

2. **Sensor Pins:**

   - IR LED 1: Pin 9 (10" sensor)
   - IR LED 2: Pin 10 (19" sensor)
   - IR LED 3: Pin 11 (37" sensor)
   - Receiver 1: A0
   - Receiver 2: A1
   - Receiver 3: A2

3. **Timing Configuration:**
   - Sensor read: Every 1 second
   - Data transmission: Every 5 seconds
   - Command polling: Every 2 seconds
   - Heartbeat: Every 30 seconds

## 📱 API Endpoints

**Server Endpoints:**

- `GET /api/health` - System health check
- `POST /api/arduino-serial` - Receives sensor data from Arduino
- `GET /api/arduino-command` - Returns pending commands for Arduino
- `POST /api/sms-gateway-proxy` - Forwards SMS requests to Android gateway
- WebSocket `ws://localhost:3000` - Real-time data broadcasting

**Arduino Commands:**

- `sim0` or `clear` - Simulate 0 inches (no water)
- `sim2` - Simulate 2 inches
- `sim10` or `half` - Simulate 10 inches (half knee)
- `sim19` or `knee` - Simulate 19 inches (knee level)
- `sim37` or `waist` - Simulate 37 inches (waist level)
- `status` - Display system status
- `test` - Test all sensors
- `wifi` - Show WiFi connection info
- `demo` - Run automatic demo sequence
- `help` - Show available commands

## 🛠️ Development

### Local development with hot reload

```bash
npm run dev
```

### Docker development

```bash
./scripts/deploy-local.sh --docker
```

### Run tests

```bash
npm test
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin request protection
- **Rate limiting** - API request limiting
- **Input validation** - Request sanitization
- **Environment variables** - Secure configuration
- **SSL/TLS** - HTTPS encryption
- **Firewall** - UFW configured

## 📈 Performance

- **WebSocket** - Real-time data streaming
- **Docker** - Containerized deployment
- **Nginx** - Reverse proxy with caching
- **PM2** - Process management (alternative)
- **Gzip compression** - Response optimization
- **Static file caching** - Asset optimization

## 🚨 Emergency Response System

**SMS Alert Integration:**

The system uses **Android SMS Gateway** (sms-gate.app) for reliable SMS delivery:

1. **Gateway Setup:**

   - Download SMS Gateway app on Android device
   - Configure API credentials in `recipients.json`:
     ```json
     {
       "smsGatewayUsername": "YOUR_USERNAME",
       "smsGatewayPassword": "YOUR_PASSWORD"
     }
     ```

2. **Alert Levels:**

   - **Flood Watch** (10 inches): "Flooding is possible in your area"
   - **Flash Flood Alert** (19 inches): "Flash flooding is occurring or imminent"
   - **Flash Flood Emergency** (37 inches): "LIFE-THREATENING flash flooding is happening NOW"

3. **Features:**

   - Restricted operator access with password authentication
   - Cooldown timer (60 seconds between alerts)
   - Custom message editing
   - Contact management (add/remove recipients)
   - Manual SMS triggering
   - Arduino serial monitor with two-way communication

4. **Recipients Management:**
   - Stored in `recipients.json`
   - Add via emergency panel interface
   - Phone numbers in international format (+639...)

## 🔍 Troubleshooting

### Common Issues

1. **Port 3000 already in use**:

   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Docker permission denied**:

   ```bash
   sudo usermod -aG docker $USER
   # Log out and log back in
   ```

3. **SSL certificate issues**:

   ```bash
   sudo certbot renew --dry-run
   ```

4. **GitHub Actions deployment fails**:
   - Check repository secrets
   - Verify SSH key format
   - Check droplet connectivity

### Get Help

- **Check logs**: `docker-compose logs -f`
- **System status**: `agos-status`
- **GitHub Issues**: Create an issue for bugs
- **Documentation**: See `docs/` folder

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🎯 Testing & Simulation

**Water Level Control Panel** (`/water-control`):

A dedicated testing interface for simulating different water levels:

1. **Access**: http://localhost:3000/water-control
2. **Four Control Buttons:**

   - 🟢 CLEAR (0 inches)
   - 🟡 2 INCHES
   - 🟠 10 INCHES
   - 🔴 19 INCHES

3. **Features:**

   - Visual water filling animation
   - Real-time WebSocket updates
   - Commands sent directly to Arduino
   - Active button highlighting
   - Smooth level transitions

4. **How to Use:**
   - Click any button to set water level
   - Button stays highlighted until another is pressed
   - Water animates to selected level
   - Arduino receives corresponding `sim` command

## 🙏 Acknowledgments

- **Arduino Community** - Hardware and library support
- **Node.js & Express** - Backend framework
- **Android SMS Gateway** (sms-gate.app) - SMS integration
- **Puerto Princesa City Government** - Flood monitoring support

## 👨‍💻 Development Team

**Developed by:** cri-kee-zel & JC

**Project Location:** Puerto Princesa City, Philippines

**Version:** AGOS v2.1.0

---

**AGOS** - _Advanced Ground Observation System for Flood Monitoring_

Built with ❤️ for Puerto Princesa City, Philippines 🇵🇭
