import { createClient } from "@/core/supabase/server";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";

export interface FeedPost {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  pageNames: string[];
  authorName: string;
  publishedAt: string;
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, name, tree_data, thumbnail_url, author_id, published_at")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (error || !posts) {
    console.error("[feed] Lỗi tải danh sách bài đăng:", error);
    return [];
  }

  // posts.author_id và profiles.id không có FK trực tiếp — query riêng rồi merge tay,
  // thay vì .select("*, profiles(...)") (sẽ không hoạt động với schema hiện tại).
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", authorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return posts.map((post) => ({
    id: post.id,
    name: post.name,
    thumbnailUrl: post.thumbnail_url,
    pageNames: getPageNamesInOrder(post.tree_data as TreeNode),
    authorName: profileMap.get(post.author_id)?.display_name ?? "Ẩn danh",
    publishedAt: post.published_at,
  }));
}
