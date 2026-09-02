
## File mới: `features/publish-post/hooks/use-clone-post.ts`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clonePostAction } from "../actions/clone-post-action";

export function useClonePost() {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);

  const clonePost = async (postId: string) => {
    setIsCloning(true);
    try {
      const res = await clonePostAction(postId);
      if (!res.success) {
        window.alert(res.error ?? "Clone thất bại.");
        return;
      }
      router.push(`/editor/${res.projectId}`);
    } finally {
      setIsCloning(false);
    }
  };

  return { clonePost, isCloning };
}
```

## File mới: `features/publish-post/components/clone-button.tsx`

```tsx
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
        // preventDefault + stopPropagation bắt buộc — CloneButton nằm trong <Link> của
        // PostCard, thiếu 2 dòng này bấm Clone sẽ vô tình điều hướng sang trang chi tiết.
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
```

## Patch `features/feed/components/post-card.tsx`

```tsx
import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { CloneButton } from "@/features/publish-post/components/clone-button";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="w-2/5 p-3 flex flex-col gap-1.5 min-w-0">
        <p className="text-sm font-semibold truncate">{post.name}</p>
        <p className="text-xs text-muted-foreground truncate">bởi {post.authorName}</p>

        <div className="mt-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {post.pageNames.length} trang
          </p>
          <ul className="text-xs text-foreground/80 mt-0.5">
            {post.pageNames.slice(0, 4).map((name) => (
              <li key={name} className="truncate">· {name}</li>
            ))}
            {post.pageNames.length > 4 && (
              <li className="text-muted-foreground">+ {post.pageNames.length - 4} trang khác</li>
            )}
          </ul>
        </div>

        <CloneButton postId={post.id} className="mt-auto w-fit" />
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

## Patch `src/app/posts/[postId]/page.tsx`

Thêm import:
```typescript
import { CloneButton } from "@/features/publish-post/components/clone-button";
```

Đổi comment placeholder thành nút thật:
```tsx
// Đổi:
{/* Nút Clone — thuộc Giai đoạn 3 theo kế hoạch bạn vạch ra, chưa làm ở bước này */}
// Thành:
<CloneButton postId={post.id} />
```
