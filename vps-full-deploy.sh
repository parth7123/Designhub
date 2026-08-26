#!/bin/bash
set -e
VPS="187.52.124.108"
APP_DIR="/var/www/designhub"

echo "=== Step 1: Syncing code to VPS ==="
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'prisma/dev.db' \
  --exclude '.drive_storage' \
  --exclude '.env' \
  ./ root@$VPS:$APP_DIR/

echo "=== Step 2: Copying production .env ==="
scp .env.production root@$VPS:$APP_DIR/.env

echo "=== Step 3: Running server setup on VPS ==="
ssh root@$VPS << 'REMOTE'
set -e

# Install Node.js 20
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
  apt-get install -y postgresql postgresql-contrib
  systemctl start postgresql
  systemctl enable postgresql
fi

# Create DB user & database
sudo -u postgres psql -c "CREATE USER designhub WITH PASSWORD 'DesignHub@Secure2026';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE designhub OWNER designhub;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE designhub TO designhub;" 2>/dev/null || true

# Install Nginx
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
  systemctl start nginx
  systemctl enable nginx
fi

# Install PM2
npm install -g pm2 2>/dev/null || true

# Setup app
cd /var/www/designhub
mkdir -p public/previews
npm ci --omit=dev
npx prisma generate
npx prisma db push

# Seed admin user
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
async function seed() {
  const hash = await bcrypt.hash('Admin@DesignHub2026', 12);
  await db.user.upsert({
    where: { email: 'admin@designhub.store' },
    create: { email: 'admin@designhub.store', name: 'Super Admin', passwordHash: hash, role: 'ADMIN', status: 'APPROVED' },
    update: {}
  });
  const sh = await bcrypt.hash('Seller@123', 12);
  await db.user.upsert({
    where: { email: 'seller@designhub.store' },
    create: { email: 'seller@designhub.store', name: 'Demo Seller', businessName: 'DesignCraft Studio', passwordHash: sh, role: 'SELLER', status: 'APPROVED' },
    update: {}
  });
  await db.\$disconnect();
  console.log('✅ Users seeded');
}
seed();
"

# Build app
npm run build

# Configure Nginx
cat > /etc/nginx/sites-available/designhub << 'NGINXCONF'
server {
    listen 80;
    server_name metusk.com www.metusk.com 187.52.124.108;
    client_max_body_size 50M;

    location /previews/ {
        alias /var/www/designhub/public/previews/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    location /_next/static/ {
        proxy_pass http://localhost:3000/_next/static/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

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
        proxy_read_timeout 120s;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
}
NGINXCONF

ln -sf /etc/nginx/sites-available/designhub /etc/nginx/sites-enabled/designhub
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Start with PM2
pm2 delete designhub 2>/dev/null || true
pm2 start npm --name designhub -- start
pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

echo ""
echo "====================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "Visit: http://187.52.124.108"
echo "Admin: admin@designhub.store / Admin@DesignHub2026"
echo "Seller: seller@designhub.store / Seller@123"
echo "====================================="
REMOTE
