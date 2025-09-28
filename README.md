# AGOS - Advanced Ground Observation System

## IoT Flood Monitoring for Philippine Rivers

![AGOS System](https://img.shields.io/badge/AGOS-v1.0.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

A comprehensive flood monitoring system using Arduino R4 WiFi, multiple sensors, and real-time web interface for disaster prevention and response.

## 🌊 System Overview

AGOS consists of a **Main Gateway** plus 4 integrated modules:

**Main Gateway** (`main/`): Central hub with system overview and module navigation

1. **Module 1 - Real-time Dashboard** (`module_1/`): Live sensor monitoring with WebSocket updates
2. **Module 2 - AI-Enhanced Mapping** (`module_2/`): Flood mapping with satellite integration and AI analysis
3. **Module 3 - Historical Analytics** (`module_3/`): Time series analysis and predictive modeling
4. **Module 4 - Emergency Response** (`module_4/`): SMS alerts via SIM800L and emergency coordination

## 🏗️ Hardware Components

- **Arduino R4 WiFi** - Main controller with WiFi connectivity
- **Omron E3X-NA11 Optical Encoder** - Water flow rate measurement
- **POF (Plastic Optical Fiber) Sensors** - Turbidity and water quality
- **SIM800L GSM Module** - SMS emergency alerts
- **Multiple environmental sensors** - Temperature, humidity, rainfall

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
   - **Main Gateway**: http://localhost:3000 (NEW!)
   - Real-time Dashboard: http://localhost:3000/dashboard
   - AI Mapping: http://localhost:3000/mapping
   - Analytics: http://localhost:3000/analytics
   - Emergency: http://localhost:3000/emergency

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

Arduino configuration in `server.js`:

- Serial port: `/dev/ttyUSB0`
- Baud rate: `9600`
- Update interval: `5000ms`

## 📱 API Endpoints

- `GET /api/health` - System health check
- `GET /api/sensor-data` - Current sensor readings
- `GET /api/historical-data?range=24h` - Historical data
- `GET /api/flood-events` - Flood event history
- WebSocket `/ws` - Real-time data stream

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

## 🚨 Emergency Response

The system includes automated emergency response:

- **Real-time alerts** when water levels exceed thresholds
- **SMS notifications** via SIM800L GSM module
- **Multi-tier alerting** (watch, alert, emergency)
- **Operator dashboard** for manual alerts
- **Integration** with local disaster response teams

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

## 🙏 Acknowledgments

- **DOST-PAGASA** - Weather data integration
- **Arduino Community** - Hardware support
- **Node.js Community** - Backend framework
- **Philippine Disaster Response** - Emergency protocols

## 📞 Support

- **Email**: support@agos-monitoring.com
- **Documentation**: [docs.agos-monitoring.com](https://docs.agos-monitoring.com)
- **Status Page**: [status.agos-monitoring.com](https://status.agos-monitoring.com)

---

**AGOS** - _Advancing Ground Observation Systems for Disaster Prevention_

Built with ❤️ for the Philippines 🇵🇭
