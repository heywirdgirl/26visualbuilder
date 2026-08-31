





## `src/app/editor/page.tsx` — file mới, dời nguyên nội dung `page.tsx` cũ sang đây

```tsx
"use client";

import { AppShell } from "@/features/app-shell/components/app-shell";

export default function EditorScratchPage() {
  return <AppShell />;
}
```

## `features/feed/utils/get-feed-posts.ts` — file mới

```typescript
import { createClient } from "@/core/supabase/server";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";

export interface FeedPost {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  pageNames: string[];
  authorName: string;
  publishedAt: string;
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, name, tree_data, thumbnail_url, author_id, published_at")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (error || !posts) {
    console.error("[feed] Lỗi tải danh sách bài đăng:", error);
    return [];
  }

  // posts.author_id và profiles.id không có FK trực tiếp — query riêng rồi merge tay,
  // thay vì .select("*, profiles(...)") (sẽ không hoạt động với schema hiện tại).
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", authorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return posts.map((post) => ({
    id: post.id,
    name: post.name,
    thumbnailUrl: post.thumbnail_url,
    pageNames: getPageNamesInOrder(post.tree_data as TreeNode),
    authorName: profileMap.get(post.author_id)?.display_name ?? "Ẩn danh",
    publishedAt: post.published_at,
  }));
}
```

## `features/feed/components/post-card.tsx` — file mới

Đúng bố cục bạn yêu cầu: **trái = danh sách trang (Page), phải = ảnh R2**.

```tsx
import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";

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

## `src/app/page.tsx` — full file, thay hoàn toàn nội dung cũ

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { getFeedPosts } from "@/features/feed/utils/get-feed-posts";
import { PostCard } from "@/features/feed/components/post-card";
import { LoginButton } from "@/features/auth/components/login-button";

export default async function FeedPage() {
  const posts = await getFeedPosts();

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">26visualbuilder</h1>
        <div className="flex items-center gap-2">
          <Link href="/editor">
            <Button size="sm">
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Mở Editor
            </Button>
          </Link>
          <LoginButton />
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Chưa có bài đăng nào — hãy là người đầu tiên chia sẻ!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## `src/app/posts/[postId]/page.tsx` — file mới, trang chi tiết

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/core/supabase/server";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("id, name, description, tree_data, thumbnail_url, author_id, published_at, clone_count, is_active")
    .eq("id", postId)
    .single();

  if (error || !post || !post.is_active) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", post.author_id)
    .single();

  const pageNames = getPageNamesInOrder(post.tree_data as TreeNode);

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
        <p className="text-sm text-muted-foreground">bởi {profile?.display_name ?? "Ẩn danh"}</p>
      </div>

      {post.description && <p className="text-sm">{post.description}</p>}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
          Gồm {pageNames.length} trang
        </p>
        <ul className="text-sm flex flex-wrap gap-2">
          {pageNames.map((name) => (
            <li key={name} className="border rounded-full px-2.5 py-0.5 text-xs">{name}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Đăng ngày {new Date(post.published_at).toLocaleDateString("vi-VN")} · {post.clone_count} lượt clone
      </p>

      {/* Nút Clone — thuộc Giai đoạn 3 theo kế hoạch bạn vạch ra, chưa làm ở bước này */}
    </div>
  );
}
```

## Patch `features/app-shell/components/app-shell.tsx`

Thêm link quay lại Feed (trước giờ Editor không có đường về):
```tsx
// Thêm import:
import { Newspaper } from "lucide-react";

// Thêm vào hàng nút, trước "My Projects":
<Link href="/">
  <Button variant="outline" size="sm">
    <Newspaper className="h-3.5 w-3.5 mr-1.5" />
    Feed
  </Button>
</Link>
```

---
**Không cần sửa** `src/app/projects/page.tsx` — `redirect("/")` khi chưa login giờ tự nhiên đưa về Feed công khai (hợp lý hơn cả trước, vì Feed có `LoginButton` sẵn), không phải sửa gì.

**Test nhanh:** vào `/` → phải thấy Feed với ít nhất 1 card (bài bạn đã đăng), trái hiện đúng "1 trang: Home", phải hiện ảnh thumbnail. Bấm card → sang `/posts/<id>` → hiện đúng chi tiết. Bấm "Mở Editor" → sang `/editor`, vẫn đúng hành vi cũ (dựng từ đầu, không load project nào).