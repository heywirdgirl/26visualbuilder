// features/auth/hooks/use-auth-actions.ts

"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/core/supabase/client";

export function useAuthActions() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    setIsSigningIn(true);

    try {
      // window.location.origin LUÔN đúng domain thật đang chạy — không đọc biến môi trường
      // nào cả, tránh lặp lại đúng bug NEXT_PUBLIC_SITE_URL sai/thiếu đã gặp.
      const redirectTo = new URL("/auth/callback", window.location.origin).toString();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) console.error("[auth] signInWithOAuth thất bại:", error);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("[auth] signOut thất bại:", error);
      // Không cần tự setUser(null) ở đây — useAuthSync (chạy global) tự nhận event
      // SIGNED_OUT qua onAuthStateChange và cập nhật store, tránh viết state 2 nơi.
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  return { isSigningIn, isSigningOut, signInWithGoogle, signOut };
}