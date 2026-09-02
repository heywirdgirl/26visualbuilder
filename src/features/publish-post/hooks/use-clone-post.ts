"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clonePostAction } from "../actions/clone-post-action";

export function useClonePost() {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);

  const clonePost = async (postId: string) => {
    setIsCloning(true);
    try {
      const res = await clonePostAction(postId);
      if (!res.success) {
        window.alert(res.error ?? "Clone thất bại.");
        return;
      }
      router.push(`/editor/${res.projectId}`);
    } finally {
      setIsCloning(false);
    }
  };

  return { clonePost, isCloning };
}