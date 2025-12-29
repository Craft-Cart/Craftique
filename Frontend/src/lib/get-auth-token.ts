/**
 * Get authentication token from Auth0 SDK
 * This utility ensures we get the token properly from HttpOnly cookies
 */

export async function getAuthToken(): Promise<string> {
  try {
    const { authService } = await import('@/lib/auth-service');

    const token = await authService['getAuthToken']();

    if (!token) {
      throw new Error('No auth token available');
    }

    return token;
  } catch (error) {
    throw error;
  }
}
