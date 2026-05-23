import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/admin/login', '/offline'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Cookie presence only — JWT validity is enforced in each API route via getAuthUser().
  // The proxy is a UX gate (redirect to login) not a security boundary.
  const token = request.cookies.get('token')?.value;
  if (!token) {
    const isAdmin = pathname.startsWith('/admin');
    return NextResponse.redirect(
      new URL(isAdmin ? '/admin/login' : '/login', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  // Exclude: Next.js internals, API routes, static assets, PWA service worker files
  matcher: ['/((?!_next|api|icons|manifest\\.json|favicon\\.ico|sw\\.js|workbox-).*)'],
};
