Dưới đây là code v7, chia thành 4 bước. Bước 1-2 là logic thuần, có thể kiểm thử độc lập. Bước 3-4 là UI.

## Tổng quan file

| File | Thao tác |
|---|---|
| `core/utils/style-cascade.ts` | Sửa (mở rộng, tương thích ngược) |
| `core/store/builder-store.ts` | Sửa (thêm `activeState`, 2 action) |
| `features/inspector/constants/style-field-schema.ts` | Mới |
| `features/inspector/constants/inspector-groups.ts` | Mới (thay `GROUPS` trong `preset-section.tsx`) |
| `features/inspector/hooks/use-style-field.ts` | Sửa (giữ nguyên API cũ) |
| `features/inspector/components/schema-field.tsx` | Mới |
| `features/inspector/components/preset-section.tsx` | Sửa |
| `features/inspector/components/inspector-panel.tsx` | Sửa (viết lại) |

`style-controls.tsx` và `style-field.tsx` giữ nguyên để các section cũ vẫn chạy.

---

## 1. `core/utils/style-cascade.ts`

```ts
// core/utils/style-cascade.ts

import {
  NodeStyle,
  StyleProps,
  Breakpoint,
  StateVariant,
  STYLE_LAYER_KEYS,
} from "@/core/types/style.types";

// "normal" = đang chỉnh theo breakpoint; hover/focus/active = đang chỉnh state layer.
export type ActiveState = "normal" | StateVariant;

// Mọi layer có thể đang được chỉnh trong Inspector.
export type StyleLayer = Breakpoint | StateVariant;

// Khi state = normal thì layer là breakpoint; khi có state thì layer là chính state đó.
export function resolveLayer(breakpoint: Breakpoint, state: ActiveState): StyleLayer {
  return state === "normal" ? breakpoint : state;
}

// Giá trị "đang thấy" tại 1 layer, cascade giống CSS thật:
// lg kế thừa md, md kế thừa base; state layer (hover...) kế thừa base.
// Chỉ dùng để HIỂN THỊ — không ảnh hưởng data lưu hay class xuất ra.
export function getEffectiveStyleValue<K extends keyof StyleProps>(
  style: NodeStyle,
  layer: StyleLayer,
  key: K
): StyleProps[K] {
  switch (layer) {
    case "lg":
      return style.lg?.[key] ?? style.md?.[key] ?? style.base[key];
    case "md":
      return style.md?.[key] ?? style.base[key];
    case "base":
      return style.base[key];
    default:
      return style[layer]?.[key] ?? style.base[key];
  }
}

// Field có bị override RIÊNG tại layer đang xem không (dùng cho nút reset).
// base luôn coi là không override.
export function hasOverrideAt<K extends keyof StyleProps>(
  style: NodeStyle,
  layer: StyleLayer,
  key: K
): boolean {
  if (layer === "base") return false;
  return style[layer]?.[key] !== undefined;
}

// Field đã được đặt ở BẤT KỲ layer nào (base, md, lg, hover, focus, active).
// Dùng `!== undefined` để không mất 0 (padding: 0, flexGrow: 0).
export function hasAnyValue(style: NodeStyle, key: keyof StyleProps): boolean {
  return STYLE_LAYER_KEYS.some((layer) => style[layer]?.[key] !== undefined);
}

export function anyKeyHasValue(style: NodeStyle, keys: readonly (keyof StyleProps)[]): boolean {
  return keys.some((key) => hasAnyValue(style, key));
}
```

---

## 2. `core/store/builder-store.ts` (chỉ các phần thay đổi)

Thêm import:

```ts
import { ActiveState, StyleLayer } from "@/core/utils/style-cascade";
```

Thêm vào `interface BuilderState`:

```ts
  activeState: ActiveState;
  setActiveState: (state: ActiveState) => void;
  updateNodeStyleLayer: (id: string, layer: StyleLayer, patch: Partial<StyleProps>) => void;
  clearNodeStyleLayerOverride: (id: string, layer: StyleLayer, key: keyof StyleProps) => void;
```

Thêm vào initial state (cạnh `activeBreakpoint: "base",`):

```ts
  activeState: "normal",
```

Thêm các action (đặt cạnh `updateNodeStyle`; `updateNodeStyle` và `clearNodeStyleOverride` cũ giữ nguyên):

```ts
  setActiveState: (activeState) => set({ activeState }),

  updateNodeStyleLayer: (id, layer, patch) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const node = findNode(newTree, id);
      if (!node) return {};
      if (layer === "base") {
        node.style.base = { ...node.style.base, ...patch };
      } else {
        node.style[layer] = { ...(node.style[layer] ?? {}), ...patch };
      }
      return { tree: newTree };
    }),

  clearNodeStyleLayerOverride: (id, layer, key) =>
    set((state) => {
      if (layer === "base") return {};
      const newTree = structuredClone(state.tree);
      const node = findNode(newTree, id);
      const override = node?.style[layer];
      if (!node || !override) return {};
      delete override[key];
      return { tree: newTree };
    }),
```

---

## 3. `features/inspector/constants/style-field-schema.ts` (mới)

```ts
// features/inspector/constants/style-field-schema.ts

import type { NodeDefinition } from "@/core/types/node-definition.types";
import type { StyleProps, OpacityStep } from "@/core/types/style.types";

// Loại node dưới góc nhìn Inspector (khác canHaveChildren/category thô).
export type NodeKind = "container" | "text" | "button" | "field" | "media" | "leaf";

export type EnumOption = { value: string | number; label: string };

// Mỗi field khai báo control của nó: Inspector không tự quyết định.
export type FieldControl =
  | { kind: "enum"; options: EnumOption[] }
  | { kind: "int"; min: number; max: number }
  | { kind: "size"; keywords: string[] }
  | { kind: "color" };

export interface StyleFieldSpec {
  key: keyof StyleProps;
  label: string;
  control: FieldControl;
  // undefined = áp dụng cho mọi loại node
  appliesTo?: NodeKind[];
}

// Ngoại lệ theo defId — node có canHaveChildren/category không khớp đúng nghĩa.
const KIND_OVERRIDE: Record<string, NodeKind> = {
  "html.a": "text",
  "shadcn.badge": "button",
  "shadcn.avatar": "media",
};

export function getNodeKind(def?: NodeDefinition): NodeKind {
  if (!def) return "leaf";
  const override = KIND_OVERRIDE[def.id];
  if (override) return override;
  if (def.canHaveChildren) return "container";
  if (def.category === "Typography") return "text";
  if (def.category === "Media") return "media";
  if (def.category === "Form") return def.tags.includes("action") ? "button" : "field";
  return "leaf";
}

// ── Helper khai báo field ──

const SIZE_KEYWORDS = ["auto", "full", "screen", "fit", "1/2", "1/3", "2/3", "1/4", "3/4"];
const OPACITY_STEPS: OpacityStep[] = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const SPACING_STEPS = Array.from({ length: 25 }, (_, i) => i); // 0..24, khớp style-to-classes

const en = (
  key: keyof StyleProps,
  label: string,
  values: readonly (string | number)[],
  appliesTo?: NodeKind[]
): StyleFieldSpec => ({
  key,
  label,
  appliesTo,
  control: { kind: "enum", options: values.map((v) => ({ value: v, label: String(v) })) },
});

const int = (
  key: keyof StyleProps,
  label: string,
  min = 0,
  max = 24,
  appliesTo?: NodeKind[]
): StyleFieldSpec => ({ key, label, appliesTo, control: { kind: "int", min, max } });

const size = (key: keyof StyleProps, label: string, appliesTo?: NodeKind[]): StyleFieldSpec => ({
  key,
  label,
  appliesTo,
  control: { kind: "size", keywords: SIZE_KEYWORDS },
});

const color = (key: keyof StyleProps, label: string, appliesTo?: NodeKind[]): StyleFieldSpec => ({
  key,
  label,
  appliesTo,
  control: { kind: "color" },
});

const TEXT_KINDS: NodeKind[] = ["text", "button"];
const TEXT_KINDS_ALL: NodeKind[] = ["text", "button", "field"];

// bgGradient chưa có UI (value là object, cần control riêng) — để sau.
export const FIELD_SPECS: StyleFieldSpec[] = [
  // Layout
  en("direction", "Hướng", ["flex-row", "flex-col"], ["container"]),
  en("gridCols", "Số cột grid", [1, 2, 3, 4, 6, 12], ["container"]),
  int("gap", "Khoảng cách con", 0, 24, ["container"]),
  int("gapX", "Gap ngang", 0, 24, ["container"]),
  int("gapY", "Gap dọc", 0, 24, ["container"]),
  en("align", "Căn trục phụ", ["items-start", "items-center", "items-end"], ["container"]),
  en("justify", "Căn trục chính", ["justify-start", "justify-center", "justify-between", "justify-end"], ["container"]),
  en("flexWrap", "Xuống dòng", ["flex-nowrap", "flex-wrap", "flex-wrap-reverse"], ["container"]),
  en("display", "Display", ["block", "inline-block", "hidden"]),

  // Sizing
  size("width", "Rộng"),
  size("height", "Cao"),
  en("maxWidth", "Max width", ["sm", "md", "lg", "xl", "2xl", "4xl", "6xl", "7xl", "full", "prose"]),
  en("aspectRatio", "Tỉ lệ", ["auto", "square", "video"], ["media"]),
  en("objectFit", "Object fit", ["cover", "contain", "fill"], ["media"]),

  // Spacing
  int("padding", "Padding"),
  int("paddingX", "Padding ngang"),
  int("paddingY", "Padding dọc"),
  int("margin", "Margin"),
  en("marginX", "Margin ngang", ["auto", ...SPACING_STEPS]),
  int("marginY", "Margin dọc"),

  // Self layout
  en("alignSelf", "Tự căn", ["self-auto", "self-start", "self-center", "self-end", "self-stretch"]),
  en("flexGrow", "Flex grow", [0, 1]),
  en("flexShrink", "Flex shrink", [0, 1]),

  // Position
  en("position", "Position", ["static", "relative", "absolute", "fixed", "sticky"]),
  int("top", "Top", -256, 256),
  int("right", "Right", -256, 256),
  int("bottom", "Bottom", -256, 256),
  int("left", "Left", -256, 256),
  en("zIndex", "Z-index", [0, 10, 20, 30, 40, 50]),

  // Typography
  en("fontSize", "Cỡ chữ", ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"], TEXT_KINDS),
  en("fontWeight", "Độ đậm", ["light", "normal", "medium", "semibold", "bold", "extrabold"], TEXT_KINDS),
  en("fontFamily", "Font", ["sans", "serif", "mono"], TEXT_KINDS),
  en("textAlign", "Căn chữ", ["left", "center", "right"], TEXT_KINDS_ALL),
  en("lineHeight", "Line height", ["none", "tight", "snug", "normal", "relaxed", "loose"], TEXT_KINDS),
  en("letterSpacing", "Letter spacing", ["tighter", "tight", "normal", "wide", "wider", "widest"], TEXT_KINDS),
  en("textTransform", "Viết hoa", ["uppercase", "lowercase", "capitalize", "normal-case"], TEXT_KINDS),
  en("textDecoration", "Gạch chân", ["underline", "line-through", "no-underline"], TEXT_KINDS),
  color("textColor", "Màu chữ", TEXT_KINDS_ALL),
  en("textOpacity", "Độ mờ chữ", OPACITY_STEPS, TEXT_KINDS_ALL),

  // Appearance
  color("bgColor", "Màu nền"),
  en("bgOpacity", "Độ mờ nền", OPACITY_STEPS),
  en("borderWidth", "Độ dày viền", [0, 1, 2, 4]),
  color("borderColor", "Màu viền"),
  en("borderOpacity", "Độ mờ viền", OPACITY_STEPS),
  en("borderRadius", "Bo góc", ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"]),
  en("ringWidth", "Ring", [0, 1, 2, 4, 8]),
  color("ringColor", "Màu ring"),
  en("shadow", "Bóng đổ", ["none", "sm", "md", "lg", "xl", "2xl"]),
  color("shadowColor", "Màu bóng"),

  // Effects
  en("opacity", "Opacity", [0, 25, 50, 75, 100]),
  en("overflow", "Overflow", ["visible", "hidden", "scroll", "auto"]),
  en("blur", "Blur", ["none", "sm", "md", "lg", "xl"]),
  en("backdropBlur", "Backdrop blur", ["none", "sm", "md", "lg", "xl", "2xl"]),
  en("cursor", "Con trỏ", ["pointer", "default", "not-allowed"]),

  // Transform & transition
  en("scale", "Scale (%)", [50, 75, 90, 95, 100, 105, 110, 125]),
  en("rotate", "Xoay (độ)", [-45, -12, -6, -3, -2, -1, 1, 2, 3, 6, 12, 45, 90, 180]),
  en("translateX", "Dịch ngang", [-4, -2, -1, 1, 2, 4]),
  en("translateY", "Dịch dọc", [-4, -2, -1, 1, 2, 4]),
  en("transition", "Transition", ["none", "all", "colors", "shadow", "transform"]),
  en("duration", "Thời lượng (ms)", [75, 150, 200, 300, 500, 700]),
];

export const FIELD_SPEC_BY_KEY = new Map<keyof StyleProps, StyleFieldSpec>(
  FIELD_SPECS.map((spec) => [spec.key, spec] as const)
);

export function fieldAppliesTo(spec: StyleFieldSpec, kind: NodeKind): boolean {
  return !spec.appliesTo || spec.appliesTo.includes(kind);
}
```

---

## 4. `features/inspector/constants/inspector-groups.ts` (mới)

Lưu ý: `GROUPS` cũ trong `preset-section.tsx` chuyển nguyên mảng `names` sang `PRESET_GROUPS` bên dưới, đổi tên và thêm `export`.

```ts
// features/inspector/constants/inspector-groups.ts

import {
  Star, Sparkles, LayoutGrid, Ruler, Space, Layers, Move, Type, Palette, Blend, RotateCw,
  type LucideIcon,
} from "lucide-react";
import type { NodeDefinition } from "@/core/types/node-definition.types";
import type { StyleProps, NodeStyle } from "@/core/types/style.types";
import { anyKeyHasValue } from "@/core/utils/style-cascade";
import {
  FIELD_SPEC_BY_KEY,
  fieldAppliesTo,
  getNodeKind,
  type NodeKind,
  type StyleFieldSpec,
} from "./style-field-schema";

export type GroupId =
  | "common" | "preset" | "layout" | "sizing" | "spacing" | "self-layout"
  | "position" | "typography" | "appearance" | "effects" | "transform";

export interface InspectorGroup {
  id: GroupId;
  label: string;
  icon: LucideIcon;
  fields: (keyof StyleProps)[];
}

// ── Nhóm "Hay dùng": danh sách field theo loại node ──
const COMMON_KEYS_BY_KIND: Record<NodeKind, (keyof StyleProps)[]> = {
  container: ["direction", "gap", "padding", "bgColor", "borderRadius"],
  text: ["fontSize", "fontWeight", "textColor", "textAlign"],
  button: ["paddingX", "paddingY", "borderRadius", "bgColor", "textColor", "shadow", "translateY", "transition"],
  field: ["width", "paddingX", "paddingY", "borderRadius", "bgColor", "textColor"],
  media: ["width", "aspectRatio", "objectFit", "borderRadius"],
  leaf: ["width", "padding", "borderRadius", "bgColor"],
};

export const INSPECTOR_GROUPS: InspectorGroup[] = [
  { id: "common", label: "Hay dùng", icon: Star, fields: [] },
  { id: "preset", label: "Preset", icon: Sparkles, fields: [] },
  {
    id: "layout", label: "Layout", icon: LayoutGrid,
    fields: ["direction", "gridCols", "gap", "gapX", "gapY", "align", "justify", "flexWrap", "display"],
  },
  {
    id: "sizing", label: "Kích thước", icon: Ruler,
    fields: ["width", "height", "maxWidth", "aspectRatio", "objectFit"],
  },
  {
    id: "spacing", label: "Khoảng cách", icon: Space,
    fields: ["padding", "paddingX", "paddingY", "margin", "marginX", "marginY"],
  },
  { id: "self-layout", label: "Tự căn", icon: Layers, fields: ["alignSelf", "flexGrow", "flexShrink"] },
  {
    id: "position", label: "Vị trí", icon: Move,
    fields: ["position", "top", "right", "bottom", "left", "zIndex"],
  },
  {
    id: "typography", label: "Chữ", icon: Type,
    fields: [
      "fontSize", "fontWeight", "fontFamily", "textAlign", "lineHeight", "letterSpacing",
      "textTransform", "textDecoration", "textColor", "textOpacity",
    ],
  },
  {
    id: "appearance", label: "Giao diện", icon: Palette,
    fields: [
      "bgColor", "bgOpacity", "borderWidth", "borderColor", "borderOpacity", "borderRadius",
      "ringWidth", "ringColor", "shadow", "shadowColor",
    ],
  },
  {
    id: "effects", label: "Hiệu ứng", icon: Blend,
    fields: ["opacity", "overflow", "blur", "backdropBlur", "cursor"],
  },
  {
    id: "transform", label: "Biến đổi", icon: RotateCw,
    fields: ["scale", "rotate", "translateX", "translateY", "transition", "duration"],
  },
];

// Keys của group với loại node cụ thể (đã lọc theo appliesTo).
export function getGroupKeys(group: InspectorGroup, kind: NodeKind): (keyof StyleProps)[] {
  if (group.id === "preset") return [];
  if (group.id === "common") return COMMON_KEYS_BY_KIND[kind];
  return group.fields.filter((key) => {
    const spec = FIELD_SPEC_BY_KEY.get(key);
    return !!spec && fieldAppliesTo(spec, kind);
  });
}

export function getGroupFields(group: InspectorGroup, kind: NodeKind): StyleFieldSpec[] {
  return getGroupKeys(group, kind)
    .map((key) => FIELD_SPEC_BY_KEY.get(key))
    .filter((spec): spec is StyleFieldSpec => !!spec);
}

// Ẩn group không có field nào cho loại node này (VD: Layout với Button).
// Common và Preset luôn hiện.
export function getVisibleGroups(kind: NodeKind): InspectorGroup[] {
  return INSPECTOR_GROUPS.filter(
    (g) => g.id === "common" || g.id === "preset" || getGroupKeys(g, kind).length > 0
  );
}

// Chấm trên tile: group có field nào được đặt ở BẤT KỲ layer nào.
export function groupHasValue(style: NodeStyle, keys: (keyof StyleProps)[]): boolean {
  return anyKeyHasValue(style, keys);
}

// ── Preset: nhóm và độ liên quan theo loại node ──

export type PresetGroupId = "layout" | "surface" | "text" | "action" | "media" | "other";

// Chuyển nguyên mảng `names` của GROUPS cũ sang đây.
export const PRESET_GROUPS: { id: PresetGroupId; label: string; names: string[] }[] = [
  // { id: "layout", label: "Layout", names: [...] },
  // { id: "surface", label: "Surface", names: [...] },
  // { id: "text", label: "Text", names: [...] },
  // { id: "action", label: "Action", names: [...] },
  // { id: "media", label: "Media & Form", names: [...] },
];

const PRESET_RELEVANCE_BY_KIND: Record<NodeKind, PresetGroupId[]> = {
  container: ["layout", "surface"],
  text: ["text"],
  button: ["action"],
  field: ["media"],
  media: ["media"],
  leaf: ["surface"],
};

// Ưu tiên theo defId khi kind không đủ mô tả (vd <a> vừa text vừa action).
const PRESET_RELEVANCE_BY_DEF: Record<string, PresetGroupId[]> = {
  "html.a": ["text", "action"],
  "shadcn.badge": ["action", "text"],
  "shadcn.avatar": ["media"],
  "shadcn.alert": ["surface", "text"],
};

export function relevantPresetGroups(def?: NodeDefinition): PresetGroupId[] {
  if (!def) return ["layout"];
  return PRESET_RELEVANCE_BY_DEF[def.id] ?? PRESET_RELEVANCE_BY_KIND[getNodeKind(def)];
}
```

---

## 5. `features/inspector/hooks/use-style-field.ts`

Giữ nguyên API cũ (`getValue`, `setValue`, `hasOverride`, `clearOverride`) nên `style-controls.tsx` và các section cũ vẫn chạy.

```ts
// features/inspector/hooks/use-style-field.ts

"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getEffectiveStyleValue, hasOverrideAt, resolveLayer } from "@/core/utils/style-cascade";

export function useStyleField(node: TreeNode) {
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const activeState = useBuilderStore((s) => s.activeState);
  const updateNodeStyleLayer = useBuilderStore((s) => s.updateNodeStyleLayer);
  const clearNodeStyleLayerOverride = useBuilderStore((s) => s.clearNodeStyleLayerOverride);

  // Một nguồn duy nhất cho layer đang chỉnh: breakpoint khi normal, state khi hover/focus/active.
  const layer = resolveLayer(activeBreakpoint, activeState);

  return {
    layer,
    state: activeState,
    breakpoint: activeBreakpoint,
    getValue: <K extends keyof StyleProps>(key: K) =>
      getEffectiveStyleValue(node.style, layer, key),
    setValue: <K extends keyof StyleProps>(key: K, value: StyleProps[K]) =>
      updateNodeStyleLayer(node.id, layer, { [key]: value } as Partial<StyleProps>),
    hasOverride: (key: keyof StyleProps) => hasOverrideAt(node.style, layer, key),
    clearOverride: (key: keyof StyleProps) => clearNodeStyleLayerOverride(node.id, layer, key),
  };
}
```

---

## 6. `features/inspector/components/schema-field.tsx` (mới)

```tsx
// features/inspector/components/schema-field.tsx

"use client";

import { useEffect, useState } from "react";
import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import type { FieldControl, EnumOption, StyleFieldSpec } from "../constants/style-field-schema";
import { StyleField } from "./style-field";

// Giống COLOR_TOKEN / HEX_COLOR trong style-to-classes.ts, để không lưu giá trị sẽ bị bỏ im lặng.
const COLOR_TOKEN = /^[a-z]+(?:-[a-z]+)?(?:-\d{2,3})?(?:\/(?:[0-9]|[1-9][0-9]|100))?$/;
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const isValidColor = (v: string) => COLOR_TOKEN.test(v) || HEX_COLOR.test(v);

export function SchemaField({ node, spec }: { node: TreeNode; spec: StyleFieldSpec }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const value = getValue(spec.key);

  return (
    <StyleField
      label={spec.label}
      showClear={hasOverride(spec.key)}
      onClear={() => clearOverride(spec.key)}
    >
      <ControlRenderer
        control={spec.control}
        value={value}
        onChange={(next) => setValue(spec.key, next as never)}
      />
    </StyleField>
  );
}

function ControlRenderer({
  control,
  value,
  onChange,
}: {
  control: FieldControl;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (control.kind) {
    case "enum":
      return <EnumSelect options={control.options} value={value} onChange={onChange} />;
    case "int":
      return (
        <IntInput
          value={value as number | undefined}
          min={control.min}
          max={control.max}
          onCommit={onChange}
        />
      );
    case "size":
      return <SizeControl keywords={control.keywords} value={value} onChange={onChange} />;
    case "color":
      return <ColorInput value={value as string | undefined} onCommit={onChange} />;
  }
}

function EnumSelect({
  options,
  value,
  onChange,
}: {
  options: EnumOption[];
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const raw = value === undefined ? "" : String(value);
  return (
    <select
      value={raw}
      onChange={(event) => {
        const picked = event.target.value;
        if (picked === "") return onChange(undefined);
        const match = options.find((option) => String(option.value) === picked);
        if (match) onChange(match.value);
      }}
      className="border rounded px-2 py-1"
    >
      <option value="">—</option>
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Dùng draft: commit khi blur/Enter, nên gõ "-" hay "1" rồi "12" không bị reset giữa chừng.
function IntInput({
  value,
  min,
  max,
  onCommit,
}: {
  value?: number;
  min: number;
  max: number;
  onCommit: (next: number | undefined) => void;
}) {
  const stored = value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(stored);
  useEffect(() => setDraft(stored), [stored]);

  const commit = () => {
    if (draft.trim() === "") return onCommit(undefined);
    const parsed = Number(draft);
    if (!Number.isInteger(parsed)) return setDraft(stored);
    const clamped = Math.min(max, Math.max(min, parsed));
    onCommit(clamped);
    setDraft(String(clamped));
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={1}
      placeholder="—"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
      }}
      className="border rounded px-2 py-1 w-full"
    />
  );
}

// Từ khóa (full, 1/2...) hoặc px. Chọn "px" mới hiện ô số.
function SizeControl({
  keywords,
  value,
  onChange,
}: {
  keywords: string[];
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const isPx = typeof value === "number";
  const selectValue = isPx ? "__px" : value === undefined ? "" : String(value);

  return (
    <div className="flex gap-1">
      <select
        value={selectValue}
        onChange={(event) => {
          const picked = event.target.value;
          if (picked === "") return onChange(undefined);
          if (picked === "__px") return onChange(isPx ? (value as number) : 0);
          onChange(picked);
        }}
        className="border rounded px-2 py-1 min-w-0 flex-1"
      >
        <option value="">—</option>
        {keywords.map((keyword) => (
          <option key={keyword} value={keyword}>
            {keyword}
          </option>
        ))}
        <option value="__px">px</option>
      </select>
      {isPx && (
        <div className="w-20">
          <IntInput value={value as number} min={0} max={2000} onCommit={onChange} />
        </div>
      )}
    </div>
  );
}

function ColorInput({
  value,
  onCommit,
}: {
  value?: string;
  onCommit: (next: string | undefined) => void;
}) {
  const stored = value ?? "";
  const [draft, setDraft] = useState(stored);
  useEffect(() => setDraft(stored), [stored]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === "") return onCommit(undefined);
    if (isValidColor(trimmed)) return onCommit(trimmed);
    setDraft(stored); // sai định dạng thì quay về giá trị đã lưu
  };

  return (
    <input
      type="text"
      placeholder="zinc-900 hoặc #hex"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
      }}
      className="border rounded px-2 py-1"
    />
  );
}
```

---

## 7. `features/inspector/components/preset-section.tsx` (viết lại)

```tsx
// features/inspector/components/preset-section.tsx

"use client";

import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { STYLE_PRESETS } from "@/core/registry/style-presets";
import { cn } from "@/core/utils/cn";
import {
  PRESET_GROUPS,
  relevantPresetGroups,
  type PresetGroupId,
} from "../constants/inspector-groups";

export function PresetSection({ node }: { node: TreeNode }) {
  const applyStylePreset = useBuilderStore((s) => s.applyStylePreset);
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const relevant = relevantPresetGroups(getNodeDefinition(node.type));
  const [openIds, setOpenIds] = useState<Set<PresetGroupId>>(() => new Set(relevant));

  // Preset mới chưa xếp nhóm tự rơi vào "Khác" — không bao giờ bị ẩn.
  const known = new Set(Object.keys(STYLE_PRESETS));
  const groups = PRESET_GROUPS
    .map((g) => ({ ...g, names: g.names.filter((n) => known.has(n)) }))
    .filter((g) => g.names.length > 0);
  const used = new Set(groups.flatMap((g) => g.names));
  const leftover = Object.keys(STYLE_PRESETS).filter((n) => !used.has(n));
  if (leftover.length > 0) groups.push({ id: "other", label: "Khác", names: leftover });

  const rank = (id: PresetGroupId) => {
    const i = relevant.indexOf(id);
    return i === -1 ? 999 : i;
  };
  const sorted = [...groups].sort((a, b) => rank(a.id) - rank(b.id));

  const toggle = (id: PresetGroupId) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const apply = (name: string | null) => {
    // Preset thay toàn bộ style, kể cả mọi breakpoint và state — cần xác nhận.
    if (!window.confirm("Áp preset sẽ thay toàn bộ style của node (mọi breakpoint và trạng thái). Tiếp tục?")) {
      return;
    }
    applyStylePreset(node.id, name);
    setLastApplied(name ?? "default");
  };

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((g) => {
        const isOpen = openIds.has(g.id);
        const isRelevant = relevant.includes(g.id);

        return (
          <div key={g.id} className="rounded-md border">
            <button
              type="button"
              onClick={() => toggle(g.id)}
              className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium"
            >
              <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-90")} />
              {g.label}
              <span className="font-normal text-muted-foreground">({g.names.length})</span>
              {isRelevant && (
                <span className="ml-auto rounded bg-primary/10 px-1.5 text-[10px] font-normal text-primary">
                  Gợi ý
                </span>
              )}
            </button>

            {isOpen && (
              <div className="flex flex-wrap gap-1 border-t px-2 py-2">
                {g.names.map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={STYLE_PRESETS[name].description}
                    onClick={() => apply(name)}
                    className={cn(
                      "rounded border px-2 py-1 text-xs hover:bg-muted",
                      lastApplied === name && "border-primary bg-primary/10 text-primary"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {lastApplied && (
        <p className="text-[10px] text-muted-foreground">
          Đã áp dụng: <b>{lastApplied}</b>
          {STYLE_PRESETS[lastApplied]
            ? ` — ${STYLE_PRESETS[lastApplied].description}`
            : " — preset mặc định của loại node này"}
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
    </div>
  );
}
```

---

## 8. `features/inspector/components/inspector-panel.tsx` (viết lại)

```tsx
// features/inspector/components/inspector-panel.tsx

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useActiveNode, useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { cn } from "@/core/utils/cn";
import type { ActiveState } from "@/core/utils/style-cascade";
import { BreakpointSwitcher } from "./breakpoint-switcher";
import { DynamicPropsForm } from "./dynamic-props-form";
import { PresetSection } from "./preset-section";
import { SchemaField } from "./schema-field";
import { getNodeKind } from "../constants/style-field-schema";
import {
  getGroupFields,
  getGroupKeys,
  getVisibleGroups,
  groupHasValue,
  type GroupId,
} from "../constants/inspector-groups";

const STATES: { id: ActiveState; label: string }[] = [
  { id: "normal", label: "Thường" },
  { id: "hover", label: "Hover" },
  { id: "focus", label: "Focus" },
  { id: "active", label: "Active" },
];

export function InspectorPanel() {
  const activeNode = useActiveNode();
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const editMode = useBuilderStore((s) => s.editMode);
  const activeState = useBuilderStore((s) => s.activeState);
  const setActiveState = useBuilderStore((s) => s.setActiveState);
  const [selectedId, setSelectedId] = useState<GroupId>("common");

  if (!editMode || !activeNode) return null;

  const def = getNodeDefinition(activeNode.type);
  // Component Instance không có style riêng — style nằm ở Component gốc (nguyên tắc V1.9).
  const isInstance = def?.nodeKind === "component-instance";
  const kind = getNodeKind(def);
  const groups = getVisibleGroups(kind);
  const current = groups.find((g) => g.id === selectedId) ?? groups[0];
  const fields = current ? getGroupFields(current, kind) : [];

  return (
    <div className="fixed top-4 right-4 w-80 bg-white/50 border rounded-lg shadow-lg flex flex-col z-[6000] max-h-[80vh]">
      <div className="sticky top-0 bg-white px-4 py-3 flex items-center justify-between border-b border-zinc-100">
        <span className="text-sm font-medium">{def?.title ?? activeNode.type}</span>
        <button
          type="button"
          onClick={() => setActiveNode(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {isInstance ? (
        <p className="p-4 text-xs text-muted-foreground">
          Component Instance không sửa trực tiếp — chọn đúng Component gốc trong Components/ để sửa.
        </p>
      ) : (
        <div className="min-h-0 overflow-y-auto p-3 flex flex-col gap-3 bg-white/30 backdrop-blur-[2px]">
          <DynamicPropsForm node={activeNode} />

          {/* Trạng thái tương tác */}
          <div className="flex rounded-md border p-0.5 text-[11px]">
            {STATES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveState(s.id)}
                className={cn(
                  "flex-1 rounded px-1.5 py-1",
                  activeState === s.id ? "bg-sky-500 text-white" : "hover:bg-zinc-100"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Breakpoint chỉ áp dụng khi đang ở trạng thái thường */}
          {activeState === "normal" && <BreakpointSwitcher />}

          {/* Lưới nhóm */}
          <div className="grid grid-cols-4 gap-1">
            {groups.map((g) => {
              const Icon = g.icon;
              const selected = g.id === current?.id;
              const hasValue =
                g.id !== "preset" && groupHasValue(activeNode.style, getGroupKeys(g, kind));
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-md p-2 text-[10px] transition-colors",
                    selected ? "ring-2 ring-sky-500 bg-sky-50" : "hover:bg-zinc-100"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="w-full truncate text-center">{g.label}</span>
                  {hasValue && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-sky-500" />}
                </button>
              );
            })}
          </div>

          {/* Nội dung nhóm đang chọn */}
          <div className="flex flex-col gap-3 border-t pt-3">
            {current?.id === "preset" ? (
              <PresetSection key={activeNode.id} node={activeNode} />
            ) : (
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
        </div>
      )}
    </div>
  );
}
```

---

## Lưu ý khi chạy thử

1. **Hover và breakpoint:** state hover/focus/active không chỉnh theo breakpoint. Panel ẩn `BreakpointSwitcher` khi không ở trạng thái thường. Lý do là `styleToClasses` sinh `hover:` ở mức layer, không có kiểu `hover:md:`. Nếu cần hover theo breakpoint, phải đổi `style-to-classes.ts` trước.
2. **Preset:** giờ có `window.confirm`. Preset không theo state, nên áp dụng sẽ xóa cả hover đã chỉnh.
3. **Số nhóm:** còn 11 nhóm kèm "Hay dùng" và "Preset", tổng 13 tile. `typography-extras` và `extras` đã gộp vào các nhóm chính.
4. **Chưa có UI:** `bgGradient` (cần control object riêng). Ô màu hiện là text input, có thể thay bằng `color-picker-field.tsx` trong `ColorInput` khi biết props của nó.
5. **Dọn dẹp sau này:** `style-controls.tsx` và các section cũ (`spacing-section`, `sizing-section`...) có thể xóa khi đã chuyển hết sang schema. `StyleNumberField` vẫn hard-code `min={0} max={24}`, nên đừng dùng cho `top/left`.
6. **Kiểm tra trước khi merge:** tên icon lucide (`Space`, `Move`, `Type`) trong `lucide-react` v1, đường dẫn `cn` và `BreakpointSwitcher`/`DynamicPropsForm` đúng với props hiện có.

Bạn chạy thử và gửi lỗi (nếu có) hoặc ảnh panel, tôi sẽ sửa tiếp.