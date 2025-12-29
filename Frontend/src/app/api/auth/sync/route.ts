import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * API route to sync Auth0 user with backend database
 * Called automatically after successful Auth0 login
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const responseObj = new NextResponse();

    const tokenData = await auth0.getAccessToken(request, responseObj);

    if (!tokenData || !tokenData.token) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${backendUrl}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Failed to sync user with backend',
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      user: data.user
    });
  } catch (error: any) {
    if (error?.code === 'missing_refresh_token' ||
        error?.code === 'invalid_grant' ||
        error?.message?.includes('access token has expired')) {

      return NextResponse.redirect(new URL('/auth/logout', request.url));
    }

    return NextResponse.json(
      { error: 'Failed to sync user', details: error.message },
      { status: 500 }
    );
  }
}
