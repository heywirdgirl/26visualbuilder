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

  return { profile, post };
});
