#!/bin/bash
set -e

APP_DIR="/var/www/designhub"
echo "===== DesignHub App Setup ====="

echo "[1/5] Installing dependencies..."
cd $APP_DIR
npm ci --omit=dev

echo "[2/5] Generating Prisma client..."
npx prisma generate

echo "[3/5] Pushing database schema..."
npx prisma db push

echo "[4/5] Creating admin user..."
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
  const sellerHash = await bcrypt.hash('Seller@123', 12);
  await db.user.upsert({
    where: { email: 'seller@designhub.store' },
    create: { email: 'seller@designhub.store', name: 'Demo Seller', businessName: 'DesignCraft Studio', passwordHash: sellerHash, role: 'SELLER', status: 'APPROVED' },
    update: {}
  });
  console.log('✅ Admin and seller accounts created');
  await db.\$disconnect();
}
seed().catch(console.error);
"

echo "[5/5] Building Next.js app..."
npm run build

echo "✅ App built! Starting with PM2..."
pm2 delete designhub 2>/dev/null || true
pm2 start npm --name designhub -- start
pm2 save
pm2 startup systemd -u root --hp /root

echo "✅ App running! Configure Nginx next."
