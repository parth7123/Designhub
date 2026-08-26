import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../../../lib/auth';
import { db } from '../../../../../lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const session = await getSessionUser(req);

    const followerCount = await db.follow.count({
      where: { sellerId },
    });

    let isFollowing = false;
    if (session) {
      const existing = await db.follow.findUnique({
        where: {
          followerId_sellerId: {
            followerId: session.userId,
            sellerId,
          },
        },
      });
      isFollowing = !!existing;
    }

    return NextResponse.json({ followerCount, isFollowing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch follow status' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json({ error: 'Authentication required to follow creators' }, { status: 401 });
    }

    if (session.userId === sellerId) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_sellerId: {
          followerId: session.userId,
          sellerId,
        },
      },
    });

    let isFollowing = false;
    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      isFollowing = false;
    } else {
      await db.follow.create({
        data: {
          followerId: session.userId,
          sellerId,
        },
      });
      isFollowing = true;
    }

    const followerCount = await db.follow.count({
      where: { sellerId },
    });

    return NextResponse.json({ isFollowing, followerCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update follow status' }, { status: 500 });
  }
}
