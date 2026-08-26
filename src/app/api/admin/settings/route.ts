import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { getDriveStorageQuota } from '../../../../lib/services/drive-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const settings = await db.adminSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const driveQuota = await getDriveStorageQuota();

    return NextResponse.json({
      settings: settingsMap,
      driveQuota,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const setting = await db.adminSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update setting' }, { status: 500 });
  }
}
