// features/auth/hooks/use-auth-sync.ts

"use client";

import { useEffect } from "react";
import { createClient } from "@/core/supabase/client";
import { useBuilderStore } from "@/core/store/builder-store";

// Gọi ĐÚNG 1 LẦN duy nhất (trong ClientProvider) — không gọi lại ở LoginButton hay bất kỳ
// component nào khác. Mỗi nơi gọi thêm = thêm 1 subscription + 1 lần getSession() độc lập,
// chính là nguyên nhân góp phần vào lỗi "Refresh Token Not Found" đã gặp.
export function useAuthSync() {
  const setUser = useBuilderStore((s) => s.setUser);
  const setAuthLoading = useBuilderStore((s) => s.setAuthLoading);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) console.error("[auth] Lỗi lấy session:", error);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setAuthLoading]);
}