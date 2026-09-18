"use server";

import { createClient } from "@/core/supabase/server";

export async function toggleLikeAction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập để thích bài viết." };

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) {
      console.error("[likes] Unlike thất bại:", error);
      return { error: "Không thể bỏ thích — thử lại." };
    }
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    if (error && error.code !== "23505") {
      console.error("[likes] Like thất bại:", error);
      return { error: "Không thể thích bài viết — thử lại." };
    }
  }

  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  return { success: true as const, isLiked: !existing, likeCount: count ?? 0 };
}
