import { useUser } from '@auth0/nextjs-auth0/client'
import { useEffect, useState } from 'react'
import { User, UserRole } from '../lib/types'

export function useRBAC() {
  const { user: auth0User, isLoading: authLoading, error } = useUser()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      if (!auth0User) {
        setCurrentUser(null)
        setLoading(false)
        return
      }

      try {
        // Create a mock user object based on Auth0 user data
        // In a real implementation, you would sync this with backend
        const user: User = {
          id: auth0User.sub || '',
          auth0_id: auth0User.sub || '',
          email: auth0User.email || '',
          email_verified: auth0User.email_verified || false,
          name: auth0User.name || '',
          role: (auth0User['https://yourstore.com/role'] as UserRole) || UserRole.customer,
          permissions: auth0User['https://yourstore.com/permissions'] as string[] || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        setCurrentUser(user)
      } catch (err) {
        console.error('Error loading user for RBAC:', err)
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [auth0User])

  const hasRole = (role: UserRole): boolean => {
    return currentUser?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return currentUser ? roles.includes(currentUser.role) : false
  }

  const isAdmin = (): boolean => hasRole(UserRole.admin)
  const isModerator = (): boolean => hasRole(UserRole.moderator)
  const isCustomer = (): boolean => hasRole(UserRole.customer)

  // Permission helpers
  const canAccessAdmin = (): boolean => hasAnyRole([UserRole.admin, UserRole.moderator])
  const canManageCategories = (): boolean => hasAnyRole([UserRole.admin, UserRole.moderator])
  const canDeleteCategories = (): boolean => hasRole(UserRole.admin)
  const canManageItems = (): boolean => hasAnyRole([UserRole.admin, UserRole.moderator])
  const canDeleteItems = (): boolean => hasRole(UserRole.admin)
  const canAccessAnalytics = (): boolean => hasRole(UserRole.admin)
  const canManageUsers = (): boolean => hasRole(UserRole.admin)
  const canModerateReviews = (): boolean => hasAnyRole([UserRole.admin, UserRole.moderator])

  return {
    currentUser,
    loading: authLoading || loading,
    isAuthenticated: !!auth0User,
    error,
    // Role checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isModerator,
    isCustomer,
    // Permission helpers
    canAccessAdmin,
    canManageCategories,
    canDeleteCategories,
    canManageItems,
    canDeleteItems,
    canAccessAnalytics,
    canManageUsers,
    canModerateReviews,
  }
}