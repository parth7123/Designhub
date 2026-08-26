import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../lib/auth';
import { db } from '../../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['SELLER', 'ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: 403 });
    }

    const sellerId = session!.userId;

    const sellerInfo = await db.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        businessName: true,
        bankAccountNo: true,
        ifscCode: true,
        status: true,
        razorpayAccountId: true,
        commissionOverride: true,
        warningNotice: true,
        penaltyFineAmount: true,
        penaltyReason: true,
        penaltyPaid: true,
      },
    });

    const listings = await db.listing.findMany({
      where: { sellerId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
      },
    });

    const orders = await db.order.findMany({
      where: { sellerId, status: 'COMPLETED' },
      include: {
        buyer: { select: { name: true, email: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payoutLogs = await db.payoutLog.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarnings = orders.reduce((sum, o) => sum + o.sellerEarnings, 0);
    const totalSalesCount = orders.length;

    return NextResponse.json({
      sellerInfo,
      listings,
      orders,
      payoutLogs,
      stats: {
        totalEarnings,
        totalSalesCount,
        listingsCount: listings.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch seller dashboard data' }, { status: 500 });
  }
}
