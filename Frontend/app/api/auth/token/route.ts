import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * API route to get Auth0 access token
 * This is needed because Auth0 SDK stores tokens in HttpOnly cookies
 * that are not accessible from client-side JavaScript
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create a response object for getAccessToken (required by Auth0 SDK)
    const response = new NextResponse();
    
    // Get access token from Auth0 session
    // getAccessToken requires both req and res in App Router
    const tokenData = await auth0.getAccessToken(request, response);
    
    if (!tokenData || !tokenData.token) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      token: tokenData.token,
      expiresAt: session.expiresAt 
    });
  } catch (error: any) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token', details: error.message },
      { status: 500 }
    );
  }
}

