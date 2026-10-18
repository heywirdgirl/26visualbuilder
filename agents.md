# v6.7a: 6 node shadcn nhẹ (không cần thư viện ngoài)

Mình chia v6.7 thành 2 đợt như đã hứa:

- **v6.7a (bản này)**: Slider, Toggle, Toggle Group, Aspect Ratio, Spinner, Empty State. Chỉ cần thêm file Radix qua shadcn CLI.
- **v6.7b (bản sau)**: Input OTP, Calendar, Carousel, Command, Drawer. Nặng hơn vì kéo thêm `input-otp`, `react-day-picker`, `embla-carousel`, `cmdk`, `vaul`.

**Mình bỏ khỏi v6.7:**
- `kbd`: đã có `html.kbd` từ v6.6.
- `form`: cần `react-hook-form` và wiring validation, không hợp với builder kéo-thả. Mình đã có `html.form` rồi.
- `chart`: cần dữ liệu và cấu hình recharts, sẽ làm riêng sau.
- `sidebar`: quá lớn, nên là **Block** ở v6.9.

Tổng v6.7 còn khoảng 19 node thay vì 18 như dự kiến, nhưng chất lượng đồng đều hơn.

## 0. Việc nhỏ trước: `ai-registry-summary.ts`

File này đưa **cả node con** (`th`, `td`, `tab-trigger`...) cho AI. Lọc bỏ chúng đi:

```ts
export function getAiRegistrySummary(): RegistrySummaryEntry[] {
  return Object.values(nodeRegistry)
    .filter(
      (def) =>
        (def.nodeKind === "html" || def.nodeKind === "shadcn") &&
        !def.parentOnly // node con của cụm: AI chỉ nhận cụm gốc, con tự sinh qua defaultChildren
    )
    .map((def) => ({
      id: def.id,
      title: def.title,
      nodeKind: def.nodeKind,
      canHaveChildren: def.canHaveChildren,
      propKeys: def.propsSchema.map((prop) => prop.key),
    }));
}
```

Có một rủi ro lớn hơn: nếu `apply-ai-operations.ts` đang tự dựng node bằng `children: []` thay vì dùng `buildNodeTree` (v6.1), thì AI thêm `shadcn.tabs` sẽ ra **Tabs rỗng**. Sau v6.7a, bạn gửi mình `apply-ai-operations.ts` và `add-node.prompt.ts` để kiểm tra.

## 1. Cài đặt

```bash
npx shadcn@latest add slider toggle toggle-group aspect-ratio
```

## 2. Thêm `export` cho các helper (2 file đã có)

**`shadcn-cluster-nodes.ts`**: thêm `export` trước `D`, `p`, `txt`, `box`, `leaf`, `overlay`:

```ts
export const D = ...
export const p = ...
export const txt = ...
export const box = ...
export const leaf = ...
export const overlay = ...
```

**`cluster-renderers.tsx`**: thêm `export` trước `classAttr`, `prop`, `overlayEntry` (v6.7b sẽ dùng `overlayEntry`):

```tsx
export const classAttr = ...
export const prop = ...
export function overlayEntry(...) { ... }
```

## 3. File mới `core/registry/shadcn-extra-nodes.ts`

```ts
import { NodeDefinition } from "@/core/types/node-definition.types";
import { txt } from "./shadcn-cluster-nodes";

type RawDef = Omit<NodeDefinition, "nodeKind">;

export const extraRawNodesA: RawDef[] = [
  {
    id: "shadcn.slider", title: "Slider", category: "Form",
    tags: ["form", "slider", "range", "shadcn"], canHaveChildren: false,
    defaultProps: { value: 50, max: 100, step: 1 },
    defaultStyle: { width: "full" },
    propsSchema: [
      { key: "value", label: "Giá trị mặc định", inputType: "number" },
      { key: "max", label: "Tối đa", inputType: "number" },
      { key: "step", label: "Bước nhảy", inputType: "number" },
    ],
  },
  {
    id: "shadcn.toggle", title: "Toggle", category: "Form",
    tags: ["form", "toggle", "button", "shadcn"], canHaveChildren: false,
    defaultProps: { text: "Đậm", variant: "outline", size: "default" },
    propsSchema: [
      { key: "text", label: "Nội dung", inputType: "text" },
      { key: "variant", label: "Variant", inputType: "select", options: ["default", "outline"] },
      { key: "size", label: "Size", inputType: "select", options: ["default", "sm", "lg"] },
    ],
  },
  {
    id: "shadcn.toggle-group", title: "Toggle Group", category: "Form", tier: "component",
    tags: ["form", "toggle", "group", "segmented", "shadcn"], canHaveChildren: true,
    defaultProps: { type: "single", variant: "outline" },
    propsSchema: [
      { key: "type", label: "Kiểu chọn", inputType: "select", options: ["single", "multiple"] },
      { key: "variant", label: "Variant", inputType: "select", options: ["default", "outline"] },
    ],
    allowedChildIds: ["shadcn.toggle-group-item"],
    defaultChildren: ["Trái", "Giữa", "Phải"].map((t) => ({
      defId: "shadcn.toggle-group-item", props: { text: t },
    })),
  },
  txt("shadcn.toggle-group-item", "Toggle Item", "shadcn.toggle-group", "Mục", "Form"),
  {
    id: "shadcn.aspect-ratio", title: "Aspect Ratio", category: "Layout", tier: "component",
    tags: ["layout", "ratio", "frame", "image", "shadcn"], canHaveChildren: true,
    defaultProps: { ratio: "16/9" },
    defaultStyle: { width: "full" },
    propsSchema: [
      { key: "ratio", label: "Tỉ lệ khung", inputType: "select", options: ["1/1", "4/3", "16/9", "21/9", "3/4", "9/16"] },
    ],
    defaultChildren: [{ defId: "html.img", props: { src: "https://placehold.co/640x360", alt: "Ảnh" } }],
  },
  {
    id: "shadcn.spinner", title: "Spinner", category: "Feedback",
    tags: ["feedback", "spinner", "loading", "shadcn"], canHaveChildren: false,
    defaultProps: { size: 24 },
    propsSchema: [{ key: "size", label: "Kích thước", inputType: "number" }],
  },
  {
    // Container thuần (không có file ui tương ứng), ghép sẵn icon + tiêu đề + mô tả + nút
    id: "shadcn.empty", title: "Empty State", category: "Data Display", tier: "component",
    tags: ["data", "empty", "placeholder", "no data"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [],
    defaultStyle: {
      direction: "flex-col", align: "items-center", justify: "justify-center",
      gap: 2, padding: 8, textAlign: "center",
      borderWidth: 1, borderColor: "zinc-300", borderRadius: "lg",
    },
    defaultChildren: [
      { defId: "html.icon", props: { name: "Inbox", size: 40 } },
      { defId: "html.h3", props: { text: "Chưa có dữ liệu" } },
      { defId: "html.p", props: { text: "Hãy thêm mục đầu tiên để bắt đầu." } },
      { defId: "shadcn.button", props: { text: "Thêm mới" } },
    ],
  },
];
```

## 4. `shadcn-nodes.ts`: sửa phần cuối

```ts
import { extraRawNodesA } from "./shadcn-extra-nodes";

export const shadcnNodes: NodeDefinition[] = [
  ...rawShadcnNodes,
  ...clusterRawNodes,
  ...extraRawNodesA,
].map((d) => ({
  ...d,
  tier: d.tier ?? "element",
  nodeKind: "shadcn" as const,
  version: 1,
}));
```

## 5. File mới `features/canvas-preview/constants/shadcn-extra-renderers.tsx`

```tsx
import React from "react";
import { Loader2 } from "lucide-react";
import type { RendererEntry } from "./renderer-map";
import { boxEntry, classAttr, prop } from "./cluster-renderers";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/core/utils/cn";
import { escapeAttr, escapeJsxText } from "@/core/utils/escape-jsx-text";
import { TreeNode } from "@/core/types/builder.types";

const num = (node: TreeNode, key: string, fallback: number) => {
  const n = Number(prop(node, key, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
};

const ratioParts = (node: TreeNode): [number, number] => {
  const [a, b] = prop(node, "ratio", "16/9").split("/").map(Number);
  return a > 0 && b > 0 ? [a, b] : [16, 9];
};

type Variant = "default" | "outline";

export const shadcnExtraRenderers: Record<string, RendererEntry> = {
  // ══ Slider ══
  "shadcn.slider": {
    jsxTagName: "Slider",
    importStatement: `import { Slider } from "@/components/ui/slider";`,
    render: (node, _c, className) => {
      const value = num(node, "value", 50), max = num(node, "max", 100), step = num(node, "step", 1) || 1;
      return (
        <Slider
          key={`${value}-${max}-${step}`} // remount khi sửa prop vì defaultValue không tự cập nhật
          data-node-id={node.id}
          defaultValue={[value]} max={max} step={step} className={className}
        />
      );
    },
    toJsx: (node, _c, className, pad) =>
      `${pad}<Slider defaultValue={[${num(node, "value", 50)}]} max={${num(node, "max", 100)}} step={${num(node, "step", 1) || 1}}${classAttr(className)} />`,
  },

  // ══ Toggle ══ (xuất code dùng đường generic: <Toggle variant=".." size="..">text</Toggle>)
  "shadcn.toggle": {
    jsxTagName: "Toggle",
    importStatement: `import { Toggle } from "@/components/ui/toggle";`,
    render: (node, _c, className) => (
      <Toggle
        data-node-id={node.id}
        variant={prop(node, "variant", "outline") as Variant}
        size={prop(node, "size", "default") as "default" | "sm" | "lg"}
        className={className}
      >
        {prop(node, "text")}
      </Toggle>
    ),
  },

  // ══ Toggle Group ══
  "shadcn.toggle-group": {
    jsxTagName: "ToggleGroup",
    importStatement: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";`,
    render: (node, children, className) => {
      const variant = prop(node, "variant", "outline") as Variant;
      const type = prop(node, "type", "single");
      // type là union phân biệt nên phải tách 2 nhánh cho TypeScript
      return type === "multiple" ? (
        <ToggleGroup key="multiple" type="multiple" variant={variant} data-node-id={node.id} className={className}>
          {children}
        </ToggleGroup>
      ) : (
        <ToggleGroup key="single" type="single" variant={variant} data-node-id={node.id} className={className}>
          {children}
        </ToggleGroup>
      );
    },
    toJsx: (node, childrenJsx, className, pad) =>
      `${pad}<ToggleGroup type="${escapeAttr(prop(node, "type", "single"))}" variant="${escapeAttr(prop(node, "variant", "outline"))}"${classAttr(className)}>\n${childrenJsx}\n${pad}</ToggleGroup>`,
  },
  "shadcn.toggle-group-item": {
    jsxTagName: "ToggleGroupItem",
    render: (node, _c, className) => (
      <ToggleGroupItem data-node-id={node.id} value={prop(node, "value", "item-1")} className={className}>
        {prop(node, "text")}
      </ToggleGroupItem>
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}<ToggleGroupItem value="${escapeAttr(prop(node, "value", "item-1"))}"${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</ToggleGroupItem>`,
  },

  // ══ Aspect Ratio ══
  "shadcn.aspect-ratio": {
    jsxTagName: "AspectRatio",
    importStatement: `import { AspectRatio } from "@/components/ui/aspect-ratio";`,
    render: (node, children, className) => {
      const [a, b] = ratioParts(node);
      return (
        <AspectRatio data-node-id={node.id} ratio={a / b} className={className}>
          {children}
        </AspectRatio>
      );
    },
    toJsx: (node, childrenJsx, className, pad) => {
      const [a, b] = ratioParts(node);
      return `${pad}<AspectRatio ratio={${a} / ${b}}${classAttr(className)}>\n${childrenJsx}\n${pad}</AspectRatio>`;
    },
  },

  // ══ Spinner ══
  "shadcn.spinner": {
    jsxTagName: "Loader2",
    importStatement: `import { Loader2 } from "lucide-react";`,
    render: (node, _c, className) => (
      <Loader2 data-node-id={node.id} size={num(node, "size", 24)} className={cn("animate-spin", className)} />
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}<Loader2 size={${num(node, "size", 24)}} className="${escapeAttr(cn("animate-spin", className))}" />`,
  },

  // ══ Empty State (div thuần) ══
  "shadcn.empty": boxEntry("div", "div", ""),
};
```

## 6. `renderer-map.tsx`

```tsx
import { shadcnExtraRenderers } from "./shadcn-extra-renderers";
```

```tsx
  ...clusterRenderers,
  ...htmlExtraRenderers,
  ...shadcnExtraRenderers,
};
```

## 7. `normalize-cluster-values.ts`: thêm Toggle Group

Trong `collectFixes`, thêm sau khối accordion:

```ts
  if (node.type === "shadcn.toggle-group") {
    assign(node.children.filter((c) => c.type === "shadcn.toggle-group-item"), "item");
  }
```

## 8. `ui-dependencies.ts`

Thêm vào khối `add(...)` đã có:

```ts
add(["slider"], "shadcn.slider");
add(["toggle"], "shadcn.toggle");
add(["toggle-group", "toggle"], "shadcn.toggle-group", "shadcn.toggle-group-item");
add(["aspect-ratio"], "shadcn.aspect-ratio");
```

Spinner và Empty không cần file ui, nên không khai báo. `toggle-group.tsx` import `toggleVariants` từ `toggle.tsx`, vì vậy phải kèm `toggle`.

## 9. `node-icons.ts`

Thêm vào import lucide:

```ts
SlidersHorizontal, ToggleRight, AlignHorizontalJustifyCenter, RectangleHorizontal, LoaderCircle, Inbox,
```

Thêm vào `NODE_ICONS`:

```ts
  "shadcn.slider": SlidersHorizontal,
  "shadcn.toggle": ToggleRight,
  "shadcn.toggle-group": AlignHorizontalJustifyCenter,
  "shadcn.aspect-ratio": RectangleHorizontal,
  "shadcn.spinner": LoaderCircle,
  "shadcn.empty": Inbox,
```

`toggle-group-item` tự lấy icon `Dot` nhờ quy tắc hậu tố `-item` từ v6.5. Nếu bản lucide của bạn báo thiếu `LoaderCircle`, đổi thành `Loader2`.

## Kiểm tra sau v6.7a

1. **Slider**: kéo được trên canvas. Sửa "Giá trị mặc định" trong Inspector thì thanh trượt nhảy theo ngay (nhờ `key`).
2. **Toggle Group**: 3 nút ghép liền nhau. Chọn node, thêm một **Toggle Item**. Đổi "Kiểu chọn" sang `multiple` thì bấm được nhiều nút cùng lúc.
3. **Aspect Ratio**: ảnh nằm trong khung. Đổi tỉ lệ sang `1/1` thì khung vuông.
4. **Empty State**: icon, tiêu đề, mô tả, nút căn giữa trong khung viền mảnh.
5. **Code**: Slider ra `defaultValue={[50]}`, Aspect Ratio ra `ratio={16 / 9}`, Spinner ra `className="animate-spin ..."`. Mục import có `slider`, `toggle-group`, `aspect-ratio`.
6. Export zip: file `components/ui/slider.tsx`, `toggle.tsx`, `toggle-group.tsx`, `aspect-ratio.tsx` có mặt đủ.

## Lưu ý

- **Tooltip** (shadcn.tooltip) đang vẽ chữ chú thích hiện cố định bên dưới nút. Mình để nguyên vì `Tooltip` thật của Radix không dùng được trong shadow root, và cách này cho phép bạn thấy nó khi chỉnh sửa. Nếu muốn chuyển sang kiểu "hover mới hiện" thì nói mình.
- Bạn gửi `apply-ai-operations.ts` và `add-node.prompt.ts` khi sẵn sàng, mình kiểm tra xem AI thêm cụm có sinh đủ nội dung con không. Nếu bạn muốn làm xong v6.7b trước thì cũng được, vì hai việc độc lập.

Báo kết quả v6.7a, rồi mình làm **v6.7b** (Input OTP, Calendar, Carousel, Command, Drawer) kèm lệnh cài thư viện.

# v6.7b: Drawer, Command, Carousel, Calendar, Input OTP

Mình đã đọc xong 2 file AI. Có 2 lỗi thật, nên mình vá trước rồi mới sang 5 node mới.

## 0. Vá phần AI

**Lỗi 1: AI thêm cụm sẽ ra cụm rỗng.** `buildNodeRecursive` tự dựng `children` từ AI, không biết `defaultChildren`. AI thêm `shadcn.tabs` thì ra Tabs trống.

**Lỗi 2: `parentDef.canHaveChildren`** ở dòng tính `children` lẽ ra phải là `nodeDef.canHaveChildren`. Hiện chạy đúng chỉ nhờ `canContain` chặn sau lưng.

**Tách hàm dựng cây ra util** để `apply-ai-operations` dùng chung, không import ngược `builder-store` (store đang import file này nên sẽ thành vòng).

### File mới `core/utils/build-node-tree.ts`

```ts
import { TreeNode } from "@/core/types/builder.types";
import { DefaultChildSpec } from "@/core/types/node-definition.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { resolveDefaultStyle } from "@/core/registry/default-presets";

const MAX_DEPTH = 8; // chặn defaultChildren tự tham chiếu vòng

export function buildNodeFromSpec(
  defId: string,
  overrideProps?: Record<string, unknown>,
  childSpecs?: DefaultChildSpec[],
  depth = 0
): TreeNode | null {
  if (depth > MAX_DEPTH) return null;
  const def = getNodeDefinition(defId);
  if (!def) return null;

  const specs = childSpecs ?? def.defaultChildren ?? [];
  return {
    id: crypto.randomUUID(),
    type: defId,
    props: { ...structuredClone(def.defaultProps), ...structuredClone(overrideProps ?? {}) },
    style: resolveDefaultStyle(def),
    children: specs
      .map((s) => buildNodeFromSpec(s.defId, s.props, s.children, depth + 1))
      .filter((n): n is TreeNode => n !== null),
  };
}

export function buildNodeTree(spec: DefaultChildSpec): TreeNode | null {
  return buildNodeFromSpec(spec.defId, spec.props, spec.children);
}
```

### `builder-store.ts`

Xóa `MAX_DEPTH`, `buildNodeFromSpec`, `buildNodeTree` (bản v6.1) và import `DefaultChildSpec` nếu không còn dùng, rồi thêm:

```ts
import { buildNodeFromSpec } from "@/core/utils/build-node-tree";
```

`addNode` vẫn gọi `buildNodeFromSpec(defId)` như cũ.

### `apply-ai-operations.ts`

```ts
import { buildNodeFromSpec } from "@/core/utils/build-node-tree";
```

Thay đoạn tính `children` trong `buildNodeRecursive`:

```ts
  // AI không gửi "children" → dùng nội dung mẫu của node (Tabs, Accordion, Table, Dialog...)
  // AI gửi "children" (kể cả []) → tôn trọng đúng ý AI
  const useDefaults = aiNode.children === undefined && (nodeDef.defaultChildren?.length ?? 0) > 0;

  const children: TreeNode[] = useDefaults
    ? (nodeDef.defaultChildren ?? [])
        .map((s) => buildNodeFromSpec(s.defId, s.props, s.children))
        .filter((c): c is TreeNode => c !== null)
    : nodeDef.canHaveChildren
      ? (aiNode.children ?? [])
          .map((child) => {
            const built = buildNodeRecursive(child, nodeDef, stats);
            if (!built) stats.skippedNested++;
            return built;
          })
          .filter((c): c is TreeNode => c !== null)
      : [];
```

Cây AI thêm vào cũng được `normalizeClusterValues` tự gán `value` (qua `subscribe` ở v6.2).

### `ai-registry-summary.ts`

```ts
export interface RegistrySummaryEntry {
  id: string;
  title: string;
  nodeKind: string;
  canHaveChildren: boolean;
  propKeys: string[];
  prefilled: boolean; // có nội dung mẫu sẵn
  sealed: boolean;    // chỉ nhận con đúng loại (Tabs, Table...) → AI không nên tự ghép con
}
```

Trong `.map(...)` thêm 2 dòng:

```ts
      prefilled: def.tier === "component" && (def.defaultChildren?.length ?? 0) > 0,
      sealed: !!def.allowedChildIds,
```

### `add-node.prompt.ts`: sửa `formatRegistryEntry`

```ts
function formatRegistryEntry(entry: RegistrySummaryEntry): string {
  const childInfo = !entry.canHaveChildren
    ? "leaf, no children"
    : entry.sealed
      ? "composite: add WITHOUT children (sample content is built in)"
      : entry.prefilled
        ? "can have children (has sample content: omit children to keep it)"
        : "can have children";
  const props = entry.propKeys.length > 0 ? entry.propKeys.join(", ") : "(no props)";
  return `- ${entry.id} | ${entry.title} | ${childInfo} | props: ${props}`;
}
```

Và thêm luật 10 sau luật 9 trong prompt:

```
10. Composite nodes (Tabs, Accordion, Table, Dialog, Carousel...) already include sample content. Add them WITHOUT "children" and customize text only via "props" on the node itself.
```

Một hệ quả bạn nên biết: AI chỉ thấy node gốc của cụm, nên "tạo Tabs 4 tab" sẽ ra Tabs 2 tab mẫu. Người dùng thêm tab thủ công sau. Nếu bạn muốn AI tự đặt số tab thì mình mở rộng bản sau.

## 1. Cài đặt

```bash
npx shadcn@latest add input-otp calendar carousel command drawer
```

Lệnh này kéo theo các thư viện `input-otp`, `react-day-picker`, `embla-carousel-react`, `cmdk`, `vaul`.

## 2. File mới `core/registry/shadcn-extra-nodes-b.ts`

```ts
import { NodeDefinition } from "@/core/types/node-definition.types";
import { overlay, txt, box, leaf, p } from "./shadcn-cluster-nodes";

type RawDef = Omit<NodeDefinition, "nodeKind">;

export const extraRawNodesB: RawDef[] = [
  // ── Input OTP ──
  {
    id: "shadcn.input-otp", title: "Input OTP", category: "Form",
    tags: ["form", "otp", "code", "verify", "pin", "shadcn"], canHaveChildren: false,
    defaultProps: { length: "6", split: true },
    propsSchema: [
      { key: "length", label: "Số ký tự", inputType: "select", options: ["4", "6", "8"] },
      { key: "split", label: "Chia 2 nhóm", inputType: "checkbox" },
    ],
  },

  // ── Calendar ──
  {
    id: "shadcn.calendar", title: "Calendar", category: "Data Display",
    tags: ["data", "calendar", "date", "picker", "shadcn"], canHaveChildren: false,
    defaultProps: { showOutsideDays: true },
    propsSchema: [{ key: "showOutsideDays", label: "Hiện ngày tháng khác", inputType: "checkbox" }],
  },

  // ── Carousel ──
  {
    id: "shadcn.carousel", title: "Carousel", category: "Media", tier: "component",
    tags: ["media", "carousel", "slider", "slides", "gallery", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [],
    allowedChildIds: ["shadcn.carousel-item"],
    defaultChildren: [1, 2, 3].map((n) => ({
      defId: "shadcn.carousel-item",
      children: [{ defId: "shadcn.card", children: [{ defId: "html.h3", props: { text: `Slide ${n}` } }] }],
    })),
  },
  box("shadcn.carousel-item", "Carousel Slide", "shadcn.carousel", "Media", {
    defaultStyle: { direction: "flex-col", gap: 2 },
    defaultChildren: [{ defId: "shadcn.card", children: [{ defId: "html.h3", props: { text: "Slide mới" } }] }],
  }),

  // ── Command ──
  {
    id: "shadcn.command", title: "Command", category: "Navigation", tier: "component",
    tags: ["navigation", "command", "search", "palette", "combobox", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [],
    allowedChildIds: ["shadcn.command-input", "shadcn.command-list"],
    defaultChildren: [
      { defId: "shadcn.command-input" },
      { defId: "shadcn.command-list", children: [
        { defId: "shadcn.command-group", props: { heading: "Gợi ý" }, children: [
          { defId: "shadcn.command-item", props: { text: "Lịch" } },
          { defId: "shadcn.command-item", props: { text: "Tìm emoji" } },
          { defId: "shadcn.command-item", props: { text: "Máy tính" } },
        ]},
        { defId: "shadcn.command-separator" },
        { defId: "shadcn.command-group", props: { heading: "Cài đặt" }, children: [
          { defId: "shadcn.command-item", props: { text: "Hồ sơ" } },
          { defId: "shadcn.command-item", props: { text: "Thanh toán" } },
        ]},
      ]},
    ],
  },
  {
    id: "shadcn.command-input", title: "Command Input", category: "Navigation", tags: ["command", "input"],
    canHaveChildren: false, defaultProps: { placeholder: "Gõ lệnh hoặc tìm kiếm..." },
    propsSchema: [{ key: "placeholder", label: "Placeholder", inputType: "text" }],
    parentOnly: ["shadcn.command"],
  },
  box("shadcn.command-list", "Command List", "shadcn.command", "Navigation", {
    allowedChildIds: ["shadcn.command-group", "shadcn.command-empty", "shadcn.command-separator"],
  }),
  txt("shadcn.command-empty", "Command Empty", "shadcn.command-list", "Không tìm thấy kết quả.", "Navigation"),
  box("shadcn.command-group", "Command Group", "shadcn.command-list", "Navigation", {
    defaultProps: { heading: "Nhóm" },
    propsSchema: [{ key: "heading", label: "Tiêu đề nhóm", inputType: "text" }],
    allowedChildIds: ["shadcn.command-item"],
    defaultChildren: [{ defId: "shadcn.command-item", props: { text: "Mục mới" } }],
  }),
  txt("shadcn.command-item", "Command Item", "shadcn.command-group", "Mục mới", "Navigation"),
  leaf("shadcn.command-separator", "Command Separator", "shadcn.command-list", "Navigation"),

  // ── Drawer ──
  overlay("shadcn.drawer", "Drawer", "Overlay", "Mở drawer", [
    { defId: "shadcn.drawer-header", children: [
      { defId: "shadcn.drawer-title" },
      { defId: "shadcn.drawer-description" },
    ]},
    p("Nội dung drawer."),
    { defId: "shadcn.drawer-footer", children: [{ defId: "shadcn.button", props: { text: "Xác nhận" } }] },
  ]),
  box("shadcn.drawer-header", "Drawer Header", "shadcn.drawer", "Overlay", {
    allowedChildIds: ["shadcn.drawer-title", "shadcn.drawer-description"],
    defaultChildren: [{ defId: "shadcn.drawer-title" }, { defId: "shadcn.drawer-description" }],
  }),
  txt("shadcn.drawer-title", "Drawer Title", "shadcn.drawer-header", "Tiêu đề drawer", "Overlay"),
  txt("shadcn.drawer-description", "Drawer Description", "shadcn.drawer-header", "Mô tả ngắn cho drawer.", "Overlay"),
  box("shadcn.drawer-footer", "Drawer Footer", "shadcn.drawer", "Overlay"),
];
```

## 3. `shadcn-nodes.ts`: nối thêm

```ts
import { extraRawNodesB } from "./shadcn-extra-nodes-b";

export const shadcnNodes: NodeDefinition[] = [
  ...rawShadcnNodes,
  ...clusterRawNodes,
  ...extraRawNodesA,
  ...extraRawNodesB,
].map((d) => ({ ...d, tier: d.tier ?? "element", nodeKind: "shadcn" as const, version: 1 }));
```

## 4. File mới `features/canvas-preview/constants/shadcn-extra-renderers-b.tsx`

```tsx
import React from "react";
import type { RendererEntry } from "./renderer-map";
import { textEntry, boxEntry, overlayEntry, classAttr, prop } from "./cluster-renderers";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Calendar } from "@/components/ui/calendar";
import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext,
} from "@/components/ui/carousel";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/core/utils/cn";
import { escapeAttr } from "@/core/utils/escape-jsx-text";
import { TreeNode } from "@/core/types/builder.types";

const IMP = {
  otp: `import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";`,
  calendar: `import { Calendar } from "@/components/ui/calendar";`,
  carousel: `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";`,
  command: `import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";`,
  drawer: `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";`,
};

// ── Input OTP ──
const otpInfo = (node: TreeNode) => {
  const n = Math.max(1, Number(prop(node, "length", "6")) || 6);
  const split = !!(node.props as { split?: boolean }).split;
  const all = Array.from({ length: n }, (_, i) => i);
  const half = Math.ceil(n / 2);
  const groups = split && n >= 4 ? [all.slice(0, half), all.slice(half)] : [all];
  return { n, groups };
};

// ── Calendar: cần state để chọn ngày nên dùng component riêng ──
function CalendarView({ id, className, showOutsideDays }: { id: string; className: string; showOutsideDays: boolean }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <div data-node-id={id} className={cn("w-fit", className)}>
      <Calendar
        mode="single" selected={date} onSelect={setDate}
        showOutsideDays={showOutsideDays} className="rounded-md border"
      />
    </div>
  );
}

export const shadcnExtraRenderersB: Record<string, RendererEntry> = {
  // ══ Input OTP ══
  "shadcn.input-otp": {
    jsxTagName: "InputOTP",
    importStatement: IMP.otp,
    render: (node, _c, className) => {
      const { n, groups } = otpInfo(node);
      return (
        <div data-node-id={node.id} className={cn("w-fit", className)}>
          <InputOTP key={`${n}-${groups.length}`} maxLength={n}>
            {groups.map((g, gi) => (
              <React.Fragment key={gi}>
                {gi > 0 && <InputOTPSeparator />}
                <InputOTPGroup>
                  {g.map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </React.Fragment>
            ))}
          </InputOTP>
        </div>
      );
    },
    toJsx: (node, _c, className, pad) => {
      const { n, groups } = otpInfo(node);
      const body = groups
        .map((g, gi) =>
          (gi > 0 ? `${pad}  <InputOTPSeparator />\n` : "") +
          `${pad}  <InputOTPGroup>\n` +
          g.map((i) => `${pad}    <InputOTPSlot index={${i}} />`).join("\n") +
          `\n${pad}  </InputOTPGroup>`
        )
        .join("\n");
      return `${pad}<InputOTP maxLength={${n}}${classAttr(className)}>\n${body}\n${pad}</InputOTP>`;
    },
  },

  // ══ Calendar ══
  "shadcn.calendar": {
    jsxTagName: "Calendar",
    importStatement: IMP.calendar,
    render: (node, _c, className) => (
      <CalendarView
        id={node.id} className={className}
        showOutsideDays={!!(node.props as { showOutsideDays?: boolean }).showOutsideDays}
      />
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}{/* TODO: Calendar cần state để chọn ngày — thêm const [date, setDate] = useState<Date | undefined>() rồi truyền selected={date} onSelect={setDate} */}\n` +
      `${pad}<Calendar mode="single" showOutsideDays={${!!(node.props as { showOutsideDays?: boolean }).showOutsideDays}} className="${escapeAttr(cn("rounded-md border", className))}" />`,
  },

  // ══ Carousel ══
  "shadcn.carousel": {
    jsxTagName: "Carousel",
    importStatement: IMP.carousel,
    render: (node, children, className) => (
      <Carousel key={node.children.length} data-node-id={node.id} className={className}>
        <CarouselContent>{children}</CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    ),
    toJsx: (_n, childrenJsx, className, pad) =>
      `${pad}<Carousel${classAttr(className)}>\n${pad}  <CarouselContent>\n${childrenJsx}\n${pad}  </CarouselContent>\n${pad}  <CarouselPrevious className="left-2" />\n${pad}  <CarouselNext className="right-2" />\n${pad}</Carousel>`,
  },
  "shadcn.carousel-item": {
    jsxTagName: "CarouselItem",
    render: (node, children, className) => (
      <CarouselItem data-node-id={node.id} className={className}>{children}</CarouselItem>
    ),
  },

  // ══ Command (canvas dùng component thật; xuất code dùng đường generic) ══
  "shadcn.command": {
    jsxTagName: "Command",
    importStatement: IMP.command,
    render: (node, children, className) => (
      <Command data-node-id={node.id} className={cn("rounded-lg border shadow-md", className)}>{children}</Command>
    ),
    toJsx: (_n, childrenJsx, className, pad) =>
      `${pad}<Command className="${escapeAttr(cn("rounded-lg border shadow-md", className))}">\n${childrenJsx}\n${pad}</Command>`,
  },
  "shadcn.command-input": {
    jsxTagName: "CommandInput",
    render: (node, _c, className) => (
      <CommandInput data-node-id={node.id} placeholder={prop(node, "placeholder")} className={className} />
    ),
  },
  "shadcn.command-list": {
    jsxTagName: "CommandList",
    render: (node, children, className) => (
      <CommandList data-node-id={node.id} className={className}>{children}</CommandList>
    ),
  },
  "shadcn.command-empty": {
    jsxTagName: "CommandEmpty",
    render: (node, _c, className) => (
      <CommandEmpty data-node-id={node.id} className={className}>{prop(node, "text")}</CommandEmpty>
    ),
  },
  "shadcn.command-group": {
    jsxTagName: "CommandGroup",
    render: (node, children, className) => (
      <CommandGroup data-node-id={node.id} heading={prop(node, "heading")} className={className}>
        {children}
      </CommandGroup>
    ),
  },
  "shadcn.command-item": {
    jsxTagName: "CommandItem",
    render: (node, _c, className) => (
      <CommandItem data-node-id={node.id} className={className}>{prop(node, "text")}</CommandItem>
    ),
  },
  "shadcn.command-separator": {
    jsxTagName: "CommandSeparator",
    render: (node, _c, className) => <CommandSeparator data-node-id={node.id} className={className} />,
  },

  // ══ Drawer (canvas luôn mở bằng div, code xuất dùng Drawer thật) ══
  "shadcn.drawer": overlayEntry({
    label: "Drawer", root: "Drawer", trigger: "DrawerTrigger", content: "DrawerContent", importStatement: IMP.drawer,
  }),
  "shadcn.drawer-header": boxEntry("DrawerHeader", "div", "flex flex-col gap-1.5"),
  "shadcn.drawer-title": textEntry("DrawerTitle", "h4", "text-lg font-semibold"),
  "shadcn.drawer-description": textEntry("DrawerDescription", "p", "text-sm text-muted-foreground"),
  "shadcn.drawer-footer": boxEntry("DrawerFooter", "div", "flex flex-col gap-2"),
};
```

Cách xuất code cho `command-group` (`heading="..."`), `command-input` (`placeholder="..."`), `command-empty`, `command-item` dựa vào đường generic của `json-to-jsx.ts` (thuộc tính lấy từ `propsSchema`, chữ lấy từ `text`), nên không cần `toJsx` riêng.

## 5. `renderer-map.tsx`

```tsx
import { shadcnExtraRenderersB } from "./shadcn-extra-renderers-b";
```

```tsx
  ...shadcnExtraRenderers,
  ...shadcnExtraRenderersB,
};
```

## 6. `ui-dependencies.ts`

```ts
add(["input-otp"], "shadcn.input-otp");
add(["calendar", "button"], "shadcn.calendar");
add(["carousel", "button"], "shadcn.carousel", "shadcn.carousel-item");
add(["command", "dialog"], "shadcn.command", "shadcn.command-input", "shadcn.command-list",
  "shadcn.command-empty", "shadcn.command-group", "shadcn.command-item", "shadcn.command-separator");
add(["drawer"], "shadcn.drawer", "shadcn.drawer-header", "shadcn.drawer-title",
  "shadcn.drawer-description", "shadcn.drawer-footer");
```

`calendar.tsx` và `carousel.tsx` import `button`, còn `command.tsx` import `dialog`, nên phải kèm theo.

## 7. `node-icons.ts`

Thêm vào import lucide:

```ts
KeyRound, CalendarDays, GalleryHorizontal, Command as CommandIcon, Search,
```

Thêm vào `NODE_ICONS`:

```ts
  "shadcn.input-otp": KeyRound,
  "shadcn.calendar": CalendarDays,
  "shadcn.carousel": GalleryHorizontal,
  "shadcn.command": CommandIcon,
  "shadcn.drawer": PanelBottom,
```

Thêm vào `PART_ICONS` (để `-item` không bị đè thành `Dot`):

```ts
  "shadcn.carousel-item": Square,
  "shadcn.command-input": Search,
  "shadcn.command-list": List,
  "shadcn.command-group": Rows3,
  "shadcn.command-empty": Info,
  "shadcn.drawer-header": PanelTop,
```

## Kiểm tra sau v6.7b

1. **Drawer**: nút trigger, khung nội dung có header (tiêu đề + mô tả), một đoạn chữ và footer có nút.
2. **Command**: ô tìm kiếm, 2 nhóm với 5 mục. Gõ chữ vào ô thì danh sách lọc theo. Chọn `Command Group` thì palette chỉ hiện **Command Item**.
3. **Carousel**: 3 slide, mũi tên trái phải nằm trong khung và bấm chuyển được. Chọn Carousel thêm **Carousel Slide** thì có slide thứ 4.
4. **Calendar**: bấm chọn ngày được, đổi tháng được.
5. **Input OTP**: 6 ô chia 3+3, đổi "Số ký tự" sang 4 thì thành 2+2.
6. **Code**: Carousel ra đủ `CarouselContent/Previous/Next`, OTP ra `<InputOTPSlot index={0} />...`, Calendar ra kèm dòng TODO.
7. **AI**: gõ "thêm bảng giá có tab" thì Tabs ra có 2 tab nội dung chứ không rỗng.

## Rủi ro cần để ý

- **Shadow root**: `cmdk` và `input-otp` có thể hành xử lạ khi nằm trong shadow root (phím tắt, focus, selection). Nếu ô Command không lọc được hoặc OTP không nhận focus, báo mình để chuyển sang kiểu hiển thị tĩnh.
- **Carousel**: kéo chuột trên slide có thể xung đột với thao tác chọn node trên canvas. Mũi tên vẫn dùng bình thường.
- **Calendar**: nếu ô lịch tràn hoặc không có style, kiểm tra `calendar.tsx` mới cài có import đúng `buttonVariants`.

## Việc còn thiếu: package.json của project xuất ra

Từ v6.2 đến giờ mình thêm khá nhiều thư viện mà mình chưa kiểm tra file xuất project. Cần xem **`export-project/constants/project-template-files.ts`** và **`export-project/utils/collect-ui-dependencies.ts`**. Danh sách cần có trong `package.json` của project xuất ra:

- Radix: `@radix-ui/react-accordion`, `react-collapsible`, `react-hover-card`, `react-context-menu`, `react-slider`, `react-toggle`, `react-toggle-group`, `react-aspect-ratio`
- Thư viện khác: `react-resizable-panels`, `input-otp`, `react-day-picker`, `embla-carousel-react`, `cmdk`, `vaul`

Bạn gửi 2 file đó, mình viết bản vá nhỏ (gọi là **v6.7c**) để export tự thêm đúng thư viện theo node đã dùng. Sau đó đến **v6.8**: giao diện palette 3 tab Elements / Components / Blocks.

Cả 2 file đều có thông tin hữu ích, và mình phải **đính chính một điều** ở lượt trước. `package.json` xuất ra dùng gói gộp `"radix-ui"`, nên các gói `@radix-ui/react-accordion`, `react-slider`... mình liệt kê hôm trước **không cần thêm**. Chỉ 5 thư viện ngoài Radix là thật sự thiếu: `input-otp`, `react-day-picker`, `embla-carousel-react`, `cmdk`, `vaul`.

# v6.7c: Export project tự thêm đúng thư viện

## 1. `ui-dependencies.ts`: thêm cuối file

```ts
// Thư viện npm ngoài "radix-ui" mà từng file components/ui/*.tsx cần.
// Đối chiếu số phiên bản với package.json của builder sau khi chạy `shadcn add`.
const UI_NPM_PACKAGES: Record<string, Record<string, string>> = {
  "input-otp": { "input-otp": "^1.4.2" },
  calendar: { "react-day-picker": "^9.11.1" },
  carousel: { "embla-carousel-react": "^8.6.0" },
  command: { cmdk: "^1.1.1" },
  drawer: { vaul: "^1.1.2" },
};

export function getNpmPackagesForUiSlugs(slugs: string[]): Record<string, string> {
  return slugs.reduce<Record<string, string>>(
    (acc, slug) => ({ ...acc, ...(UI_NPM_PACKAGES[slug] ?? {}) }),
    {}
  );
}

// File ui nào import file ui khác. Khai báo 1 lần ở đây, khỏi nhớ từng node.
export const UI_PEER_SLUGS: Record<string, string[]> = {
  pagination: ["button"],
  "alert-dialog": ["button"],
  calendar: ["button"],
  carousel: ["button"],
  command: ["dialog"],
  "toggle-group": ["toggle"],
};
```

Đây cũng là lỗi cũ: `pagination.tsx` import `button`, mà `shadcn.pagination` chỉ khai báo `["pagination"]`. Một project chỉ có Pagination mà không có Button sẽ báo `Module not found` khi build.

## 2. `collect-ui-dependencies.ts`: thay toàn bộ

```ts
import { TreeNode } from "@/core/types/builder.types";
import { getUiDependencies, UI_PEER_SLUGS } from "@/core/registry/ui-dependencies";

export function collectRequiredUiSlugs(root: TreeNode): string[] {
  const slugs = new Set<string>();

  function walk(node: TreeNode) {
    getUiDependencies(node.type).forEach((slug) => slugs.add(slug));
    node.children.forEach(walk);
  }
  walk(root);

  // Mở rộng theo file ui phụ thuộc nhau (calendar → button...)
  slugs.forEach((slug) => (UI_PEER_SLUGS[slug] ?? []).forEach((peer) => slugs.add(peer)));

  return Array.from(slugs);
}
```

Chạy `forEach` trên `Set` đang thêm phần tử vẫn duyệt cả phần tử mới thêm, nên phụ thuộc bắc cầu cũng được gom.

## 3. `project-template-files.ts`

Thay hằng `PACKAGE_JSON` bằng:

```ts
const BASE_DEPENDENCIES: Record<string, string> = {
  next: "16.2.9",
  react: "19.2.4",
  "react-dom": "19.2.4",
  cn: "^0.2.6",
  "class-variance-authority": "^0.7.1",
  clsx: "^2.1.1",
  "lucide-react": "^1.21.0",
  "radix-ui": "^1.6.0",
  "tailwind-merge": "^3.6.0",
  "react-resizable-panels": "^4.14.5",
};

const PACKAGE_JSON = (projectSlug: string, extraDeps: Record<string, string> = {}) => {
  const dependencies = Object.fromEntries(
    Object.entries({ ...BASE_DEPENDENCIES, ...extraDeps }).sort(([a], [b]) => a.localeCompare(b))
  );
  return (
    JSON.stringify(
      {
        name: projectSlug,
        version: "0.1.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies,
        devDependencies: {
          "@tailwindcss/postcss": "^4",
          "@types/node": "^20",
          "@types/react": "^19",
          "@types/react-dom": "^19",
          tailwindcss: "^4",
          typescript: "^5",
        },
      },
      null,
      2
    ) + "\n"
  );
};
```

Sửa chữ ký hàm:

```ts
export function getProjectTemplateFiles(
  projectName: string,
  extraDeps: Record<string, string> = {}
): GeneratedFile[] {
  const slug = slugifyPathSegment(projectName);

  return [
    { path: "package.json", content: PACKAGE_JSON(slug, extraDeps) },
    // ...các file còn lại giữ nguyên
```

## 4. Nơi gọi hàm (mình chưa thấy file này)

Chỗ đang gọi `getProjectTemplateFiles(...)` thường là `use-export-project.ts` hoặc `build-zip.ts`. Đổi thành:

```ts
import { getNpmPackagesForUiSlugs } from "@/core/registry/ui-dependencies";

const slugs = collectRequiredUiSlugs(tree);               // đã có sẵn trong luồng export
const npmDeps = getNpmPackagesForUiSlugs(slugs);
const templateFiles = getProjectTemplateFiles(projectName, npmDeps);
```

Nếu cấu trúc luồng khác, gửi mình file đó, mình chỉ đúng dòng.

## 5. Hai việc cần kiểm tra thủ công

**a) Các file ui mới có vào được file zip không?**
`package.json` của bạn có `generate:ui-templates`, chạy tự động trước `pnpm dev` và `pnpm build`. Nó có vẻ tạo ra bản nhúng của `components/ui/*`. Sau khi chạy `shadcn add` cho `accordion`, `slider`, `drawer`..., bạn **khởi động lại `pnpm dev`** (hoặc chạy `pnpm generate:ui-templates`) để các file mới được nhúng. Nếu script dùng danh sách tên file cố định thay vì quét thư mục, các file mới sẽ vắng mặt trong zip, và khi đó gửi mình `scripts/generate-ui-templates.mjs`.

**b) Project xuất ra có bị mất style không?**
Đây là điều mình lo nhất. `GLOBALS_CSS` của template chỉ có `@import "tailwindcss"`, **không có** các biến màu của shadcn (`--background`, `--primary`, `--border`...) và **không import `tw-animate-css`**. Các file ui đều dùng class như `bg-primary`, `text-muted-foreground`, `animate-accordion-down`. Nếu `build-zip.ts` không nối thêm theme ở đâu đó, project xuất ra sẽ có Button, Card, Tabs... **không màu, không viền**, còn Accordion thì không có hiệu ứng mở. Mình không chắc vì chưa xem `build-zip.ts`.

Cách thử nhanh (2 phút): export một project có Button và Card, giải nén, chạy `pnpm install && pnpm dev`. Nếu nút trơn, không nền, thì gửi mình **`src/app/globals.css`** và **`build-zip.ts`**, mình viết `GLOBALS_CSS` đầy đủ (theme, dark mode, animation) và thêm `tw-animate-css` vào danh sách phụ thuộc cơ bản.

## Kiểm tra sau v6.7c

1. Project chỉ có `Pagination`: zip có cả `button.tsx`.
2. Project có `Carousel` và `Command`: `package.json` có `embla-carousel-react` và `cmdk`, kèm `button.tsx` và `dialog.tsx`.
3. Project chỉ có `Div` và `Paragraph`: `package.json` y như trước, không thêm thư viện thừa.
4. Trong zip đã giải nén, `pnpm install && pnpm build` chạy qua.

## Bước tiếp theo: v6.8

v6.8 là giao diện palette 3 tab Elements / Components / Blocks, category thu gọn được, tìm xuyên tầng. Mình cần xem thêm:

1. **`node-list-row.tsx`** (đã xin ở v6.5, để sửa lỗi `iconName={def.icon}` đang trống)
2. **`common-node-ids.ts`** (danh sách "Hay dùng": có nên thêm Tabs, Table, Dialog... vào không)

`quick-add-dropdown.tsx` và `add-node-browser.tsx` mình đã có. Gửi 2 file này (kèm `globals.css` và `build-zip.ts` nếu bước 5b phát hiện lỗi) là mình làm được v6.8.