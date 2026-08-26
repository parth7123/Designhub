import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { comparePassword, signToken } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.email || body.phone || body.identifier || '').trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/Phone number and password are required' }, { status: 400 });
    }

    // Lookup user by email OR phone number
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email/phone number or password' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email/phone number or password' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'SELLER' | 'BUYER',
      status: user.status as any,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        businessName: user.businessName,
      },
    });

    res.cookies.set('designhub_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
