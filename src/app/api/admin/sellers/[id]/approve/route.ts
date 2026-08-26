import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../../../lib/auth';
import { db } from '../../../../../../lib/db';
import { createAndSendNotification } from '../../../../../../lib/services/email-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { action, commissionOverride, adminNotes } = await req.json(); // action: 'APPROVE' | 'REJECT' | 'SUSPEND'

    if (!['APPROVE', 'REJECT', 'SUSPEND'].includes(action)) {
      return NextResponse.json({ error: 'Invalid approval action' }, { status: 400 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'SUSPENDED';

    const seller = await db.user.update({
      where: { id: sellerId },
      data: {
        status: newStatus,
        ...(commissionOverride !== undefined ? { commissionOverride: parseFloat(commissionOverride) } : {}),
      },
    });

    // Send Notification to Seller
    await createAndSendNotification({
      userId: seller.id,
      userEmail: seller.email,
      title: `Seller Account ${newStatus === 'APPROVED' ? 'Approved — You are Live!' : 'Status Update'}`,
      message: newStatus === 'APPROVED' 
        ? 'Congratulations! Your seller account has been approved by admin. You can now publish design listings and start earning.'
        : `Your seller account status has been set to ${newStatus}. ${adminNotes || ''}`,
      type: 'APPROVAL',
      link: '/seller',
    });

    return NextResponse.json({
      success: true,
      message: `Seller account ${newStatus.toLowerCase()} successfully`,
      seller,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
