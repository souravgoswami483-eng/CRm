import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'vortex_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'vortex_jwt_secret_indiranagar_bengaluru_2026_crm_secure_hash';

interface SessionPayload {
  userId: string;
  role: 'ADMIN' | 'CLIENT';
  clientId?: string;
  name: string;
  email: string;
  mustChangePassword?: boolean;
  exp: number;
}

async function verifySessionTokenEdge(token: string | undefined): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataStr, sigStr] = parts;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const binarySig = atob(sigStr.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(dataStr));
    if (!isValid) return null;

    const jsonStr = atob(dataStr.replace(/-/g, '+').replace(/_/g, '/'));
    const payload: SessionPayload = JSON.parse(jsonStr);
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, next internal routes, and public auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionTokenEdge(token);

  // If request is to an API route
  if (pathname.startsWith('/api')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Role-specific API protections
    if (pathname.startsWith('/api/clients')) {
      if (session.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Admin privilege required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // If request is to an Admin page route
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/portal', request.url));
    }
    return NextResponse.next();
  }

  // If request is to a Client Portal page route
  if (pathname.startsWith('/portal')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Admin can also view portal (for previewing client view)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/api/:path*'],
};
