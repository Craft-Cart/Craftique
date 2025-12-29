import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * API route to sync Auth0 user with backend database
 * Called automatically after successful Auth0 login
 */
export async function POST(request: NextRequest) {
  console.log('[API Route: /api/auth/sync] POST request received');
  try {
    const session = await auth0.getSession(request);
    console.log('[API Route: /api/auth/sync] Session:', session?.user?.email);

    if (!session || !session.user) {
      console.log('[API Route: /api/auth/sync] No session found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const responseObj = new NextResponse();

    console.log('[API Route: /api/auth/sync] Getting access token from Auth0');
    const tokenData = await auth0.getAccessToken(request, responseObj);

    if (!tokenData || !tokenData.token) {
      console.log('[API Route: /api/auth/sync] No token available');
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }
    console.log('[API Route: /api/auth/sync] Access token obtained');

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    console.log('[API Route: /api/auth/sync] Syncing user with backend:', backendUrl);
    const response = await fetch(`${backendUrl}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[API Route: /api/auth/sync] Backend sync failed:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to sync user with backend',
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API Route: /api/auth/sync] User synced successfully:', data.user?.email);

    return NextResponse.json({
      success: true,
      user: data.user
    });
  } catch (error: any) {
    if (error?.code === 'missing_refresh_token' ||
        error?.code === 'invalid_grant' ||
        error?.message?.includes('access token has expired')) {

      console.log('[API Route: /api/auth/sync] Session expired, redirecting to logout');
      return NextResponse.redirect(new URL('/auth/logout', request.url));
    }

    console.error('[API Route: /api/auth/sync] Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user', details: error.message },
      { status: 500 }
    );
  }
}

