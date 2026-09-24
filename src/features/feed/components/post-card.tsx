import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { ReadonlyNodeTree } from "@/features/node-tree-preview/components/readonly-node-tree";
import { PostActionsBar } from "@/features/post-actions/components/post-actions-bar";
import { FeedImageCarousel } from "@/features/post-gallery/components/feed-image-carousel";
import { getPostUrl } from "@/core/utils/site-url";

export function PostCard({ post }: { post: FeedPost }) {
  const canonicalUrl = getPostUrl(post.authorUsername, post.slug);
  const detailUrl = `/${post.authorUsername}/${post.slug}`;

  return (
    <Link
      href={detailUrl}
      className="block overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
    >
      <div className="h-64 w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
  <FeedImageCarousel images={post.gallery} />
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div>
          <p className="truncate text-sm font-semibold text-zinc-900">{post.name}</p>
          <p className="truncate text-xs text-zinc-500">by {post.authorName}</p>
        </div>

        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 p-1.5">
          <ReadonlyNodeTree tree={post.treeData} maxHeight={300} />
        </div>
      </div>

      <div className="border-t border-zinc-200/70 px-4 py-3">
        <PostActionsBar
          postId={post.id}
          postName={post.name}
          canonicalUrl={canonicalUrl}
          detailUrl={detailUrl}
          variant="feed"
          initialLikeCount={post.likeCount}
          initialIsLiked={post.isLiked}
          commentCount={post.commentCount}
          initialCloneCount={post.cloneCount}
        />
      </div>
    </Link>
  );
}
