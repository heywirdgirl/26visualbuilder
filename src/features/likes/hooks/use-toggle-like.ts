"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBuilderStore } from "@/core/store/builder-store";
import { toggleLikeAction } from "../actions/toggle-like-action";

export function useToggleLike(postId: string, initialIsLiked: boolean, initialLikeCount: number) {
  const user = useBuilderStore((s) => s.user);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isToggling, setIsToggling] = useState(false);

  const toggleLike = async () => {
    if (!user) {
      toast.error("Đăng nhập để thích bài viết.");
      return;
    }
    if (isToggling) return;

    const previousLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!previousLiked);
    setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);
    setIsToggling(true);

    try {
      const res = await toggleLikeAction(postId);
      if (!res.success) {
        setIsLiked(previousLiked);
        setLikeCount(previousCount);
        toast.error(res.error ?? "Không thể thích bài viết.");
        return;
      }
      setIsLiked(res.isLiked);
      setLikeCount(res.likeCount);
    } catch (err) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      console.error("[likes] toggleLike thất bại:", err);
      toast.error("Không thể thích bài viết.");
    } finally {
      setIsToggling(false);
    }
  };

  return { isLiked, likeCount, isToggling, toggleLike };
}
