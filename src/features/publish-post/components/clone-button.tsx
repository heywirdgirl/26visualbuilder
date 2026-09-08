"use client";

import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useClonePost } from "../hooks/use-clone-post";

export function CloneButton({ postId, className }: { postId: string; className?: string }) {
  const { clonePost, isCloning } = useClonePost();

  return (
    <Button
      size="sm"
      variant="secondary"
      className={className}
      disabled={isCloning}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void clonePost(postId);
      }}
    >
      {isCloning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
      {isCloning ? "Đang clone..." : "Clone"}
    </Button>
  );
}