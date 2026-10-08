import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { ReadonlyNodeTree } from "@/features/node-tree-preview/components/readonly-node-tree";
import { PostActionsBar } from "@/features/post-actions/components/post-actions-bar";
import { getPostUrl, getFallbackOgImageUrl } from "@/core/utils/site-url";
import { getPostDetailData } from "@/features/post-detail/utils/get-post-detail-data";
import { getPostComments } from "@/features/comments/utils/get-post-comments";
import { CommentsSection } from "@/features/comments/components/comments-section";
import { PostDetailGallery } from "@/features/post-gallery/components/post-detail-gallery";

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
  const { profile, post, likeCount, isLiked, gallery } = await getPostDetailData(username, slug);
  const canonicalUrl = getPostUrl(profile.username, slug);
  const { comments, totalCount, hasMore } = await getPostComments(post.id, 0);

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại Feed
      </Link>

      <PostDetailGallery images={gallery} />

      <div>
        <h1 className="text-lg font-semibold">{post.name}</h1>
        <Link href={`/${profile.username}`} className="text-sm text-muted-foreground hover:underline">
          bởi {profile.display_name ?? profile.username}
        </Link>
      </div>

      {post.description && <p className="text-sm">{post.description}</p>}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">Cấu trúc dự án</p>
        <div className="border rounded-md p-2 bg-muted/30">
          <ReadonlyNodeTree tree={post.tree_data as TreeNode} maxHeight={320} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Đăng ngày {new Date(post.published_at).toLocaleDateString("vi-VN")}
      </p>

      <PostActionsBar
        postId={post.id}
        postName={post.name}
        canonicalUrl={canonicalUrl}
        detailUrl={`/${profile.username}/${slug}`}
        variant="detail"
        initialLikeCount={likeCount}
        initialIsLiked={isLiked}
        commentCount={totalCount}
        initialCloneCount={post.clone_count}
      />

      <div id="comments" className="border-t pt-4">
        <CommentsSection
          postId={post.id}
          initialComments={comments}
          initialTotalCount={totalCount}
          initialHasMore={hasMore}
        />
      </div>
    </div>
  );
}