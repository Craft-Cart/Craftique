import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * API route to get Auth0 access token
 * This is needed because Auth0 SDK stores tokens in HttpOnly cookies
 * that are not accessible from client-side JavaScript
 */
export async function GET(request: NextRequest) {
  console.log('[API Route: /api/auth/token] GET request received');
  try {
    const session = await auth0.getSession(request);
    console.log('[API Route: /api/auth/token] Session:', session?.user?.email);

    if (!session) {
      console.log('[API Route: /api/auth/token] No session found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = new NextResponse();

    console.log('[API Route: /api/auth/token] Getting access token from Auth0');
    const tokenData = await auth0.getAccessToken(request, response);

    if (!tokenData || !tokenData.token) {
      console.log('[API Route: /api/auth/token] No token available');
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    console.log('[API Route: /api/auth/token] Token obtained successfully');
    return NextResponse.json({
      token: tokenData.token,
      expiresAt: session.expiresAt
    });
  } catch (error: any) {
    if (error?.code === 'missing_refresh_token' ||
        error?.code === 'invalid_grant' ||
        error?.message?.includes('access token has expired')) {

      console.log('[API Route: /api/auth/token] Session expired, redirecting to logout');
      return NextResponse.redirect(new URL('/auth/logout', request.url));
    }

    console.error('[API Route: /api/auth/token] Error getting access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token', details: error.message },
      { status: 500 }
    );
  }
}

