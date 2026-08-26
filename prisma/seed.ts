import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DesignHub database (Production Foundation)...');

  // 1. Admin Settings
  await prisma.adminSetting.upsert({
    where: { key: 'global_commission_pct' },
    update: { value: '15' },
    create: { key: 'global_commission_pct', value: '15' },
  });

  await prisma.adminSetting.upsert({
    where: { key: 'adsense_publisher_id' },
    update: { value: 'ca-pub-1234567890123456' },
    create: { key: 'adsense_publisher_id', value: 'ca-pub-1234567890123456' },
  });

  // 2. Categories
  const categories = [
    { name: 'UI Kits & Dashboards', slug: 'ui-kits-dashboards', description: 'Premium UI components and admin dashboard templates', icon: 'Layout' },
    { name: '3D Assets & Models', slug: '3d-assets-models', description: 'High-resolution 3D objects, avatars, and scenes', icon: 'Box' },
    { name: 'Icons & Vector Packs', slug: 'icons-vector-packs', description: 'Custom icon sets, illustrations, and vector graphics', icon: 'Grid' },
    { name: 'Web Templates', slug: 'web-templates', description: 'Responsive Framer, Webflow, and HTML templates', icon: 'Globe' },
    { name: 'Typography & Fonts', slug: 'typography-fonts', description: 'Modern display fonts, serif typefaces, and font families', icon: 'Type' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // 3. Admin Account
  const passwordHash = await bcrypt.hash('Password123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@designhub.store' },
    update: {},
    create: {
      email: 'admin@designhub.store',
      name: 'Platform Admin',
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  console.log('Production database initialized successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

