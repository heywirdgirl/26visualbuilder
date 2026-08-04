// src/core/supabase/client.ts


import { createBrowserClient } from "@supabase/ssr";

// Dùng trong Client Component ("use client") — mọi nơi cần gọi signInWithOAuth/signOut.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}