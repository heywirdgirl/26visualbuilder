Tham khảo 2 pattern phổ biến, mỗi nơi hợp với 1 loại không gian khác nhau:
- **Feed Card** (khung nhỏ, nằm trong list cuộn) — kiểu **Instagram**: carousel vuốt/chạm để chuyển ảnh, chấm tròn + số đếm "1/3" ở góc.
- **Post Detail** (trang riêng, nhiều chỗ hơn) — kiểu **Airbnb/Product Hunt**: 1 ảnh lớn (hero) + dải thumbnail bên dưới kèm tên trang, bấm thumbnail để đổi ảnh lớn.

**1 điểm cần xử lý trước khi code:** bài đăng **cũ** (đăng trước lượt tính năng multi-page vừa xong) chỉ có `thumbnail_url`, chưa có row nào trong `post_pages` — cần fallback về hiển thị đúng 1 ảnh đó, không được để trống.

## File mới: `features/post-gallery/utils/build-gallery.ts`

```typescript
import { TreeNode } from "@/core/types/builder.types";
import { getPageNodes } from "@/core/store/builder-store";

export interface GalleryImage {
  pageId: string;
  pageName: string;
  imageUrl: string;
}

// Sắp xếp lại theo ĐÚNG thứ tự Page thật trong tree_data (thứ tự lưu trong post_pages
// không đảm bảo khớp thứ tự cây) — cùng nguyên tắc "tree_data là nguồn sự thật" đã dùng
// cho pageNames trước đây.
export function buildGallery(
  treeData: TreeNode,
  postPages: { page_id: string; image_url: string }[],
  fallbackThumbnailUrl: string | null,
  fallbackName: string
): GalleryImage[] {
  const imageMap = new Map(postPages.map((p) => [p.page_id, p.image_url]));
  const pages = getPageNodes(treeData);

  const gallery = pages
    .map((page) => {
      const imageUrl = imageMap.get(page.id);
      if (!imageUrl) return null;
      const pageName = String((page.props as { name?: string }).name ?? "Page");
      return { pageId: page.id, pageName, imageUrl };
    })
    .filter((g): g is GalleryImage => g !== null);

  // Bài đăng cũ (trước tính năng multi-page) không có row nào trong post_pages —
  // fallback về đúng 1 ảnh cover cũ, không để trống.
  if (gallery.length === 0 && fallbackThumbnailUrl) {
    return [{ pageId: "cover", pageName: fallbackName, imageUrl: fallbackThumbnailUrl }];
  }
  return gallery;
}
```

## Patch `features/feed/utils/get-feed-posts.ts`

Thêm import:
```typescript
import { buildGallery, GalleryImage } from "@/features/post-gallery/utils/build-gallery";
```

Thêm vào interface:
```typescript
export interface FeedPost {
  // ...giữ nguyên các field cũ
  gallery: GalleryImage[]; // 👈 thêm
}
```

Thêm batch query (cạnh khối `Promise.all` đã có):
```typescript
const { data: allPostPages } = await supabase
  .from("post_pages")
  .select("post_id, page_id, image_url")
  .in("post_id", postIds);

const postPagesMap = new Map<string, { page_id: string; image_url: string }[]>();
(allPostPages ?? []).forEach((pp) => {
  const arr = postPagesMap.get(pp.post_id) ?? [];
  arr.push({ page_id: pp.page_id, image_url: pp.image_url });
  postPagesMap.set(pp.post_id, arr);
});
```

Thêm vào object trả về cuối hàm:
```typescript
gallery: buildGallery(
  post.tree_data as TreeNode,
  postPagesMap.get(post.id) ?? [],
  post.thumbnail_url,
  post.name
),
```

## Patch `features/post-detail/utils/get-post-detail-data.ts`

Thêm import:
```typescript
import { buildGallery, GalleryImage } from "@/features/post-gallery/utils/build-gallery";
```

Thêm vào trong hàm `cache(async (...) => {...})`, sau đoạn tính `isLiked`:
```typescript
const { data: postPages } = await supabase
  .from("post_pages")
  .select("page_id, image_url")
  .eq("post_id", post.id);

const gallery: GalleryImage[] = buildGallery(
  post.tree_data as TreeNode,
  postPages ?? [],
  post.thumbnail_url,
  post.name
);
```

Đổi dòng `return`:
```typescript
return { profile, post, likeCount: likeCount ?? 0, isLiked, gallery };
```

## File mới: `features/post-gallery/components/feed-image-carousel.tsx`

```tsx
"use client";

import { useRef, useState } from "react";
import { GalleryImage } from "../utils/build-gallery";
import { cn } from "@/core/utils/cn";

export function FeedImageCarousel({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
        Không có ảnh
      </div>
    );
  }

  const goTo = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(i);
  };
  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      setIndex((i) => (deltaX < 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length));
    }
    touchStartX.current = null;
  };

  const current = images[index];

  return (
    <div className="relative w-full h-full select-none" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <img src={current.imageUrl} alt={current.pageName} className="w-full h-full object-cover" />

      {images.length > 1 && (
        <>
          {/* Nút trái/phải trong suốt phủ 1/3 mỗi bên — vuốt hoặc bấm đều chuyển được,
              1/3 GIỮA không có nút, để tap vào giữa ảnh vẫn điều hướng sang trang chi
              tiết như bình thường (PostCard đang nằm trong <Link>). */}
          <button onClick={handlePrev} className="absolute inset-y-0 left-0 w-1/3" aria-label="Ảnh trước" />
          <button onClick={handleNext} className="absolute inset-y-0 right-0 w-1/3" aria-label="Ảnh sau" />

          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {index + 1}/{images.length}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => goTo(e, i)}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-white" : "w-1.5 bg-white/50")}
                aria-label={`Ảnh ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

## File mới: `features/post-gallery/components/post-detail-gallery.tsx`

```tsx
"use client";

import { useState } from "react";
import { GalleryImage } from "../utils/build-gallery";
import { cn } from "@/core/utils/cn";

export function PostDetailGallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const current = images[index];

  return (
    <div className="flex flex-col gap-2">
      <img src={current.imageUrl} alt={current.pageName} className="w-full rounded-lg border object-cover" />

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.pageId}
              onClick={() => setIndex(i)}
              className={cn("shrink-0 flex flex-col items-center gap-1", i === index ? "opacity-100" : "opacity-60 hover:opacity-100")}
            >
              <img
                src={img.imageUrl}
                alt={img.pageName}
                className={cn("w-20 h-14 object-cover rounded-md border-2", i === index ? "border-primary" : "border-transparent")}
              />
              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{img.pageName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Patch `features/feed/components/post-card.tsx`

```tsx
// Đổi import:
import { FeedImageCarousel } from "@/features/post-gallery/components/feed-image-carousel";

// Đổi khối ảnh cũ:
<div className="w-3/5 bg-muted">
  {post.thumbnailUrl ? (
    <img src={post.thumbnailUrl} alt={post.name} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
      Không có ảnh
    </div>
  )}
</div>
// Thành:
<div className="w-3/5 bg-muted">
  <FeedImageCarousel images={post.gallery} />
</div>
```

## Patch `src/app/(shell)/[username]/[slug]/page.tsx`

```tsx
// Đổi destructure:
const { profile, post, likeCount, isLiked } = await getPostDetailData(username, slug);
// Thành:
const { profile, post, likeCount, isLiked, gallery } = await getPostDetailData(username, slug);

// Đổi import:
import { PostDetailGallery } from "@/features/post-gallery/components/post-detail-gallery";

// Đổi khối ảnh cũ:
{post.thumbnail_url && (
  <img src={post.thumbnail_url} alt={post.name} className="w-full rounded-lg border" />
)}
// Thành:
<PostDetailGallery images={gallery} />
```

---
**Test nhanh:** vào Feed → post nhiều trang phải hiện carousel với chấm tròn + "1/N" góc phải → vuốt ngang (mobile) hoặc bấm 2 bên trái/phải ảnh → chuyển đúng ảnh, **không** điều hướng nhầm sang chi tiết. Bấm đúng giữa ảnh → phải điều hướng bình thường sang trang chi tiết. Ở đó, phải thấy ảnh lớn + dải thumbnail có tên từng trang bên dưới, bấm thumbnail → đổi ảnh lớn, viền tím đánh dấu ảnh đang chọn. Vào 1 bài đăng **cũ** (trước tính năng này) → vẫn phải hiện đúng 1 ảnh cover, không lỗi, không trống.