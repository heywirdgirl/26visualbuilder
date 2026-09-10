import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { getPostUrl, getFallbackOgImageUrl } from "@/core/utils/site-url";
import { getPostDetailData } from "@/features/post-detail/utils/get-post-detail-data";

interface PageParams {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { username, slug } = await params;
  const { profile, post } = await getPostDetailData(username, slug);

  const canonicalUrl = getPostUrl(profile.username, slug);
  const authorName = profile.display_name ?? profile.username;
  const description = post.description || "A visual creation published with 26VisualBuilder.";
  const imageUrl = post.thumbnail_url || getFallbackOgImageUrl();

  return {
    title: `${post.name} — ${authorName} | 26VisualBuilder`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.name,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.name,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PostDetailPage({ params }: PageParams) {
  const { username, slug } = await params;
  const { profile, post } = await getPostDetailData(username, slug);

  const pageNames = getPageNamesInOrder(post.tree_data as TreeNode);
  const canonicalUrl = getPostUrl(profile.username, slug);

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

      <div className="flex items-center gap-2">
        <CloneButton postId={post.id} />
        <SharePost title={post.name} canonicalUrl={canonicalUrl} />
      </div>
    </div>
  );
}