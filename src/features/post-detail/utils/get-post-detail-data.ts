import { cache } from "react";
import { notFound } from "next/navigation";
import { TreeNode } from "@/core/types/builder.types";
import { createClient } from "@/core/supabase/server";
import { buildGallery, GalleryImage } from "@/features/post-gallery/utils/build-gallery";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";

export const getPostDetailData = cache(async (username: string, slug: string) => {
  const profile = await resolveProfileByUsername(username, (u) => `/${u}/${slug}`);

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, name, description, tree_data, thumbnail_url, author_id, published_at, clone_count, is_active")
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .single();

  if (error || !post || !post.is_active) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const { count: likeCount } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  let isLiked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isLiked = !!likeRow;
  }

  const { data: postPages } = await supabase
    .from("post_pages")
    .select("page_id, image_url")
    .eq("post_id", post.id);

  const gallery: GalleryImage[] = buildGallery(
    post.tree_data as TreeNode,
    postPages ?? [],
    post.thumbnail_url,
    post.name
  );

  return { profile, post, likeCount: likeCount ?? 0, isLiked, gallery };
});
