import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-designhub-jwt-token-key-2026-secure'
);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<JWTPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get('designhub_token')?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get('designhub_token')?.value;
    } catch (e) {}
  }

  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(user: JWTPayload | null, allowedRoles: ('ADMIN' | 'SELLER' | 'BUYER')[]) {
  if (!user) {
    return { authorized: false, reason: 'Unauthenticated - Please log in' };
  }
  if (!allowedRoles.includes(user.role)) {
    return { authorized: false, reason: `Unauthorized role: ${user.role}. Required: ${allowedRoles.join(', ')}` };
  }
  if (user.role === 'SELLER' && user.status === 'PENDING_APPROVAL') {
    return { authorized: false, reason: 'Seller account pending approval' };
  }
  if (user.role === 'SELLER' && user.status === 'REJECTED') {
    return { authorized: false, reason: 'Seller application rejected' };
  }
  return { authorized: true };
}
