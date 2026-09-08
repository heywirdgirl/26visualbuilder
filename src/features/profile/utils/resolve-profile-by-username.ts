import { notFound, redirect } from "next/navigation";
import { createClient } from "@/core/supabase/server";

export interface ResolvedProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export async function resolveProfileByUsername(
  username: string,
  buildRedirectPath: (newUsername: string) => string
): Promise<ResolvedProfile> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .single();

  if (profile) return profile;

  const { data: redirectRow } = await supabase
    .from("username_redirects")
    .select("user_id")
    .eq("old_username", username)
    .single();

  if (redirectRow) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", redirectRow.user_id)
      .single();

    if (currentProfile) redirect(buildRedirectPath(currentProfile.username));
  }

  notFound();
}