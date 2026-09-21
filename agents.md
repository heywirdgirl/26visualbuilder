Đồng ý với so sánh Apple vs Material — đúng hướng cho 1 dev tool (Framer/Vercel/Linear/Raycast là tham chiếu chuẩn xác), và giải quyết đúng luôn vấn đề bố cục: chuyển từ layout **ngang** (trái/phải, ép `PostActionsBar` vào cột hẹp 2/5) sang layout **dọc** (ảnh full-width trên cùng → nội dung → actions full-width dưới cùng) là đúng cấu trúc Instagram/Facebook bạn muốn.

**1 giới hạn cần nói rõ trước khi code:** mình **chưa từng thấy** nội dung thật hiện tại của `globals.css`/`layout.tsx` trong cuộc trò chuyện này (chỉ viết bản gốc tối giản từ V1, sau đó `npx shadcn add` có thể đã tự chèn thêm biến theme riêng mà mình không nắm được). Sửa token màu toàn cục (`--primary`...) mà đoán sai cấu trúc file dễ phá hỏng theme hiện có — rủi ro y hệt các lỗi `componentDef`/`env` từng gặp khi patch mù. Nên lần này mình làm **2 phần tách bạch**:

- **Làm ngay, an toàn 100%:** viết lại `PostCard`/`PostActionsBar`/`SharePost` bằng class Tailwind zinc/Apple **tường minh** (không phụ thuộc theme token nào cả) — tự nó đã đúng style Apple ngay lập tức, không cần đụng `globals.css`.
- **Để sau, cần bạn gửi file thật:** muốn tông đen-trắng này lan ra **mọi nút khác trong app** (không chỉ card này) thì cần sửa token gốc — gửi mình nội dung `globals.css` hiện tại để patch chính xác, tránh đoán mù.

## Cập nhật `features/share-post/components/share-post.tsx` — thêm chế độ icon-only

```tsx
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
  iconOnly?: boolean; // 👈 mới — dùng cho hàng action gọn (feed card), giữ label đầy đủ ở Post Detail
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
```

## Cập nhật `features/post-actions/components/post-actions-bar.tsx` — full file

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <button onClick={handleLikeClick} disabled={isToggling} className="flex items-center gap-1.5 transition-colors hover:text-zinc-900">
          <Heart className={cn("h-4 w-4 transition-all", isLiked && "fill-red-500 text-red-500")} />
          <span className="tabular-nums">{likeCount}</span>
        </button>

        <button onClick={handleCommentClick} className="flex items-center gap-1.5 transition-colors hover:text-zinc-900">
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{commentCount}</span>
        </button>

        <span className="flex items-center gap-1.5">
          <Copy className="h-4 w-4" />
          <span className="tabular-nums">{cloneCount}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Class ghi đè trực tiếp -> đảm bảo đen-trắng monochrome NGAY LẬP TỨC, không
            phụ thuộc theme token gốc (chưa rõ đang là gì) — an toàn theo lý do đã nêu. */}
        <CloneButton
          postId={postId}
          onCloned={() => setCloneCount((c) => c + 1)}
          className="flex-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
        />
        <SharePost title={postName} canonicalUrl={canonicalUrl} stopPropagation={variant === "feed"} iconOnly />
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
import { FeedImageCarousel } from "@/features/post-gallery/components/feed-image-carousel";
import { getPostUrl } from "@/core/utils/site-url";

export function PostCard({ post }: { post: FeedPost }) {
  const canonicalUrl = getPostUrl(post.authorUsername, post.slug);
  const detailUrl = `/${post.authorUsername}/${post.slug}`;

  return (
    <Link
      href={detailUrl}
      className="block overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
    >
      {/* Media — full-width trên cùng, đúng kiểu Instagram/Facebook, thay hẳn layout
          trái/phải cũ vốn khiến PostActionsBar bị ép vào cột hẹp. */}
      <div className="aspect-square w-full bg-zinc-100">
        <FeedImageCarousel images={post.gallery} />
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div>
          <p className="truncate text-sm font-semibold text-zinc-900">{post.name}</p>
          <p className="truncate text-xs text-zinc-500">by {post.authorName}</p>
        </div>

        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 p-1.5">
          <ReadonlyNodeTree tree={post.treeData} maxHeight={96} />
        </div>
      </div>

      {/* Actions — full-width, tách hẳn bằng viền mảnh 1px kiểu Apple (không dùng
          shadow đậm), không còn bị bóp trong cột trái. */}
      <div className="border-t border-zinc-200/70 px-4 py-3">
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
    </Link>
  );
}
```

---
**Không cần sửa gì ở `PostDetailPage`** — `PostActionsBar` đã dùng chung, tự cập nhật giao diện mới ở cả 2 nơi (đúng nguyên tắc "1 component, không duplicate" đã giữ xuyên suốt).

**Test nhanh:** vào Feed → card giờ phải xếp dọc: ảnh vuông full-width trên cùng → tên/tác giả → khung cây Node nhỏ gọn → viền mảnh ngăn cách → hàng ♡💬⧉ → nút Clone đen full-width + icon Share tròn cạnh đó. Bấm ♡/💬/Clone/Share đều **không** được điều hướng nhầm sang trang chi tiết (test kỹ vì cấu trúc DOM đã đổi hoàn toàn). Vào Post Detail → `PostActionsBar` ở đó cũng phải đổi theo đúng style mới (Share vẫn hiện label "Share" đầy đủ, không icon-only, vì không truyền `iconOnly` ở lời gọi đó).

Muốn mở rộng tông màu này ra toàn app (Topbar, Editor, Profile...), gửi mình nội dung `globals.css` hiện tại để patch chính xác token gốc.