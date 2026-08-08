// features/auth/hooks/use-auth.ts


"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/core/supabase/client";

const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000/";

  url = url.endsWith("/") ? url : `${url}/`;
  url = url.startsWith("http") ? url : `https://${url}`;
  return url;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // 1. Lấy thông tin user hiện tại khi trang load
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // 2. LẮNG NGHE SỰ KIỆN DỰ ÁN THỜI GIAN THỰC (CẬP NHẬT LOGO NGAY LẬP TỨC)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Khi phát hiện đăng nhập thành công hoặc đổi token -> Làm mới UI lập tức
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    setIsSigningIn(true);
    try {
      const redirectUrl = `${getURL()}auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  }, [router]);

  return {
    user,
    loading,
    isSigningIn,
    isSigningOut,
    signInWithGoogle,
    signOut,
  };
}
