"use server";

import { createClient } from "@/core/supabase/server";

export async function clonePostAction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập trước khi clone." };

  const { data, error } = await supabase.rpc("clone_post", { target_post_id: postId });

  if (error) {
    console.error("[clone] clone_post RPC thất bại:", error);
    return { error: error.message ?? "Clone thất bại." };
  }

  return { success: true as const, projectId: data as string };
}