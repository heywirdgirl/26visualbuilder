"use client";

import { useState } from "react";
import { createClient } from "@/core/supabase/client";
import { fetchCommentsPage, type CommentItem } from "../utils/fetch-comments-page";

interface UsePostCommentsArgs {
  postId: string;
  initialComments: CommentItem[];
  initialTotalCount: number;
  initialHasMore: boolean;
}

export function usePostComments({
  postId,
  initialComments,
  initialTotalCount,
  initialHasMore,
}: UsePostCommentsArgs) {
  const [comments, setComments] = useState(initialComments);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMore = async () => {
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const supabase = createClient();
      const res = await fetchCommentsPage(supabase, postId, comments.length);
      setComments((prev) => [...prev, ...res.comments]);
      setTotalCount(res.totalCount);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("[comments] Load more thất bại:", err);
      setLoadError("Không tải thêm được bình luận — thử lại.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return { comments, totalCount, hasMore, isLoadingMore, loadError, loadMore, setComments, setTotalCount };
}
