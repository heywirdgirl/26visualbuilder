"use server";

import { createClient } from "@/core/supabase/server";

export async function updateCommentAction(commentId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const trimmed = content.trim();
  if (trimmed.length < 1) return { error: "Bình luận không được để trống." };
  if (trimmed.length > 1000) return { error: "Bình luận tối đa 1000 ký tự." };

  const { data, error } = await supabase
    .from("comments")
    .update({ content: trimmed })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("[comments] Sửa comment thất bại:", error);
    return { error: "Couldn't update your comment. Please try again." };
  }

  return { success: true as const, comment: data };
}
