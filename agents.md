Mình hiểu hai việc: (1) Inspector có ô chọn preset để áp dụng 1 chạm, (2) mỗi loại node có preset mặc định, tự áp khi bấm Add Node (cả nút "+" lẫn Browser). Nếu "làm preset" nghĩa là người dùng tự lưu preset của riêng mình thì đó là hướng khác (lưu vào DB), bạn báo mình.

## Các quyết định thiết kế

- **Bảng map riêng, không sửa 66 definition.** Preset mặc định nằm trong `default-presets.ts` (id node → tên preset). Không phải sửa từng dòng trong registry. Node chưa có trong bảng vẫn dùng `defaultStyle` cũ.
- **`shadcn.button` dùng `button-soft` (chỉ bo góc + hiệu ứng), không dùng `button-primary`.** `shadcn.button` có prop `variant` riêng. Nếu áp preset có `bgColor`, class màu đó đè lên variant (qua tailwind-merge), nên người dùng chọn `outline` mà nút vẫn đen. Preset mặc định của loại này chỉ được chứa hình dáng, không chứa màu hay padding.
- **`div`/`main`/`article` dùng preset `box` (`flex flex-col gap-4 p-4`).** Container rỗng không có padding sẽ cao 0px, không nhìn thấy và không bấm chọn được trên Canvas. Đây là lý do `p-4` có từ V1. Mình ẩn `box` khỏi prompt AI để AI không quay lại thói quen cũ.
- **Card tự đẹp hơn.** Card có `defaultChildren` (Heading + Paragraph) nên 2 con đó tự nhận `heading-card` và `text-body` qua cùng cơ chế.
- **Áp preset là thay toàn bộ style của node (mọi breakpoint).** Kèm nút "Reset về mặc định". App chưa có undo, nên nút Reset là đường quay lại.
- **Node cũ đã tạo trong project không đổi.** Chỉ node thêm mới mới nhận preset mặc định.

**Mình phải sửa một lỗi của lượt trước.** Safelist ở `preview.css` chỉ phủ spacing và màu. Các class tĩnh đi kèm biến thể (`md:grid-cols-3`, `md:text-6xl`, `hover:shadow-xl`, `hover:-translate-y-1`, `focus:ring-2`) không có trong CSS của Canvas, vì Tailwind chỉ quét literal trong source mà tiền tố `md:`/`hover:` được ghép lúc chạy. Preset dùng chúng rất nhiều, nên Canvas sẽ không hiện lưới responsive hay hiệu ứng hover (code export vẫn đúng). Mình vá ở bước 5, khoảng 300 class.

---

## 1. Thêm preset vào `core/registry/style-presets.ts`

Dán vào **cuối object `STYLE_PRESETS`**, ngay trước dấu `};`:

```typescript
  // ── Preset mặc định khi Add Node (xem default-presets.ts) ──
  box: {
    description: "plain padded container (always visible when empty): stack gap 4, padding 4",
    style: { base: { direction: "flex-col", gap: 4, padding: 4 } },
  },
  navbar: {
    description: "top bar: row, centered, space-between, padding x 6 / y 4",
    style: { base: { direction: "flex-row", align: "items-center", justify: "justify-between", gap: 4, paddingX: 6, paddingY: 4 } },
  },
  footer: {
    description: "page footer: stacked, zinc-100 background, generous padding",
    style: { base: { direction: "flex-col", gap: 4, paddingX: 6, paddingY: 8, bgColor: "zinc-100" } },
  },
  list: {
    description: "vertical list, gap 2",
    style: { base: { direction: "flex-col", gap: 2 } },
  },
  "list-item": {
    description: "list row: horizontal, centered, gap 2",
    style: { base: { direction: "flex-row", align: "items-center", gap: 2 } },
  },
  link: {
    description: "inline link: blue-500, underline on hover",
    style: {
      base: { direction: "flex-row", align: "items-center", gap: 1, textColor: "blue-500", transition: "colors" },
      hover: { textDecoration: "underline" },
    },
  },
  label: {
    description: "form label: sm, medium, zinc-700",
    style: { base: { fontSize: "sm", fontWeight: "medium", textColor: "zinc-700" } },
  },
  "input-field": {
    description: "form field: full width, thin border, rounded-lg, blue focus ring",
    style: {
      base: { width: "full", borderWidth: 1, borderColor: "zinc-300", borderRadius: "lg", paddingX: 3, paddingY: 2, transition: "all" },
      focus: { ringWidth: 2, ringColor: "blue-500" },
    },
  },
  "button-soft": {
    description: "shape-only button polish (keeps the component's own variant colors): rounded-xl, lifts on hover",
    style: { base: { borderRadius: "xl", transition: "all", duration: 200 }, hover: { translateY: -1, shadow: "md" } },
  },
```

## 2. `core/registry/default-presets.ts` (file mới)

```typescript
import { NodeDefinition } from "@/core/types/node-definition.types";
import { NodeStyle } from "@/core/types/style.types";
import { getStylePreset } from "./style-presets";

// defId → tên preset áp khi bấm Add Node. Node không có trong bảng dùng defaultStyle cũ.
// Cố ý để ngoài NodeDefinition để không phải sửa từng dòng trong 66 definition.
export const DEFAULT_PRESET_BY_NODE: Record<string, string> = {
  // Layout (container rỗng vẫn phải nhìn thấy/bấm chọn được → có padding)
  "html.div": "box",
  "html.main": "box",
  "html.article": "box",
  "html.section": "section",
  "html.header": "navbar",
  "html.footer": "footer",
  "html.aside": "surface-muted",
  "html.nav": "row",

  // Typography
  "html.h1": "heading-hero",
  "html.h2": "heading-section",
  "html.h3": "heading-card",
  "html.p": "text-body",
  "html.label": "label",
  "shadcn.label": "label",

  // List & link
  "html.ul": "list",
  "html.ol": "list",
  "html.li": "list-item",
  "html.a": "link",

  // Form
  "html.button": "button-primary",
  "html.input": "input-field",
  "html.textarea": "input-field",
  "html.select": "input-field",
  // shadcn.button có variant riêng → CHỈ preset hình dáng, không màu/padding (tránh đè variant/size)
  "shadcn.button": "button-soft",

  // Media & surface
  "html.img": "image-cover",
  "shadcn.card": "card",
};

export function resolveDefaultStyle(def: NodeDefinition): NodeStyle {
  const preset = getStylePreset(DEFAULT_PRESET_BY_NODE[def.id])?.style;
  if (preset) return structuredClone(preset);
  return { base: structuredClone(def.defaultStyle ?? {}) };
}
```

## 3. Patch `core/store/builder-store.ts`

Thêm import:
```typescript
import { resolveDefaultStyle } from "@/core/registry/default-presets";
import { getStylePreset } from "@/core/registry/style-presets";
```

Trong `buildChildNode`, đổi 1 dòng:
```typescript
// Đổi:
style: { base: structuredClone(childDef.defaultStyle ?? {}) },
// Thành:
style: resolveDefaultStyle(childDef),
```

Trong `addNode`, đổi 1 dòng:
```typescript
// Đổi:
style: { base: structuredClone(def.defaultStyle ?? {}) },
// Thành:
style: resolveDefaultStyle(def),
```

Thêm vào interface `BuilderState`:
```typescript
applyStylePreset: (id: string, presetName: string | null) => void; // null = reset về preset mặc định
```

Thêm action (cạnh `updateNodeStyle`):
```typescript
applyStylePreset: (id, presetName) =>
  set((state) => {
    const newTree = structuredClone(state.tree);
    const node = findNode(newTree, id);
    if (!node) return {};
    const def = getNodeDefinition(node.type);
    if (!def) return {};

    if (presetName === null) {
      node.style = resolveDefaultStyle(def);
    } else {
      const preset = getStylePreset(presetName);
      if (!preset) return {};
      node.style = structuredClone(preset.style); // thay TOÀN BỘ style (mọi breakpoint/state)
    }
    return { tree: newTree };
  }),
```

## 4. Inspector: ô chọn preset

### `features/inspector/components/preset-section.tsx` (file mới)

```tsx
"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { STYLE_PRESETS } from "@/core/registry/style-presets";
import { SectionShell } from "./section-shell";

const GROUPS: { label: string; names: string[] }[] = [
  { label: "Layout", names: ["page-container", "section", "hero", "box", "stack", "stack-lg", "row", "row-between", "row-wrap", "grid-2", "grid-3", "grid-4", "navbar", "footer", "list", "list-item"] },
  { label: "Surface", names: ["card", "card-featured", "card-dark", "card-glass", "surface-muted"] },
  { label: "Text", names: ["heading-hero", "heading-section", "heading-card", "text-lead", "text-body", "text-muted", "price", "eyebrow", "label", "link"] },
  { label: "Action", names: ["button-primary", "button-block", "button-accent", "button-soft", "badge-pill"] },
  { label: "Media & Form", names: ["image-cover", "input-field"] },
];

export function PresetSection({ node }: { node: TreeNode }) {
  const applyStylePreset = useBuilderStore((s) => s.applyStylePreset);
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  // Preset nào chưa nằm trong GROUPS tự rơi vào nhóm "Khác" — thêm preset mới không bao giờ bị ẩn.
  const known = new Set(Object.keys(STYLE_PRESETS));
  const groups = GROUPS.map((g) => ({ ...g, names: g.names.filter((n) => known.has(n)) })).filter((g) => g.names.length > 0);
  const used = new Set(groups.flatMap((g) => g.names));
  const others = Object.keys(STYLE_PRESETS).filter((n) => !used.has(n));
  if (others.length > 0) groups.push({ label: "Khác", names: others });

  const apply = (name: string | null) => {
    applyStylePreset(node.id, name);
    setLastApplied(name ?? "default");
  };

  return (
    <SectionShell title="Preset" defaultOpen>
      <select
        value=""
        onChange={(e) => e.target.value && apply(e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="">— Chọn preset —</option>
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.names.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {lastApplied && (
        <p className="text-[10px] text-muted-foreground">
          Đã áp dụng: <b>{lastApplied}</b>
          {STYLE_PRESETS[lastApplied] ? ` — ${STYLE_PRESETS[lastApplied].description}` : " — preset mặc định của loại node này"}
        </p>
      )}

      <button
        type="button"
        onClick={() => apply(null)}
        className="flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" />
        Reset về mặc định
      </button>

      <p className="text-[10px] text-muted-foreground">
        Áp preset sẽ thay toàn bộ style của node này (mọi breakpoint). Dùng Reset để quay về mặc định.
      </p>
    </SectionShell>
  );
}
```

### `features/inspector/components/inspector-panel.tsx` — full file

```tsx
"use client";

import { useBuilderStore, useActiveNode } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { BreakpointSwitcher } from "./breakpoint-switcher";
import { PresetSection } from "./preset-section";
import { LayoutSection } from "./layout-section";
import { SizingSection } from "./sizing-section";
import { SpacingSection } from "./spacing-section";
import { PositionSection } from "./position-section";
import { SelfLayoutSection } from "./self-layout-section";
import { TypographySection } from "./typography-section";
import { AppearanceSection } from "./appearance-section";
import { GradientSection } from "./gradient-section";
import { EffectsSection } from "./effects-section";
import { TransformSection } from "./transform-section";
import { TypographyExtrasSection } from "./typography-extras-section";
import { ExtrasSection } from "./extras-section";
import { DynamicPropsForm } from "./dynamic-props-form";

export function InspectorPanel() {
  const activeNode = useActiveNode();
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const editMode = useBuilderStore((s) => s.editMode);

  if (!editMode || !activeNode) return null;

  const def = getNodeDefinition(activeNode.type);
  const isInstance = def?.nodeKind === "component-instance";

  return (
    <div className="fixed top-4 right-4 w-72 bg-white border rounded-lg shadow-lg p-4 flex flex-col gap-4 z-40 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{def?.title ?? activeNode.type}</span>
        <button onClick={() => setActiveNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>

      {isInstance ? (
        <p className="text-xs text-muted-foreground">
          Component Instance không sửa trực tiếp — chọn đúng Component gốc trong Components/ để sửa.
        </p>
      ) : (
        <>
          <DynamicPropsForm node={activeNode} />
          {/* key = id node → đổi node thì ô "Đã áp dụng: ..." tự reset, không hiện nhầm của node trước */}
          <PresetSection key={activeNode.id} node={activeNode} />
          <BreakpointSwitcher />
          {def?.canHaveChildren && <LayoutSection node={activeNode} />}
          <SizingSection node={activeNode} />
          <SpacingSection node={activeNode} />
          <PositionSection node={activeNode} />
          <SelfLayoutSection node={activeNode} />
          <TypographySection node={activeNode} />
          <AppearanceSection node={activeNode} />
          <GradientSection node={activeNode} />
          <EffectsSection node={activeNode} />
          <TransformSection node={activeNode} />
          <TypographyExtrasSection node={activeNode} />
          <ExtrasSection node={activeNode} />
        </>
      )}
    </div>
  );
}
```

## 5. Vá safelist — thêm vào cuối `src/app/preview.css`

```css
/* md:/lg: cho layout & typography (class tĩnh nhưng tiền tố ghép lúc chạy nên phải safelist) */
@source inline("{md:,lg:}{flex,grid,hidden,block,inline-block,flex-row,flex-col,flex-wrap,flex-nowrap}");
@source inline("{md:,lg:}grid-cols-{1,2,3,4,6,12}");
@source inline("{md:,lg:}{items-start,items-center,items-end,justify-start,justify-center,justify-between,justify-end}");
@source inline("{md:,lg:}text-{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,left,center,right}");
@source inline("{md:,lg:}w-{auto,full,screen,fit,1/2,1/3,2/3,1/4,3/4}");
@source inline("{md:,lg:}max-w-{sm,md,lg,xl,2xl,4xl,6xl,7xl,full,prose}");
@source inline("{md:,lg:}{static,relative,absolute,fixed,sticky}");

/* hover:/focus:/active: cho hiệu ứng tương tác */
@source inline("{hover:,focus:,active:}shadow-{none,sm,md,lg,xl,2xl}");
@source inline("{hover:,focus:,active:}{-translate-y-,translate-y-,-translate-x-,translate-x-}{1,2,4}");
@source inline("{hover:,focus:,active:}scale-{50,75,90,95,100,105,110,125}");
@source inline("{hover:,focus:,active:}{rotate-,-rotate-}{1,2,3,6,12,45}");
@source inline("{hover:,focus:,active:}ring-{0,1,2,4,8}");
@source inline("{hover:,focus:,active:}{underline,no-underline,line-through}");
@source inline("{hover:,focus:,active:}opacity-{0,25,50,75,100}");
@source inline("{hover:,focus:,active:}rounded-{none,sm,md,lg,xl,2xl,3xl,full}");
```

## 6. Ẩn `box` khỏi AI — `features/ai-assistant/prompts/add-node.prompt.ts`

Sửa hàm `formatPresets`:
```typescript
const formatPresets = () =>
  Object.entries(STYLE_PRESETS)
    .filter(([name]) => name !== "box") // box = diện mạo mặc định cũ (flex flex-col gap-4 p-4) — ẩn để AI không quay lại thói quen đó
    .map(([name, p]) => `- ${name}: ${p.description}`)
    .join("\n");
```
Các preset mới còn lại (`navbar`, `footer`, `link`...) tự xuất hiện trong prompt AI, không cần sửa gì thêm.

---

## Kiểm tra

1. **Add Node:** thêm một `Div`, Canvas phải hiện khung có padding. Thêm `Card`, phải ra card bo `2xl` có bóng, chứa sẵn tiêu đề `xl` đậm và đoạn mô tả `zinc-700`. Thêm `Heading 1` thì chữ to. Thêm `Button` shadcn rồi đổi `variant` sang `outline` trong Inspector, nút phải đổi theo (xác nhận không bị đè màu).
2. **Chọn preset:** chọn một Div, vào "Preset" → `grid-3`, thêm 3 Card vào trong. Resize cửa sổ, phải thấy 1 → 2 → 3 cột. Nếu không thấy, chạy `grep -c "md:grid-cols-2" public/preview.css`, kết quả phải lớn hơn 0 (nhớ chạy lại `dev:css`).
3. **Reset:** áp `card-dark` lên một Div rồi bấm "Reset về mặc định", phải quay về diện mạo `box`.
4. **Code Modal:** className của Card phải có `hover:shadow-xl hover:-translate-y-1`.

## Giới hạn cần biết

- **Hiệu ứng hover chỉ thấy khi rê chuột**, trên điện thoại sẽ không kiểm tra được. Hãy xem class trong Code Modal.
- **Preset là thay hết, chưa có undo.** Nếu đã chỉnh tay nhiều rồi lỡ áp preset khác, chỉ quay về được diện mạo mặc định, không quay về bản chỉnh tay.
- **Preset hiện cố định trong code.** Muốn người dùng lưu preset của riêng mình (ví dụ "lưu style node này thành preset"), cần thêm bảng DB và UI. Hướng đó đúng với Marketplace sau này, nhưng là một tính năng riêng.