Đúng, `DynamicPropsForm` là nơi điền nội dung và thuộc tính riêng của node. Dưới đây là 3 phần: bỏ tiêu đề, viết lại form, và cho `<div>` có props.

## 1. Viết lại `DynamicPropsForm`

Form này bỏ `<h4>`, không tự quyết định layout ngoài, và sửa ô số giống `IntInput` ở v7 để gõ `-` hay xóa ô không bị reset giữa chừng.

```tsx
// features/inspector/components/dynamic-props-form.tsx

"use client";

import { useEffect, useState } from "react";
import { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import type { PropsFieldMeta } from "@/core/types/node-definition.types";

// Chỉ render các field, không có tiêu đề: tiêu đề do tile của group "Nội dung" đảm nhiệm.
export function DynamicPropsForm({ node }: { node: TreeNode }) {
  const updateNodeProps = useBuilderStore((s) => s.updateNodeProps);
  const def = getNodeDefinition(node.type);
  if (!def || def.propsSchema.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {def.propsSchema.map((meta) => (
        <PropField
          key={meta.key}
          meta={meta}
          value={node.props[meta.key]}
          onChange={(next) => updateNodeProps(node.id, { [meta.key]: next })}
        />
      ))}
    </div>
  );
}

// Hàm có thể dùng lại: mỗi kiểu input là một nhánh, không lặp JSX.
function PropField({
  meta,
  value,
  onChange,
}: {
  meta: PropsFieldMeta;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (meta.inputType) {
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          {meta.label}
        </label>
      );

    case "select":
      return (
        <FieldShell label={meta.label}>
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {(meta.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FieldShell>
      );

    case "textarea":
      return (
        <FieldShell label={meta.label}>
          <textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </FieldShell>
      );

    case "number":
      return (
        <FieldShell label={meta.label}>
          <NumberDraftInput
            value={typeof value === "number" ? value : undefined}
            onCommit={onChange}
          />
        </FieldShell>
      );

    default:
      return (
        <FieldShell label={meta.label}>
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </FieldShell>
      );
  }
}

function FieldShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}

// Commit khi blur/Enter; gõ "-" hay xóa ô không ghi giá trị rác vào store.
function NumberDraftInput({
  value,
  onCommit,
}: {
  value?: number;
  onCommit: (next: number | undefined) => void;
}) {
  const stored = value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(stored);
  useEffect(() => setDraft(stored), [stored]);

  const commit = () => {
    if (draft.trim() === "") return onCommit(undefined);
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) return setDraft(stored);
    onCommit(parsed);
    setDraft(String(parsed));
  };

  return (
    <input
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      className="border rounded px-2 py-1"
    />
  );
}
```

Lưu ý: file import `PropsFieldMeta` từ `node-definition.types`. Nếu tên type trong project khác, sửa lại cho khớp (hoặc dùng `NodeDefinition["propsSchema"][number]`).

## 2. Cho `<div>` có content

Hiện `html.div` có `propsSchema: []`, nên không có gì để điền. `<div>` không có text, nên content hợp lý là các thuộc tính HTML: `id`, `title` (tooltip) và `aria-label`.

### 2a. Khai báo schema trong `html-nodes.ts`

Thay dòng `html.div`:

```ts
{
  id: "html.div",
  title: "Div",
  category: "Layout",
  tags: ["layout", "container", "flex", "div"],
  canHaveChildren: true,
  defaultProps: { id: "", title: "", ariaLabel: "" },
  defaultStyle: containerDefaultStyle,
  propsSchema: [
    { key: "id", label: "ID (id)", inputType: "text" },
    { key: "title", label: "Tooltip (title)", inputType: "text" },
    { key: "ariaLabel", label: "Nhãn cho đọc màn hình (aria-label)", inputType: "text" },
  ],
},
```

### 2b. Truyền props xuống DOM trong `renderer-map.tsx`

`containerEntry` hiện không đọc `node.props`. Thêm một helper riêng cho `div`, giữ nguyên các tag còn lại:

```tsx
// Thêm dưới containerEntry. React bỏ qua attribute có giá trị undefined,
// nên ô trống sẽ không sinh ra thuộc tính rỗng trong DOM.
function attrContainerEntry(tag: string): RendererEntry {
  return {
    jsxTagName: tag,
    render: (node, children, className) => {
      const props = node.props as { id?: string; title?: string; ariaLabel?: string };
      return React.createElement(
        tag,
        {
          "data-node-id": node.id,
          id: props.id || undefined,
          title: props.title || undefined,
          "aria-label": props.ariaLabel || undefined,
          className,
        },
        children
      );
    },
  };
}
```

Rồi đổi entry:

```ts
"html.div": attrContainerEntry("div"),
```

### 2c. Phần còn lại cần làm

- **`json-to-jsx.ts`** (chưa có trong ngữ cảnh): khi xuất code, cần thêm `id`, `title`, `aria-label` vào thẻ `<div>`, bỏ qua giá trị rỗng. Gửi file này nếu bạn muốn tôi viết phần đó.
- **Dữ liệu cũ:** node `html.div` đã tồn tại trong project sẽ không có `id/title/ariaLabel` trong `props`. Với `node.props[key]` là `undefined`, form hiển thị ô trống nên không lỗi. Chỉ cần đảm bảo `DynamicPropsForm` không ghi đè các prop khác (đã đúng vì `updateNodeProps` merge).

## 3. Nối vào Inspector

`getVisibleGroups(kind, hasProps)` đã nhận cờ này, nên `<div>` sẽ tự có tile "Nội dung" vì `propsSchema` không còn rỗng. Trong `inspector-panel.tsx`, bỏ `DynamicPropsForm` ở đầu panel và chỉ render trong nhánh nội dung:

```tsx
{/* Xóa khối <DynamicPropsForm node={activeNode} /> ở đầu panel */}

<div className="flex flex-col gap-3 border-t pt-3">
  {current?.id === "preset" && <PresetSection key={activeNode.id} node={activeNode} />}

  {current?.id === "content" && <DynamicPropsForm node={activeNode} />}

  {current?.id !== "preset" && current?.id !== "content" && (
    <>
      <h3 className="text-xs font-medium">{current?.label}</h3>
      {activeState !== "normal" && (
        <p className="text-[10px] text-muted-foreground">
          Đang chỉnh trạng thái <b>{activeState}</b>. Style này chỉ áp dụng khi trạng thái xảy ra.
        </p>
      )}
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">Không có thuộc tính cho loại node này.</p>
      )}
      {fields.map((spec) => (
        <SchemaField key={spec.key} node={activeNode} spec={spec} />
      ))}
    </>
  )}
</div>
```

Thứ tự tile trong `INSPECTOR_GROUPS` nên là `common`, `content`, `preset`, rồi các group style. Với node không có props, tile "Nội dung" không xuất hiện.

## Tóm tắt thay đổi

| File | Thay đổi |
|---|---|
| `dynamic-props-form.tsx` | Bỏ `<h4>`, tách `PropField`, sửa ô số bằng draft |
| `html-nodes.ts` | `html.div` có `defaultProps` và `propsSchema` |
| `renderer-map.tsx` | Thêm `attrContainerEntry`, dùng cho `html.div` |
| `inspector-panel.tsx` | Bỏ form ở đầu, render trong nhánh "content" |
| `json-to-jsx.ts` | Cần cập nhật để xuất attribute (gửi file nếu muốn tôi viết) |