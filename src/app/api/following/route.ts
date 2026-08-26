import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';
import { db } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ listings: [] }, { status: 200 });
    }

    const follows = await db.follow.findMany({
      where: { followerId: session.userId },
      select: { sellerId: true },
    });

    const sellerIds = follows.map((f) => f.sellerId);

    if (sellerIds.length === 0) {
      return NextResponse.json({ listings: [] });
    }

    const listings = await db.listing.findMany({
      where: {
        sellerId: { in: sellerIds },
        status: 'APPROVED',
      },
      include: {
        category: { select: { name: true, slug: true } },
        seller: { select: { id: true, name: true, businessName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ listings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch following feed' }, { status: 500 });
  }
}
