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
    // Only redirect admin users from home page to admin dashboard
    if (!isLoading && user && pathname === '/') {
      if (isAdmin || isModerator) {
        router.replace('/admin');
      }
    }
  }, [user, isLoading, isAdmin, isModerator, router, pathname]);

  return <>{children}</>;
}
