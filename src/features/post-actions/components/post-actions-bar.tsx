"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Copy } from "lucide-react";
import { useToggleLike } from "@/features/likes/hooks/use-toggle-like";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { cn } from "@/core/utils/cn";

interface PostActionsBarProps {
  postId: string;
  postName: string;
  canonicalUrl: string;
  detailUrl: string;
  variant: "feed" | "detail";
  initialLikeCount: number;
  initialIsLiked: boolean;
  commentCount: number;
  initialCloneCount: number;
}

export function PostActionsBar({
  postId,
  postName,
  canonicalUrl,
  detailUrl,
  variant,
  initialLikeCount,
  initialIsLiked,
  commentCount,
  initialCloneCount,
}: PostActionsBarProps) {
  const router = useRouter();
  const { isLiked, likeCount, isToggling, toggleLike } = useToggleLike(postId, initialIsLiked, initialLikeCount);
  const [cloneCount, setCloneCount] = useState(initialCloneCount);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleLike();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variant === "feed") {
      router.push(`${detailUrl}#comments`);
    } else {
      document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <button onClick={handleLikeClick} disabled={isToggling} className="flex items-center gap-1 hover:text-foreground">
          <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-red-500 text-red-500")} />
          {likeCount}
        </button>

        <button onClick={handleCommentClick} className="flex items-center gap-1 hover:text-foreground">
          <MessageCircle className="h-3.5 w-3.5" />
          {commentCount}
        </button>

        <span className="flex items-center gap-1">
          <Copy className="h-3.5 w-3.5" />
          {cloneCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <CloneButton postId={postId} onCloned={() => setCloneCount((c) => c + 1)} />
        <SharePost title={postName} canonicalUrl={canonicalUrl} stopPropagation={variant === "feed"} />
      </div>
    </div>
  );
}
