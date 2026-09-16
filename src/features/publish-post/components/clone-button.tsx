"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2 } from "lucide-react";
import { useClonePost } from "../hooks/use-clone-post";

const CLONED_STATE_DURATION_MS = 2000;

export function CloneButton({
  postId,
  className,
  onCloned,
}: {
  postId: string;
  className?: string;
  onCloned?: () => void;
}) {
  const { clonePost, isCloning } = useClonePost();
  const [justCloned, setJustCloned] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await clonePost(postId);
    if (!success) return;

    setJustCloned(true);
    onCloned?.();
    setTimeout(() => setJustCloned(false), CLONED_STATE_DURATION_MS);
  };

  return (
    <Button size="sm" className={className} disabled={isCloning} onClick={handleClick}>
      {isCloning ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : justCloned ? (
        <Check className="h-3.5 w-3.5 mr-1.5" />
      ) : (
        <Copy className="h-3.5 w-3.5 mr-1.5" />
      )}
      {isCloning ? "Cloning..." : justCloned ? "Cloned" : "Clone"}
    </Button>
  );
}