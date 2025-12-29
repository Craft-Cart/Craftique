import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(request: NextRequest) {
  console.log('[API Route: /api/me] GET request received');
  try {
    const session = await auth0.getSession(request);
    console.log('[API Route: /api/me] Session:', session?.user?.email);
    
    if (!session) {
      console.log('[API Route: /api/me] No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[API Route: /api/me] Returning user data');
    return NextResponse.json({ user: session.user });
  } catch (error) {
    console.error('[API Route: /api/me] Error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}