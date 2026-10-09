// core/types/style.types.ts

export type FlexDirection = "flex-row" | "flex-col";
export type Breakpoint = "base" | "md" | "lg";

// Mọi field ở đây CHỈ dùng để sinh Tailwind class — không đi vào React component nào,
// khác hẳn TreeNode.props (props component thật: text, variant, placeholder...).
export interface StyleProps {
  // Layout — chỉ có ý nghĩa với node canHaveChildren, vô hại (không lỗi) nếu gán cho leaf
  direction?: FlexDirection;
  gap?: number;
  align?: "items-start" | "items-center" | "items-end";
  justify?: "justify-start" | "justify-center" | "justify-between" | "justify-end";

  // Sizing
  width?: "auto" | "full" | "screen" | "fit" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4" | number;
  height?: "auto" | "full" | "screen" | "fit" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4" | number;

  // Position & Layering
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: 0 | 10 | 20 | 30 | 40 | 50;

  // Spacing — áp dụng MỌI node
  padding?: number;
  margin?: number;

  // Overflow & Opacity
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  opacity?: 0 | 25 | 50 | 75 | 100;

  // Extended flex layout
  flexWrap?: "flex-nowrap" | "flex-wrap" | "flex-wrap-reverse";
  alignSelf?: "self-auto" | "self-start" | "self-center" | "self-end" | "self-stretch";
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;

  // Color — string là Tailwind token ("gray-900") hoặc hex tự do ("#111827")
  textColor?: string;
  bgColor?: string;

  // Typography
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  textAlign?: "left" | "center" | "right";

  // Border & Shadow
  borderWidth?: 0 | 1 | 2 | 4;
  borderColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
}

// mobile-first: "base" LUÔN có giá trị (không optional), md/lg chỉ override 1 phần khi cần.
export interface NodeStyle {
  base: StyleProps;
  md?: Partial<StyleProps>;
  lg?: Partial<StyleProps>;
}

export const STYLE_PROP_KEYS: (keyof StyleProps)[] = [
  "direction", "gap", "align", "justify",
  "width", "height", "position", "top", "right", "bottom", "left", "zIndex",
  "padding", "margin", "overflow", "opacity",
  "flexWrap", "alignSelf", "flexGrow", "flexShrink",
  "textColor", "bgColor", "fontSize", "fontWeight", "textAlign",
  "borderWidth", "borderColor", "borderRadius", "shadow",
];