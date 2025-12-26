import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function middleware(request: NextRequest) {
  const authRes = await auth0.middleware(request);
  
  // Allow access to auth routes and public routes
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return authRes;
  }
  
  if (request.nextUrl.pathname === '/' || 
      request.nextUrl.pathname.startsWith('/cart') ||
      request.nextUrl.pathname.startsWith('/checkout')) {
    return authRes;
  }
  
  // Protect profile route
  if (request.nextUrl.pathname.startsWith('/profile')) {
    const session = await auth0.getSession(request);
    
    if (!session) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/api/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return authRes;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};