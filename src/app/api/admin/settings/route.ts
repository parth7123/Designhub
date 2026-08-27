import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { getDriveStorageQuota } from '../../../../lib/services/drive-service';
import fs from 'fs';
import path from 'path';

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

    let finalValue = String(value || '');

    // If key is hero_image_url and value is a base64 image data string, save to public/uploads disk
    if (key === 'hero_image_url' && finalValue.startsWith('data:image/')) {
      const match = finalValue.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'svg+xml' ? 'svg' : match[1] || 'png';
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `hero_banner_${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);

        finalValue = `/uploads/${fileName}`;
      }
    }

    const setting = await db.adminSetting.upsert({
      where: { key },
      update: { value: finalValue },
      create: { key, value: finalValue },
    });

    return NextResponse.json({ success: true, setting, heroUrl: finalValue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update setting' }, { status: 500 });
  }
}
