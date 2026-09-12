"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBuilderStore } from "@/core/store/builder-store";
import { updateCommentAction } from "../actions/update-comment-action";
import { deleteCommentAction } from "../actions/delete-comment-action";
import type { CommentItem as CommentItemType } from "../utils/fetch-comments-page";

const MAX_LENGTH = 1000;

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  return `${Math.floor(hours / 24)} ngày trước`;
}

export function CommentItemView({
  comment,
  onUpdated,
  onDeleted,
}: {
  comment: CommentItemType;
  onUpdated: (id: string, content: string, updatedAt: string) => void;
  onDeleted: (id: string) => void;
}) {
  const user = useBuilderStore((s) => s.user);
  const isOwner = user?.id === comment.authorId;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = comment.authorDisplayName ?? comment.authorUsername;
  const isEdited = comment.updatedAt !== comment.createdAt;
  const trimmedDraftLength = draft.trim().length;

  const handleSave = async () => {
    if (trimmedDraftLength < 1 || trimmedDraftLength > MAX_LENGTH) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await updateCommentAction(comment.id, draft);
      if (!res.success) {
        setError(res.error ?? "Couldn't update your comment. Please try again.");
        return;
      }

      onUpdated(comment.id, res.comment.content, res.comment.updated_at);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraft(comment.content);
    setError(null);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await deleteCommentAction(comment.id);
      if (!res.success) {
        setError(res.error ?? "Couldn't delete this comment. Please try again.");
        return;
      }

      onDeleted(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2.5 py-3 border-b last:border-b-0">
      <Avatar size="sm">
        {comment.authorAvatarUrl && <AvatarImage src={comment.authorAvatarUrl} alt={displayName} />}
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium">{displayName}</span>
          {comment.usedProject && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              ✓ Used this project
            </Badge>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-1.5 mt-1">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{trimmedDraftLength}/{MAX_LENGTH}</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || trimmedDraftLength < 1 || trimmedDraftLength > MAX_LENGTH}
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
        )}

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {timeAgo(comment.createdAt)}
            {isEdited && " · edited"}
          </p>

          {isOwner && !isEditing && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Edit
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" className="text-xs text-muted-foreground hover:text-red-500">
                    Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
