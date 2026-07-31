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

  // Spacing — áp dụng MỌI node
  padding?: number;
  margin?: number;

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