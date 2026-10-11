Trước khi chấm điểm đề xuất, mình cần kiểm tra 2 điều chưa chắc: tên class gradient/blur/ring/shadow đã đổi trong Tailwind v4 (project bạn đang dùng v4), và cú pháp safelist của v4.

## Đánh giá đề xuất 30 field của GPT

Hướng đi đúng, nhưng code mẫu có vài lỗi sẽ tạo ra class chết (class không có tác dụng) hoặc xung đột. Mình đã kiểm tra tên class v4 qua upgrade guide chính thức.

| Điểm trong đề xuất | Kết luận |
|---|---|
| 3 nhóm thiếu (chiều sâu, state, typography) | Đúng. Mình giữ nguyên. |
| `bg-gradient-to-*` | **Sai với v4**: v4 đổi thành `bg-linear-to-*`. Project bạn đang dùng v4. |
| `blur: md → "blur"`, `backdrop-blur` | **Sai với v4**: `blur` → `blur-sm`, `blur-sm` → `blur-xs`. Mình dùng tên tường minh (`blur-md`...). |
| `rotate`/`translate` dạng số tự do | Sinh class arbitrary (`rotate-[7deg]`), Canvas không hiện được. Mình đổi sang các mức cố định có sẵn của Tailwind. |
| `display: flex\|grid` cạnh `direction`/`gridCols` | Xung đột (`flex` và `grid` cùng lúc). Mình giữ `display` chỉ cho `block/inline-block/hidden`. `gridCols` thắng `direction` trong cùng một lớp. |
| `dark` variant | **Bỏ.** Cần quyết định ở cấp project (nút đổi theme, `.dark`). Canvas không xem được, và template export không có `@custom-variant dark`, nên Builder và project export sẽ chạy khác nhau. |
| `hover/focus/active` | Giữ ở tầng dữ liệu, compiler và AI. **Chưa có Inspector UI** vì lý do "không chọn được `:hover` bằng click" đã bàn trước đó. |
| Safelist 2 dòng (spacing, text size) | Thiếu: màu, opacity, gradient cũng bị JIT bỏ sót. Mình cũng tách sang `preview.css` riêng để không làm nặng CSS các trang Feed/SEO. |
| Class sinh từ giá trị không hợp lệ | GPT bỏ sót. AI trả `fontSize: "huge"` thì code cũ ghi chữ "undefined" vào className. Mình thêm lớp chặn trong compiler. |
| Chỉ sửa compiler | Chưa đủ cho câu hỏi của bạn. Inspector và AI prompt phải cập nhật riêng (xem bên dưới). |

**Mình thêm ngoài danh sách GPT:**
- `maxWidth` và `marginX: "auto"`. Thiếu hai cái này thì không căn giữa được container kiểu `max-w-6xl mx-auto`.
- Bảng màu trung tính (white, black, zinc). Hiện chỉ có đúng một màu xám (`slate-500`).
- `fontWeight` thêm `light` và `extrabold`.

**Chống quên đồng bộ:** `STYLE_FIELD_DOCS: Record<keyof StyleProps, string>` buộc TypeScript báo lỗi nếu thêm field mà quên mô tả. `STYLE_PROP_KEYS` suy ra từ đó, nên không còn lỗi "quên cập nhật danh sách" như trước.

**Hoãn lại:** style presets và đổi `defaultStyle` (bước 4 của GPT), vì cần UI áp preset.

---

## 1. Types, tài liệu field, palette

### `core/types/style.types.ts` — full file

```typescript
export type FlexDirection = "flex-row" | "flex-col";
export type Breakpoint = "base" | "md" | "lg";
export type StateVariant = "hover" | "focus" | "active";

export type OpacityStep = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
export type RotateStep = -45 | -12 | -6 | -3 | -2 | -1 | 1 | 2 | 3 | 6 | 12 | 45 | 90 | 180;
export type TranslateStep = -4 | -2 | -1 | 1 | 2 | 4; // đơn vị spacing Tailwind (1 = 4px)

export interface GradientValue {
  direction: "to-r" | "to-l" | "to-t" | "to-b" | "to-tr" | "to-br" | "to-tl" | "to-bl";
  from: string;
  via?: string;
  to: string;
}

export interface StyleProps {
  // Layout
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

  // Spacing
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  margin?: number;
  marginX?: number | "auto";
  marginY?: number;

  // Overflow & Opacity
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  opacity?: 0 | 25 | 50 | 75 | 100;

  // Flex (chính node này trong container cha)
  flexWrap?: "flex-nowrap" | "flex-wrap" | "flex-wrap-reverse";
  alignSelf?: "self-auto" | "self-start" | "self-center" | "self-end" | "self-stretch";
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;

  // Color
  textColor?: string;
  textOpacity?: OpacityStep;
  bgColor?: string;
  bgOpacity?: OpacityStep;
  bgGradient?: GradientValue;

  // Typography
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  fontWeight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  fontFamily?: "sans" | "serif" | "mono";
  lineHeight?: "none" | "tight" | "snug" | "normal" | "relaxed" | "loose";
  letterSpacing?: "tighter" | "tight" | "normal" | "wide" | "wider" | "widest";
  textAlign?: "left" | "center" | "right";
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "normal-case";
  textDecoration?: "underline" | "line-through" | "no-underline";

  // Border, Shadow, Ring
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

  // Transform & Transition
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

// mobile-first: base luôn có; md/lg ghi đè trên màn hình lớn; hover/focus/active là trạng thái tương tác.
export interface NodeStyle {
  base: StyleProps;
  md?: Partial<StyleProps>;
  lg?: Partial<StyleProps>;
  hover?: Partial<StyleProps>;
  focus?: Partial<StyleProps>;
  active?: Partial<StyleProps>;
}

export const STYLE_LAYER_KEYS = ["base", "md", "lg", "hover", "focus", "active"] as const;

// Record<keyof StyleProps, string> → thêm field vào StyleProps mà QUÊN dòng ở đây là TypeScript báo lỗi.
// Đây vừa là tài liệu cho AI prompt, vừa là nguồn duy nhất của STYLE_PROP_KEYS.
export const STYLE_FIELD_DOCS: Record<keyof StyleProps, string> = {
  direction: "flex-row|flex-col. Makes the node a flex container (ignored if gridCols is set)",
  gridCols: "1|2|3|4|6|12. Makes the node a CSS grid with N columns",
  gap: "integer 0-24 (spacing units, 1 = 4px). Space between children",
  gapX: "integer 0-24. Horizontal gap between children",
  gapY: "integer 0-24. Vertical gap between children",
  align: "items-start|items-center|items-end. Cross-axis alignment of children",
  justify: "justify-start|justify-center|justify-between|justify-end. Main-axis alignment of children",
  display: "block|inline-block|hidden. 'hidden' hides the node (useful at base, then re-show at md/lg via direction/gridCols)",
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
  alignSelf: "self-auto|self-start|self-center|self-end|self-stretch. How THIS node aligns inside its parent flex container",
  flexGrow: "0|1. 1 = fill remaining space in parent flex container",
  flexShrink: "0|1",
  textColor: "color token from COLORS, or #hex",
  textOpacity: "10|20|30|40|50|60|70|80|90. Alpha of textColor (requires textColor)",
  bgColor: "color token from COLORS, or #hex",
  bgOpacity: "10|20|30|40|50|60|70|80|90. Alpha of bgColor (requires bgColor). Great for glass effects with white/black",
  bgGradient: "object {direction: to-r|to-l|to-t|to-b|to-tr|to-br|to-tl|to-bl, from: color, via?: color, to: color}",
  fontSize: "xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl. Use 5xl-7xl for hero headings",
  fontWeight: "light|normal|medium|semibold|bold|extrabold",
  fontFamily: "sans|serif|mono",
  lineHeight: "none|tight|snug|normal|relaxed|loose",
  letterSpacing: "tighter|tight|normal|wide|wider|widest",
  textAlign: "left|center|right",
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
  backdropBlur: "none|sm|md|lg|xl|2xl. Blurs what is BEHIND the node (glassmorphism; pair with bgColor + bgOpacity)",
  scale: "50|75|90|95|100|105|110|125 (percent). Typical hover lift: 105",
  rotate: "-45|-12|-6|-3|-2|-1|1|2|3|6|12|45|90|180 (degrees)",
  translateX: "-4|-2|-1|1|2|4 (spacing units, 1 = 4px)",
  translateY: "-4|-2|-1|1|2|4. Typical hover lift: -1 or -2",
  transition: "none|all|colors|shadow|transform. Set this when using hover/focus/active so changes animate",
  duration: "75|150|200|300|500|700 (ms). Transition length",
  objectFit: "cover|contain|fill. For images",
  aspectRatio: "auto|square|video",
  cursor: "pointer|default|not-allowed",
};

export const STYLE_PROP_KEYS = Object.keys(STYLE_FIELD_DOCS) as (keyof StyleProps)[];
```

### `core/registry/color-palette.ts` — file mới

```typescript
// Class swatch viết LITERAL (không ghép chuỗi) để Tailwind quét được trong Editor.
// Safelist cho Canvas (src/app/preview.css) phải KHỚP danh sách này — sửa 1 nơi thì sửa nơi kia.
export interface PaletteSwatch {
  name: string;
  value: string;
  swatchClass: string;
}

export const HUE_SWATCHES: PaletteSwatch[] = [
  { name: "Slate", value: "slate-500", swatchClass: "bg-slate-500" },
  { name: "Red", value: "red-500", swatchClass: "bg-red-500" },
  { name: "Orange", value: "orange-500", swatchClass: "bg-orange-500" },
  { name: "Amber", value: "amber-500", swatchClass: "bg-amber-500" },
  { name: "Yellow", value: "yellow-500", swatchClass: "bg-yellow-500" },
  { name: "Lime", value: "lime-500", swatchClass: "bg-lime-500" },
  { name: "Green", value: "green-500", swatchClass: "bg-green-500" },
  { name: "Teal", value: "teal-500", swatchClass: "bg-teal-500" },
  { name: "Blue", value: "blue-500", swatchClass: "bg-blue-500" },
  { name: "Indigo", value: "indigo-500", swatchClass: "bg-indigo-500" },
  { name: "Purple", value: "purple-500", swatchClass: "bg-purple-500" },
  { name: "Pink", value: "pink-500", swatchClass: "bg-pink-500" },
];

export const NEUTRAL_SWATCHES: PaletteSwatch[] = [
  { name: "White", value: "white", swatchClass: "bg-white" },
  { name: "Zinc 100", value: "zinc-100", swatchClass: "bg-zinc-100" },
  { name: "Zinc 300", value: "zinc-300", swatchClass: "bg-zinc-300" },
  { name: "Zinc 500", value: "zinc-500", swatchClass: "bg-zinc-500" },
  { name: "Zinc 700", value: "zinc-700", swatchClass: "bg-zinc-700" },
  { name: "Zinc 900", value: "zinc-900", swatchClass: "bg-zinc-900" },
  { name: "Black", value: "black", swatchClass: "bg-black" },
];

// Danh sách token đưa vào AI prompt (thêm "transparent" cho đầu mút gradient).
export const PALETTE_TOKENS: string[] = [
  ...HUE_SWATCHES.map((s) => s.value),
  ...NEUTRAL_SWATCHES.map((s) => s.value),
  "transparent",
];
```

---

## 2. Compiler

### `core/utils/style-to-classes.ts` — full file

```typescript
import { StyleProps, NodeStyle, STYLE_LAYER_KEYS } from "@/core/types/style.types";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const COLOR_TOKEN = /^[a-z]+(?:-[a-z]+)?(?:-\d{2,3})?(?:\/\d{1,3})?$/; // blue-500, white, zinc-900, blue-500/30

type ColorPrefix = "bg" | "text" | "border" | "ring" | "shadow" | "from" | "via" | "to";

// Giá trị màu có thể đến từ AI (không đáng tin) → chuỗi lạ bị bỏ, không lọt vào className.
function colorClass(prefix: ColorPrefix, value?: string, opacity?: number): string | null {
  if (!value || typeof value !== "string") return null;
  let base: string;
  if (HEX_COLOR.test(value)) base = `${prefix}-[${value}]`;
  else if (COLOR_TOKEN.test(value)) base = `${prefix}-${value}`;
  else return null;

  const hasAlphaAlready = value.includes("/");
  if (!hasAlphaAlready && typeof opacity === "number" && opacity > 0 && opacity < 100) {
    return `${base}/${Math.round(opacity)}`;
  }
  return base;
}

// Map "chính nó → chính nó": vừa kiểm tra giá trị hợp lệ, vừa khiến Tailwind THẤY literal class trong source.
function same(...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, n]));
}

// QUAN TRỌNG: mọi class thuộc tập hữu hạn đều viết LITERAL ở dưới (không `text-${x}`), để Tailwind JIT quét được.
// Chỉ các giá trị số (gap/padding/margin...) và màu là phải safelist trong src/app/preview.css.
const DIRECTION = same("flex-row", "flex-col");
const ALIGN = same("items-start", "items-center", "items-end");
const JUSTIFY = same("justify-start", "justify-center", "justify-between", "justify-end");
const FLEX_WRAP = same("flex-nowrap", "flex-wrap", "flex-wrap-reverse");
const ALIGN_SELF = same("self-auto", "self-start", "self-center", "self-end", "self-stretch");
const POSITION = same("static", "relative", "absolute", "fixed", "sticky");
const DISPLAY = same("block", "inline-block", "hidden");
const TEXT_TRANSFORM = same("uppercase", "lowercase", "capitalize", "normal-case");
const TEXT_DECORATION = same("underline", "line-through", "no-underline");

const GRID_COLS: Record<string, string> = {
  1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 6: "grid-cols-6", 12: "grid-cols-12",
};
const MAX_WIDTH: Record<string, string> = {
  sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-2xl",
  "4xl": "max-w-4xl", "6xl": "max-w-6xl", "7xl": "max-w-7xl", full: "max-w-full", prose: "max-w-prose",
};
const Z_INDEX: Record<string, string> = { 0: "z-0", 10: "z-10", 20: "z-20", 30: "z-30", 40: "z-40", 50: "z-50" };
const OPACITY: Record<string, string> = {
  0: "opacity-0", 25: "opacity-25", 50: "opacity-50", 75: "opacity-75", 100: "opacity-100",
};
const OVERFLOW: Record<string, string> = {
  visible: "overflow-visible", hidden: "overflow-hidden", scroll: "overflow-scroll", auto: "overflow-auto",
};
const FONT_SIZE: Record<string, string> = {
  xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl",
  "3xl": "text-3xl", "4xl": "text-4xl", "5xl": "text-5xl", "6xl": "text-6xl", "7xl": "text-7xl",
};
const FONT_WEIGHT: Record<string, string> = {
  light: "font-light", normal: "font-normal", medium: "font-medium",
  semibold: "font-semibold", bold: "font-bold", extrabold: "font-extrabold",
};
const FONT_FAMILY: Record<string, string> = { sans: "font-sans", serif: "font-serif", mono: "font-mono" };
const LINE_HEIGHT: Record<string, string> = {
  none: "leading-none", tight: "leading-tight", snug: "leading-snug",
  normal: "leading-normal", relaxed: "leading-relaxed", loose: "leading-loose",
};
const LETTER_SPACING: Record<string, string> = {
  tighter: "tracking-tighter", tight: "tracking-tight", normal: "tracking-normal",
  wide: "tracking-wide", wider: "tracking-wider", widest: "tracking-widest",
};
const TEXT_ALIGN: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };
const BORDER_WIDTH: Record<string, string> = { 0: "border-0", 1: "border", 2: "border-2", 4: "border-4" };
const RADIUS: Record<string, string> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl",
  "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};
const SHADOW: Record<string, string> = {
  none: "shadow-none", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl", "2xl": "shadow-2xl",
};
const RING_WIDTH: Record<string, string> = { 0: "ring-0", 1: "ring-1", 2: "ring-2", 4: "ring-4", 8: "ring-8" };
// Tailwind v4: tên tường minh (v4 đã dịch thang blur: `blur` → `blur-sm`, `blur-sm` → `blur-xs`).
const BLUR: Record<string, string> = {
  none: "blur-none", sm: "blur-sm", md: "blur-md", lg: "blur-lg", xl: "blur-xl",
};
const BACKDROP_BLUR: Record<string, string> = {
  none: "backdrop-blur-none", sm: "backdrop-blur-sm", md: "backdrop-blur-md",
  lg: "backdrop-blur-lg", xl: "backdrop-blur-xl", "2xl": "backdrop-blur-2xl",
};
const SCALE: Record<string, string> = {
  50: "scale-50", 75: "scale-75", 90: "scale-90", 95: "scale-95", 100: "scale-100",
  105: "scale-105", 110: "scale-110", 125: "scale-125",
};
const ROTATE: Record<string, string> = {
  "-45": "-rotate-45", "-12": "-rotate-12", "-6": "-rotate-6", "-3": "-rotate-3", "-2": "-rotate-2", "-1": "-rotate-1",
  1: "rotate-1", 2: "rotate-2", 3: "rotate-3", 6: "rotate-6", 12: "rotate-12", 45: "rotate-45", 90: "rotate-90", 180: "rotate-180",
};
const TRANSLATE_X: Record<string, string> = {
  "-4": "-translate-x-4", "-2": "-translate-x-2", "-1": "-translate-x-1",
  1: "translate-x-1", 2: "translate-x-2", 4: "translate-x-4",
};
const TRANSLATE_Y: Record<string, string> = {
  "-4": "-translate-y-4", "-2": "-translate-y-2", "-1": "-translate-y-1",
  1: "translate-y-1", 2: "translate-y-2", 4: "translate-y-4",
};
const TRANSITION: Record<string, string> = {
  none: "transition-none", all: "transition-all", colors: "transition-colors",
  shadow: "transition-shadow", transform: "transition-transform",
};
const DURATION: Record<string, string> = {
  75: "duration-75", 150: "duration-150", 200: "duration-200", 300: "duration-300", 500: "duration-500", 700: "duration-700",
};
const OBJECT_FIT: Record<string, string> = { cover: "object-cover", contain: "object-contain", fill: "object-fill" };
const ASPECT: Record<string, string> = { auto: "aspect-auto", square: "aspect-square", video: "aspect-video" };
const CURSOR: Record<string, string> = {
  pointer: "cursor-pointer", default: "cursor-default", "not-allowed": "cursor-not-allowed",
};
// v4: bg-gradient-to-* đã đổi tên thành bg-linear-to-*
const GRADIENT_DIR: Record<string, string> = {
  "to-r": "bg-linear-to-r", "to-l": "bg-linear-to-l", "to-t": "bg-linear-to-t", "to-b": "bg-linear-to-b",
  "to-tr": "bg-linear-to-tr", "to-br": "bg-linear-to-br", "to-tl": "bg-linear-to-tl", "to-bl": "bg-linear-to-bl",
};
const SIZE_PRESET: Record<string, string> = {
  auto: "auto", full: "full", screen: "screen", fit: "fit", "1/2": "1/2", "1/3": "1/3", "2/3": "2/3", "1/4": "1/4", "3/4": "3/4",
};

function lookup(map: Record<string, string>, key: unknown): string | null {
  if (key === undefined || key === null) return null;
  return map[String(key)] ?? null;
}

function spacingClass(prefix: string, value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? `${prefix}-${value}` : null;
}

function sizeClass(prefix: "w" | "h", value: unknown): string | null {
  if (typeof value === "number") return Number.isFinite(value) ? `${prefix}-[${value}px]` : null;
  const preset = typeof value === "string" ? SIZE_PRESET[value] : undefined;
  return preset ? `${prefix}-${preset}` : null;
}

function offsetClass(side: "top" | "right" | "bottom" | "left", value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value < 0 ? `-${side}-[${Math.abs(value)}px]` : `${side}-[${value}px]`;
}

function gradientClasses(g: unknown): string[] {
  if (!g || typeof g !== "object") return [];
  const { direction, from, via, to } = g as { direction?: string; from?: string; via?: string; to?: string };
  const dir = direction ? GRADIENT_DIR[direction] : undefined;
  const fromC = colorClass("from", from);
  const toC = colorClass("to", to);
  if (!dir || !fromC || !toC) return [];
  const viaC = via ? colorClass("via", via) : null;
  return viaC ? [dir, fromC, viaC, toC] : [dir, fromC, toC];
}

// Chỉ emit class cho field THẬT SỰ có mặt — giá trị không hợp lệ (VD từ AI) bị bỏ im lặng,
// không bao giờ ghi chữ "undefined" hay chuỗi lạ vào className.
function fieldsToClasses(f: Partial<StyleProps>): string[] {
  const out: string[] = [];
  const add = (c: string | null | undefined) => {
    if (c) out.push(c);
  };

  // Layout: grid thắng flex trong CÙNG 1 lớp (tránh flex + grid xung đột). Khác lớp thì override bình thường
  // (VD base: flex-col, md: grid-cols-3 → mobile xếp dọc, desktop thành lưới).
  const grid = lookup(GRID_COLS, f.gridCols);
  if (grid) {
    add("grid");
    add(grid);
  } else if (f.direction && DIRECTION[f.direction]) {
    add("flex");
    add(DIRECTION[f.direction]);
  }
  add(spacingClass("gap", f.gap));
  add(spacingClass("gap-x", f.gapX));
  add(spacingClass("gap-y", f.gapY));
  add(lookup(ALIGN, f.align));
  add(lookup(JUSTIFY, f.justify));
  add(lookup(FLEX_WRAP, f.flexWrap));
  add(lookup(DISPLAY, f.display));

  // Sizing
  add(sizeClass("w", f.width));
  add(sizeClass("h", f.height));
  add(lookup(MAX_WIDTH, f.maxWidth));

  // Position & layering
  add(lookup(POSITION, f.position));
  add(offsetClass("top", f.top));
  add(offsetClass("right", f.right));
  add(offsetClass("bottom", f.bottom));
  add(offsetClass("left", f.left));
  add(lookup(Z_INDEX, f.zIndex));

  add(lookup(OVERFLOW, f.overflow));
  add(lookup(OPACITY, f.opacity));
  add(lookup(ALIGN_SELF, f.alignSelf));
  if (f.flexGrow !== undefined) add(f.flexGrow === 1 ? "grow" : "grow-0");
  if (f.flexShrink !== undefined) add(f.flexShrink === 1 ? "shrink" : "shrink-0");

  // Spacing
  add(spacingClass("p", f.padding));
  add(spacingClass("px", f.paddingX));
  add(spacingClass("py", f.paddingY));
  add(spacingClass("m", f.margin));
  add(f.marginX === "auto" ? "mx-auto" : spacingClass("mx", f.marginX));
  add(spacingClass("my", f.marginY));

  // Color
  add(colorClass("text", f.textColor, f.textOpacity));
  add(colorClass("bg", f.bgColor, f.bgOpacity));
  gradientClasses(f.bgGradient).forEach(add);

  // Typography
  add(lookup(FONT_SIZE, f.fontSize));
  add(lookup(FONT_WEIGHT, f.fontWeight));
  add(lookup(FONT_FAMILY, f.fontFamily));
  add(lookup(LINE_HEIGHT, f.lineHeight));
  add(lookup(LETTER_SPACING, f.letterSpacing));
  add(lookup(TEXT_ALIGN, f.textAlign));
  add(lookup(TEXT_TRANSFORM, f.textTransform));
  add(lookup(TEXT_DECORATION, f.textDecoration));

  // Border / shadow / ring
  add(lookup(BORDER_WIDTH, f.borderWidth));
  add(colorClass("border", f.borderColor, f.borderOpacity));
  add(lookup(RADIUS, f.borderRadius));
  add(lookup(SHADOW, f.shadow));
  add(colorClass("shadow", f.shadowColor, 30)); // bóng màu luôn 30% alpha — cố định để không phải thêm field mới
  add(lookup(RING_WIDTH, f.ringWidth));
  add(colorClass("ring", f.ringColor));

  // Effects & transform
  add(lookup(BLUR, f.blur));
  add(lookup(BACKDROP_BLUR, f.backdropBlur));
  add(lookup(SCALE, f.scale));
  add(lookup(ROTATE, f.rotate));
  add(lookup(TRANSLATE_X, f.translateX));
  add(lookup(TRANSLATE_Y, f.translateY));
  add(lookup(TRANSITION, f.transition));
  add(lookup(DURATION, f.duration));

  // Misc
  add(lookup(OBJECT_FIT, f.objectFit));
  add(lookup(ASPECT, f.aspectRatio));
  add(lookup(CURSOR, f.cursor));

  return out;
}

// Gộp mọi lớp thành 1 className duy nhất, y hệt viết tay: "p-4 md:p-8 hover:shadow-lg".
export function styleToClasses(style: NodeStyle): string {
  const out = [...fieldsToClasses(style.base)];
  for (const layer of STYLE_LAYER_KEYS) {
    if (layer === "base") continue;
    const fields = style[layer];
    if (fields) out.push(...fieldsToClasses(fields).map((c) => `${layer}:${c}`));
  }
  return out.join(" ");
}
```

---

## 3. Safelist cho Canvas (tách file riêng)

Class thuộc tập hữu hạn đã nằm literal trong `style-to-classes.ts` nên tự được quét. Chỉ **spacing** và **màu** (ghép động) mới cần safelist.

### `src/app/preview.css` — file mới

```css
@import "./globals.css";

/* Safelist CHỈ cho Canvas Preview (public/preview.css). Tách khỏi globals.css để Editor/Feed/SEO
   không phải tải thêm ~vài trăm class vô ích. Cần Tailwind >= 4.1 (@source inline). */

/* Spacing: gap/padding/margin theo số (Inspector cho nhập tự do, nhưng Canvas chỉ thấy các mức dưới đây) */
@source inline("{,md:,lg:}{gap,gap-x,gap-y,p,px,py,m,mx,my}-{0,1,2,3,4,5,6,7,8,9,10,11,12,14,16,20,24}");

/* Màu đơn — PHẢI KHỚP src/core/registry/color-palette.ts */
@source inline("{,md:,lg:,hover:,focus:}{bg,text,border,ring,shadow,from,via,to}-{slate,red,orange,amber,yellow,lime,green,teal,blue,indigo,purple,pink}-500");
@source inline("{,md:,lg:,hover:,focus:}{bg,text,border,ring,shadow,from,via,to}-{white,black,transparent,zinc-100,zinc-300,zinc-500,zinc-700,zinc-900}");

/* Màu + opacity (bgOpacity/textOpacity/borderOpacity) — chỉ base + hover để giữ file gọn */
@source inline("{,hover:}{bg,text,border}-{slate,red,orange,amber,yellow,lime,green,teal,blue,indigo,purple,pink}-500/{10,20,30,40,50,60,70,80,90}");
@source inline("{,hover:}{bg,text,border}-{white,black,zinc-100,zinc-300,zinc-500,zinc-700,zinc-900}/{10,20,30,40,50,60,70,80,90}");

/* Bóng màu (shadowColor luôn 30% alpha) */
@source inline("{,hover:}shadow-{slate,red,orange,amber,yellow,lime,green,teal,blue,indigo,purple,pink}-500/30");
@source inline("{,hover:}shadow-{white,black,zinc-100,zinc-300,zinc-500,zinc-700,zinc-900}/30");
```

### Patch `package.json` — đổi input của 2 script CSS

```json
"dev:css": "tailwindcss -i ./src/app/preview.css -o ./public/preview.css --watch",
"build:css": "tailwindcss -i ./src/app/preview.css -o ./public/preview.css --minify",
```

---

## 4. AI nhận style mới

### Patch `core/utils/apply-ai-operations.ts`

Đổi import:
```typescript
import { NodeStyle, StyleProps, STYLE_PROP_KEYS, STYLE_LAYER_KEYS } from "@/core/types/style.types";
```

Thay hàm `mergeStyle` cũ bằng 2 hàm sau:
```typescript
function sanitizeStyleFields(raw: unknown): Partial<StyleProps> {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of STYLE_PROP_KEYS) {
    if (key in source) out[key] = source[key]; // giá trị được kiểm tra tiếp ở style-to-classes
  }
  return out as Partial<StyleProps>;
}

// AI nên trả { base, md, lg, hover, focus, active } — nhưng nếu model trả phẳng (chỉ các field style)
// thì coi cả object là "base", không bỏ phí kết quả.
function mergeStyle(def: NodeDefinition, aiStyle: Record<string, unknown> | undefined): NodeStyle {
  const style: NodeStyle = { base: structuredClone(def.defaultStyle ?? {}) };
  if (!aiStyle) return style;

  const hasLayers = STYLE_LAYER_KEYS.some((layer) => layer in aiStyle);
  const layers: Record<string, unknown> = hasLayers ? aiStyle : { base: aiStyle };

  style.base = { ...style.base, ...sanitizeStyleFields(layers.base) };
  for (const layer of STYLE_LAYER_KEYS) {
    if (layer === "base") continue;
    if (layers[layer]) style[layer] = sanitizeStyleFields(layers[layer]);
  }
  return style;
}
```

Trong `buildChildrenRecursive`, đổi 1 dòng:
```typescript
// Đổi:
style: { base: mergeStyle(childDef, aiChild.style) },
// Thành:
style: mergeStyle(childDef, aiChild.style),
```

### `features/ai-assistant/prompts/add-node.prompt.ts` — full file

```typescript
import { RegistrySummaryEntry } from "@/core/registry/ai-registry-summary";
import { STYLE_FIELD_DOCS } from "@/core/types/style.types";
import { PALETTE_TOKENS } from "@/core/registry/color-palette";
import { AiContextPayload } from "../utils/build-ai-context";

function formatRegistryEntry(entry: RegistrySummaryEntry): string {
  const childInfo = entry.canHaveChildren ? "can have children" : "leaf, no children";
  const props = entry.propKeys.length > 0 ? entry.propKeys.join(", ") : "(no props)";
  return `- ${entry.id} | ${entry.title} | ${childInfo} | props: ${props}`;
}

function formatStyleDocs(): string {
  return Object.entries(STYLE_FIELD_DOCS)
    .map(([key, doc]) => `- ${key}: ${doc}`)
    .join("\n");
}

export function buildAddNodeSystemPrompt(registry: RegistrySummaryEntry[], context: AiContextPayload): string {
  return `You are the Node Assistant of 26VisualBuilder, a tree-based visual UI builder.

Your job: given a user request (may be in Vietnamese or English), propose ONE or MORE new nodes to ADD into the user's current Page.

STRICT RULES:
1. You may ONLY use "nodeType" values from the REGISTRY list below. Never invent a new nodeType.
2. A leaf node ("leaf, no children") must never get a "children" array.
3. "parentId" MUST be the id of a node that already exists in CURRENT PAGE TREE below — never invent an id.
4. Only use prop keys listed for that nodeType in the registry. Do not add unknown prop keys.
5. action is always "add". You are not allowed to modify or delete existing nodes.
6. Prefer the simplest structure that satisfies the request.
7. "summary" should briefly explain (in the user's language) what you added.

STYLE (optional, per node). "style" is an object with optional layers:
{ "base": {...}, "md": {...}, "lg": {...}, "hover": {...}, "focus": {...}, "active": {...} }
- "base" applies on ALL screen sizes (mobile-first). "md"/"lg" ONLY override on larger screens (e.g. base: direction flex-col, md: gridCols 3).
- "hover"/"focus"/"active" are interaction states. When you use them, also set "transition" in base (e.g. "all") so changes animate.
- Use ONLY the style fields below, with exactly the allowed values. Unknown fields or invalid values are silently discarded.
- COLORS: use only these tokens (or a #hex): ${PALETTE_TOKENS.join(", ")}.
- Design with taste: consistent spacing (gap/padding 4-8), rounded corners (lg/xl/2xl), subtle shadows, clear type hierarchy (heading fontSize 3xl-6xl bold, body base/sm in zinc-500/zinc-700), center page containers with maxWidth + marginX "auto".

AVAILABLE STYLE FIELDS:
${formatStyleDocs()}

EXAMPLE OUTPUT:
{"operations":[{"action":"add","parentId":"<existing id>","node":{"nodeType":"shadcn.badge","props":{"text":"New"},"style":{"base":{"bgColor":"blue-500","textColor":"white","borderRadius":"full","transition":"all"},"hover":{"shadow":"md"}}}}],"summary":"Added a blue 'New' badge."}

REGISTRY (id | title | children? | props):
${registry.map(formatRegistryEntry).join("\n")}

CURRENT PAGE TREE (JSON):
${JSON.stringify(context.currentPageTree)}
${
  context.referencedComponents.length > 0
    ? `\nREUSABLE COMPONENTS already defined in this project (for style/content reference only):\n${JSON.stringify(context.referencedComponents)}\n`
    : ""
}
SELECTED NODE ID (where the user is currently focused): ${context.selectedNodeId ?? "(none selected)"}
`;
}
```

---

## 5. Inspector: UI cho field mới

Mình **không sửa** các section cũ (tránh lỗi patch). Field mới nằm trong 5 section mới, thu gọn mặc định để panel không dài vô tận.

### `features/inspector/components/section-shell.tsx`

```tsx
export function SectionShell({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-t pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase text-muted-foreground select-none">
        {title}
        <span className="text-[11px] transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}
```

### `features/inspector/components/style-controls.tsx` — 2 control dùng lại nhiều lần

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";

export function StyleSelectField<K extends keyof StyleProps>({
  node,
  field,
  label,
  options,
}: {
  node: TreeNode;
  field: K;
  label: string;
  options: { value: string | number; label?: string }[];
}) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const current = getValue(field);

  return (
    <StyleField label={label} showClear={hasOverride(field)} onClear={() => clearOverride(field)}>
      <select
        value={current === undefined ? "" : String(current)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return setValue(field, undefined);
          const match = options.find((o) => String(o.value) === raw);
          if (match) setValue(field, match.value as StyleProps[K]);
        }}
        className="border rounded px-2 py-1"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label ?? String(o.value)}
          </option>
        ))}
      </select>
    </StyleField>
  );
}

export function StyleNumberField<K extends keyof StyleProps>({
  node,
  field,
  label,
}: {
  node: TreeNode;
  field: K;
  label: string;
}) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const current = getValue(field);

  return (
    <StyleField label={label} showClear={hasOverride(field)} onClear={() => clearOverride(field)}>
      <input
        type="number"
        min={0}
        placeholder="—"
        value={typeof current === "number" ? current : ""}
        onChange={(e) => {
          if (e.target.value === "") return setValue(field, undefined);
          const n = Number(e.target.value);
          if (Number.isFinite(n)) setValue(field, n as StyleProps[K]);
        }}
        className="border rounded px-2 py-1"
      />
    </StyleField>
  );
}
```

### `features/inspector/components/color-picker-field.tsx` — full file (thêm hàng màu trung tính)

```tsx
"use client";

import { HUE_SWATCHES, NEUTRAL_SWATCHES, PaletteSwatch } from "@/core/registry/color-palette";
import { cn } from "@/core/utils/cn";

function isHex(value?: string) {
  return !!value && value.startsWith("#");
}

function SwatchRow({
  swatches,
  value,
  onChange,
}: {
  swatches: PaletteSwatch[];
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {swatches.map((s) => (
        <button
          key={s.value}
          type="button"
          title={s.name}
          onClick={() => onChange(s.value)}
          className={cn(
            "w-5 h-5 rounded-full border-2",
            s.swatchClass,
            value === s.value ? "border-primary" : "border-zinc-200"
          )}
        />
      ))}
    </div>
  );
}

export function ColorPickerField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SwatchRow swatches={HUE_SWATCHES} value={value} onChange={onChange} />
      <div className="flex items-center gap-1">
        <SwatchRow swatches={NEUTRAL_SWATCHES} value={value} onChange={onChange} />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title="Xoá màu"
          className="w-5 h-5 shrink-0 rounded-full border border-dashed flex items-center justify-center text-[10px] text-muted-foreground"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 border rounded cursor-pointer"
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="blue-500 hoặc #1e40af"
          className="flex-1 border rounded px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
}
```

### `features/inspector/components/gradient-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { GradientValue } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { SectionShell } from "./section-shell";
import { StyleField } from "./style-field";
import { ColorPickerField } from "./color-picker-field";

const DIRECTIONS: GradientValue["direction"][] = ["to-r", "to-l", "to-t", "to-b", "to-tr", "to-br", "to-tl", "to-bl"];

export function GradientSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const gradient = getValue("bgGradient");

  const update = (patch: Partial<GradientValue>) => {
    if (gradient) setValue("bgGradient", { ...gradient, ...patch });
  };

  return (
    <SectionShell title="Gradient">
      {!gradient ? (
        <button
          type="button"
          onClick={() => setValue("bgGradient", { direction: "to-r", from: "blue-500", to: "purple-500" })}
          className="border rounded px-2 py-1.5 text-xs hover:bg-muted"
        >
          + Thêm gradient nền
        </button>
      ) : (
        <>
          <StyleField label="Hướng" showClear={hasOverride("bgGradient")} onClear={() => clearOverride("bgGradient")}>
            <select
              value={gradient.direction}
              onChange={(e) => update({ direction: e.target.value as GradientValue["direction"] })}
              className="border rounded px-2 py-1"
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </StyleField>

          <StyleField label="From">
            <ColorPickerField value={gradient.from} onChange={(v) => v && update({ from: v })} />
          </StyleField>
          <StyleField label="Via (tuỳ chọn)">
            <ColorPickerField value={gradient.via} onChange={(v) => update({ via: v })} />
          </StyleField>
          <StyleField label="To">
            <ColorPickerField value={gradient.to} onChange={(v) => v && update({ to: v })} />
          </StyleField>

          <button
            type="button"
            onClick={() => setValue("bgGradient", undefined)}
            className="text-xs text-muted-foreground hover:text-foreground self-start"
          >
            Xoá gradient
          </button>
        </>
      )}
    </SectionShell>
  );
}
```

### `features/inspector/components/effects-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import { SectionShell } from "./section-shell";
import { StyleField } from "./style-field";
import { StyleSelectField } from "./style-controls";
import { ColorPickerField } from "./color-picker-field";

const OPACITY = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => ({ value: v, label: `${v}%` }));
const RING = [0, 1, 2, 4, 8].map((v) => ({ value: v, label: `${v}px` }));
const BLUR = ["none", "sm", "md", "lg", "xl"].map((v) => ({ value: v }));
const BACKDROP = ["none", "sm", "md", "lg", "xl", "2xl"].map((v) => ({ value: v }));

export function EffectsSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <SectionShell title="Effects">
      <p className="-mt-1 text-[10px] text-muted-foreground">
        Opacity áp lên màu đã chọn (Background / Text / Border) — cần chọn màu trước.
      </p>
      <StyleSelectField node={node} field="bgOpacity" label="Background opacity" options={OPACITY} />
      <StyleSelectField node={node} field="textOpacity" label="Text opacity" options={OPACITY} />
      <StyleSelectField node={node} field="borderOpacity" label="Border opacity" options={OPACITY} />

      <StyleField label="Shadow color (cần chọn Shadow trước)" showClear={hasOverride("shadowColor")} onClear={() => clearOverride("shadowColor")}>
        <ColorPickerField value={getValue("shadowColor")} onChange={(v) => setValue("shadowColor", v)} />
      </StyleField>

      <StyleSelectField node={node} field="ringWidth" label="Ring" options={RING} />
      <StyleField label="Ring color" showClear={hasOverride("ringColor")} onClear={() => clearOverride("ringColor")}>
        <ColorPickerField value={getValue("ringColor")} onChange={(v) => setValue("ringColor", v)} />
      </StyleField>

      <StyleSelectField node={node} field="backdropBlur" label="Backdrop blur (kính mờ)" options={BACKDROP} />
      <StyleSelectField node={node} field="blur" label="Blur" options={BLUR} />
    </SectionShell>
  );
}
```

### `features/inspector/components/transform-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { SectionShell } from "./section-shell";
import { StyleSelectField } from "./style-controls";

const SCALE = [50, 75, 90, 95, 100, 105, 110, 125].map((v) => ({ value: v, label: `${v}%` }));
const ROTATE = [-45, -12, -6, -3, -2, -1, 1, 2, 3, 6, 12, 45, 90, 180].map((v) => ({ value: v, label: `${v}°` }));
const TRANSLATE = [-4, -2, -1, 1, 2, 4].map((v) => ({ value: v, label: `${v * 4}px` }));
const TRANSITION = ["none", "all", "colors", "shadow", "transform"].map((v) => ({ value: v }));
const DURATION = [75, 150, 200, 300, 500, 700].map((v) => ({ value: v, label: `${v}ms` }));

export function TransformSection({ node }: { node: TreeNode }) {
  return (
    <SectionShell title="Transform & Transition">
      <StyleSelectField node={node} field="scale" label="Scale" options={SCALE} />
      <StyleSelectField node={node} field="rotate" label="Rotate" options={ROTATE} />
      <StyleSelectField node={node} field="translateX" label="Translate X" options={TRANSLATE} />
      <StyleSelectField node={node} field="translateY" label="Translate Y" options={TRANSLATE} />
      <StyleSelectField node={node} field="transition" label="Transition" options={TRANSITION} />
      <StyleSelectField node={node} field="duration" label="Duration" options={DURATION} />
    </SectionShell>
  );
}
```

### `features/inspector/components/typography-extras-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { SectionShell } from "./section-shell";
import { StyleSelectField } from "./style-controls";

const opts = (...v: string[]) => v.map((value) => ({ value }));

export function TypographyExtrasSection({ node }: { node: TreeNode }) {
  return (
    <SectionShell title="Typography+">
      <StyleSelectField node={node} field="fontFamily" label="Font family" options={opts("sans", "serif", "mono")} />
      <StyleSelectField node={node} field="lineHeight" label="Line height" options={opts("none", "tight", "snug", "normal", "relaxed", "loose")} />
      <StyleSelectField node={node} field="letterSpacing" label="Letter spacing" options={opts("tighter", "tight", "normal", "wide", "wider", "widest")} />
      <StyleSelectField node={node} field="textTransform" label="Text transform" options={opts("uppercase", "lowercase", "capitalize", "normal-case")} />
      <StyleSelectField node={node} field="textDecoration" label="Decoration" options={opts("underline", "line-through", "no-underline")} />
    </SectionShell>
  );
}
```

### `features/inspector/components/extras-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import { SectionShell } from "./section-shell";
import { StyleField } from "./style-field";
import { StyleSelectField, StyleNumberField } from "./style-controls";
import { cn } from "@/core/utils/cn";

const opts = (...v: (string | number)[]) => v.map((value) => ({ value }));

function MarginXField({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const current = getValue("marginX");

  return (
    <StyleField label="Margin X" showClear={hasOverride("marginX")} onClear={() => clearOverride("marginX")}>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          placeholder="—"
          value={typeof current === "number" ? current : ""}
          onChange={(e) => {
            if (e.target.value === "") return setValue("marginX", undefined);
            const n = Number(e.target.value);
            if (Number.isFinite(n)) setValue("marginX", n);
          }}
          className="border rounded px-2 py-1 w-20"
        />
        <button
          type="button"
          onClick={() => setValue("marginX", current === "auto" ? undefined : "auto")}
          className={cn("border rounded px-2 py-1 text-xs", current === "auto" && "bg-primary/10 border-primary text-primary")}
        >
          auto
        </button>
      </div>
    </StyleField>
  );
}

export function ExtrasSection({ node }: { node: TreeNode }) {
  return (
    <SectionShell title="More">
      <p className="-mt-1 text-[10px] text-muted-foreground">
        Căn giữa container: đặt Max width + Margin X = auto.
      </p>
      <StyleSelectField node={node} field="maxWidth" label="Max width" options={opts("sm", "md", "lg", "xl", "2xl", "4xl", "6xl", "7xl", "full", "prose")} />
      <MarginXField node={node} />
      <StyleNumberField node={node} field="marginY" label="Margin Y" />
      <StyleNumberField node={node} field="paddingX" label="Padding X" />
      <StyleNumberField node={node} field="paddingY" label="Padding Y" />

      <StyleSelectField node={node} field="gridCols" label="Grid columns (thành lưới)" options={opts(1, 2, 3, 4, 6, 12).map((o) => ({ ...o, label: `${o.value} cột` }))} />
      <StyleNumberField node={node} field="gapX" label="Gap X" />
      <StyleNumberField node={node} field="gapY" label="Gap Y" />

      <StyleSelectField node={node} field="display" label="Display" options={opts("block", "inline-block", "hidden")} />
      <StyleSelectField node={node} field="objectFit" label="Object fit (ảnh)" options={opts("cover", "contain", "fill")} />
      <StyleSelectField node={node} field="aspectRatio" label="Aspect ratio" options={opts("auto", "square", "video")} />
      <StyleSelectField node={node} field="cursor" label="Cursor" options={opts("pointer", "default", "not-allowed")} />
    </SectionShell>
  );
}
```

### 2 patch nhỏ để mở rộng lựa chọn sẵn có

`features/inspector/components/typography-section.tsx`:
```typescript
// Đổi:
const FONT_SIZE_OPTIONS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const;
const FONT_WEIGHT_OPTIONS = ["normal", "medium", "semibold", "bold"] as const;
// Thành:
const FONT_SIZE_OPTIONS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"] as const;
const FONT_WEIGHT_OPTIONS = ["light", "normal", "medium", "semibold", "bold", "extrabold"] as const;
```

`features/inspector/components/appearance-section.tsx`:
```typescript
// Đổi:
const RADIUS_OPTIONS = ["none", "sm", "md", "lg", "xl", "full"] as const;
const SHADOW_OPTIONS = ["none", "sm", "md", "lg", "xl"] as const;
// Thành:
const RADIUS_OPTIONS = ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"] as const;
const SHADOW_OPTIONS = ["none", "sm", "md", "lg", "xl", "2xl"] as const;
```

### `features/inspector/components/inspector-panel.tsx` — full file

Mình chuyển `DynamicPropsForm` (sửa chữ/props) lên đầu. Có tới 13 section, để nó ở cuối thì thao tác hay dùng nhất bị chôn dưới cùng.

```tsx
"use client";

import { useBuilderStore, useActiveNode } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { BreakpointSwitcher } from "./breakpoint-switcher";
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

---

## Test sau khi áp dụng

1. **Kiểm tra TypeScript:** `STYLE_FIELD_DOCS` đủ 61 dòng. Thiếu field nào thì báo lỗi ngay chỗ đó.
2. **Restart `pnpm dev`** vì đường dẫn input của `dev:css` đã đổi. Kiểm tra `grep -c "bg-linear-to-r" public/preview.css`, phải ≥ 1.
3. **Inspector:** chọn 1 Container, bật `styles`. Mở "Gradient" → Thêm. Canvas phải hiện nền chuyển màu `blue-500 → purple-500`. Đặt `bgColor: white` + `Background opacity: 20%` + `Backdrop blur: lg` thì được hiệu ứng kính mờ.
4. **Căn giữa:** Max width `6xl` + Margin X `auto`, container phải thu hẹp và nằm giữa.
5. **Responsive grid:** `base` giữ `flex-col`, chuyển breakpoint Tablet rồi đặt Grid `3 cột`. Code Modal phải ra `flex flex-col md:grid md:grid-cols-3`.
6. **AI:** prompt *"Thêm hero có nền gradient tím sang xanh, tiêu đề cỡ lớn căn giữa, nút bấm hover nổi lên"* phải sinh `bgGradient`, `fontSize 5xl/6xl`, `hover: {translateY: -1, shadow: ...}` kèm `transition: "all"`. Mở Code Modal kiểm tra className.
7. **Chống giá trị rác:** gọi `useBuilderStore.getState().applyAiOperations([...])` với `style: {base: {fontSize: "huge", bgColor: "<script>"}}`. Class sinh ra không được chứa `undefined` hay chuỗi lạ.

## Giới hạn cần biết

- **Màu hex tự do, px tự do (`w-[320px]`) và token ngoài palette vẫn không hiện trên Canvas.** Code export vẫn đúng. Đây là giới hạn cũ, nay áp cho cả gradient/shadow tuỳ màu.
- **Opacity-màu trên Canvas chỉ xem được ở `base` và `hover`.** `md:`/`lg:` thì không, để file `preview.css` không phình thêm. Nếu cần thêm thì chỉ việc thêm `md:,lg:` vào dòng safelist tương ứng.
- **Hover/focus/active chưa có UI sửa.** AI và code export dùng được, nhưng người dùng không chỉnh tay được trong Inspector.
- **`fontFamily`:** `font-sans` trong Builder phụ thuộc biến `--font-sans`, mà `globals.css` bạn gửi có dòng `--font-sans: var(--font-sans)` tự tham chiếu. Mình chưa kiểm chứng, Canvas có thể không đổi font dù export vẫn đúng. Gửi `layout.tsx` thì mình xác nhận được.
- **`@source inline` cần Tailwind ≥ 4.1.** Dependency của bạn là `^4.x` nên đáp ứng. Nếu CLI báo lỗi cú pháp thì báo mình.
- **Hướng sửa gốc cho Canvas (mình chưa kiểm chứng):** biên dịch Tailwind ngay trong trình duyệt từ các class của cây node hiện tại, bỏ hẳn safelist và `dev:css`. Hướng này chưa chắc làm được trong Shadow DOM nên mình chưa đụng vào. Muốn thì mình thử riêng.

