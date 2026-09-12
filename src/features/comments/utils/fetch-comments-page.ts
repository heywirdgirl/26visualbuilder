import type { SupabaseClient } from "@supabase/supabase-js";

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  usedProject: boolean;
}

export const COMMENTS_PAGE_SIZE = 20;

export async function fetchCommentsPage(
  supabase: SupabaseClient,
  postId: string,
  offset: number
): Promise<{ comments: CommentItem[]; totalCount: number; hasMore: boolean }> {
  const { data: comments, count, error } = await supabase
    .from("comments")
    .select("id, content, created_at, updated_at, user_id", { count: "exact" })
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(offset, offset + COMMENTS_PAGE_SIZE - 1);

  if (error || !comments) {
    console.error("[comments] Lỗi tải comments:", error);
    return { comments: [], totalCount: 0, hasMore: false };
  }

  if (comments.length === 0) {
    return { comments: [], totalCount: count ?? 0, hasMore: false };
  }

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));

  const [{ data: profiles }, { data: clones }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", userIds),
    supabase.from("clones").select("user_id").eq("post_id", postId).in("user_id", userIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const usedSet = new Set((clones ?? []).map((c) => c.user_id));

  const items: CommentItem[] = comments.map((c) => {
    const profile = profileMap.get(c.user_id);
    return {
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      authorId: c.user_id,
      authorUsername: profile?.username ?? "unknown",
      authorDisplayName: profile?.display_name ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
      usedProject: usedSet.has(c.user_id),
    };
  });

  const totalCount = count ?? 0;
  return { comments: items, totalCount, hasMore: offset + items.length < totalCount };
}
