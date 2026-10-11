// core/types/style.types.ts

export type FlexDirection = "flex-row" | "flex-col";
export type Breakpoint = "base" | "md" | "lg";
export type StateVariant = "hover" | "focus" | "active";

export type OpacityStep = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
export type RotateStep = -45 | -12 | -6 | -3 | -2 | -1 | 1 | 2 | 3 | 6 | 12 | 45 | 90 | 180;
export type TranslateStep = -4 | -2 | -1 | 1 | 2 | 4;

export interface GradientValue {
  direction: "to-r" | "to-l" | "to-t" | "to-b" | "to-tr" | "to-br" | "to-tl" | "to-bl";
  from: string;
  via?: string;
  to: string;
}

// Mọi field ở đây CHỈ dùng để sinh Tailwind class — không đi vào React component nào,
// khác hẳn TreeNode.props (props component thật: text, variant, placeholder...).
export interface StyleProps {
  // Layout — chỉ có ý nghĩa với node canHaveChildren, vô hại (không lỗi) nếu gán cho leaf
  direction?: FlexDirection;
  gridCols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: number;
  gapX?: number;
  gapY?: number;
  align?: "items-start" | "items-center" | "items-end";
  justify?: "justify-start" | "justify-center" | "justify-between" | "justify-end";
  display?: "block" | "inline-block" | "hidden";

  // Sizing
  width?: "auto" | "full" | "screen" | "fit" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4" | number;
  height?: "auto" | "full" | "screen" | "fit" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4" | number;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full" | "prose";

  // Position & Layering
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: 0 | 10 | 20 | 30 | 40 | 50;

  // Spacing — áp dụng MỌI node
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  margin?: number;
  marginX?: number | "auto";
  marginY?: number;

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
  textOpacity?: OpacityStep;
  bgColor?: string;
  bgOpacity?: OpacityStep;
  bgGradient?: GradientValue;

  // Typography
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  fontWeight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  textAlign?: "left" | "center" | "right";
  fontFamily?: "sans" | "serif" | "mono";
  lineHeight?: "none" | "tight" | "snug" | "normal" | "relaxed" | "loose";
  letterSpacing?: "tighter" | "tight" | "normal" | "wide" | "wider" | "widest";
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "normal-case";
  textDecoration?: "underline" | "line-through" | "no-underline";

  // Border & Shadow
  borderWidth?: 0 | 1 | 2 | 4;
  borderColor?: string;
  borderOpacity?: OpacityStep;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  shadowColor?: string;
  ringWidth?: 0 | 1 | 2 | 4 | 8;
  ringColor?: string;

  // Effects
  blur?: "none" | "sm" | "md" | "lg" | "xl";
  backdropBlur?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";

  // Transform & transition
  scale?: 50 | 75 | 90 | 95 | 100 | 105 | 110 | 125;
  rotate?: RotateStep;
  translateX?: TranslateStep;
  translateY?: TranslateStep;
  transition?: "none" | "all" | "colors" | "shadow" | "transform";
  duration?: 75 | 150 | 200 | 300 | 500 | 700;

  // Misc
  objectFit?: "cover" | "contain" | "fill";
  aspectRatio?: "auto" | "square" | "video";
  cursor?: "pointer" | "default" | "not-allowed";
}

// mobile-first: "base" LUÔN có giá trị (không optional), md/lg chỉ override 1 phần khi cần.
export interface NodeStyle {
  base: StyleProps;
  md?: Partial<StyleProps>;
  lg?: Partial<StyleProps>;
  hover?: Partial<StyleProps>;
  focus?: Partial<StyleProps>;
  active?: Partial<StyleProps>;
}

export const STYLE_LAYER_KEYS = ["base", "md", "lg", "hover", "focus", "active"] as const;

export const STYLE_FIELD_DOCS: Record<keyof StyleProps, string> = {
  direction: "flex-row|flex-col. Makes the node a flex container (ignored if gridCols is set)",
  gridCols: "1|2|3|4|6|12. Makes the node a CSS grid with N columns",
  gap: "integer 0-24 (spacing units, 1 = 4px). Space between children",
  gapX: "integer 0-24. Horizontal gap between children",
  gapY: "integer 0-24. Vertical gap between children",
  align: "items-start|items-center|items-end. Cross-axis alignment of children",
  justify: "justify-start|justify-center|justify-between|justify-end. Main-axis alignment of children",
  display: "block|inline-block|hidden",
  width: "auto|full|screen|fit|1/2|1/3|2/3|1/4|3/4, or a number (px)",
  height: "auto|full|screen|fit|1/2|1/3|2/3|1/4|3/4, or a number (px)",
  maxWidth: "sm|md|lg|xl|2xl|4xl|6xl|7xl|full|prose. Combine with marginX:'auto' to center a container",
  position: "static|relative|absolute|fixed|sticky",
  top: "number (px, may be negative). Only works when position is not static",
  right: "number (px, may be negative). Only works when position is not static",
  bottom: "number (px, may be negative). Only works when position is not static",
  left: "number (px, may be negative). Only works when position is not static",
  zIndex: "0|10|20|30|40|50",
  padding: "integer 0-24, all sides",
  paddingX: "integer 0-24, left+right",
  paddingY: "integer 0-24, top+bottom",
  margin: "integer 0-24, all sides",
  marginX: "integer 0-24 or 'auto' (auto centers a block with a maxWidth)",
  marginY: "integer 0-24, top+bottom",
  overflow: "visible|hidden|scroll|auto",
  opacity: "0|25|50|75|100. Opacity of the WHOLE element",
  flexWrap: "flex-nowrap|flex-wrap|flex-wrap-reverse. Only for flex containers",
  alignSelf: "self-auto|self-start|self-center|self-end|self-stretch",
  flexGrow: "0|1",
  flexShrink: "0|1",
  textColor: "color token from COLORS, or #hex",
  textOpacity: "10|20|30|40|50|60|70|80|90. Alpha of textColor (requires textColor)",
  bgColor: "color token from COLORS, or #hex",
  bgOpacity: "10|20|30|40|50|60|70|80|90. Alpha of bgColor (requires bgColor)",
  bgGradient: "object {direction: to-r|to-l|to-t|to-b|to-tr|to-br|to-tl|to-bl, from: color, via?: color, to: color}",
  fontSize: "xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl",
  fontWeight: "light|normal|medium|semibold|bold|extrabold",
  textAlign: "left|center|right",
  fontFamily: "sans|serif|mono",
  lineHeight: "none|tight|snug|normal|relaxed|loose",
  letterSpacing: "tighter|tight|normal|wide|wider|widest",
  textTransform: "uppercase|lowercase|capitalize|normal-case",
  textDecoration: "underline|line-through|no-underline",
  borderWidth: "0|1|2|4 (px)",
  borderColor: "color token from COLORS, or #hex",
  borderOpacity: "10|20|30|40|50|60|70|80|90. Alpha of borderColor",
  borderRadius: "none|sm|md|lg|xl|2xl|3xl|full",
  shadow: "none|sm|md|lg|xl|2xl",
  shadowColor: "color token. Tints the shadow at 30% alpha (requires shadow to be set)",
  ringWidth: "0|1|2|4|8 (px). Outline-like ring around the node",
  ringColor: "color token from COLORS, or #hex",
  blur: "none|sm|md|lg|xl. Blurs the node itself",
  backdropBlur: "none|sm|md|lg|xl|2xl. Blurs what is behind the node",
  scale: "50|75|90|95|100|105|110|125 (percent)",
  rotate: "-45|-12|-6|-3|-2|-1|1|2|3|6|12|45|90|180 (degrees)",
  translateX: "-4|-2|-1|1|2|4 (spacing units, 1 = 4px)",
  translateY: "-4|-2|-1|1|2|4 (spacing units, 1 = 4px)",
  transition: "none|all|colors|shadow|transform",
  duration: "75|150|200|300|500|700 (ms)",
  objectFit: "cover|contain|fill. For images",
  aspectRatio: "auto|square|video",
  cursor: "pointer|default|not-allowed",
};

export const STYLE_PROP_KEYS = Object.keys(STYLE_FIELD_DOCS) as (keyof StyleProps)[];