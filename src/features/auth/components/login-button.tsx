"use client";

import Link from "next/link";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/core/store/builder-store";
import { useAuthActions } from "@/features/auth/hooks/use-auth-actions";
import { Loader2, LogIn, LogOut, User } from "lucide-react";

export function LoginButton() {
  const user = useBuilderStore((s) => s.user);
  const authLoading = useBuilderStore((s) => s.authLoading);
  const { isSigningIn, isSigningOut, signInWithGoogle, signOut } = useAuthActions();

  if (authLoading) {
    return (
      <Button variant="ghost" size="icon" disabled className="h-8 w-8 rounded-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => void signInWithGoogle()} disabled={isSigningIn}>
        {isSigningIn ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <LogIn className="mr-1.5 h-3.5 w-3.5" />}
        Sign in
      </Button>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const fallback = displayName.slice(0, 2).toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="shrink-0 rounded-full" aria-label="Account menu">
          <Avatar size="sm">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent 
        align="start" 
        side="bottom" 
        sideOffset={4}
        className="w-50 p-0 z-[7000]"
      >
        <div className="flex items-center gap-2.5 border-b p-3">
          <Avatar size="sm">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email ?? "No email"}</p>
          </div>
        </div>

        <div className="flex flex-col p-1">
          <Link href="/profile" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
            <User className="h-3.5 w-3.5" />
            Profile
          </Link>
          <button
            onClick={() => void signOut()}
            disabled={isSigningOut}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}