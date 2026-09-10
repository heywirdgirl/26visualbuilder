# Phase 1

```bash
npm install server-only
```

## File mới: `core/utils/site-url.ts`

```typescript
import "server-only"; // build sẽ báo lỗi ngay nếu file này lỡ bị import vào Client Component

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name} — kiểm tra .env.local hoặc wrangler.jsonc.`);
  }
  return value;
}

// KHÔNG dùng tiền tố NEXT_PUBLIC_ — đúng bài học từ NEXT_PUBLIC_SITE_URL từng gây bug
// redirect sai domain ở luồng login OAuth. Chỉ server đọc biến này (Share, Metadata,
// Sitemap đều chạy server-side), nên không cần "đóng cứng" lúc build như R2_PUBLIC_URL.
export function getSiteUrl(): string {
  return requireEnv("SITE_URL").replace(/\/+$/, ""); // bỏ "/" thừa cuối, tránh double-slash khi ghép path
}

export function getPostUrl(username: string, slug: string): string {
  return `${getSiteUrl()}/${username}/${slug}`;
}

export function getProfileUrl(username: string): string {
  return `${getSiteUrl()}/${username}`;
}

// Fallback OG image khi post.thumbnail_url null (hiếm, nhưng vẫn cần đúng PRD mục 9).
// File ảnh thật (public/og-fallback.png) là việc bạn chuẩn bị ở Phase 5, chưa cần có ngay.
export function getFallbackOgImageUrl(): string {
  return `${getSiteUrl()}/og-fallback.png`;
}
```

## Patch `.env.local`

```
SITE_URL=http://localhost:3000
```

(Dùng `localhost:3000` cho dev — Phase 5 khi deploy thật, giá trị trên Cloudflare Dashboard/`wrangler.jsonc` sẽ là domain thật, không phải file này.)

## Patch `wrangler.jsonc`

```jsonc
{
  "r2_buckets": [
    { "binding": "THUMBNAILS_BUCKET", "bucket_name": "26visualbuilder-image" }
  ],
  "vars": {
    "R2_PUBLIC_URL": "https://pub-xxxx.r2.dev",
    "SITE_URL": "https://26visualbuilder.awsmydream.workers.dev"
  }
}
```

(Giữ nguyên `R2_PUBLIC_URL` đã có — chỉ thêm dòng `SITE_URL` mới vào object `vars`.)

---
# Phase 2

## File mới: `features/share-post/components/share-post.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/core/utils/cn";

interface SharePostProps {
  title: string;
  canonicalUrl: string; // luôn nhận từ prop (Server Component cha tính sẵn) — không tự
                         // tính bằng window.location, đúng quyết định kiến trúc Phase 1.
  className?: string;
  stopPropagation?: boolean; // bật khi đặt trong Feed Card (nested trong <Link>)
}

export function SharePost({ title, canonicalUrl, className, stopPropagation }: SharePostProps) {
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
      // PRD mục 16 — Clipboard API cũng lỗi thì hiện URL để user tự copy tay.
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
          // Payload tối thiểu đúng PRD mục 3 — chỉ title + url.
          await navigator.share({ title, url: canonicalUrl });
          return; // native share sheet tự xử lý hết
        } catch (err) {
          // AbortError = user tự bấm Cancel — KHÔNG rơi xuống fallback Copy Link,
          // nếu không sẽ rất khó chịu (Cancel share xong lại bị copy link).
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
    <Button size="sm" variant="outline" className={cn(className)} disabled={isSharing} onClick={handleShare}>
      {isSharing ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : justCopied ? (
        <Check className="h-3.5 w-3.5 mr-1.5" />
      ) : (
        <Share2 className="h-3.5 w-3.5 mr-1.5" />
      )}
      {justCopied ? "Copied" : "Share"}
    </Button>
  );
}
```

## Cập nhật `features/feed/components/post-card.tsx` — full file

```tsx
import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { getPostUrl } from "@/core/utils/site-url";

export function PostCard({ post }: { post: FeedPost }) {
  // PostCard là Server Component — tính canonicalUrl ở đây (server-only an toàn), truyền
  // xuống SharePost (Client Component) qua prop, đúng ranh giới kiến trúc đã chốt Phase 1.
  const canonicalUrl = getPostUrl(post.authorUsername, post.slug);

  return (
    <Link
      href={`/${post.authorUsername}/${post.slug}`}
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

        <div className="mt-auto flex items-center gap-2">
          <CloneButton postId={post.id} />
          <SharePost title={post.name} canonicalUrl={canonicalUrl} stopPropagation />
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
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/core/supabase/server";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { getPostUrl } from "@/core/utils/site-url";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const profile = await resolveProfileByUsername(username, (u) => `/${u}/${slug}`);

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, name, description, tree_data, thumbnail_url, author_id, published_at, clone_count, is_active")
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .single();

  if (error || !post || !post.is_active) notFound();

  const pageNames = getPageNamesInOrder(post.tree_data as TreeNode);
  const canonicalUrl = getPostUrl(profile.username, slug);

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

      <div className="flex items-center gap-2">
        <CloneButton postId={post.id} />
        <SharePost title={post.name} canonicalUrl={canonicalUrl} />
      </div>
    </div>
  );
}
```

---
**Test nhanh:**
- **Mobile thật** (Termux/Chrome Android): bấm Share trên PostCard → phải mở native share sheet Android, không bị điều hướng nhầm sang trang chi tiết. Bấm Cancel trên share sheet → **không** có gì xảy ra thêm (không tự copy link).
- **Desktop/máy không hỗ trợ Web Share:** bấm Share → phải copy thẳng, toast "Link copied" hiện ra, nút đổi tạm sang "Copied" ✓ trong 2s.
- Dán link đã copy vào thanh địa chỉ mới → phải đúng dạng `https://.../<username>/<slug>` (không phải UUID, không phải `localhost` nếu đang test trên bản đã deploy).
- Test cả 2 nơi (Feed Card + Post Detail) — hành vi phải giống nhau tuyệt đối, vì dùng chung 1 component (đúng yêu cầu PRD mục 5).



# Phase 3

## File mới: `features/post-detail/utils/get-post-detail-data.ts`

```typescript
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";

// cache() của React — pattern chuẩn Next.js để dedupe fetch giữa generateMetadata() và
// chính page component: cả 2 gọi hàm này với CÙNG tham số trong CÙNG 1 request, React tự
// gộp thành 1 lần query thật duy nhất, không phải viết logic gộp thủ công.
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

  return { profile, post };
});
```

## Cập nhật `src/app/(shell)/[username]/[slug]/page.tsx` — full file

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { getPostUrl, getFallbackOgImageUrl } from "@/core/utils/site-url";
import { getPostDetailData } from "@/features/post-detail/utils/get-post-detail-data";

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
    alternates: { canonical: canonicalUrl }, // <link rel="canonical">
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
  // Nhờ cache() ở get-post-detail-data.ts — gọi lại y hệt tham số như generateMetadata()
  // phía trên, nhưng KHÔNG tạo thêm 1 lần query database thật nào nữa.
  const { profile, post } = await getPostDetailData(username, slug);

  const pageNames = getPageNamesInOrder(post.tree_data as TreeNode);
  const canonicalUrl = getPostUrl(profile.username, slug);

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

      <div className="flex items-center gap-2">
        <CloneButton postId={post.id} />
        <SharePost title={post.name} canonicalUrl={canonicalUrl} />
      </div>
    </div>
  );
}
```

---
**1 quyết định nhỏ, không nằm rõ trong PRD:** `og:type` chọn `"website"` (không phải `"article"`) — vì Post ở đây là "1 sản phẩm UI được chia sẻ", không phải bài viết có ngữ nghĩa "article" đầy đủ (không cần thêm field như `article:published_time`). Nếu sau này muốn đổi, chỉ sửa 1 dòng.

**Test nhanh:** vào 1 trang `/<username>/<slug>` bất kỳ → bấm chuột phải → **"View page source"** (không phải Inspect — phải xem đúng HTML server trả về, không phải DOM đã hydrate) → tìm trong `<head>`:
- `<title>Tên bài — Tên tác giả | 26VisualBuilder</title>`
- `<link rel="canonical" href="https://.../<username>/<slug>">`
- `<meta property="og:image" content="...">` — phải là link R2 thật nếu bài có ảnh, hoặc `/og-fallback.png` nếu chưa (ảnh đó **chưa tồn tại thật** cho tới Phase 5, không sao ở bước này).

Muốn kiểm bằng công cụ ngoài (đúng theo mắt Facebook/Discord thấy), sau khi **deploy thật** (không chạy được với `localhost`), dán URL vào **Facebook Sharing Debugger** hoặc **card validator của LinkedIn/Twitter** — nhưng đó thuộc Step 10 (Phase 5), không cần làm ngay bây giờ.

# Phase 4

## File mới: `src/app/sitemap.ts`

Đặt ở **root `app/`**, không nằm trong `(shell)` — `sitemap.ts`/`robots.ts` là quy ước đặc biệt của Next.js ánh xạ URL cố định (`/sitemap.xml`), không thuộc cây route lồng nhau nên không bị ảnh hưởng bởi Route Group:

```typescript
import type { MetadataRoute } from "next";
import { createClient } from "@/core/supabase/server";
import { getSiteUrl } from "@/core/utils/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
  ];

  const { data: profiles } = await supabase.from("profiles").select("username, updated_at");
  (profiles ?? []).forEach((p) => {
    entries.push({
      url: `${siteUrl}/${p.username}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  });

  const { data: posts } = await supabase
    .from("posts")
    .select("slug, author_id, published_at")
    .eq("is_active", true);

  const authorIds = Array.from(new Set((posts ?? []).map((p) => p.author_id)));
  const { data: postAuthors } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", authorIds.length > 0 ? authorIds : ["00000000-0000-0000-0000-000000000000"]);
  // authorIds rỗng -> .in([]) sẽ lỗi cú pháp Postgres, dùng UUID vô hại thay thế để query
  // vẫn hợp lệ và tự nhiên trả về mảng rỗng.

  const usernameMap = new Map((postAuthors ?? []).map((p) => [p.id, p.username]));

  (posts ?? []).forEach((post) => {
    const username = usernameMap.get(post.author_id);
    if (!username) return; // dữ liệu lệch hiếm gặp — bỏ qua an toàn, không crash cả sitemap
    entries.push({
      url: `${siteUrl}/${username}/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  });

  return entries;
}
```

## File mới: `src/app/robots.ts`

```typescript
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/core/utils/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /profile, /projects: PRD nêu rõ. /editor, /post: mở rộng hợp lý theo đúng tinh
      // thần "chặn route riêng tư/tác vụ nội bộ", không phải nội dung public cần index.
      disallow: ["/profile", "/projects", "/editor", "/post", "/auth"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

---
