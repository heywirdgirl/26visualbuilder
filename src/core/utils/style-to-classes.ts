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

// Chỉ emit class cho field THẬT SỰ có mặt trong object — đây là chỗ quyết định hành vi
// "override" của md/lg: field không set ở md thì không sinh class md:..., trình duyệt
// tự áp dụng đúng theo CSS cascade thật (kế thừa từ base), Builder không tự tính toán gì.
function fieldsToClasses(fields: Partial<StyleProps>): string[] {
  const classes: string[] = [];

  if (fields.direction) classes.push("flex", fields.direction);
  if (fields.gap !== undefined) classes.push(`gap-${fields.gap}`);
  if (fields.align) classes.push(fields.align);
  if (fields.justify) classes.push(fields.justify);
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