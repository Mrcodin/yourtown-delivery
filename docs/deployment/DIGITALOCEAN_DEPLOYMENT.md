# DigitalOcean Deployment Guide

Complete guide to deploy YourTown Delivery to DigitalOcean.

## 📋 Prerequisites

- DigitalOcean account (sign up at https://digitalocean.com)
- Domain name (optional but recommended)
- SSH key pair (we'll create one)
- Credit card for payment (~$6/month)

## 💰 Cost Breakdown

**Monthly Costs:**
- **Droplet**: $6/month (Basic, 1GB RAM, 25GB SSD, 1TB transfer)
- **Domain**: ~$1/month ($12/year)
- **Total**: ~$7/month

**Free Services:**
- MongoDB (on same droplet)
- SSL Certificate (Let's Encrypt)
- Cloudflare CDN (optional)
- Backups: $1.20/month (optional, 20% of droplet cost)

---

## 🚀 Step 1: Create Droplet

### 1.1 Sign Up & Add Payment
1. Go to https://digitalocean.com
2. Create account or sign in
3. Add payment method
4. **Tip**: Use referral code for $200 free credit (60 days)

### 1.2 Create Droplet
1. Click **"Create"** → **"Droplets"**
2. **Choose Image**: 
   - Select **Ubuntu 24.04 LTS** (recommended)
3. **Choose Plan**:
   - Select **Basic**
   - **Regular** CPU option
   - **$6/month** (1GB RAM / 25GB SSD / 1TB transfer)
4. **Choose Region**:
   - Select closest to your customers (e.g., New York, San Francisco, London)
5. **Authentication**:
   - Select **"SSH Key"** (more secure)
   - Click **"New SSH Key"**
   - Follow instructions to generate and add key
   - OR use **"Password"** (easier but less secure)
6. **Hostname**:
   - Name it something like: `yourtown-delivery-prod`
7. **Advanced Options**:
   - ✅ Check **"Add improved metrics monitoring and alerting"** (free)
   - ✅ Check **"Enable IPv6"** (optional)
8. Click **"Create Droplet"**
9. Wait 1-2 minutes for droplet to be created

### 1.3 Get Your IP Address
- Copy the **IPv4 address** shown (e.g., `157.230.xxx.xxx`)
- Save this - you'll need it!

---

## 🔐 Step 2: Initial Server Setup

### 2.1 Connect to Server

**On Windows** (use PowerShell or Git Bash):
```bash
ssh root@YOUR_DROPLET_IP
```

**On Mac/Linux**:
```bash
ssh root@YOUR_DROPLET_IP
```

**First time?** You'll see a security warning - type `yes` and press Enter.

### 2.2 Update System
```bash
# Update package list
apt update

# Upgrade all packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git ufw fail2ban unzip
```

### 2.3 Create Non-Root User
```bash
# Create new user
adduser yourtown
# Follow prompts to set password

# Add user to sudo group
usermod -aG sudo yourtown

# Copy SSH keys to new user (if using SSH)
rsync --archive --chown=yourtown:yourtown ~/.ssh /home/yourtown
```

### 2.4 Configure Firewall
```bash
# Allow SSH
ufw allow OpenSSH

# Allow HTTP and HTTPS
ufw allow 'Nginx Full'

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## 📦 Step 3: Install Dependencies

### 3.1 Install Node.js 18 LTS
```bash
# Install Node.js repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3.2 Install MongoDB
```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
apt update

# Install MongoDB
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod

# Enable MongoDB on boot
systemctl enable mongod

# Verify MongoDB is running
systemctl status mongod
```

### 3.3 Install Nginx
```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx

# Enable on boot
systemctl enable nginx

# Check status
systemctl status nginx
```

### 3.4 Install PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

---

## 📂 Step 4: Deploy Application

### 4.1 Switch to Your User
```bash
# Exit root session
exit

# Login as yourtown user
ssh yourtown@YOUR_DROPLET_IP
```

### 4.2 Clone Repository
```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository
git clone https://github.com/Mrcodin/yourtown-delivery.git
cd yourtown-delivery

# Install dependencies
cd server
npm install --production
cd ..
```

### 4.3 Create Environment File
```bash
# Create production .env file
cd ~/apps/yourtown-delivery/server
nano .env
```

**Paste this and customize:**
```env
# Server Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING

# MongoDB
MONGODB_URI=mongodb://localhost:27017/yourtown-delivery

# Stripe (your production keys)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY

# Email (SendGrid)
SENDGRID_API_KEY=YOUR_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Sentry
SENTRY_DSN=https://28341744dafdef2ed6824d2f101e7835@o4510650554974208.ingest.us.sentry.io/4510650590822400

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Session Secret
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

**Generate secure secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated strings and update your `.env` file.

---

## 🔄 Step 5: Start Application with PM2

### 5.1 Start Server
```bash
cd ~/apps/yourtown-delivery/server

# Start with PM2
pm2 start server.js --name "yourtown-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command it gives you (copy and run it)
```

### 5.2 Check Application Status
```bash
# View running processes
pm2 list

# View logs
pm2 logs yourtown-api

# View specific log lines
pm2 logs yourtown-api --lines 50

# Monitor in real-time
pm2 monit
```

### 5.3 Verify Server is Running
```bash
# Test locally
curl http://localhost:3000/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🌐 Step 6: Configure Nginx

### 6.1 Create Nginx Configuration
```bash
# Create new site configuration
sudo nano /etc/nginx/sites-available/yourtown
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    # Frontend files
    location / {
        root /home/yourtown/apps/yourtown-delivery;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Logs
    access_log /var/log/nginx/yourtown_access.log;
    error_log /var/log/nginx/yourtown_error.log;
}
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

### 6.2 Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/yourtown /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Step 7: Setup SSL Certificate (HTTPS)

### 7.1 Install Certbot
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Get SSL Certificate
```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

### 7.3 Test Auto-Renewal
```bash
# Test renewal process
sudo certbot renew --dry-run

# Certificate auto-renews every 60 days
```

**Your site is now live with HTTPS!** 🎉

---

## 🗄️ Step 8: MongoDB Security

### 8.1 Create Database User
```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "CHOOSE_STRONG_PASSWORD",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Switch to your database
use yourtown-delivery

# Create app user
db.createUser({
  user: "yourtown",
  pwd: "CHOOSE_STRONG_PASSWORD",
  roles: [ { role: "readWrite", db: "yourtown-delivery" } ]
})

# Exit MongoDB
exit
```

### 8.2 Enable Authentication
```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf
```

**Find and modify the security section:**
```yaml
security:
  authorization: enabled
```

**Save and restart MongoDB:**
```bash
sudo systemctl restart mongod
```

### 8.3 Update Connection String
```bash
# Edit your .env file
nano ~/apps/yourtown-delivery/server/.env
```

**Update MONGODB_URI:**
```env
MONGODB_URI=mongodb://yourtown:YOUR_PASSWORD@localhost:27017/yourtown-delivery
```

**Restart application:**
```bash
pm2 restart yourtown-api
```

---

## 🔄 Step 9: Setup Automated Backups

### 9.1 Create Backup Script
```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
nano ~/backups/backup-mongodb.sh
```

**Paste this script:**
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/yourtown/backups"
DB_NAME="yourtown-delivery"
DB_USER="yourtown"
DB_PASS="YOUR_PASSWORD"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.gz"

# Create backup
mongodump \
  --username="$DB_USER" \
  --password="$DB_PASS" \
  --db="$DB_NAME" \
  --archive="$BACKUP_FILE" \
  --gzip

# Delete backups older than 7 days
find $BACKUP_DIR -name "backup_*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Make executable:**
```bash
chmod +x ~/backups/backup-mongodb.sh
```

### 9.2 Schedule Daily Backups
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /home/yourtown/backups/backup-mongodb.sh >> /home/yourtown/backups/backup.log 2>&1
```

### 9.3 Test Backup
```bash
# Run backup manually
~/backups/backup-mongodb.sh

# Check if backup exists
ls -lh ~/backups/
```

---

## 📊 Step 10: Monitoring & Maintenance

### 10.1 Check Application Health
```bash
# View PM2 status
pm2 status

# View logs
pm2 logs yourtown-api --lines 100

# View errors only
pm2 logs yourtown-api --err

# Monitor resources
pm2 monit
```

### 10.2 View Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/yourtown_access.log

# Error logs
sudo tail -f /var/log/nginx/yourtown_error.log
```

### 10.3 Check MongoDB Status
```bash
# MongoDB status
sudo systemctl status mongod

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### 10.4 Server Resources
```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Check running processes
ps aux | grep node
```

---

## 🔄 Step 11: Deployment Updates

### 11.1 Update Application
```bash
# Connect to server
ssh yourtown@YOUR_DROPLET_IP

# Navigate to app
cd ~/apps/yourtown-delivery

# Pull latest changes
git pull origin main

# Install new dependencies
cd server
npm install --production

# Restart application
pm2 restart yourtown-api

# View logs to verify
pm2 logs yourtown-api
```

### 11.2 Zero-Downtime Deployment
```bash
# Reload application (keeps it running during restart)
pm2 reload yourtown-api

# OR start new instance and switch
pm2 start server.js --name "yourtown-api-new"
pm2 stop yourtown-api
pm2 delete yourtown-api
pm2 restart yourtown-api-new --name "yourtown-api"
```

---

## 🔐 Step 12: Security Hardening

### 12.1 Install Fail2Ban (Block brute force attacks)
```bash
# Already installed in Step 2, configure it
sudo nano /etc/fail2ban/jail.local
```

**Add this configuration:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

**Restart Fail2Ban:**
```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

### 12.2 Automatic Security Updates
```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 12.3 Disable Root Login
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Find and change:
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys

# Restart SSH
sudo systemctl restart sshd
```

---

## 🌍 Step 13: Domain Configuration

### 13.1 Point Domain to Droplet

**At your domain registrar (Namecheap, GoDaddy, etc.):**

1. Go to DNS settings
2. Add these A records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 300 |
| A | www | YOUR_DROPLET_IP | 300 |

3. Wait 5-60 minutes for DNS propagation

### 13.2 Verify Domain
```bash
# Check if domain resolves
ping yourdomain.com

# Should show your droplet IP
```

---

## 📱 Step 14: Testing Checklist

After deployment, test everything:

- [ ] **Website loads**: Visit https://yourdomain.com
- [ ] **HTTPS works**: Check for green padlock
- [ ] **API responds**: Test https://yourdomain.com/api/health
- [ ] **Login/Register works**: Create test account
- [ ] **Products load**: Browse shop page
- [ ] **Cart works**: Add items to cart
- [ ] **Checkout works**: Test with Stripe test cards
- [ ] **Email works**: Test order confirmation emails
- [ ] **Admin panel works**: Login as admin
- [ ] **Real-time updates**: Test socket.io notifications
- [ ] **Mobile responsive**: Test on phone
- [ ] **Sentry logging**: Check errors appear in dashboard

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs yourtown-api --err

# Common issues:
# 1. Missing .env file
# 2. Wrong MongoDB connection
# 3. Port already in use
# 4. Missing dependencies

# Fix: Check environment variables
cat ~/apps/yourtown-delivery/server/.env

# Restart
pm2 restart yourtown-api
```

### Can't connect to MongoDB
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh "mongodb://yourtown:PASSWORD@localhost:27017/yourtown-delivery"
```

### Nginx errors
```bash
# Check configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL certificate issues
```bash
# Renew certificate manually
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

### Out of disk space
```bash
# Check disk usage
df -h

# Find large files
du -h --max-depth=1 /home/yourtown | sort -h

# Clean up old logs
pm2 flush
sudo find /var/log -type f -name "*.log" -mtime +30 -delete

# Clean old backups
find ~/backups -name "backup_*.gz" -mtime +7 -delete
```

---

## 📚 Useful Commands

### PM2 Commands
```bash
pm2 list                    # List all processes
pm2 logs                    # View all logs
pm2 logs yourtown-api       # View specific app logs
pm2 restart yourtown-api    # Restart app
pm2 stop yourtown-api       # Stop app
pm2 delete yourtown-api     # Remove from PM2
pm2 monit                   # Real-time monitoring
pm2 flush                   # Clear all logs
pm2 save                    # Save current process list
```

### Nginx Commands
```bash
sudo nginx -t              # Test configuration
sudo systemctl start nginx      # Start Nginx
sudo systemctl stop nginx       # Stop Nginx
sudo systemctl restart nginx    # Restart Nginx
sudo systemctl reload nginx     # Reload config (no downtime)
sudo systemctl status nginx     # Check status
```

### MongoDB Commands
```bash
sudo systemctl start mongod     # Start MongoDB
sudo systemctl stop mongod      # Stop MongoDB
sudo systemctl restart mongod   # Restart MongoDB
sudo systemctl status mongod    # Check status
mongosh                         # Connect to MongoDB shell
```

---

## 💡 Pro Tips

1. **Monitor your site**: Use https://uptimerobot.com (free) to get alerts when site goes down

2. **Enable DigitalOcean backups**: $1.20/month for weekly snapshots of entire droplet

3. **Use Cloudflare**: Free CDN + DDoS protection + analytics
   - Point domain to Cloudflare nameservers
   - Configure Cloudflare DNS to point to your droplet IP
   - Enable "Full (strict)" SSL mode

4. **Set up alerts**: Configure Sentry and DigitalOcean monitoring alerts

5. **Create staging environment**: Use $6/month droplet for testing before production

6. **Document your setup**: Keep notes on passwords, configurations, and customizations

---

## 📞 Support Resources

- **DigitalOcean Community**: https://www.digitalocean.com/community
- **Documentation**: https://docs.digitalocean.com/
- **Support Tickets**: Available in your DigitalOcean dashboard
- **Sentry Support**: https://sentry.io/support/
- **MongoDB Docs**: https://docs.mongodb.com/

---

## 🎉 Next Steps

1. **Add your products** through the admin panel
2. **Test order flow** end-to-end
3. **Configure email templates** for branding
4. **Set up Google Analytics** for traffic insights
5. **Create social media accounts** and link them
6. **Soft launch** with friends/family for testing
7. **Go live** and start taking real orders!

---

**Congratulations! Your YourTown Delivery platform is now live on DigitalOcean! 🚀**
