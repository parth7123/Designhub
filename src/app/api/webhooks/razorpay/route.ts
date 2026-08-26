import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../lib/db';
import { createAndSendNotification } from '../../../../lib/services/email-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headerSignature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_123';

    const event = JSON.parse(rawBody);

    // Verify signature if present (real Razorpay webhook call)
    if (headerSignature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== headerSignature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    // For client-side calls after payment success: verify razorpay_signature if provided
    if (event.razorpay_order_id && event.razorpay_payment_id && event.razorpay_signature) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return NextResponse.json({ error: 'Server payment configuration missing' }, { status: 500 });
      }

      const expectedSig = crypto
        .createHmac('sha256', keySecret)
        .update(`${event.razorpay_order_id}|${event.razorpay_payment_id}`)
        .digest('hex');

      if (expectedSig !== event.razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    } else if (!headerSignature) {
      // Neither valid webhook header nor signed client payload provided
      return NextResponse.json({ error: 'Missing authentication signatures' }, { status: 401 });
    }

    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      const order = await db.order.findUnique({
        where: { razorpayOrderId },
        include: {
          buyer: true,
          seller: true,
          listing: true,
        },
      });

      if (order && order.status !== 'COMPLETED') {
        // Update order to COMPLETED
        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            razorpayPaymentId,
          },
        });

        // Log Payout
        await db.payoutLog.create({
          data: {
            sellerId: order.sellerId,
            orderId: order.id,
            razorpayTransferId: payment.transfer_id || `trf_${Date.now()}`,
            amount: order.sellerEarnings,
            commission: order.platformFee,
            status: 'PROCESSED',
          },
        });

        // Send Email & In-App Notification to Buyer
        await createAndSendNotification({
          userId: order.buyerId,
          userEmail: order.buyer.email,
          title: 'Order Confirmed — Asset Ready for Download!',
          message: `Thank you for purchasing "${order.listing.title}". Your download link is ready in your library.`,
          type: 'ORDER',
          link: '/my-purchases',
        });

        // Send Notification to Seller
        await createAndSendNotification({
          userId: order.sellerId,
          userEmail: order.seller.email,
          title: 'New Sale & Automatic Payout Dispatched!',
          message: `You earned ₹${order.sellerEarnings.toFixed(2)} from sale of "${order.listing.title}".`,
          type: 'PAYOUT',
          link: '/seller',
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
