import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/admin/login', '/offline'];

// ⚠️ SECURITY NOTE: This middleware is a UX-only routing gate — it routes the browser to
// the right login page but does NOT enforce security. The unverified JWT role decode below
// is intentional and documented. Real authentication and authorization are enforced
// per-route inside each API handler via getAuthUser() + jsonwebtoken signature verification.
// NEVER remove getAuthUser() from an API route assuming this middleware protects it.
function getJwtRole(token: string): string | null {
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(raw));
    return typeof payload?.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const isAdminPath = pathname.startsWith('/admin');

  if (!token) {
    return NextResponse.redirect(
      new URL(isAdminPath ? '/admin/login' : '/login', request.url)
    );
  }

  const role = getJwtRole(token);

  // Staff trying to access admin pages → clear stale cookie + redirect to admin login
  if (isAdminPath && role !== 'admin') {
    const res = NextResponse.redirect(new URL('/admin/login', request.url));
    res.cookies.delete('token');
    return res;
  }

  // Admin trying to access staff pages → redirect to admin dashboard (keep their token)
  if (!isAdminPath && role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude: Next.js internals, API routes, static assets, PWA service worker files
  matcher: ['/((?!_next|api|icons|manifest\\.json|favicon\\.ico|sw\\.js|workbox-).*)'],
};
