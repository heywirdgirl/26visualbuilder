import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { CloneButton } from "@/features/publish-post/components/clone-button";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="w-2/5 p-3 flex flex-col gap-1.5 min-w-0">
        <p className="text-sm font-semibold truncate">{post.name}</p>
        <p className="text-xs text-muted-foreground truncate">bởi {post.authorName}</p>

        <div className="mt-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {post.pageNames.length} trang
          </p>
          <ul className="text-xs text-foreground/80 mt-0.5">
            {post.pageNames.slice(0, 4).map((name) => (
              <li key={name} className="truncate">· {name}</li>
            ))}
            {post.pageNames.length > 4 && (
              <li className="text-muted-foreground">+ {post.pageNames.length - 4} trang khác</li>
            )}
          </ul>
        </div>

        <CloneButton postId={post.id} className="mt-auto w-fit" />
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
