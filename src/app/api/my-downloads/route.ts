import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';
import { db } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ purchases: [], freeDownloads: [] }, { status: 200 });
    }

    const purchases = await db.order.findMany({
      where: {
        buyerId: session.userId,
        status: 'COMPLETED',
      },
      include: {
        listing: {
          include: {
            category: { select: { name: true, slug: true } },
            seller: { select: { id: true, name: true, businessName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const freeDownloads = await db.downloadLog.findMany({
      where: {
        userId: session.userId,
        type: 'FREE',
      },
      include: {
        listing: {
          include: {
            category: { select: { name: true, slug: true } },
            seller: { select: { id: true, name: true, businessName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { downloadedAt: 'desc' },
    });

    // Deduplicate free downloads by listingId
    const uniqueFreeMap = new Map();
    for (const log of freeDownloads) {
      if (!uniqueFreeMap.has(log.listingId)) {
        uniqueFreeMap.set(log.listingId, log);
      }
    }

    return NextResponse.json({
      purchases,
      freeDownloads: Array.from(uniqueFreeMap.values()),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch downloads history' }, { status: 500 });
  }
}
