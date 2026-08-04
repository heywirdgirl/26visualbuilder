// src/core/supabase/server.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Dùng trong Server Component / Route Handler. Next 16: cookies() là async — thiếu await
// sẽ crash runtime, không phải lỗi biên dịch, dễ bỏ sót nếu copy nhầm code Next cũ.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Gọi từ Server Component thuần (không phải Route Handler/Server Action) —
            // bỏ qua an toàn vì proxy.ts (dưới đây) đã đảm nhiệm việc refresh session rồi.
          }
        },
      },
    }
  );
}