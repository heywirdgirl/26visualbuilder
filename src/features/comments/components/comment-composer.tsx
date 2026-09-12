"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBuilderStore } from "@/core/store/builder-store";
import { createCommentAction } from "../actions/create-comment-action";
import type { CommentItem } from "../utils/fetch-comments-page";

const MAX_LENGTH = 1000;

export function CommentComposer({
  postId,
  onCommentCreated,
}: {
  postId: string;
  onCommentCreated: (comment: CommentItem) => void;
}) {
  const user = useBuilderStore((s) => s.user);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const displayName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "You";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const trimmedLength = content.trim().length;

  const handleSubmit = async () => {
    if (trimmedLength < 1 || trimmedLength > MAX_LENGTH) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createCommentAction(postId, content);
      if (!res.success) {
        setError(res.error ?? "Couldn't post your comment. Please try again.");
        return;
      }

      onCommentCreated(res.comment);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2.5">
      <Avatar size="sm">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 flex flex-col gap-1.5">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-red-500">{error}</p>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={trimmedLength < 1 || trimmedLength > MAX_LENGTH || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
