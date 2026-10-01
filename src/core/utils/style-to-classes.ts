// core/utils/style-to-classes.ts


import { StyleProps, NodeStyle, Breakpoint } from "@/core/types/style.types";

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function colorClass(prefix: "bg" | "text" | "border", value?: string): string | null {
  if (!value) return null;
  return isHexColor(value) ? `${prefix}-[${value}]` : `${prefix}-${value}`;
}

const RADIUS_CLASS: Record<NonNullable<StyleProps["borderRadius"]>, string> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md",
  lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full",
};

const SHADOW_CLASS: Record<NonNullable<StyleProps["shadow"]>, string> = {
  none: "shadow-none", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl",
};

const BORDER_WIDTH_CLASS: Record<NonNullable<StyleProps["borderWidth"]>, string> = {
  0: "border-0", 1: "border", 2: "border-2", 4: "border-4",
};

const WIDTH_HEIGHT_PRESET_CLASS: Record<string, string> = {
  auto: "auto", full: "full", screen: "screen", fit: "fit",
  "1/2": "1/2", "1/3": "1/3", "2/3": "2/3", "1/4": "1/4", "3/4": "3/4",
};

function sizeToClass(prefix: "w" | "h", value: StyleProps["width"]): string | null {
  if (value === undefined) return null;
  if (typeof value === "number") return `${prefix}-[${value}px]`;
  const preset = WIDTH_HEIGHT_PRESET_CLASS[value];
  return preset ? `${prefix}-${preset}` : null;
}

// Chỉ emit class cho field THẬT SỰ có mặt trong object — đây là chỗ quyết định hành vi
// "override" của md/lg: field không set ở md thì không sinh class md:..., trình duyệt
// tự áp dụng đúng theo CSS cascade thật (kế thừa từ base), Builder không tự tính toán gì.
function fieldsToClasses(fields: Partial<StyleProps>): string[] {
  const classes: string[] = [];

  if (fields.direction) classes.push("flex", fields.direction);
  if (fields.gap !== undefined) classes.push(`gap-${fields.gap}`);
  if (fields.align) classes.push(fields.align);
  if (fields.justify) classes.push(fields.justify);
  const widthClass = sizeToClass("w", fields.width);
  if (widthClass) classes.push(widthClass);
  const heightClass = sizeToClass("h", fields.height);
  if (heightClass) classes.push(heightClass);

  if (fields.position) classes.push(fields.position);
  const offsetClass = (side: "top" | "right" | "bottom" | "left", value: number | undefined) => {
    if (value === undefined) return null;
    return value < 0 ? `-${side}-[${Math.abs(value)}px]` : `${side}-[${value}px]`;
  };
  const topClass = offsetClass("top", fields.top);
  if (topClass) classes.push(topClass);
  const rightClass = offsetClass("right", fields.right);
  if (rightClass) classes.push(rightClass);
  const bottomClass = offsetClass("bottom", fields.bottom);
  if (bottomClass) classes.push(bottomClass);
  const leftClass = offsetClass("left", fields.left);
  if (leftClass) classes.push(leftClass);
  if (fields.zIndex !== undefined) classes.push(`z-${fields.zIndex}`);

  if (fields.overflow) classes.push(`overflow-${fields.overflow}`);
  if (fields.opacity !== undefined) classes.push(`opacity-${fields.opacity}`);
  if (fields.flexWrap) classes.push(fields.flexWrap);
  if (fields.alignSelf) classes.push(fields.alignSelf);
  if (fields.flexGrow !== undefined) classes.push(fields.flexGrow === 1 ? "grow" : "grow-0");
  if (fields.flexShrink !== undefined) classes.push(fields.flexShrink === 1 ? "shrink" : "shrink-0");

  if (fields.padding !== undefined) classes.push(`p-${fields.padding}`);
  if (fields.margin !== undefined) classes.push(`m-${fields.margin}`);

  const textColorClass = colorClass("text", fields.textColor);
  if (textColorClass) classes.push(textColorClass);
  const bgColorClass = colorClass("bg", fields.bgColor);
  if (bgColorClass) classes.push(bgColorClass);

  if (fields.fontSize) classes.push(`text-${fields.fontSize}`);
  if (fields.fontWeight) classes.push(`font-${fields.fontWeight}`);
  if (fields.textAlign) classes.push(`text-${fields.textAlign}`);

  if (fields.borderWidth !== undefined) classes.push(BORDER_WIDTH_CLASS[fields.borderWidth]);
  const borderColorClass = colorClass("border", fields.borderColor);
  if (borderColorClass) classes.push(borderColorClass);
  if (fields.borderRadius) classes.push(RADIUS_CLASS[fields.borderRadius]);
  if (fields.shadow) classes.push(SHADOW_CLASS[fields.shadow]);

  return classes;
}

function withPrefix(classes: string[], breakpoint: Breakpoint): string[] {
  if (breakpoint === "base") return classes;
  return classes.map((c) => `${breakpoint}:${c}`);
}

// Gộp base + md + lg thành 1 className string DUY NHẤT — không có khái niệm "render riêng
// theo breakpoint" ở đây. Trình duyệt tự quyết định class nào có hiệu lực qua Media Query
// thật khi resize, đúng nguyên tắc "không giả lập màn hình" đã chốt từ Pre-MVP.
export function styleToClasses(style: NodeStyle): string {
  const baseClasses = fieldsToClasses(style.base);
  const mdClasses = withPrefix(fieldsToClasses(style.md ?? {}), "md");
  const lgClasses = withPrefix(fieldsToClasses(style.lg ?? {}), "lg");
  return [...baseClasses, ...mdClasses, ...lgClasses].join(" ");
}