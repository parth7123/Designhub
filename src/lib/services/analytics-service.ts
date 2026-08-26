import { db } from '../db';

export async function getAdminAnalyticsData() {
  const totalOrders = await db.order.count({ where: { status: 'COMPLETED' } });
  const totalSellers = await db.user.count({ where: { role: 'SELLER' } });
  const totalBuyers = await db.user.count({ where: { role: 'BUYER' } });
  const totalListings = await db.listing.count({ where: { status: 'APPROVED' } });
  const pendingSellersCount = await db.user.count({ where: { role: 'SELLER', status: 'PENDING_APPROVAL' } });
  const openDisputesCount = await db.dispute.count({ where: { status: 'OPEN' } });

  // Sum total revenue and platform fee
  const completedOrders = await db.order.findMany({
    where: { status: 'COMPLETED' },
    select: {
      amount: true,
      platformFee: true,
      sellerEarnings: true,
      createdAt: true,
    },
  });

  const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalPlatformCommission = completedOrders.reduce((sum, o) => sum + o.platformFee, 0);
  const totalSellerPayouts = completedOrders.reduce((sum, o) => sum + o.sellerEarnings, 0);

  // Top Selling Designs
  const topListings = await db.listing.findMany({
    orderBy: { downloadCount: 'desc' },
    take: 5,
    include: {
      seller: { select: { name: true, businessName: true } },
      category: { select: { name: true } },
    },
  });

  // Top Performing Sellers
  const topSellers = await db.user.findMany({
    where: { role: 'SELLER' },
    take: 5,
    include: {
      sellerOrders: {
        where: { status: 'COMPLETED' },
        select: { amount: true, sellerEarnings: true },
      },
      listings: {
        select: { downloadCount: true },
      },
    },
  });

  const formattedTopSellers = topSellers.map((seller) => {
    const totalSales = seller.sellerOrders.length;
    const grossEarnings = seller.sellerOrders.reduce((sum, o) => sum + o.sellerEarnings, 0);
    return {
      id: seller.id,
      name: seller.name,
      businessName: seller.businessName || seller.name,
      totalSales,
      grossEarnings,
    };
  }).sort((a, b) => b.grossEarnings - a.grossEarnings);

  // Category sales breakdown
  const categories = await db.category.findMany({
    include: {
      listings: {
        include: {
          orders: { where: { status: 'COMPLETED' } },
        },
      },
    },
  });

  const categoryBreakdown = categories.map((cat) => {
    let salesCount = 0;
    let categoryRevenue = 0;
    cat.listings.forEach((l) => {
      salesCount += l.orders.length;
      categoryRevenue += l.orders.reduce((s, o) => s + o.amount, 0);
    });
    return {
      id: cat.id,
      name: cat.name,
      listingsCount: cat.listings.length,
      salesCount,
      revenue: categoryRevenue,
    };
  });

  return {
    overview: {
      totalGrossRevenue,
      totalPlatformCommission,
      totalSellerPayouts,
      totalOrders,
      totalSellers,
      totalBuyers,
      totalListings,
      pendingSellersCount,
      openDisputesCount,
    },
    topListings,
    topSellers: formattedTopSellers,
    categoryBreakdown,
  };
}
