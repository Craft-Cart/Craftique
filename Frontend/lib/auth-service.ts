import { API_ENDPOINTS } from './endpoints'
import { Auth0User, User } from './types'

export class AuthService {
  private apiBaseUrl: string

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
          return null // User not authenticated
        }
        throw new Error(`Failed to get current user: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting current user:', error)
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
}

export const authService = new AuthService()