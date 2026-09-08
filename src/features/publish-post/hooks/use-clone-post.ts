"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBuilderStore } from "@/core/store/builder-store";
import { useRecentProjects } from "@/features/global-shell/hooks/use-recent-projects";
import { clonePostAction } from "../actions/clone-post-action";

const HIGHLIGHT_DURATION_MS = 2500;

export function useClonePost() {
  const [isCloning, setIsCloning] = useState(false);
  const setHighlightedProjectId = useBuilderStore((s) => s.setHighlightedProjectId);
  const { fetchRecentProjects } = useRecentProjects();

  const clonePost = async (postId: string) => {
    setIsCloning(true);
    try {
      const res = await clonePostAction(postId);
      if (!res.success) {
        toast.error(res.error ?? "Clone thất bại.");
        return;
      }
      toast.success("✓ Added to your projects");
      await fetchRecentProjects();
      setHighlightedProjectId(res.projectId);
      setTimeout(() => setHighlightedProjectId(null), HIGHLIGHT_DURATION_MS);
    } finally {
      setIsCloning(false);
    }
  };

  return { clonePost, isCloning };
}