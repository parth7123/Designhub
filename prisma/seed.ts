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
    update: { value: 'ca-pub-1066955028311078' },
    create: { key: 'adsense_publisher_id', value: 'ca-pub-1066955028311078' },
  });

  // 2. Categories for Metusk Marketplace
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
