// features/auth/hooks/use-auth-actions.ts
"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/core/supabase/client";

export function useAuthActions() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // 🔍 Debug: Log actual origin
      console.log("[auth] Current origin:", window.location.origin);
      
      const redirectTo = new URL(
        "/auth/callback", 
        window.location.origin
      ).toString();
      
      console.log("[auth] Redirect URL:", redirectTo); // ⭐ Quan trọng!

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (authError) {
        setError(authError.message || "Đăng nhập Google thất bại");
        console.error("[auth] OAuth error:", authError);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối";
      setError(msg);
      console.error("[auth] Exception:", err);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signOut();

      if (authError) {
        setError(authError.message || "Đăng xuất thất bại");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối";
      setError(msg);
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  return { 
    isSigningIn, 
    isSigningOut, 
    error, 
    signInWithGoogle, 
    signOut 
  };
}