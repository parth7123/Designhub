import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../lib/auth';
import { getAdminAnalyticsData } from '../../../../lib/services/analytics-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const data = await getAdminAnalyticsData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
