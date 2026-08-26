import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';
import { db } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ favorites: [] }, { status: 200 });
    }

    const favorites = await db.favorite.findMany({
      where: { userId: session.userId },
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

    return NextResponse.json({ favorites });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    const existing = await db.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: session.userId,
          listingId,
        },
      },
    });

    if (existing) {
      await db.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false });
    } else {
      await db.favorite.create({
        data: {
          userId: session.userId,
          listingId,
        },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update favorite' }, { status: 500 });
  }
}
