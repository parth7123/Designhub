#!/bin/bash
set -e

echo "===== DesignHub VPS Deploy Script ====="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y

echo -e "${YELLOW}[2/8] Installing Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

echo -e "${YELLOW}[3/8] Installing PostgreSQL 16...${NC}"
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

echo -e "${YELLOW}[4/8] Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << 'SQLEOF'
CREATE USER designhub WITH PASSWORD 'DesignHub@Secure2026';
CREATE DATABASE designhub OWNER designhub;
GRANT ALL PRIVILEGES ON DATABASE designhub TO designhub;
\q
SQLEOF

echo -e "${YELLOW}[5/8] Installing Nginx...${NC}"
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

echo -e "${YELLOW}[6/8] Installing PM2 globally...${NC}"
npm install -g pm2

echo -e "${YELLOW}[7/8] Setting up app directory...${NC}"
mkdir -p /var/www/designhub
mkdir -p /var/www/designhub/public/previews
chown -R www-data:www-data /var/www/designhub/public/previews

echo -e "${YELLOW}[8/8] Installing Certbot for SSL...${NC}"
apt-get install -y certbot python3-certbot-nginx

echo -e "${GREEN}✅ Server setup complete! Now run: bash setup-app.sh${NC}"
