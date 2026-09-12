import { createClient } from "@/core/supabase/server";
import { fetchCommentsPage } from "./fetch-comments-page";

export async function getPostComments(postId: string, offset = 0) {
  const supabase = await createClient();
  return fetchCommentsPage(supabase, postId, offset);
}
