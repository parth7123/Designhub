import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning and Seeding Production Metusk.com Database...');

  // 1. Admin Settings Initialization
  await prisma.adminSetting.upsert({
    where: { key: 'global_commission_pct' },
    update: { value: '15' },
    create: { key: 'global_commission_pct', value: '15' },
  });

  await prisma.adminSetting.upsert({
    where: { key: 'adsense_publisher_id' },
    update: { value: 'ca-pub-1066955028311078' },
    create: { key: 'adsense_publisher_id', value: 'ca-pub-1066955028311078' },
  });

  // 2. Clean Official Production Categories
  const categories = [
    { name: 'Hotfix Designs', slug: 'hotfix-designs', description: 'Rhinestone & hotfix motif pattern ZIP files for garment creation', icon: 'Sparkles' },
    { name: 'Embroidery Designs', slug: 'embroidery-designs', description: 'Multi-head machine stitch files, embroidery vectors & motifs', icon: 'Grid' },
    { name: 'Jacquard Designs', slug: 'jacquard-designs', description: 'Textile weaving patterns, sari borders & Jacquard loom designs', icon: 'Globe' },
    { name: 'Beads Designs', slug: 'beads-designs', description: 'Handbeaded artwork, sequins, and machine bead ornament files', icon: 'Box' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // 3. Admin Account Setup (ID: 8799385445, Password: madhavmetusk@1410)
  const passwordHash = await bcrypt.hash('madhavmetusk@1410', 10);

  // Upsert for primary phone/email identification
  await prisma.user.upsert({
    where: { email: '8799385445@metusk.com' },
    update: {
      phone: '8799385445',
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
      name: 'Admin',
    },
    create: {
      email: '8799385445@metusk.com',
      phone: '8799385445',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  // Also support entering literal '8799385445' in email field
  await prisma.user.upsert({
    where: { email: '8799385445' },
    update: {
      phone: '8799385445',
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
      name: 'Admin',
    },
    create: {
      email: '8799385445',
      phone: '8799385445',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  console.log('Metusk.com Production Database Initialized Cleanly!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
