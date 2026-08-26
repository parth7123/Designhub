import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../../lib/auth';
import { db } from '../../../../../lib/db';
import { createAndSendNotification } from '../../../../../lib/services/email-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const sellers = await db.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        status: true,
        warningNotice: true,
        penaltyFineAmount: true,
        penaltyReason: true,
        penaltyPaid: true,
        commissionOverride: true,
        createdAt: true,
        _count: { select: { listings: true, sellerOrders: true } },
        sellerOrders: {
          where: { status: 'COMPLETED' },
          select: { amount: true, platformFee: true, sellerEarnings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sellersWithMetrics = sellers.map((s) => {
      const grossVolume = s.sellerOrders.reduce((sum, o) => sum + o.amount, 0);
      const commissionEarned = s.sellerOrders.reduce((sum, o) => sum + o.platformFee, 0);
      const totalSellerEarnings = s.sellerOrders.reduce((sum, o) => sum + o.sellerEarnings, 0);
      const { sellerOrders, ...sellerData } = s;
      return {
        ...sellerData,
        completedSalesCount: sellerOrders.length,
        grossVolume,
        commissionEarned,
        totalSellerEarnings,
      };
    });

    return NextResponse.json({ sellers: sellersWithMetrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch sellers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { sellerId, action, warningNotice, fineAmount, reason } = await req.json();

    if (!sellerId || !action) {
      return NextResponse.json({ error: 'Seller ID and action are required' }, { status: 400 });
    }

    const seller = await db.user.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (action === 'WARN') {
      await db.user.update({
        where: { id: sellerId },
        data: {
          warningNotice: warningNotice || 'Policy Violation Warning: Please review Marketplace Seller Guidelines.',
        },
      });

      await createAndSendNotification({
        userId: sellerId,
        userEmail: seller.email,
        title: '⚠️ Official Policy Warning Issued by Admin',
        message: warningNotice || 'An official policy violation warning was issued on your creator studio account.',
        type: 'WARNING',
        link: '/seller',
      });

      return NextResponse.json({ success: true, message: 'Warning issued to seller' });
    }

    if (action === 'BLOCK_AND_FINE') {
      const fine = parseFloat(fineAmount) || 0;
      await db.user.update({
        where: { id: sellerId },
        data: {
          status: 'SUSPENDED',
          penaltyFineAmount: fine,
          penaltyReason: reason || 'Account suspended for marketplace policy violation. Fine required to unlock studio.',
          penaltyPaid: false,
          warningNotice: `Studio Account Blocked. Penalty fine of ₹${fine.toLocaleString('en-IN')} issued.`,
        },
      });

      await createAndSendNotification({
        userId: sellerId,
        userEmail: seller.email,
        title: '🚫 Studio Suspended & Penalty Fine Issued',
        message: `Your seller studio account has been blocked. Reason: ${reason || 'Policy violation'}. To unlock your account, you must pay the penalty fine of ₹${fine.toLocaleString('en-IN')}.`,
        type: 'PENALTY',
        link: '/seller',
      });

      return NextResponse.json({ success: true, message: 'Seller studio suspended and fine issued successfully' });
    }

    if (action === 'REVOKE_WARNING') {
      await db.user.update({
        where: { id: sellerId },
        data: {
          warningNotice: null,
        },
      });

      await createAndSendNotification({
        userId: sellerId,
        userEmail: seller.email,
        title: '✅ Policy Warning Revoked by Admin',
        message: 'The previously issued policy warning on your creator studio account has been reviewed and dismissed by an administrator.',
        type: 'ACCOUNT',
        link: '/seller',
      });

      return NextResponse.json({ success: true, message: 'Warning revoked successfully' });
    }

    if (action === 'UNBLOCK') {
      await db.user.update({
        where: { id: sellerId },
        data: {
          status: 'APPROVED',
          penaltyFineAmount: 0,
          penaltyReason: null,
          penaltyPaid: true,
          warningNotice: null,
        },
      });

      await createAndSendNotification({
        userId: sellerId,
        userEmail: seller.email,
        title: '✅ Studio Account Re-activated & Unblocked',
        message: 'Your seller studio account has been re-activated by Platform Admin. You may resume publishing.',
        type: 'ACCOUNT',
        link: '/seller',
      });

      return NextResponse.json({ success: true, message: 'Seller unblocked successfully' });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update seller status' }, { status: 500 });
  }
}
