"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, LogIn } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRBAC } from '@/hooks/use-rbac';

export function SiteHeader() {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const { user, isLoading } = useUser();
  const { canAccessAdmin, isAdmin, isModerator } = useRBAC();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* MODIFIED: Nested flex row for Logo + Text */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 overflow-hidden rounded-md bg-primary/10 flex items-center justify-center">
            {/* Replace /logo.svg with your actual icon path later */}
            <Image
              src="/icon.svg"
              alt="Craftique Icon"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
            CRAFTIQUE
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Products
          </Link>
          <Link href="/cart" className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              {itemCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 rounded-full px-1.5"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>
          
          {/* Admin/Moderator link - only show for privileged users */}
          {canAccessAdmin && (
            <Link
              href="/admin"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {isAdmin ? 'Admin' : 'Moderator'}
            </Link>
          )}
          
          {/* Profile link - only show when authenticated */}
          {user && (
            <Link
              href="/profile"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Profile
            </Link>
          )}
          
          {/* Auth buttons */}
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <Link href="/auth/logout">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Link>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
            >
              <Link href="/auth/login">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
