## Patch `core/store/builder-store.ts`

Thêm hàm mới (đặt cạnh `getPageNamesInOrder`, giữ nguyên hàm cũ vì `Datastructure.md`/nơi khác có thể còn tham chiếu tên trang thuần — không phá gì đang chạy tốt):

```typescript
import { APP_FOLDER_ID } from "./builder-store"; // đã có sẵn export trong chính file này, không cần import — chỉ ghi chú vị trí hằng số dùng bên dưới

// Tìm folder App/ trong cây, trả về nguyên TreeNode của từng Page bên trong (đệ quy qua
// Folder lồng nhau nếu có) — khác getPageNamesInOrder() ở chỗ giữ NGUYÊN cấu trúc con
// (html/shadcn/Component Instance thật), không làm phẳng chỉ còn mỗi cái tên.
function collectPageNodes(node: TreeNode, acc: TreeNode[] = []): TreeNode[] {
  if (node.type === SYSTEM_NODE_IDS.page) {
    acc.push(node);
    return acc; // Page không thể chứa Page khác (Node Rules) — không cần đệ quy sâu hơn
  }
  node.children.forEach((c) => collectPageNodes(c, acc));
  return acc;
}

export function getPageNodes(tree: TreeNode): TreeNode[] {
  const appFolder = tree.children.find((c) => c.id === APP_FOLDER_ID);
  if (!appFolder) return [];
  return collectPageNodes(appFolder);
}
```

## Patch `features/feed/utils/get-feed-posts.ts`

Đổi `pageNames: string[]` → `pageNodes: TreeNode[]` trong interface và cách tính:

```typescript
// Đổi:
import { getPageNamesInOrder } from "@/core/store/builder-store";
// Thành:
import { getPageNodes } from "@/core/store/builder-store";

// Đổi interface:
export interface FeedPost {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  pageNodes: TreeNode[]; // 👈 đổi từ pageNames: string[]
  authorUsername: string;
  authorName: string;
  publishedAt: string;
}

// Đổi trong hàm map cuối file:
return posts.map((post) => {
  const profile = profileMap.get(post.author_id);
  return {
    id: post.id,
    name: post.name,
    slug: post.slug,
    thumbnailUrl: post.thumbnail_url,
    pageNodes: getPageNodes(post.tree_data as TreeNode), // 👈 đổi từ getPageNamesInOrder
    authorUsername: profile?.username ?? "unknown",
    authorName: profile?.display_name ?? "Ẩn danh",
    publishedAt: post.published_at,
  };
});
```

## Patch `src/app/(shell)/[username]/[slug]/page.tsx`

```typescript
// Đổi:
import { getPageNamesInOrder } from "@/core/store/builder-store";
// Thành:
import { getPageNodes } from "@/core/store/builder-store";

// Đổi dòng tính toán trong PostDetailPage:
const pageNames = getPageNamesInOrder(post.tree_data as TreeNode);
// Thành:
const pageNodes = getPageNodes(post.tree_data as TreeNode);
```

**Chưa sửa phần JSX render** (`{pageNames.map(...)}`) ở cả `PostCard` và `PostDetailPage` — đúng dự kiến, đó là việc của **Phase 3** khi `ReadonlyNodeTree` đã có để thay thế. Tạm thời code sẽ báo lỗi type ở 2 chỗ đó (biến `pageNames` không còn tồn tại) — bình thường, sẽ hết khi Phase 3 xong.

---
# Phase 2 

1 điều chỉnh nhỏ cho Phase 1 trước khi vào Phase 2 — phát hiện khi thiết kế component: `getPageNodes()` chỉ trả về nhánh `App/`, nhưng **Component Instance nằm trong Page cần tra tên thật từ nhánh `Components/`** (sibling của `App/`, không nằm trong subtree Page) — muốn hiện đúng tên "Header (Instance)" như Editor vẫn làm, `ReadonlyNodeTree` cần **toàn bộ cây**, không chỉ mảng Page đã cắt rời. Đổi `FeedPost.pageNodes: TreeNode[]` → `FeedPost.treeData: TreeNode` (nguyên snapshot) — `getPageNodes()` vẫn giữ nguyên, chỉ chuyển việc gọi nó vào trong `ReadonlyNodeTree` chứ không gọi trước ở tầng fetch data.

## Patch `features/feed/utils/get-feed-posts.ts`

```typescript
// Đổi:
import { getPageNodes } from "@/core/store/builder-store";

export interface FeedPost {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  pageNodes: TreeNode[];
  authorUsername: string;
  authorName: string;
  publishedAt: string;
}
// ...
pageNodes: getPageNodes(post.tree_data as TreeNode),

// Thành:
export interface FeedPost {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  treeData: TreeNode; // nguyên snapshot — cần cả nhánh Components/ để resolve tên thật
                       // của Component Instance, ReadonlyNodeTree tự gọi getPageNodes() bên trong
  authorUsername: string;
  authorName: string;
  publishedAt: string;
}
// ...
treeData: post.tree_data as TreeNode,
```

(Bỏ import `getPageNodes` khỏi file này — không còn dùng trực tiếp ở đây nữa.)

## Patch `src/app/(shell)/[username]/[slug]/page.tsx`

```typescript
// Đổi:
import { getPageNodes } from "@/core/store/builder-store";
// ...
const pageNodes = getPageNodes(post.tree_data as TreeNode);
// Thành: xoá cả 2 dòng — Phase 3 sẽ truyền thẳng post.tree_data vào ReadonlyNodeTree
```

## File mới: `features/node-tree-preview/components/readonly-node-row.tsx`

```tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FileText, Component as ComponentIcon } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { findNode } from "@/core/store/builder-store";
import { cn } from "@/core/utils/cn";

function useDisplayName(node: TreeNode, fullTree: TreeNode): string {
  const def = getNodeDefinition(node.type);

  if (node.type === SYSTEM_NODE_IDS.componentInstance) {
    const referenced = node.referenceId ? findNode(fullTree, node.referenceId) : null;
    const refName = (referenced?.props as { name?: string })?.name;
    return refName ? `${refName} (Instance)` : "Component Instance (lỗi tham chiếu)";
  }

  const nameProp = (node.props as { name?: string })?.name;
  return nameProp ?? def?.title ?? node.type;
}

function NodeIcon({ node }: { node: TreeNode }) {
  const def = getNodeDefinition(node.type);
  const cls = "h-3.5 w-3.5 shrink-0";

  switch (def?.nodeKind) {
    case "folder":
      return <Folder className={cn(cls, "text-muted-foreground")} />;
    case "page":
      return <FileText className={cn(cls, "text-blue-600")} />;
    case "component":
      return <ComponentIcon className={cn(cls, "text-purple-600")} />;
    case "component-instance":
      return <ComponentIcon className={cn(cls, "text-purple-400")} />;
    default:
      return <span className={cls} />;
  }
}

export function ReadonlyNodeRow({
  node,
  fullTree,
  depth,
}: {
  node: TreeNode;
  fullTree: TreeNode;
  depth: number;
}) {
  // Mặc định thu gọn MỌI cấp — đúng quyết định "overflow" đã chốt: Preview không tự
  // phình to, người xem tự bấm mở nhánh họ muốn xem.
  const [expanded, setExpanded] = useState(false);

  const def = getNodeDefinition(node.type);
  // Component Instance KHÔNG expand được — đúng quy tắc đã áp dụng nhất quán từ V1.9
  // trong chính Editor (nội dung thật chỉ sửa/xem qua Component gốc).
  const hasChildren = def?.nodeKind !== "component-instance" && node.children.length > 0;
  const displayName = useDisplayName(node, fullTree);

  const handleToggle = (e: React.MouseEvent) => {
    // PostCard bọc row này trong <Link> — thiếu 2 dòng này sẽ vô tình điều hướng sang
    // trang chi tiết mỗi khi bấm mở/đóng node, giống bug đã né với CloneButton/SharePost.
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <div>
      <div
        onClick={hasChildren ? handleToggle : undefined}
        style={{ paddingLeft: depth * 16 }}
        className={cn(
          "flex items-center gap-1.5 text-xs py-1 rounded",
          hasChildren && "cursor-pointer hover:bg-muted",
          def?.nodeKind === "component" && "text-purple-600",
          def?.nodeKind === "component-instance" && "text-purple-500 italic"
        )}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <NodeIcon node={node} />
        <span className="truncate">{displayName}</span>
      </div>

      {expanded &&
        node.children.map((child) => (
          <ReadonlyNodeRow key={child.id} node={child} fullTree={fullTree} depth={depth + 1} />
        ))}
    </div>
  );
}
```

## File mới: `features/node-tree-preview/components/readonly-node-tree.tsx`

```tsx
"use client";

import { useMemo } from "react";
import { TreeNode } from "@/core/types/builder.types";
import { getPageNodes } from "@/core/store/builder-store";
import { ReadonlyNodeRow } from "./readonly-node-row";

export function ReadonlyNodeTree({
  tree,
  maxHeight = 200,
}: {
  tree: TreeNode;
  maxHeight?: number;
}) {
  const pageNodes = useMemo(() => getPageNodes(tree), [tree]);

  if (pageNodes.length === 0) {
    return <p className="text-xs text-muted-foreground">Không có trang nào.</p>;
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight }}>
      {pageNodes.map((page) => (
        <ReadonlyNodeRow key={page.id} node={page} fullTree={tree} depth={0} />
      ))}
    </div>
  );
}
```

---
# Phase 3 

## Cập nhật `features/feed/components/post-card.tsx` — full file

```tsx
import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { ReadonlyNodeTree } from "@/features/node-tree-preview/components/readonly-node-tree";
import { getPostUrl } from "@/core/utils/site-url";

export function PostCard({ post }: { post: FeedPost }) {
  const canonicalUrl = getPostUrl(post.authorUsername, post.slug);

  return (
    <Link
      href={`/${post.authorUsername}/${post.slug}`}
      className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="w-2/5 p-3 flex flex-col gap-1.5 min-w-0">
        <p className="text-sm font-semibold truncate">{post.name}</p>
        <p className="text-xs text-muted-foreground truncate">bởi {post.authorName}</p>

        {/* Đổi từ list tên trang phẳng -> cây Node thật, thu gọn mặc định, tự cuộn khi
            tràn (Phase 2 đã xử lý overflow ở đây). */}
        <div className="mt-1 border rounded-md p-1.5 bg-muted/30">
          <ReadonlyNodeTree tree={post.treeData} maxHeight={160} />
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
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CloneButton } from "@/features/publish-post/components/clone-button";
import { SharePost } from "@/features/share-post/components/share-post";
import { ReadonlyNodeTree } from "@/features/node-tree-preview/components/readonly-node-tree";
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
  const { profile, post } = await getPostDetailData(username, slug);
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
        Đăng ngày {new Date(post.published_at).toLocaleDateString("vi-VN")} · {post.clone_count} lượt clone
      </p>

      <div className="flex items-center gap-2">
        <CloneButton postId={post.id} />
        <SharePost title={post.name} canonicalUrl={canonicalUrl} />
      </div>

      <div className="border-t pt-4">
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
**Test nhanh:** vào Feed → mỗi PostCard phải hiện khung cây Node **thu gọn** (chỉ dòng Page, không tự bung), scroll được nếu Page nhiều. Bấm mở 1 Page trong PostCard → phải bung đúng cấu trúc con, **không** bị điều hướng nhầm sang trang chi tiết (xác nhận `stopPropagation` hoạt động). Vào trang chi tiết `/<username>/<slug>` → khung "Cấu trúc dự án" phải hiện cùng cây, cao hơn (320px), tự cuộn nếu tràn. Post có dùng Component tái sử dụng → dòng Instance phải hiện tên thật + "(Instance)", không có chevron mở được.

Toàn bộ 3 Phase của tính năng "Node Tree Preview" đã hoàn thành — Post Detail và Feed Card giờ hiện đúng cấu trúc thật của dự án, không còn chỉ là list tên trang phẳng.