"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/core/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    setIsSigningIn(true);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).toString()
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: redirectTo
          ? {
              redirectTo,
              flowType: "pkce",
            }
          : undefined,
      });

      if (error) throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  return {
    user,
    loading,
    isSigningIn,
    isSigningOut,
    signInWithGoogle,
    signOut,
  };
}
