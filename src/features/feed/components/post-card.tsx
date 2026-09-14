import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { ReadonlyNodeTree } from "@/features/node-tree-preview/components/readonly-node-tree";
import { getPostUrl } from "@/core/utils/site-url";

export function PostCard({ post }: { post: FeedPost }) {
  const canonicalUrl = getPostUrl(post.authorUsername, post.slug);

  return (
    <Link
      href={`/${post.authorUsername}/${post.slug}`}
      className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="w-2/5 p-3 flex flex-col gap-1.5 min-w-0">
        <p className="text-sm font-semibold truncate">{post.name}</p>
        <p className="text-xs text-muted-foreground truncate">bởi {post.authorName}</p>

        <div className="mt-1 border rounded-md p-1.5 bg-muted/30">
          <ReadonlyNodeTree tree={post.treeData} maxHeight={160} />
        </div>

        <div className="mt-auto flex items-center gap-2">
          <CloneButton postId={post.id} className="w-fit" />
          <SharePost title={post.name} canonicalUrl={canonicalUrl} stopPropagation />
        </div>
      </div>

      <div className="w-3/5 bg-muted">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt={post.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Không có ảnh
          </div>
        )}
      </div>
    </Link>
  );
}
