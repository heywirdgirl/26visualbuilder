"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/core/store/builder-store";
import { usePostComments } from "../hooks/use-post-comments";
import type { CommentItem } from "../utils/fetch-comments-page";
import { CommentItemView } from "./comment-item";
import { CommentComposer } from "./comment-composer";

export function CommentsSection({
  postId,
  initialComments,
  initialTotalCount,
  initialHasMore,
}: {
  postId: string;
  initialComments: CommentItem[];
  initialTotalCount: number;
  initialHasMore: boolean;
}) {
  const user = useBuilderStore((s) => s.user);
  const { comments, totalCount, hasMore, isLoadingMore, loadError, loadMore, setComments, setTotalCount } =
    usePostComments({ postId, initialComments, initialTotalCount, initialHasMore });

  const handleCreated = (comment: CommentItem) => {
    setComments((prev) => [comment, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handleUpdated = (id: string, content: string, updatedAt: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content, updatedAt } : c)));
  };

  const handleDeleted = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Comments ({totalCount})</h2>

      {user ? (
        <CommentComposer postId={postId} onCommentCreated={handleCreated} />
      ) : (
        <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">Sign in to leave a comment.</p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="flex flex-col">
          {comments.map((c) => (
            <CommentItemView key={c.id} comment={c} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {loadError && <p className="text-xs text-red-500 text-center">{loadError}</p>}

      {hasMore && (
        <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore} className="self-center">
          {isLoadingMore && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {isLoadingMore ? "Đang tải..." : "Load more"}
        </Button>
      )}
    </div>
  );
}
