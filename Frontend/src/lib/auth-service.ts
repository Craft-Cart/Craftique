import { API_ENDPOINTS } from './endpoints'
import { Auth0User, User } from './types'

export class AuthService {
  private apiBaseUrl: string
  private currentUser: User | null = null
  private roleCache = new Map<string, string>()

  constructor() {
    this.apiBaseUrl = API_ENDPOINTS.auth.verify.split('/auth/verify')[0]
  }

  /**
   * Sync Auth0 user with backend database
   * Call this after successful Auth0 login
   * Uses Next.js API route for server-side token access
   */
  async syncUser(auth0User?: Auth0User): Promise<User> {
    console.log('[AuthService] syncUser - Syncing user with backend');
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.log('[AuthService] syncUser - Sync failed with status:', response.status);
        if (response.redirected || response.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
          }
          throw new Error('Session expired - redirecting to login')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to sync user: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      this.currentUser = data.user
      this.roleCache.set(data.user.email, data.user.role)
      console.log('[AuthService] syncUser - User synced successfully:', data.user.email);
      return data.user
    } catch (error) {
      console.error('[AuthService] syncUser - Error syncing user:', error);
      if (error instanceof TypeError && error.message?.includes('fetch')) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
      throw error
    }
  }

  /**
   * Get current authenticated user from backend
   */
  async getCurrentUser(): Promise<User | null> {
    console.log('[AuthService] getCurrentUser - Fetching current user');
    try {
      const token = await this.getAuthToken()

      const response = await fetch(`${this.apiBaseUrl}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[AuthService] getCurrentUser - User not authenticated');
          this.currentUser = null
          return null
        }
        throw new Error(`Failed to get current user: ${response.statusText}`)
      }

      const user = await response.json()
      this.currentUser = user
      this.roleCache.set(user.email, user.role)
      console.log('[AuthService] getCurrentUser - Current user fetched:', user.email);
      return user
    } catch (error) {
      console.error('[AuthService] getCurrentUser - Error:', error);
      this.currentUser = null
      return null
    }
  }

  /**
   * Get Auth0 access token from client-side
   * Uses Auth0 SDK's built-in /auth/access-token route
   */
  private async getAuthToken(): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('getAuthToken can only be called from client-side')
    }

    console.log('[AuthService] getAuthToken - Getting auth token');
    try {
      const response = await fetch('/auth/access-token', {
        method: 'GET',
        credentials: 'include',
      })

      console.log('[AuthService] getAuthToken - Auth token response:', {
        ok: response.ok,
        status: response.status,
        redirected: response.redirected,
        url: response.url,
      })

      if (!response.ok) {
        if (response.redirected || response.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
          }
          throw new Error('Session expired - redirecting to login')
        }
        throw new Error(`Failed to get token: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[AuthService] getAuthToken - Token data received:', { hasToken: !!data.token })

      if (!data.token) {
        throw new Error('No token in response')
      }

      console.log('[AuthService] getAuthToken - Token retrieved successfully');
      return data.token
    } catch (error: any) {
      console.error('[AuthService] getAuthToken - Error:', error);
      if (error.message?.includes('redirecting')) {
        throw error
      }
      throw new Error(`No authentication token available: ${error.message}`)
    }
  }

  /**
   * Validate token with backend
   */
  async validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
    console.log('[AuthService] validateToken - Validating token');
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        console.log('[AuthService] validateToken - Token invalid');
        return { valid: false }
      }

      const data = await response.json()
      console.log('[AuthService] validateToken - Token valid, user:', data.user?.email);
      return { valid: true, user: data.user }
    } catch (error) {
      console.error('[AuthService] validateToken - Error:', error);
      return { valid: false }
    }
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    if (!this.currentUser) return false
    return this.currentUser.role === role
  }

  /**
   * Check if current user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser) return false
    return roles.includes(this.currentUser.role)
  }

  /**
   * Check if current user is an admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  /**
   * Check if current user is a moderator
   */
  isModerator(): boolean {
    return this.hasRole('moderator')
  }

  /**
   * Check if current user is a customer
   */
  isCustomer(): boolean {
    return this.hasRole('customer')
  }

  /**
   * Check if current user can perform admin-level actions
   */
  canAccessAdmin(): boolean {
    return this.hasAnyRole(['admin', 'moderator'])
  }

  /**
   * Check if current user can manage categories
   */
  canManageCategories(): boolean {
    return this.hasAnyRole(['admin', 'moderator'])
  }

  /**
   * Check if current user can delete categories
   */
  canDeleteCategories(): boolean {
    return this.hasRole('admin')
  }

  /**
   * Check if current user can manage items
   */
  canManageItems(): boolean {
    return this.hasAnyRole(['admin', 'moderator'])
  }

  /**
   * Check if current user can delete items
   */
  canDeleteItems(): boolean {
    return this.hasRole('admin')
  }

  /**
   * Check if current user can access analytics
   */
  canAccessAnalytics(): boolean {
    return this.hasRole('admin')
  }

  /**
   * Check if current user can manage users
   */
  canManageUsers(): boolean {
    return this.hasRole('admin')
  }

  /**
   * Check if current user can moderate reviews
   */
  canModerateReviews(): boolean {
    return this.hasAnyRole(['admin', 'moderator'])
  }

  /**
   * Get cached user role
   */
  getCachedUserRole(email: string): string | null {
    return this.roleCache.get(email) || null
  }

  /**
   * Clear current user and cache
   */
  clearCurrentUser(): void {
    console.log('[AuthService] clearCurrentUser - Clearing current user');
    this.currentUser = null
    this.roleCache.clear()
  }
}

export const authService = new AuthService()