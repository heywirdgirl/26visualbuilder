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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <button onClick={handleLikeClick} disabled={isToggling} className="flex items-center gap-1.5 transition-colors hover:text-zinc-900">
          <Heart className={cn("h-4 w-4 transition-all", isLiked && "fill-red-500 text-red-500")} />
          <span className="tabular-nums">{likeCount}</span>
        </button>

        <button onClick={handleCommentClick} className="flex items-center gap-1.5 transition-colors hover:text-zinc-900">
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{commentCount}</span>
        </button>

        <span className="flex items-center gap-1.5">
          <Copy className="h-4 w-4" />
          <span className="tabular-nums">{cloneCount}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <CloneButton
          postId={postId}
          onCloned={() => setCloneCount((c) => c + 1)}
          className="flex-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
        />
        <SharePost
          title={postName}
          canonicalUrl={canonicalUrl}
          stopPropagation={variant === "feed"}
          iconOnly={variant === "feed"}
        />
      </div>
    </div>
  );
}
