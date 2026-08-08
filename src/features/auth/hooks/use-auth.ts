// features/auth/hooks/use-auth.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/core/supabase/client";

// Hàm helper để lấy URL chính xác dựa trên biến môi trường
const getURL = () => {
  let url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000/';
  // Đảm bảo có dấu '/' ở cuối
  url = url.endsWith('/') ? url : `${url}/`;
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
    
    // Thêm logic lấy session của bạn ở đây nếu cần...
    
  }, []); 

  const signInWithGoogle = useCallback(async () => { 
    const supabase = createClient(); 
    setIsSigningIn(true); 

    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Sử dụng hàm getURL() thay vì window.location.origin
          redirectTo: `${getURL()}auth/callback`,
        },
      });
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
    } finally {
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
