import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: 'RAZORPAY_KEY_SECRET is not configured on server' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    
    const razorpayOrderId = body.razorpay_order_id || body.razorpayOrderId;
    const razorpayPaymentId = body.razorpay_payment_id || body.razorpayPaymentId;
    const razorpaySignature = body.razorpay_signature || body.razorpaySignature;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature)',
        },
        { status: 400 }
      );
    }

    // HMAC SHA-256 algorithm: order_id + "|" + payment_id
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature === razorpaySignature) {
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        order_id: razorpayOrderId,
        payment_id: razorpayPaymentId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment signature',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying Razorpay payment signature:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify payment signature',
        details: error?.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
