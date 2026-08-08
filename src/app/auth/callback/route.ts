// src/app/auth/callback/route.ts

import { createClient } from "@/core/supabase/server";
import { NextResponse } from "next/server";

// BẮT BUỘC: Ép Next.js không được cache file này dưới dạng static HTML
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const error = requestUrl.searchParams.get("error");

  // Nếu Google/Supabase trả về lỗi OAuth
  if (error) {
    console.error("OAuth Error:", error);
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Đổi code thành công -> Redirect về trang chủ (hoặc 'next')
      // Lệnh này sẽ tự động loại bỏ tham số ?code=... trên thanh địa chỉ
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";

      if (isLocal) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
    } else {
      console.error("Exchange Code Error:", exchangeError);
    }
  }

  // Nếu không có code hoặc đổi code thất bại
  return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`);
}
