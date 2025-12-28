/**
 * Get authentication token from Auth0 SDK
 * This utility ensures we get the token properly from HttpOnly cookies
 */

export async function getAuthToken(): Promise<string> {
  try {
    // Import auth-service dynamically to avoid circular dependencies
    const { authService } = await import('@/lib/auth-service');

    // Use the proper auth-service method that handles HttpOnly cookies
    const token = await authService['getAuthToken']();

    if (!token) {
      console.warn('No auth token available');
      throw new Error('No auth token available');
    }

    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}
