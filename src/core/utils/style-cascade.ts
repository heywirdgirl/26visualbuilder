// core/utils/style-cascade.ts

import {
  NodeStyle,
  StyleProps,
  Breakpoint,
  StateVariant,
  STYLE_LAYER_KEYS,
} from "@/core/types/style.types";

export type ActiveState = "normal" | StateVariant;
export type StyleLayer = Breakpoint | StateVariant;

export function resolveLayer(breakpoint: Breakpoint, state: ActiveState): StyleLayer {
  return state === "normal" ? breakpoint : state;
}

// Giá trị "đang thấy" tại 1 breakpoint — cascade xuống md/base giống đúng cách trình duyệt
// áp Tailwind thật khi resize (lg: kế thừa md: nếu không override, md: kế thừa base nếu
// không override). CHỈ dùng để HIỂN THỊ trong Inspector cho dễ hiểu — không ảnh hưởng data
// lưu hay class thật xuất ra (styleToClasses ở Phase 2 không dùng hàm này).
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

// Field có bị override RIÊNG tại breakpoint đang xem không (khác giá trị kế thừa) —
// dùng để hiện nút "reset về kế thừa". base luôn coi là không override.
export function hasOverrideAt<K extends keyof StyleProps>(
  style: NodeStyle,
  layer: StyleLayer,
  key: K
): boolean {
  if (layer === "base") return false;
  return style[layer]?.[key] !== undefined;
}

export function hasAnyValue(style: NodeStyle, key: keyof StyleProps): boolean {
  return STYLE_LAYER_KEYS.some((layer) => style[layer]?.[key] !== undefined);
}

export function anyKeyHasValue(style: NodeStyle, keys: readonly (keyof StyleProps)[]): boolean {
  return keys.some((key) => hasAnyValue(style, key));
}
