// features/auth/hooks/use-auth.ts


"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/core/supabase/client";

const getURL = () => {
  let url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000/";
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    
    // Lấy user ban đầu
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };
    initSession();

    // Lắng nghe thay đổi trạng thái
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
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
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Bắt buộc dùng getURL() để truyền đúng origin của Netlify
          redirectTo: `${getURL()}auth/callback`,
        },
      });
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
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
