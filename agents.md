Rà lại toàn bộ 66 definition trong Registry: phần lớn node leaf (Button, Badge, Avatar, Input, Checkbox, Heading, Paragraph...) **đã có sẵn** dummy content hợp lý từ `defaultProps` — và việc **sửa trong Inspector** cũng **đã hoạt động sẵn** từ V1 (Phase E): bất kỳ field nào trong `propsSchema` có `inputType: "text"` đều tự động render form chỉnh sửa qua `DynamicPropsForm`, không cần code thêm gì cho phần "edit".

**Chỉ còn đúng 1 thủ phạm thật sự "trống rỗng":** `shadcn.card` — từ quyết định ở V1.9 (bỏ cấu trúc title/description/content cố định, biến Card thành container linh hoạt), nó giờ **không có field text nào cả**, thêm vào Canvas là 1 khung trắng trơn.

**Cố ý không đụng tới nhóm container HTML** (`div`, `section`, `header`...) — đây **không phải bug**, mà đúng triết lý builder dạng cây: container nên trống cho tới khi bạn tự thêm nội dung vào, tự động nhồi text giả vào mọi `div` sẽ làm ô nhiễm cây Node, bắt bạn phải xoá liên tục. Cũng tạm **không sửa** `Breadcrumb`/`Navigation Menu`/`Menubar` — vấn đề của chúng sâu hơn (chưa có loại node con đúng nghĩa như `BreadcrumbItem` đăng ký trong Registry để nhồi vào), ngoài phạm vi "thêm dummy content" hôm nay.

**Cơ chế:** thêm 1 field mới `defaultChildren` vào `NodeDefinition` — khi thêm Card, tự động tạo sẵn 2 node con (`Heading` + `Paragraph`) bên trong, người dùng chọn đúng node con đó để sửa chữ qua Inspector như bình thường, không cần cơ chế "edit content" riêng nào khác.

## Patch `core/types/node-definition.types.ts`

```typescript
export interface NodeDefinition {
  // ...giữ nguyên các field cũ
  defaultChildren?: { defId: string; props?: Record<string, unknown> }[];
}
```

## Patch `core/registry/shadcn-nodes.ts`

```typescript
// Đổi:
{ id: "shadcn.card", title: "Card", category: "Layout", tags: [...], canHaveChildren: true, defaultProps: {}, defaultStyle: containerDefaultStyle, propsSchema: [] },
// Thành:
{
  id: "shadcn.card", title: "Card", category: "Layout", tags: [...], canHaveChildren: true,
  defaultProps: {}, defaultStyle: containerDefaultStyle, propsSchema: [],
  defaultChildren: [
    { defId: "html.h3", props: { text: "Card Title" } },
    { defId: "html.p", props: { text: "Mô tả ngắn cho nội dung card." } },
  ],
},
```

## Patch `core/store/builder-store.ts`

Thêm hàm helper (đặt cạnh `findNode`/`findParent`):
```typescript
function buildChildNode(defId: string, overrideProps?: Record<string, unknown>): TreeNode | null {
  const childDef = getNodeDefinition(defId);
  if (!childDef) return null;
  return {
    id: crypto.randomUUID(),
    type: defId,
    props: { ...structuredClone(childDef.defaultProps), ...structuredClone(overrideProps ?? {}) },
    style: { base: structuredClone(childDef.defaultStyle ?? {}) },
    children: [],
  };
}
```

Sửa `addNode`:
```typescript
  addNode: (parentId, defId) =>
    set((state) => {
      const def = getNodeDefinition(defId);
      if (!def) return {};

      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      if (!parent) return {};

      const parentDef = getNodeDefinition(parent.type);
      if (!parentDef || !canContain(parentDef, def.nodeKind)) return {};

      // Tự tạo sẵn node con theo defaultChildren (nếu có khai báo) — VD Card tự có
      // Heading + Paragraph ngay khi thêm, không còn là khung trắng trơn.
      const children = (def.defaultChildren ?? [])
        .map((spec) => buildChildNode(spec.defId, spec.props))
        .filter((n): n is TreeNode => n !== null);

      parent.children.push({
        id: crypto.randomUUID(),
        type: defId,
        props: structuredClone(def.defaultProps),
        style: { base: structuredClone(def.defaultStyle ?? {}) },
        children, // 👈 đổi từ [] cố định sang mảng vừa dựng
      });
      return { tree: newTree };
    }),
```

---
**Không cần sửa file nào khác** — `QuickAddDropdown`/`AddNodeBrowser`/nút `[+]` trong `TreeToolbar` đều chỉ gọi `addNode(parentId, defId)` sẵn có, tự động nhận đúng hành vi mới mà không cần đổi gì ở tầng UI gọi nó.

**Test nhanh:** thêm 1 `Card` mới (qua Add Node bất kỳ cách nào) → Canvas phải hiện ngay khung Card có sẵn dòng "Card Title" (đậm, lớn) + dòng mô tả bên dưới, không còn trống. Mở Tree → phải thấy đúng 2 node con (`Heading 1`, `Paragraph`) nằm trong Card. Chọn riêng node `Heading 1` đó, bật `styles` → Inspector phải hiện field "Nội dung" sửa được ngay (đúng cơ chế `DynamicPropsForm` có sẵn, không cần code gì mới cho bước sửa).