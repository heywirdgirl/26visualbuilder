"use server";

import { createClient } from "@/core/supabase/server";

export async function createCommentAction(postId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập để bình luận." };

  const trimmed = content.trim();
  if (trimmed.length < 1) return { error: "Bình luận không được để trống." };
  if (trimmed.length > 1000) return { error: "Bình luận tối đa 1000 ký tự." };

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: user.id, content: trimmed })
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("[comments] Tạo comment thất bại:", error);
    return { error: "Couldn't post your comment. Please try again." };
  }

  const [{ data: profile }, { data: cloneRow }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url").eq("id", user.id).single(),
    supabase.from("clones").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    success: true as const,
    comment: {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      authorId: user.id,
      authorUsername: profile?.username ?? "unknown",
      authorDisplayName: profile?.display_name ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
      usedProject: !!cloneRow,
    },
  };
}
