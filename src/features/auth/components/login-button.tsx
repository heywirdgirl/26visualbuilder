// features/auth/components/login-button.tsx


"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Loader2, LogIn, LogOut } from "lucide-react";

export function LoginButton() {
  const { user, loading, isSigningIn, isSigningOut, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        Đang tải...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => void signInWithGoogle()} disabled={isSigningIn}>
        {isSigningIn ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogIn className="mr-1.5 h-3.5 w-3.5" />
        )}
        Đăng nhập với Google
      </Button>
    );
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const fallback = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2 rounded-md border bg-white/80 px-2 py-2 shadow-sm">
      <Avatar size="sm">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium">{displayName}</p>
        <p className="truncate text-[10px] text-muted-foreground">{user.email ?? "No email"}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={() => void signOut()}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
