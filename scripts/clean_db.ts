import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning all demo data from database...');

  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.follower.deleteMany({});
  await prisma.listing.deleteMany({});

  // Delete all non-admin users
  await prisma.user.deleteMany({
    where: {
      NOT: [
        { email: '8799385445@metusk.com' },
        { email: '8799385445' },
        { phone: '8799385445' },
      ],
    },
  });

  // Delete non-official categories
  await prisma.category.deleteMany({
    where: {
      NOT: [
        { slug: 'hotfix-designs' },
        { slug: 'embroidery-designs' },
        { slug: 'jacquard-designs' },
        { slug: 'beads-designs' },
      ],
    },
  });

  console.log('All demo products, seller accounts, and placeholder categories cleared successfully!');
}

clean()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
