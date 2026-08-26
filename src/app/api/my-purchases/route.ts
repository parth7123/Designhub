import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';
import { db } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: {
        buyerId: session.userId,
        status: 'COMPLETED',
      },
      include: {
        listing: {
          include: {
            category: { select: { name: true } },
            seller: { select: { name: true, businessName: true } },
          },
        },
        review: true,
        dispute: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch purchases' }, { status: 500 });
  }
}
