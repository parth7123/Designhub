import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';
import { db } from '../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { listingId, orderId, rating, comment } = await req.json();

    if (!listingId || !orderId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars' }, { status: 400 });
    }

    // Strict Verified Purchase Gate
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        buyerId: session.userId,
        listingId,
        status: 'COMPLETED',
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Only verified purchasers of this item can leave a review' },
        { status: 403 }
      );
    }

    // Check if review already exists for this order
    const existingReview = await db.review.findUnique({
      where: { orderId: order.id },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already submitted a review for this purchase' }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        listingId,
        sellerId: order.sellerId,
        buyerId: session.userId,
        orderId: order.id,
        rating: parseInt(rating, 10),
        comment,
      },
    });

    // Recalculate Average Rating and Count for Listing
    const allReviews = await db.review.findMany({
      where: { listingId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await db.listing.update({
      where: { id: listingId },
      data: {
        ratingAvg: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Verified review posted successfully!',
      review,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
