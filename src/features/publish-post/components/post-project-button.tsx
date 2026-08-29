"use client";

import { Button } from "@/components/ui/button";
import { Rocket, Loader2 } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { usePreparePost } from "../hooks/use-prepare-post";

export function PostProjectButton() {
  const user = useBuilderStore((s) => s.user);
  const { preparePost, isPreparing } = usePreparePost();

  return (
    <Button variant="outline" size="sm" onClick={preparePost} disabled={!user || isPreparing}>
      {isPreparing ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Rocket className="mr-1.5 h-3.5 w-3.5" />
      )}
      {isPreparing ? "Đang chuẩn bị..." : "Post"}
    </Button>
  );
}
