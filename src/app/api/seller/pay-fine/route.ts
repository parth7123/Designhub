import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createAndSendNotification } from '../../../../lib/services/email-service';

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
  return new Razorpay({ key_id, key_secret });
}

// 1. Create Razorpay order to pay penalty fine
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const seller = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!seller || seller.role !== 'SELLER') {
      return NextResponse.json({ error: 'Seller account required' }, { status: 403 });
    }

    const fineAmount = seller.penaltyFineAmount || 0;
    if (fineAmount <= 0 || seller.status !== 'SUSPENDED') {
      return NextResponse.json({ error: 'No outstanding penalty fine required for this account' }, { status: 400 });
    }

    const rzp = getRazorpayInstance();
    const amountInPaise = Math.round(fineAmount * 100);

    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `fine_${Date.now()}_${seller.id.substring(0, 5)}`,
      notes: {
        type: 'SELLER_PENALTY_FINE',
        sellerId: seller.id,
        fineAmount: String(fineAmount),
      },
    });

    // Save penalty order reference
    await db.user.update({
      where: { id: seller.id },
      data: { penaltyOrderId: order.id },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: fineAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      sellerName: seller.businessName || seller.name,
      email: seller.email,
    });
  } catch (error: any) {
    console.error('Fine checkout error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate fine payment' }, { status: 500 });
  }
}

// 2. Verify Razorpay payment signature & unblock seller upon payment success
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Payment verification details required' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Server payment configuration error' }, { status: 500 });
    }

    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Automatically unblock seller account
    const updatedSeller = await db.user.update({
      where: { id: session.userId },
      data: {
        status: 'APPROVED',
        penaltyPaid: true,
        penaltyFineAmount: 0,
        penaltyReason: null,
        warningNotice: null,
        penaltyOrderId: null,
      },
    });

    await createAndSendNotification({
      userId: session.userId,
      userEmail: updatedSeller.email,
      title: '🎉 Penalty Paid — Studio Account Fully Unblocked & Restored!',
      message: 'Your penalty fine payment was verified successfully. Your seller studio has been unlocked and restored to full active status.',
      type: 'ACCOUNT',
      link: '/seller',
    });

    return NextResponse.json({
      success: true,
      message: 'Penalty fine paid successfully. Your studio has been unblocked!',
    });
  } catch (error: any) {
    console.error('Fine verification error:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify fine payment' }, { status: 500 });
  }
}
