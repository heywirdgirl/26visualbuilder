## Cập nhật `features/feed/utils/get-feed-posts.ts` — full file

```typescript
import { createClient } from "@/core/supabase/server";
import { TreeNode } from "@/core/types/builder.types";

export interface FeedPost {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  treeData: TreeNode;
  authorUsername: string;
  authorName: string;
  publishedAt: string;
  cloneCount: number;
  likeCount: number;
  isLiked: boolean;
}

export async function getFeedPosts(options?: { authorId?: string }): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select("id, name, slug, tree_data, thumbnail_url, author_id, published_at, clone_count")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (options?.authorId) query = query.eq("author_id", options.authorId);

  const { data: posts, error } = await query;
  if (error || !posts) {
    console.error("[feed] Lỗi tải danh sách bài đăng:", error);
    return [];
  }
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));

  // Batch cho CẢ TRANG cùng lúc — không phải 1 query riêng mỗi post (tránh N+1).
  // post_likes không hỗ trợ COUNT gộp theo post_id qua PostgREST trực tiếp, nên lấy
  // nguyên rows trong batch rồi đếm bằng JS — cùng kỹ thuật đã dùng cho badge
  // "Used this project" ở Comments (Set/Map dựng từ 1 lần fetch, không query lặp lại).
  const [{ data: profiles }, { data: allLikes }, { data: userLikes }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name").in("id", authorIds),
    supabase.from("post_likes").select("post_id").in("post_id", postIds),
    user
      ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const likeCountMap = new Map<string, number>();
  (allLikes ?? []).forEach((l) => {
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
  });

  const likedPostIds = new Set((userLikes ?? []).map((l) => l.post_id));

  return posts.map((post) => {
    const profile = profileMap.get(post.author_id);
    return {
      id: post.id,
      name: post.name,
      slug: post.slug,
      thumbnailUrl: post.thumbnail_url,
      treeData: post.tree_data as TreeNode,
      authorUsername: profile?.username ?? "unknown",
      authorName: profile?.display_name ?? "Ẩn danh",
      publishedAt: post.published_at,
      cloneCount: post.clone_count,
      likeCount: likeCountMap.get(post.id) ?? 0,
      isLiked: likedPostIds.has(post.id),
    };
  });
}
```

## Cập nhật `features/post-detail/utils/get-post-detail-data.ts` — full file

```typescript
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";

export const getPostDetailData = cache(async (username: string, slug: string) => {
  const profile = await resolveProfileByUsername(username, (u) => `/${u}/${slug}`);

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, name, description, tree_data, thumbnail_url, author_id, published_at, clone_count, is_active")
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .single();

  if (error || !post || !post.is_active) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  // Chỉ 1 post ở đây (khác Feed — batch nhiều post cùng lúc) nên dùng thẳng
  // { count: "exact", head: true } của PostgREST — đúng công cụ cho đúng quy mô,
  // không cần fetch rows rồi đếm tay như bên get-feed-posts.ts.
  const { count: likeCount } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  let isLiked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isLiked = !!likeRow;
  }

  return { profile, post, likeCount: likeCount ?? 0, isLiked };
});
```

**Lưu ý:** `PostDetailPage` hiện đang destructure `const { profile, post } = await getPostDetailData(...)` — thêm `likeCount`/`isLiked` vào phần này **không phá gì cả** (backward compatible, chỉ thêm field mới vào object trả về), nhưng bạn cần đổi thành `const { profile, post, likeCount, isLiked } = ...` khi tới **Phase 3** để thật sự dùng 2 giá trị mới này — chưa cần sửa `PostDetailPage`/`PostCard` ở bước này.

---
**Test nhanh (qua console/log tạm, chưa có UI):** thêm tạm 1 vài row vào `post_likes` cho 1-2 post test → gọi `getFeedPosts()` → phải thấy `cloneCount`/`likeCount` đúng số thật, `isLiked` đúng `true`/`false` tuỳ tài khoản đang đăng nhập có nằm trong `post_likes` của post đó không. Gọi `getPostDetailData(username, slug)` cho đúng 1 post đó → `likeCount`/`isLiked` phải khớp y hệt kết quả từ Feed (2 cách tính khác nhau nhưng phải ra cùng đáp số).

# phase 2

## File mới: `features/likes/actions/toggle-like-action.ts`

```typescript
"use server";

import { createClient } from "@/core/supabase/server";

export async function toggleLikeAction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập để thích bài viết." };

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) {
      console.error("[likes] Unlike thất bại:", error);
      return { error: "Không thể bỏ thích — thử lại." };
    }
  } else {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: user.id });
    // primary key (post_id, user_id) tự chặn duplicate ở tầng DB — nếu race condition
    // hiếm gặp (bấm 2 lần liên tiếp quá nhanh) khiến insert trùng, coi là "đã like",
    // không cần báo lỗi khó hiểu cho người dùng.
    if (error && error.code !== "23505") {
      console.error("[likes] Like thất bại:", error);
      return { error: "Không thể thích bài viết — thử lại." };
    }
  }

  // Đếm lại SỐ THẬT ngay sau khi ghi — không tự +1/-1 trên client, tránh lệch nếu có
  // request khác xảy ra đồng thời (đúng nguyên tắc đã áp dụng cho projectCount ở Global Shell).
  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  return { success: true as const, isLiked: !existing, likeCount: count ?? 0 };
}
```

## File mới: `features/likes/hooks/use-toggle-like.ts`

```typescript
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

    // Optimistic update — Like cần phản hồi tức thì (không giống Clone, vốn đã có
    // state "Cloning..." hợp lý để chờ). Rollback lại nếu server trả lỗi.
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
      // Đồng bộ lại đúng số thật từ server — phòng trường hợp có like/unlike khác
      // xảy ra song song trong lúc đang chờ optimistic update ở trên.
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
```

---
**Test nhanh (chưa có UI nút Like — Phase 3):** gọi tạm `toggleLikeAction(postId)` qua 1 nút test bất kỳ hoặc console (Server Action gọi được trực tiếp trong Client Component) → lần 1 phải trả `isLiked: true`, `likeCount` tăng 1; gọi lại lần 2 với cùng `postId` → phải trả `isLiked: false`, giảm về đúng số cũ. Kiểm tra Table Editor → `post_likes` phải có/mất đúng 1 row tương ứng, không tạo trùng dù bấm nhanh liên tục nhiều lần.

# phase 3

Trước khi vào code, 1 khoảng trống dữ liệu cần vá: `get-feed-posts.ts` (Phase 1) chưa hề lấy **số lượng comment** — PRD yêu cầu `💬 4` hiện ngay trên Feed Card, không chỉ ở Post Detail. Thêm 1 batch query nữa theo đúng kỹ thuật đã dùng cho Like (đếm bằng JS từ 1 lần fetch, không N+1).

**1 quyết định dọn dẹp:** dòng "· N lượt clone" cũ trong Post Detail sẽ **bỏ** — trùng lặp thông tin với `⧉ N` trong stats row mới, hiện 2 nơi cùng 1 số dễ gây lệch nhìn (VD Clone ngay lúc đang xem, 1 nơi cập nhật 1 nơi không).

## Patch `features/feed/utils/get-feed-posts.ts`

Thêm vào interface:
```typescript
export interface FeedPost {
  // ...giữ nguyên các field cũ
  commentCount: number; // 👈 thêm
}
```

Thêm batch query (đặt cạnh khối `Promise.all` đã có ở Phase 1):
```typescript
const { data: allComments } = await supabase
  .from("comments")
  .select("post_id")
  .in("post_id", postIds);

const commentCountMap = new Map<string, number>();
(allComments ?? []).forEach((c) => {
  commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1);
});
```

Thêm vào object trả về cuối hàm:
```typescript
commentCount: commentCountMap.get(post.id) ?? 0,
```

## Patch `features/publish-post/hooks/use-clone-post.ts`

Đổi `clonePost` trả về `boolean` — để `CloneButton` biết chính xác có nên bump số liệu/hiện "✓ Cloned" hay không:
```typescript
const clonePost = async (postId: string): Promise<boolean> => {
  setIsCloning(true);
  try {
    const res = await clonePostAction(postId);
    if (!res.success) {
      toast.error(res.error ?? "Clone thất bại.");
      return false; // 👈 đổi từ "return;"
    }
    toast.success("✓ Added to your projects");
    await fetchRecentProjects();
    setHighlightedProjectId(res.projectId);
    setTimeout(() => setHighlightedProjectId(null), HIGHLIGHT_DURATION_MS);
    return true; // 👈 thêm
  } finally {
    setIsCloning(false);
  }
};
```

## Cập nhật `features/publish-post/components/clone-button.tsx` — full file

```tsx
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
  onCloned?: () => void; // PostActionsBar dùng để bump số ⧉ trong stats row
}) {
  const { clonePost, isCloning } = useClonePost();
  const [justCloned, setJustCloned] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await clonePost(postId);
    if (!success) return;

    // "✓ Cloned" chỉ tạm 2s rồi revert lại "Clone" — không khoá nút vĩnh viễn, cho phép
    // clone thêm 1 bản độc lập nếu người dùng thật sự muốn (đúng quyết định đã chốt).
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
```

(Bỏ `variant="secondary"` cũ — mặc định `Button` là filled/primary, đúng yêu cầu PRD "Clone là Primary CTA, nổi bật nhất".)

## File mới: `features/post-actions/components/post-actions-bar.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Copy } from "lucide-react";
import { useToggleLike } from "@/features/likes/hooks/use-toggle-like";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { cn } from "@/core/utils/cn";

interface PostActionsBarProps {
  postId: string;
  postName: string;
  canonicalUrl: string;
  detailUrl: string;
  variant: "feed" | "detail";
  initialLikeCount: number;
  initialIsLiked: boolean;
  commentCount: number;
  initialCloneCount: number;
}

export function PostActionsBar({
  postId,
  postName,
  canonicalUrl,
  detailUrl,
  variant,
  initialLikeCount,
  initialIsLiked,
  commentCount,
  initialCloneCount,
}: PostActionsBarProps) {
  const router = useRouter();
  const { isLiked, likeCount, isToggling, toggleLike } = useToggleLike(postId, initialIsLiked, initialLikeCount);
  const [cloneCount, setCloneCount] = useState(initialCloneCount);

  // preventDefault + stopPropagation LUÔN gọi — vô hại khi variant="detail" (không nằm
  // trong <Link>), bắt buộc khi variant="feed" (PostCard bọc ngoài bằng <Link>).
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleLike();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variant === "feed") {
      router.push(`${detailUrl}#comments`);
    } else {
      document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <button onClick={handleLikeClick} disabled={isToggling} className="flex items-center gap-1 hover:text-foreground">
          <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-red-500 text-red-500")} />
          {likeCount}
        </button>

        <button onClick={handleCommentClick} className="flex items-center gap-1 hover:text-foreground">
          <MessageCircle className="h-3.5 w-3.5" />
          {commentCount}
        </button>

        <span className="flex items-center gap-1">
          <Copy className="h-3.5 w-3.5" />
          {cloneCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <CloneButton postId={postId} onCloned={() => setCloneCount((c) => c + 1)} />
        <SharePost title={postName} canonicalUrl={canonicalUrl} stopPropagation={variant === "feed"} />
      </div>
    </div>
  );
}
```

## Cập nhật `features/feed/components/post-card.tsx` — full file

```tsx
import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { ReadonlyNodeTree } from "@/features/node-tree-preview/components/readonly-node-tree";
import { PostActionsBar } from "@/features/post-actions/components/post-actions-bar";
import { getPostUrl } from "@/core/utils/site-url";

export function PostCard({ post }: { post: FeedPost }) {
  const canonicalUrl = getPostUrl(post.authorUsername, post.slug);
  const detailUrl = `/${post.authorUsername}/${post.slug}`;

  return (
    <Link href={detailUrl} className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
      <div className="w-2/5 p-3 flex flex-col gap-1.5 min-w-0">
        <p className="text-sm font-semibold truncate">{post.name}</p>
        <p className="text-xs text-muted-foreground truncate">bởi {post.authorName}</p>

        <div className="mt-1 border rounded-md p-1.5 bg-muted/30">
          <ReadonlyNodeTree tree={post.treeData} maxHeight={160} />
        </div>

        <div className="mt-auto">
          <PostActionsBar
            postId={post.id}
            postName={post.name}
            canonicalUrl={canonicalUrl}
            detailUrl={detailUrl}
            variant="feed"
            initialLikeCount={post.likeCount}
            initialIsLiked={post.isLiked}
            commentCount={post.commentCount}
            initialCloneCount={post.cloneCount}
          />
        </div>
      </div>

      <div className="w-3/5 bg-muted">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt={post.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Không có ảnh
          </div>
        )}
      </div>
    </Link>
  );
}
```

## Cập nhật `src/app/(shell)/[username]/[slug]/page.tsx` — full file

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReadonlyNodeTree } from "@/features/node-tree-preview/components/readonly-node-tree";
import { PostActionsBar } from "@/features/post-actions/components/post-actions-bar";
import { getPostUrl, getFallbackOgImageUrl } from "@/core/utils/site-url";
import { getPostDetailData } from "@/features/post-detail/utils/get-post-detail-data";
import { getPostComments } from "@/features/comments/utils/get-post-comments";
import { CommentsSection } from "@/features/comments/components/comments-section";
import { TreeNode } from "@/core/types/builder.types";

interface PageParams {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { username, slug } = await params;
  const { profile, post } = await getPostDetailData(username, slug);

  const canonicalUrl = getPostUrl(profile.username, slug);
  const authorName = profile.display_name ?? profile.username;
  const description = post.description || "A visual creation published with 26VisualBuilder.";
  const imageUrl = post.thumbnail_url || getFallbackOgImageUrl();

  return {
    title: `${post.name} — ${authorName} | 26VisualBuilder`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.name,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.name,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PostDetailPage({ params }: PageParams) {
  const { username, slug } = await params;
  const { profile, post, likeCount, isLiked } = await getPostDetailData(username, slug);
  const canonicalUrl = getPostUrl(profile.username, slug);
  const { comments, totalCount, hasMore } = await getPostComments(post.id, 0);

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại Feed
      </Link>

      {post.thumbnail_url && (
        <img src={post.thumbnail_url} alt={post.name} className="w-full rounded-lg border" />
      )}

      <div>
        <h1 className="text-lg font-semibold">{post.name}</h1>
        <Link href={`/${profile.username}`} className="text-sm text-muted-foreground hover:underline">
          bởi {profile.display_name ?? profile.username}
        </Link>
      </div>

      {post.description && <p className="text-sm">{post.description}</p>}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">Cấu trúc dự án</p>
        <div className="border rounded-md p-2 bg-muted/30">
          <ReadonlyNodeTree tree={post.tree_data as TreeNode} maxHeight={320} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Đăng ngày {new Date(post.published_at).toLocaleDateString("vi-VN")}
      </p>

      <PostActionsBar
        postId={post.id}
        postName={post.name}
        canonicalUrl={canonicalUrl}
        detailUrl={`/${profile.username}/${slug}`}
        variant="detail"
        initialLikeCount={likeCount}
        initialIsLiked={isLiked}
        commentCount={totalCount}
        initialCloneCount={post.clone_count}
      />

      <div id="comments" className="border-t pt-4">
        <CommentsSection
          postId={post.id}
          initialComments={comments}
          initialTotalCount={totalCount}
          initialHasMore={hasMore}
        />
      </div>
    </div>
  );
}
```

---
**Đối chiếu Acceptance Criteria PRD:** Clone primary/filled ✅ · Like toggle optimistic (không delay) ✅ · Comment click đúng 2 hành vi khác nhau theo variant ✅ · Share tái dùng nguyên component cũ, không viết lại ✅ · Không có Statistics section riêng, stats gộp 1 dòng ✅ · Không animation/gradient chói cho Clone (chỉ dùng biến thể mặc định của Button) ✅.

**Test nhanh:** Feed → bấm ♡ trên 1 card → phải đổi màu đỏ + tăng số **ngay lập tức** (không đợi network), không điều hướng nhầm sang chi tiết. Bấm 💬 N → phải chuyển sang trang chi tiết **và tự cuộn xuống đúng khối bình luận**. Ở Post Detail, bấm 💬 N → chỉ cuộn mượt, **không** đổi URL/reload. Bấm Clone → nút đổi "Cloning..." → "✓ Cloned" → sau 2s về lại "Clone", đồng thời số `⧉` cạnh đó phải **tăng ngay tại chỗ**, không cần reload trang.