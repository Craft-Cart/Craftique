"use client";

// Auth0 v4 doesn't require a client-side provider
// The session is handled server-side and available through hooks

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}