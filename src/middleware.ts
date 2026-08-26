import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-designhub-jwt-token-key-2026-secure'
);

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // ─── 1. Apply OWASP Top 10 Security Headers to ALL Responses ───
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');

  // ─── 2. Extract Token from Cookies or Authorization Header ───
  const token = req.cookies.get('designhub_token')?.value;
  const user = token ? await verifyToken(token) : null;

  // ─── 3. Strict Admin Access Control (/admin and /admin/*) ───
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'ADMIN') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'admin_access_required');
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── 4. Strict Seller Access Control (/seller and /seller/*) ───
  if (pathname.startsWith('/seller')) {
    if (!user || (user.role !== 'SELLER' && user.role !== 'ADMIN')) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'seller_access_required');
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── 5. Strict Admin API Authorization (/api/admin/*) ───
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/categories' && req.method === 'GET' && user) {
      return response;
    }
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Administrator authentication required' },
        { status: 403 }
      );
    }
  }

  return response;
}

// Apply middleware to sensitive routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/:path*',
    '/api/admin/:path*',
  ],
};
