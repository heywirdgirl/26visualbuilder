// core/utils/style-cascade.ts

import { NodeStyle, StyleProps, Breakpoint } from "@/core/types/style.types";

// Giá trị "đang thấy" tại 1 breakpoint — cascade xuống md/base giống đúng cách trình duyệt
// áp Tailwind thật khi resize (lg: kế thừa md: nếu không override, md: kế thừa base nếu
// không override). CHỈ dùng để HIỂN THỊ trong Inspector cho dễ hiểu — không ảnh hưởng data
// lưu hay class thật xuất ra (styleToClasses ở Phase 2 không dùng hàm này).
export function getEffectiveStyleValue<K extends keyof StyleProps>(
  style: NodeStyle,
  breakpoint: Breakpoint,
  key: K
): StyleProps[K] {
  if (breakpoint === "lg") return style.lg?.[key] ?? style.md?.[key] ?? style.base[key];
  if (breakpoint === "md") return style.md?.[key] ?? style.base[key];
  return style.base[key];
}

// Field có bị override RIÊNG tại breakpoint đang xem không (khác giá trị kế thừa) —
// dùng để hiện nút "reset về kế thừa". base luôn coi là không override.
export function hasOverrideAt<K extends keyof StyleProps>(
  style: NodeStyle,
  breakpoint: Breakpoint,
  key: K
): boolean {
  if (breakpoint === "base") return false;
  return style[breakpoint]?.[key] !== undefined;
}
