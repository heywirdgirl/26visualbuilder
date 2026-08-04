// src/proxy.ts

import { updateSession } from "@/core/supabase/proxy";
import { type NextRequest } from "next/server";

// Next 16 đổi tên middleware.ts -> proxy.ts, export function CŨNG PHẢI đổi tên
// từ "middleware" thành "proxy" — sai tên export, file bị Next lặng lẽ bỏ qua, không báo lỗi.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};