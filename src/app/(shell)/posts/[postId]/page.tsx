import { notFound, redirect } from "next/navigation";
import { createClient } from "@/core/supabase/server";

export default async function LegacyPostRedirectPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("slug, author_id")
    .eq("id", postId)
    .single();

  if (error || !post) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", post.author_id)
    .single();

  if (!profile) notFound();

  redirect(`/${profile.username}/${post.slug}`);
}
