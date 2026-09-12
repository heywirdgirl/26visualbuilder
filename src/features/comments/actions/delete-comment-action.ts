"use server";

import { createClient } from "@/core/supabase/server";

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);

  if (error) {
    console.error("[comments] Xoá comment thất bại:", error);
    return { error: "Couldn't delete this comment. Please try again." };
  }

  return { success: true as const };
}
