// src/core/supabase/proxy.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Tự refresh access token hết hạn TRƯỚC khi request chạm tới Server Component — thiếu bước
// này, Server Component sẽ thấy session cũ/hết hạn dù user vẫn đang đăng nhập trên browser.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // KHÔNG chèn code nào giữa createServerClient và getUser() — 1 sai sót nhỏ ở đây rất khó
  // debug (user bị đăng xuất ngẫu nhiên, không có lỗi rõ ràng nào để lần theo).
  await supabase.auth.getUser();

  return supabaseResponse;
}