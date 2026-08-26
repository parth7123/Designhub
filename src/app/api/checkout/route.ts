import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';
import { createRazorpayOrder } from '../../../lib/services/razorpay-service';
import { db } from '../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Please log in or sign up to purchase assets' }, { status: 401 });
    }

    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    const checkoutData = await createRazorpayOrder({
      listingId,
      buyerId: session.userId,
    });

    // Create a PENDING order in DB so webhook can find it after payment
    await db.order.upsert({
      where: { razorpayOrderId: checkoutData.razorpayOrderId },
      create: {
        razorpayOrderId: checkoutData.razorpayOrderId,
        buyerId: session.userId,
        sellerId: checkoutData.listing.sellerId,
        listingId: checkoutData.listing.id,
        amount: checkoutData.amount,
        platformFee: checkoutData.platformFee,
        sellerEarnings: checkoutData.sellerEarnings,
        status: 'PENDING',
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      ...checkoutData,
      buyer: {
        name: session.name,
        email: session.email,
      },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate checkout' }, { status: 500 });
  }
}
