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
   */
  async syncUser(auth0User: Auth0User): Promise<User> {
    try {
      // Get the Auth0 access token
      const token = await this.getAuthToken()
      
      // Verify token with backend and sync user
      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to sync user: ${response.statusText}`)
      }

      const data = await response.json()
      this.currentUser = data.user
      this.roleCache.set(data.user.email, data.user.role)
      return data.user
    } catch (error) {
      console.error('Error syncing user with backend:', error)
      throw error
    }
  }

  /**
   * Get current authenticated user from backend
   */
  async getCurrentUser(): Promise<User | null> {
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
          this.currentUser = null // User not authenticated
          return null
        }
        throw new Error(`Failed to get current user: ${response.statusText}`)
      }

      const user = await response.json()
      this.currentUser = user
      this.roleCache.set(user.email, user.role)
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      this.currentUser = null
      return null
    }
  }

  /**
   * Get Auth0 access token from client-side
   */
  private async getAuthToken(): Promise<string> {
    // This should be implemented based on your Auth0 client setup
    // For now, we'll try to get it from localStorage or a cookie
    if (typeof window !== 'undefined') {
      // Try to get token from Auth0 SDK or storage
      const auth0Token = localStorage.getItem('auth0_access_token')
      if (auth0Token) {
        return auth0Token
      }
      
      // Fallback: get from cookie (server-side)
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='))
      if (authCookie) {
        return authCookie.split('=')[1]
      }
    }
    
    throw new Error('No authentication token available')
  }

  /**
   * Validate token with backend
   */
  async validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
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
        return { valid: false }
      }

      const data = await response.json()
      return { valid: true, user: data.user }
    } catch (error) {
      console.error('Error validating token:', error)
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
    this.currentUser = null
    this.roleCache.clear()
  }
}

export const authService = new AuthService()