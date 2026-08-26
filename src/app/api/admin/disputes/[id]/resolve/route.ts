import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../../../lib/auth';
import { db } from '../../../../../../lib/db';
import { createAndSendNotification } from '../../../../../../lib/services/email-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: disputeId } = await params;
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { action, adminNotes } = await req.json(); // action: 'APPROVE_REFUND' | 'REJECT'

    if (!['APPROVE_REFUND', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid resolution action' }, { status: 400 });
    }

    const dispute = await db.dispute.findUnique({
      where: { id: disputeId },
      include: {
        buyer: true,
        seller: true,
        order: true,
        listing: true,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute case not found' }, { status: 404 });
    }

    const newDisputeStatus = action === 'APPROVE_REFUND' ? 'APPROVED_REFUND' : 'REJECTED';

    await db.dispute.update({
      where: { id: disputeId },
      data: {
        status: newDisputeStatus,
        adminNotes,
      },
    });

    if (action === 'APPROVE_REFUND') {
      // Update Order Status to REFUNDED
      await db.order.update({
        where: { id: dispute.orderId },
        data: { status: 'REFUNDED' },
      });

      // Update Payout Log status if exists
      await db.payoutLog.updateMany({
        where: { orderId: dispute.orderId },
        data: { status: 'REVERSED' },
      });
    }

    // Notify Buyer
    await createAndSendNotification({
      userId: dispute.buyerId,
      userEmail: dispute.buyer.email,
      title: `Dispute Case Update: ${action === 'APPROVE_REFUND' ? 'Refund Approved' : 'Case Closed'}`,
      message: action === 'APPROVE_REFUND'
        ? `Your refund request for "${dispute.listing.title}" has been approved. Notes: ${adminNotes || 'Case resolved by admin.'}`
        : `Your dispute for "${dispute.listing.title}" was reviewed and closed. Notes: ${adminNotes || 'File verified working by admin.'}`,
      type: 'DISPUTE',
      link: '/my-purchases',
    });

    return NextResponse.json({
      success: true,
      message: `Dispute resolved as ${newDisputeStatus}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Resolution failed' }, { status: 500 });
  }
}
