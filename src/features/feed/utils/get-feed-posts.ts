import { createClient } from "@/core/supabase/server";
import { TreeNode } from "@/core/types/builder.types";
import { buildGallery, GalleryImage } from "@/features/post-gallery/utils/build-gallery";

export interface FeedPost {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  treeData: TreeNode;
  gallery: GalleryImage[];
  authorUsername: string;
  authorName: string;
  publishedAt: string;
  cloneCount: number;
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
}

export async function getFeedPosts(options?: { authorId?: string }): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select("id, name, slug, tree_data, thumbnail_url, author_id, published_at, clone_count")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (options?.authorId) query = query.eq("author_id", options.authorId);

  const { data: posts, error } = await query;
  if (error || !posts) {
    console.error("[feed] Lỗi tải danh sách bài đăng:", error);
    return [];
  }
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));

  const [{ data: profiles }, { data: allLikes }, { data: userLikes }, { data: allComments }, { data: allPostPages }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name").in("id", authorIds),
    supabase.from("post_likes").select("post_id").in("post_id", postIds),
    user
      ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    supabase.from("comments").select("post_id").in("post_id", postIds),
    supabase.from("post_pages").select("post_id, page_id, image_url").in("post_id", postIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const postPagesMap = new Map<string, { page_id: string; image_url: string }[]>();
  (allPostPages ?? []).forEach((pp) => {
    const arr = postPagesMap.get(pp.post_id) ?? [];
    arr.push({ page_id: pp.page_id, image_url: pp.image_url });
    postPagesMap.set(pp.post_id, arr);
  });

  const likeCountMap = new Map<string, number>();
  (allLikes ?? []).forEach((l) => {
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
  });

  const commentCountMap = new Map<string, number>();
  (allComments ?? []).forEach((c) => {
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1);
  });

  const likedPostIds = new Set((userLikes ?? []).map((l) => l.post_id));

  return posts.map((post) => {
    const profile = profileMap.get(post.author_id);
    return {
      id: post.id,
      name: post.name,
      slug: post.slug,
      thumbnailUrl: post.thumbnail_url,
      treeData: post.tree_data as TreeNode,
      gallery: buildGallery(
        post.tree_data as TreeNode,
        postPagesMap.get(post.id) ?? [],
        post.thumbnail_url,
        post.name
      ),
      authorUsername: profile?.username ?? "unknown",
      authorName: profile?.display_name ?? "Ẩn danh",
      publishedAt: post.published_at,
      cloneCount: post.clone_count,
      likeCount: likeCountMap.get(post.id) ?? 0,
      isLiked: likedPostIds.has(post.id),
      commentCount: commentCountMap.get(post.id) ?? 0,
    };
  });
}
