import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";
import { createClient } from "@/core/supabase/server";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const profile = await resolveProfileByUsername(username, (newUsername) => `/${newUsername}/${slug}`);

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, name, description, tree_data, thumbnail_url, author_id, published_at, clone_count, is_active")
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .single();

  if (error || !post || !post.is_active) notFound();

  const pageNames = getPageNamesInOrder(post.tree_data as TreeNode);

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại Feed
      </Link>

      {post.thumbnail_url && (
        <img src={post.thumbnail_url} alt={post.name} className="w-full rounded-lg border" />
      )}

      <div>
        <h1 className="text-lg font-semibold">{post.name}</h1>
        <Link href={`/${profile.username}`} className="text-sm text-muted-foreground hover:underline">
          bởi {profile.display_name ?? profile.username}
        </Link>
      </div>

      {post.description && <p className="text-sm">{post.description}</p>}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
          Gồm {pageNames.length} trang
        </p>
        <ul className="text-sm flex flex-wrap gap-2">
          {pageNames.map((name) => (
            <li key={name} className="border rounded-full px-2.5 py-0.5 text-xs">{name}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Đăng ngày {new Date(post.published_at).toLocaleDateString("vi-VN")} · {post.clone_count} lượt clone
      </p>

      <CloneButton postId={post.id} />
    </div>
  );
}