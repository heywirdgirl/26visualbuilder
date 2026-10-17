# v6.4: Nội dung mẫu cho node HTML và dọn mã chết

Hầu hết node shadcn đã có nội dung mẫu từ v6.2 và v6.3. Bản này làm nốt phần còn lại: `ul`, `ol`, `li`, `nav`, `a`, `Card`, `Scroll Area`, `Tooltip`, rồi xóa các đoạn cũ đã bị ghi đè.

## 1. `html-nodes.ts`: thay 5 dòng

Thay các dòng `html.ul`, `html.ol`, `html.li`, `html.a`, `html.nav` bằng:

```ts
  // ── List ──
  { id: "html.ul", title: "Unordered List", category: "List", tags: ["list", "unordered", "container"], canHaveChildren: true, defaultProps: {}, defaultStyle: { direction: "flex-col", gap: 1 }, propsSchema: [],
    defaultChildren: [1, 2, 3].map((n) => ({ defId: "html.li", children: [{ defId: "html.span", props: { text: `Mục ${n}` } }] })) },
  { id: "html.ol", title: "Ordered List", category: "List", tags: ["list", "ordered", "container"], canHaveChildren: true, defaultProps: {}, defaultStyle: { direction: "flex-col", gap: 1 }, propsSchema: [],
    defaultChildren: [1, 2, 3].map((n) => ({ defId: "html.li", children: [{ defId: "html.span", props: { text: `Bước ${n}` } }] })) },
  { id: "html.li", title: "List Item", category: "List", tags: ["list", "item", "container"], canHaveChildren: true, defaultProps: {}, defaultStyle: { direction: "flex-row", gap: 2 }, propsSchema: [],
    defaultChildren: [{ defId: "html.span", props: { text: "Mục danh sách" } }] },
```

```ts
  // ── Navigation ──
  { id: "html.nav", title: "Nav", category: "Navigation", tags: ["navigation", "menu", "container"], canHaveChildren: true, defaultProps: {}, defaultStyle: { direction: "flex-row", gap: 4 }, propsSchema: [],
    defaultChildren: ["Trang chủ", "Giới thiệu", "Liên hệ"].map((t) => ({
      defId: "html.a", props: { href: "#" }, children: [{ defId: "html.span", props: { text: t } }],
    })) },
  { id: "html.a", title: "Link", category: "Navigation", tags: ["navigation", "link", "anchor"], canHaveChildren: true, defaultProps: { href: "#" }, defaultStyle: { direction: "flex-row", gap: 1 }, propsSchema: [{ key: "href", label: "Đường dẫn (href)", inputType: "text" }],
    defaultChildren: [{ defId: "html.span", props: { text: "Liên kết" } }] },
```

Trước đây `html.a` thêm vào là một thẻ trống, nhìn không thấy gì trên canvas. Giờ nó có chữ. Mình **không** thêm `parentOnly` hay `allowedChildIds` cho `ul/ol/li`. Một phần vì như vậy hợp lệ hơn về HTML, nhưng chủ yếu vì mình chưa thấy `apply-ai-operations.ts`: nếu AI đang sinh cây có `li` ngoài `ul`, luật chặt sẽ làm các thao tác đó bị từ chối. Cần chặt thì mình thêm sau khi xem file đó.

## 2. `shadcn-nodes.ts`

**Card**: thay khối `shadcn.card` hiện có:

```ts
  {
    id: "shadcn.card", title: "Card", category: "Layout", tier: "component",
    tags: ["layout", "container", "panel", "card", "shadcn"],
    canHaveChildren: true, defaultProps: {}, defaultStyle: containerDefaultStyle, propsSchema: [],
    defaultChildren: [
      { defId: "html.h3", props: { text: "Card Title" } },
      { defId: "html.p", props: { text: "Mô tả ngắn cho nội dung card." } },
      { defId: "shadcn.button", props: { text: "Xem thêm" } },
    ],
  },
```

**Scroll Area** và **Tooltip**: thêm `defaultChildren` vào hai dòng hiện có (dán ngay trước `propsSchema`):

```ts
// shadcn.scroll-area
defaultChildren: [1, 2, 3, 4, 5, 6].map((n) => ({ defId: "html.p", props: { text: `Dòng nội dung ${n}` } })),

// shadcn.tooltip
defaultChildren: [{ defId: "shadcn.button", props: { text: "Rê chuột vào đây" } }],
```

Ví dụ, dòng Tooltip sẽ thành:

```ts
{ id: "shadcn.tooltip", title: "Tooltip", category: "Overlay", tags: ["feedback", "tooltip", "hint", "shadcn"], canHaveChildren: true, defaultProps: { text: "Tooltip text" },
  defaultChildren: [{ defId: "shadcn.button", props: { text: "Rê chuột vào đây" } }],
  propsSchema: [{ key: "text", label: "Nội dung tooltip", inputType: "text" }] },
```

## 3. Dọn mã chết trong `shadcn-nodes.ts`

**Xóa** khỏi mảng `rawShadcnNodes` các định nghĩa cũ mà `shadcn-cluster-nodes.ts` đã thay thế:

`shadcn.alert-dialog`, `shadcn.dialog`, `shadcn.sheet`, `shadcn.popover`, `shadcn.table`, `shadcn.breadcrumb`, `shadcn.navigation-menu`, `shadcn.menubar`, `shadcn.dropdown-menu`, `shadcn.context-menu`, `shadcn.hover-card`, `shadcn.collapsible`, `shadcn.resizable`.

(`shadcn.tabs` và `shadcn.accordion` đã thay tại chỗ ở v6.2, nên không còn bản cũ.)

Rồi thay phần cuối file bằng bản gọn, không cần bộ lọc `clusterIds` nữa:

```ts
import { clusterRawNodes } from "./shadcn-cluster-nodes";

export const shadcnNodes: NodeDefinition[] = [...rawShadcnNodes, ...clusterRawNodes].map((d) => ({
  ...d,
  nodeKind: "shadcn" as const,
  version: 1,
}));
```

## 4. Dọn mã chết trong `renderer-map.tsx`

**Xóa các entry cũ** (đã bị `...clusterRenderers` ghi đè):

`shadcn.collapsible`, `shadcn.resizable`, `shadcn.alert-dialog`, `shadcn.dialog`, `shadcn.sheet`, `shadcn.popover`, `shadcn.table`, `shadcn.breadcrumb`, `shadcn.navigation-menu`, `shadcn.menubar`, `shadcn.dropdown-menu`, `shadcn.context-menu`, `shadcn.hover-card`.

Sau đó **không còn ai dùng `placeholderEntry`**, nên xóa luôn hàm này. Kèm các import không còn dùng:

```tsx
// XÓA các dòng import này
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Menubar } from "@/components/ui/menubar";
```

`shadcn.tooltip` và `shadcn.toast` giữ nguyên vì không có bản mới.

## 5. Dọn `ui-dependencies.ts`

Xóa 4 dòng cũ đã có trong khối `add(...)`: `"shadcn.table"`, `"shadcn.breadcrumb"`, `"shadcn.navigation-menu"`, `"shadcn.menubar"`. Xóa luôn đoạn comment cuối về "13 entry còn lại" vì không còn đúng.

## Kiểm tra sau v6.4

1. Thêm **Unordered List**: ra 3 mục có chữ. Thêm **Nav**: ra 3 link thấy được.
2. Thêm **Card**: có tiêu đề, mô tả và nút.
3. Thêm **Scroll Area**: 6 dòng, cuộn được.
4. Build không báo lỗi `unused import` hay `placeholderEntry is not defined`. Nếu báo, bạn còn sót một entry cũ gọi `placeholderEntry`.
5. Mọi cụm của v6.2 và v6.3 (Tabs, Dialog, Table, Breadcrumb...) vẫn chạy như trước.

