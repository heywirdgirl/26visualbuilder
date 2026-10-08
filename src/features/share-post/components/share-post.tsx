"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/core/utils/cn";

interface SharePostProps {
  title: string;
  canonicalUrl: string;
  className?: string;
  stopPropagation?: boolean;
  iconOnly?: boolean;
}

export function SharePost({ title, canonicalUrl, className, stopPropagation, iconOnly }: SharePostProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      toast.success("Link copied");
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err) {
      console.error("[share] Clipboard copy thất bại:", err);
      toast.error("Unable to copy link. Please copy the URL manually.", {
        description: canonicalUrl,
        duration: 8000,
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, url: canonicalUrl });
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          console.error("[share] Web Share API thất bại, fallback Copy Link:", err);
        }
      }
      await copyToClipboard();
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      size={iconOnly ? "icon" : "sm"}
      variant="outline"
      className={cn(iconOnly && "h-9 w-9 shrink-0 rounded-full border-zinc-200", className)}
      disabled={isSharing}
      onClick={handleShare}
    >
      {isSharing ? (
        <Loader2 className={cn("h-3.5 w-3.5 animate-spin", !iconOnly && "mr-1.5")} />
      ) : justCopied ? (
        <Check className={cn("h-3.5 w-3.5", !iconOnly && "mr-1.5")} />
      ) : (
        <Share2 className={cn("h-3.5 w-3.5", !iconOnly && "mr-1.5")} />
      )}
      {!iconOnly && (justCopied ? "Copied" : "Share")}
    </Button>
  );
}
