import { useUser } from '@auth0/nextjs-auth0/client'
import { useEffect, useState } from 'react'
import { User, UserRole } from '../lib/types'
import { authService } from '../lib/auth-service'

export function useRBAC() {
  const { user: auth0User, isLoading: authLoading, error } = useUser()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncAttempted, setSyncAttempted] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      if (!auth0User) {
        setCurrentUser(null)
        setLoading(false)
        setSyncAttempted(false)
        authService.clearCurrentUser()
        return
      }

      try {
        // Sync user with backend database
        // This ensures the user exists in the backend and gets real data
        if (!syncAttempted) {
          setSyncAttempted(true)
          try {
            const syncedUser = await authService.syncUser(auth0User)
            setCurrentUser(syncedUser)
            setLoading(false)
            return
          } catch (syncError) {
            console.error('Failed to sync user, falling back to Auth0 data:', syncError)
            // Fallback to Auth0 data if sync fails
          }
        }

        // Fallback: Use Auth0 user data if backend sync fails
        // This ensures the UI still works even if backend is unavailable
        const metadataRole = auth0User['https://craftique-api/roles'] as UserRole;
        let userRole: UserRole = UserRole.customer;
        
        if (metadataRole && Object.values(UserRole).includes(metadataRole)) {
          userRole = metadataRole;
        }

        const user: User = {
          id: auth0User.sub || '',
          auth0_id: auth0User.sub || '',
          email: auth0User.email || '',
          email_verified: auth0User.email_verified || false,
          name: auth0User.name || '',
          role: userRole,
          permissions: auth0User['https://craftique-api/permissions'] as string[] || [],
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
  }, [auth0User, syncAttempted])

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