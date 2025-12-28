// Temporary helper for demo purposes
// In production, roles should come from Auth0 metadata or backend

export const DEMO_USERS = {
  admin: ['admin@example.com', 'test@admin.com', 'peter@admin.com', 'peter@example.com'],
  moderator: ['moderator@example.com', 'test@moderator.com', 'peter@mod.com'],
  customer: ['user@example.com', 'customer@example.com', 'test@example.com']
}

export function getDemoRole(email?: string): 'admin' | 'moderator' | 'customer' {
  if (!email) return 'customer'
  
  const emailLower = email.toLowerCase()
  
  if (DEMO_USERS.admin.some(adminEmail => adminEmail.toLowerCase() === emailLower)) {
    return 'admin'
  }
  
  if (DEMO_USERS.moderator.some(modEmail => modEmail.toLowerCase() === emailLower)) {
    return 'moderator'
  }
  
  return 'customer'
}