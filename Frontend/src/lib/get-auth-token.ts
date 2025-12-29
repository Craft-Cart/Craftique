/**
 * Get authentication token from Auth0 SDK
 * This utility ensures we get the token properly from HttpOnly cookies
 */

export async function getAuthToken(): Promise<string> {
  console.log('[getAuthToken] Getting auth token');
  try {
    const { authService } = await import('@/lib/auth-service');

    const token = await authService['getAuthToken']();

    if (!token) {
      console.warn('[getAuthToken] No auth token available');
      throw new Error('No auth token available');
    }

    console.log('[getAuthToken] Token obtained successfully');
    return token;
  } catch (error) {
    console.error('[getAuthToken] Error:', error);
    throw error;
  }
}
