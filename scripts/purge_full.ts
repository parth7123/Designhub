import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function purgeAll() {
  console.log("1. Deleting all reviews, orders, disputes, favorites, followers, download logs...");
  await db.review.deleteMany({});
  await db.order.deleteMany({});
  await db.dispute.deleteMany({});
  await db.favorite.deleteMany({});
  await db.follow.deleteMany({});
  await db.downloadLog.deleteMany({});
  await db.message.deleteMany({});
  await db.notification.deleteMany({});
  await db.payoutLog.deleteMany({});

  console.log("2. Deleting all listings...");
  await db.listing.deleteMany({});

  console.log("3. Deleting all users...");
  await db.user.deleteMany({});

  console.log("4. Deleting all categories...");
  await db.category.deleteMany({});

  console.log("5. Creating Clean Admin User (ID: 8799385445, Password: madhavmetusk@1410)...");
  const passwordHash = await bcrypt.hash("madhavmetusk@1410", 10);
  
  await db.user.create({
    data: {
      email: "8799385445",
      phone: "8799385445",
      name: "Admin",
      passwordHash: passwordHash,
      role: "ADMIN",
      status: "APPROVED"
    }
  });

  console.log("6. Creating Clean Official Categories...");
  const categories = [
    { name: "Hotfix Designs", slug: "hotfix-designs", description: "Rhinestone & hotfix motif pattern ZIP files for garment creation", icon: "Sparkles", displayOrder: 0 },
    { name: "Embroidery Designs", slug: "embroidery-designs", description: "Multi-head machine stitch files, embroidery vectors & motifs", icon: "Grid", displayOrder: 1 },
    { name: "Jacquard Designs", slug: "jacquard-designs", description: "Textile weaving patterns, sari borders & Jacquard loom designs", icon: "Globe", displayOrder: 2 },
    { name: "Beads Designs", slug: "beads-designs", description: "Handbeaded artwork, sequins, and machine bead ornament files", icon: "Box", displayOrder: 3 }
  ];

  for (const cat of categories) {
    await db.category.create({ data: cat });
  }

  console.log("SUCCESS: Whole Database Fully Cleaned and Initialized for Production!");
}

purgeAll().catch(console.error).finally(() => db.$disconnect());
