// src/app/auth/callback/route.ts

import { createClient } from "@/core/supabase/server";
import { NextResponse } from "next/server";

// BẮT BUỘC TRÊN NETLIFY: Không cache API này
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Nếu có tham số next thì lấy, không thì mặc định về trang chủ
  const next = searchParams.get("next") ?? "/"; 
  const error = searchParams.get("error");

  // Xử lý nếu Google trả về lỗi ngay từ đầu
  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Đổi code lấy phiên đăng nhập (Session)
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // THÀNH CÔNG: Chuyển hướng người dùng về trang chủ (hoặc trang next)
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // THẤT BẠI: Báo lỗi
      console.error("Lỗi xác thực Supabase:", exchangeError.message);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
  }

  // Nếu truy cập link không có code cũng không có error -> Đá về trang chủ
  return NextResponse.redirect(origin);
}
