import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";
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

  return { profile, post, likeCount: likeCount ?? 0, isLiked };
});
