
# phase 2
Trước khi vào code, 1 quyết định kiến trúc: PRD mô tả trạng thái "Loading comments..." như thể toàn bộ list fetch phía client — nhưng đúng pattern đã dùng ổn định cho `ProjectsList` (Server Component fetch trước, truyền `initialProjects` xuống Client Component quản lý tiếp), mình sẽ làm y hệt ở đây: **20 comment đầu load sẵn từ server** (nhanh hơn, không có màn hình loading rỗng lúc mới vào trang) — trạng thái "loading" chỉ áp dụng cho **"Load more"**, không phải lần load đầu tiên.

Không cần cài thêm shadcn component nào — `Badge`/`Avatar`/`Button` đã có sẵn từ trước.

## File mới: `features/comments/utils/fetch-comments-page.ts`

Logic lõi dùng chung được cho **cả server lẫn client** (nhận `SupabaseClient` qua tham số, không tự tạo) — tránh viết trùng đúng kiểu "3-query-merge" đã lặp lại nhiều lần trước đây:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  usedProject: boolean; // derive từ clones — KHÔNG lưu field riêng, đúng PRD
}

export const COMMENTS_PAGE_SIZE = 20;

export async function fetchCommentsPage(
  supabase: SupabaseClient,
  postId: string,
  offset: number
): Promise<{ comments: CommentItem[]; totalCount: number; hasMore: boolean }> {
  const { data: comments, count, error } = await supabase
    .from("comments")
    .select("id, content, created_at, updated_at, user_id", { count: "exact" })
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(offset, offset + COMMENTS_PAGE_SIZE - 1);

  if (error || !comments) {
    console.error("[comments] Lỗi tải comments:", error);
    return { comments: [], totalCount: 0, hasMore: false };
  }
  if (comments.length === 0) {
    return { comments: [], totalCount: count ?? 0, hasMore: false };
  }

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));

  const [{ data: profiles }, { data: clones }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", userIds),
    supabase.from("clones").select("user_id").eq("post_id", postId).in("user_id", userIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const usedSet = new Set((clones ?? []).map((c) => c.user_id));

  const items: CommentItem[] = comments.map((c) => {
    const profile = profileMap.get(c.user_id);
    return {
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      authorId: c.user_id,
      authorUsername: profile?.username ?? "unknown",
      authorDisplayName: profile?.display_name ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
      usedProject: usedSet.has(c.user_id),
    };
  });

  const totalCount = count ?? 0;
  return { comments: items, totalCount, hasMore: offset + items.length < totalCount };
}
```

## File mới: `features/comments/utils/get-post-comments.ts`

Wrapper phía server — dùng trong Post Detail page (Server Component):

```typescript
import { createClient } from "@/core/supabase/server";
import { fetchCommentsPage } from "./fetch-comments-page";

export async function getPostComments(postId: string, offset = 0) {
  const supabase = await createClient();
  return fetchCommentsPage(supabase, postId, offset);
}
```

## File mới: `features/comments/hooks/use-post-comments.ts`

Hook client — nhận data ban đầu từ server làm "hạt giống", tự quản lý tiếp `loadMore`. Có sẵn `setComments`/`setTotalCount` xuất ra để **Phase 3** (create/edit/delete) tái sử dụng, không viết lại hook mới:

```typescript
"use client";

import { useState } from "react";
import { createClient } from "@/core/supabase/client";
import { fetchCommentsPage, CommentItem } from "../utils/fetch-comments-page";

interface UsePostCommentsArgs {
  postId: string;
  initialComments: CommentItem[];
  initialTotalCount: number;
  initialHasMore: boolean;
}

export function usePostComments({ postId, initialComments, initialTotalCount, initialHasMore }: UsePostCommentsArgs) {
  const [comments, setComments] = useState(initialComments);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMore = async () => {
    setIsLoadingMore(true);
    setLoadError(null);
    try {
      const supabase = createClient();
      const res = await fetchCommentsPage(supabase, postId, comments.length);
      setComments((prev) => [...prev, ...res.comments]);
      setTotalCount(res.totalCount);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("[comments] Load more thất bại:", err);
      setLoadError("Không tải thêm được bình luận — thử lại.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return { comments, totalCount, hasMore, isLoadingMore, loadError, loadMore, setComments, setTotalCount };
}
```

## File mới: `features/comments/components/comment-item.tsx`

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CommentItem as CommentItemType } from "../utils/fetch-comments-page";

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function CommentItemView({ comment }: { comment: CommentItemType }) {
  const displayName = comment.authorDisplayName ?? comment.authorUsername;
  // created_at/updated_at cùng dùng now() trong 1 transaction lúc INSERT nên LUÔN bằng
  // nhau tuyệt đối tại thời điểm tạo — khác nhau nghĩa chắc chắn đã qua ít nhất 1 lần UPDATE.
  const isEdited = comment.updatedAt !== comment.createdAt;

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
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">✓ Used this project</Badge>
          )}
        </div>

        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>

        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo(comment.createdAt)}
          {isEdited && " · edited"}
        </p>
        {/* Nút Edit/Delete (chỉ hiện với comment của chính mình) thuộc Phase 3 — chưa thêm ở đây */}
      </div>
    </div>
  );
}
```

## File mới: `features/comments/components/comments-section.tsx`

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/core/store/builder-store";
import { usePostComments } from "../hooks/use-post-comments";
import { CommentItemView } from "./comment-item";
import { CommentItem } from "../utils/fetch-comments-page";

export function CommentsSection({
  postId,
  initialComments,
  initialTotalCount,
  initialHasMore,
}: {
  postId: string;
  initialComments: CommentItem[];
  initialTotalCount: number;
  initialHasMore: boolean;
}) {
  const user = useBuilderStore((s) => s.user);
  const { comments, totalCount, hasMore, isLoadingMore, loadError, loadMore } = usePostComments({
    postId,
    initialComments,
    initialTotalCount,
    initialHasMore,
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Comments ({totalCount})</h2>

      {/* CommentComposer thật thuộc Phase 3 — dòng dưới chỉ hiện CTA cho user chưa login,
          đúng phạm vi Phase 2 (chỉ đọc), chưa cho gửi bình luận thật. */}
      {!user && (
        <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
          Sign in to leave a comment.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="flex flex-col">
          {comments.map((c) => (
            <CommentItemView key={c.id} comment={c} />
          ))}
        </div>
      )}

      {loadError && <p className="text-xs text-red-500 text-center">{loadError}</p>}

      {hasMore && (
        <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore} className="self-center">
          {isLoadingMore && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {isLoadingMore ? "Đang tải..." : "Load more"}
        </Button>
      )}
    </div>
  );
}
```

## Patch `src/app/(shell)/[username]/[slug]/page.tsx`

Thêm import:
```typescript
import { getPostComments } from "@/features/comments/utils/get-post-comments";
import { CommentsSection } from "@/features/comments/components/comments-section";
```

Trong `PostDetailPage`, sau đoạn `const canonicalUrl = getPostUrl(...)`, thêm:
```typescript
const { comments, totalCount, hasMore } = await getPostComments(post.id, 0);
```

Thêm vào cuối JSX, sau khối `<CloneButton />`/`<SharePost />`:
```tsx
<div className="border-t pt-4">
  <CommentsSection
    postId={post.id}
    initialComments={comments}
    initialTotalCount={totalCount}
    initialHasMore={hasMore}
  />
</div>
```

---
# phase 3

## File mới: `features/comments/actions/create-comment-action.ts`

```typescript
"use server";

import { createClient } from "@/core/supabase/server";

export async function createCommentAction(postId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập để bình luận." };

  const trimmed = content.trim();
  if (trimmed.length < 1) return { error: "Bình luận không được để trống." };
  if (trimmed.length > 1000) return { error: "Bình luận tối đa 1000 ký tự." };

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: user.id, content: trimmed })
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("[comments] Tạo comment thất bại:", error);
    return { error: "Couldn't post your comment. Please try again." };
  }

  // Lấy profile + kiểm tra đã từng Clone chưa — để UI hiện ĐÚNG badge ngay lập tức,
  // không cần refetch cả trang mới thấy "✓ Used this project".
  const [{ data: profile }, { data: cloneRow }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url").eq("id", user.id).single(),
    supabase.from("clones").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    success: true as const,
    comment: {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      authorId: user.id,
      authorUsername: profile?.username ?? "unknown",
      authorDisplayName: profile?.display_name ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
      usedProject: !!cloneRow,
    },
  };
}
```

## File mới: `features/comments/actions/update-comment-action.ts`

```typescript
"use server";

import { createClient } from "@/core/supabase/server";

export async function updateCommentAction(commentId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  const trimmed = content.trim();
  if (trimmed.length < 1) return { error: "Bình luận không được để trống." };
  if (trimmed.length > 1000) return { error: "Bình luận tối đa 1000 ký tự." };

  // .eq("user_id", user.id) thêm tường minh dù RLS đã chặn — tránh update 0 dòng trong
  // im lặng nếu ai đó cố sửa comment không phải của mình, trả lỗi rõ ràng hơn cho UI.
  const { data, error } = await supabase
    .from("comments")
    .update({ content: trimmed })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("id, content, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("[comments] Sửa comment thất bại:", error);
    return { error: "Couldn't update your comment. Please try again." };
  }

  return { success: true as const, comment: data };
}
```

## File mới: `features/comments/actions/delete-comment-action.ts`

```typescript
"use server";

import { createClient } from "@/core/supabase/server";

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);

  if (error) {
    console.error("[comments] Xoá comment thất bại:", error);
    return { error: "Couldn't delete this comment. Please try again." };
  }

  return { success: true as const };
}
```

## File mới: `features/comments/components/comment-composer.tsx`

```tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createCommentAction } from "../actions/create-comment-action";
import { CommentItem } from "../utils/fetch-comments-page";

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

  if (!user) return null; // CTA "Sign in to leave a comment" đã hiện ở CommentsSection

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
```

## Cập nhật `features/comments/components/comment-item.tsx` — full file

```tsx
"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { updateCommentAction } from "../actions/update-comment-action";
import { deleteCommentAction } from "../actions/delete-comment-action";
import { CommentItem as CommentItemType } from "../utils/fetch-comments-page";

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
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">✓ Used this project</Badge>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-1.5 mt-1">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{trimmedDraftLength}/{MAX_LENGTH}</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
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
              <button onClick={() => setIsEditing(true)} className="text-xs text-muted-foreground hover:text-foreground">
                Edit
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-xs text-muted-foreground hover:text-red-500">Delete</button>
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
```

## Cập nhật `features/comments/components/comments-section.tsx` — full file

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/core/store/builder-store";
import { usePostComments } from "../hooks/use-post-comments";
import { CommentItemView } from "./comment-item";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "../utils/fetch-comments-page";

export function CommentsSection({
  postId,
  initialComments,
  initialTotalCount,
  initialHasMore,
}: {
  postId: string;
  initialComments: CommentItem[];
  initialTotalCount: number;
  initialHasMore: boolean;
}) {
  const user = useBuilderStore((s) => s.user);
  const { comments, totalCount, hasMore, isLoadingMore, loadError, loadMore, setComments, setTotalCount } =
    usePostComments({ postId, initialComments, initialTotalCount, initialHasMore });

  const handleCreated = (comment: CommentItem) => {
    setComments((prev) => [comment, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handleUpdated = (id: string, content: string, updatedAt: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content, updatedAt } : c)));
  };

  const handleDeleted = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Comments ({totalCount})</h2>

      {user ? (
        <CommentComposer postId={postId} onCommentCreated={handleCreated} />
      ) : (
        <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">Sign in to leave a comment.</p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="flex flex-col">
          {comments.map((c) => (
            <CommentItemView key={c.id} comment={c} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {loadError && <p className="text-xs text-red-500 text-center">{loadError}</p>}

      {hasMore && (
        <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore} className="self-center">
          {isLoadingMore && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {isLoadingMore ? "Đang tải..." : "Load more"}
        </Button>
      )}
    </div>
  );
}
```

---
