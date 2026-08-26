import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { hashPassword, signToken } from '../../../../lib/auth';
import { createRazorpayLinkedAccount } from '../../../../lib/services/razorpay-service';
import { createAndSendNotification } from '../../../../lib/services/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, password, name, role, businessName, bankAccountNo, ifscCode, accountHolderName } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['BUYER', 'SELLER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid account role' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.trim() : null;

    const existing = await db.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email or phone number already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    let razorpayAccountId: string | undefined = undefined;
    let status: 'APPROVED' | 'PENDING_APPROVAL' = role === 'BUYER' ? 'APPROVED' : 'PENDING_APPROVAL';

    if (role === 'SELLER') {
      if (!businessName || !bankAccountNo || !ifscCode) {
        return NextResponse.json(
          { error: 'Sellers must provide business name, bank account number, and IFSC code for Razorpay Route payouts' },
          { status: 400 }
        );
      }

      // Create linked account on Razorpay Route
      razorpayAccountId = await createRazorpayLinkedAccount({
        name: accountHolderName || name,
        email: cleanEmail,
        businessName,
        bankAccountNo,
        ifscCode,
      });
    }

    const user = await db.user.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        name,
        passwordHash,
        role: role as 'BUYER' | 'SELLER',
        status,
        razorpayAccountId,
        businessName,
        bankAccountNo,
        ifscCode,
        accountHolderName: accountHolderName || name,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'SELLER' | 'BUYER',
      status: user.status as any,
    });

    // Notify admins if seller registered
    if (role === 'SELLER') {
      const admins = await db.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await createAndSendNotification({
          userId: admin.id,
          userEmail: admin.email,
          title: 'New Seller Registration Pending Approval',
          message: `Seller "${name}" (${businessName}) registered and is awaiting admin KYC approval.`,
          type: 'APPROVAL',
          link: '/admin/sellers',
        });
      }
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
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
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
