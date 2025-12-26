"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRBAC } from '@/hooks/use-rbac';

interface AuthRedirectProps {
  children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, isLoading } = useUser();
  const { isAdmin, isModerator } = useRBAC();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect after authentication is complete and user exists
    if (!isLoading && user) {
      // Skip redirect for certain routes
      const skipRoutes = ['/auth', '/api/auth', '/admin'];
      const shouldSkip = skipRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
      

      
      if (!shouldSkip && (isAdmin || isModerator)) {
        router.replace('/admin');
      }
    }
  }, [user, isLoading, isAdmin, isModerator, router, pathname]);

  return <>{children}</>;
}