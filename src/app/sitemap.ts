import type { MetadataRoute } from "next";
import { createClient } from "@/core/supabase/server";
import { getSiteUrl } from "@/core/utils/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
  ];

  const { data: profiles } = await supabase.from("profiles").select("username, updated_at");
  (profiles ?? []).forEach((p) => {
    entries.push({
      url: `${siteUrl}/${p.username}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  });

  const { data: posts } = await supabase
    .from("posts")
    .select("slug, author_id, published_at")
    .eq("is_active", true);

  const authorIds = Array.from(new Set((posts ?? []).map((p) => p.author_id)));
  const { data: postAuthors } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", authorIds.length > 0 ? authorIds : ["00000000-0000-0000-0000-000000000000"]);

  const usernameMap = new Map((postAuthors ?? []).map((p) => [p.id, p.username]));

  (posts ?? []).forEach((post) => {
    const username = usernameMap.get(post.author_id);
    if (!username) return;
    entries.push({
      url: `${siteUrl}/${username}/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  });

  return entries;
}
