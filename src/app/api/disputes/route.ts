import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { createAndSendNotification } from '../../../lib/services/email-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let disputes;
    if (session.role === 'ADMIN') {
      disputes = await db.dispute.findMany({
        include: {
          buyer: { select: { name: true, email: true } },
          seller: { select: { name: true, email: true, businessName: true } },
          listing: { select: { title: true, price: true } },
          order: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (session.role === 'SELLER') {
      disputes = await db.dispute.findMany({
        where: { sellerId: session.userId },
        include: {
          buyer: { select: { name: true, email: true } },
          listing: { select: { title: true } },
          order: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      disputes = await db.dispute.findMany({
        where: { buyerId: session.userId },
        include: {
          listing: { select: { title: true } },
          order: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ disputes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch disputes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { orderId, reason, description } = await req.json();

    if (!orderId || !reason || !description) {
      return NextResponse.json({ error: 'Order ID, reason, and detailed description are required' }, { status: 400 });
    }

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        buyerId: session.userId,
        status: 'COMPLETED',
      },
      include: { listing: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not eligible for dispute' }, { status: 404 });
    }

    const existingDispute = await db.dispute.findUnique({
      where: { orderId },
    });

    if (existingDispute) {
      return NextResponse.json({ error: 'A dispute has already been filed for this purchase order' }, { status: 400 });
    }

    const dispute = await db.dispute.create({
      data: {
        orderId,
        buyerId: session.userId,
        sellerId: order.sellerId,
        listingId: order.listingId,
        reason,
        description,
        status: 'OPEN',
      },
    });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await createAndSendNotification({
        userId: admin.id,
        userEmail: admin.email,
        title: 'New Dispute & Refund Case Opened',
        message: `Buyer reported issue with "${order.listing.title}": ${reason}`,
        type: 'DISPUTE',
        link: '/admin/disputes',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Dispute submitted successfully. Our admin team will inspect the file and review your case.',
      dispute,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to file dispute' }, { status: 500 });
  }
}
