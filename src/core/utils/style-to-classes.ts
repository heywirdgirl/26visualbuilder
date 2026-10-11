import { NodeStyle, STYLE_LAYER_KEYS, StyleProps } from "@/core/types/style.types";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const COLOR_TOKEN = /^[a-z]+(?:-[a-z]+)?(?:-\d{2,3})?(?:\/(?:[0-9]|[1-9][0-9]|100))?$/;

type ColorPrefix = "bg" | "text" | "border" | "ring" | "shadow" | "from" | "via" | "to";

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

function same(...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, name]));
}

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
const OPACITY: Record<string, string> = { 0: "opacity-0", 25: "opacity-25", 50: "opacity-50", 75: "opacity-75", 100: "opacity-100" };
const OVERFLOW: Record<string, string> = {
  visible: "overflow-visible", hidden: "overflow-hidden", scroll: "overflow-scroll", auto: "overflow-auto",
};
const FONT_SIZE: Record<string, string> = {
  xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl",
  "3xl": "text-3xl", "4xl": "text-4xl", "5xl": "text-5xl", "6xl": "text-6xl", "7xl": "text-7xl",
};
const FONT_WEIGHT: Record<string, string> = {
  light: "font-light", normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold", extrabold: "font-extrabold",
};
const FONT_FAMILY: Record<string, string> = { sans: "font-sans", serif: "font-serif", mono: "font-mono" };
const LINE_HEIGHT: Record<string, string> = {
  none: "leading-none", tight: "leading-tight", snug: "leading-snug", normal: "leading-normal", relaxed: "leading-relaxed", loose: "leading-loose",
};
const LETTER_SPACING: Record<string, string> = {
  tighter: "tracking-tighter", tight: "tracking-tight", normal: "tracking-normal", wide: "tracking-wide", wider: "tracking-wider", widest: "tracking-widest",
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
const BLUR: Record<string, string> = { none: "blur-none", sm: "blur-sm", md: "blur-md", lg: "blur-lg", xl: "blur-xl" };
const BACKDROP_BLUR: Record<string, string> = {
  none: "backdrop-blur-none", sm: "backdrop-blur-sm", md: "backdrop-blur-md", lg: "backdrop-blur-lg", xl: "backdrop-blur-xl", "2xl": "backdrop-blur-2xl",
};
const SCALE: Record<string, string> = {
  50: "scale-50", 75: "scale-75", 90: "scale-90", 95: "scale-95", 100: "scale-100", 105: "scale-105", 110: "scale-110", 125: "scale-125",
};
const ROTATE: Record<string, string> = {
  "-45": "-rotate-45", "-12": "-rotate-12", "-6": "-rotate-6", "-3": "-rotate-3", "-2": "-rotate-2", "-1": "-rotate-1",
  1: "rotate-1", 2: "rotate-2", 3: "rotate-3", 6: "rotate-6", 12: "rotate-12", 45: "rotate-45", 90: "rotate-90", 180: "rotate-180",
};
const TRANSLATE_X: Record<string, string> = {
  "-4": "-translate-x-4", "-2": "-translate-x-2", "-1": "-translate-x-1", 1: "translate-x-1", 2: "translate-x-2", 4: "translate-x-4",
};
const TRANSLATE_Y: Record<string, string> = {
  "-4": "-translate-y-4", "-2": "-translate-y-2", "-1": "-translate-y-1", 1: "translate-y-1", 2: "translate-y-2", 4: "translate-y-4",
};
const TRANSITION: Record<string, string> = {
  none: "transition-none", all: "transition-all", colors: "transition-colors", shadow: "transition-shadow", transform: "transition-transform",
};
const DURATION: Record<string, string> = {
  75: "duration-75", 150: "duration-150", 200: "duration-200", 300: "duration-300", 500: "duration-500", 700: "duration-700",
};
const OBJECT_FIT: Record<string, string> = { cover: "object-cover", contain: "object-contain", fill: "object-fill" };
const ASPECT: Record<string, string> = { auto: "aspect-auto", square: "aspect-square", video: "aspect-video" };
const CURSOR: Record<string, string> = { pointer: "cursor-pointer", default: "cursor-default", "not-allowed": "cursor-not-allowed" };
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
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 24 ? `${prefix}-${value}` : null;
}

function sizeClass(prefix: "w" | "h", value: unknown): string | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? `${prefix}-[${value}px]` : null;
  const preset = typeof value === "string" ? SIZE_PRESET[value] : undefined;
  return preset ? `${prefix}-${preset}` : null;
}

function offsetClass(side: "top" | "right" | "bottom" | "left", value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value < 0 ? `-${side}-[${Math.abs(value)}px]` : `${side}-[${value}px]`;
}

function gradientClasses(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const { direction, from, via, to } = value as { direction?: string; from?: string; via?: string; to?: string };
  const dir = direction ? GRADIENT_DIR[direction] : undefined;
  const fromColor = colorClass("from", from);
  const toColor = colorClass("to", to);
  if (!dir || !fromColor || !toColor) return [];
  const viaColor = via ? colorClass("via", via) : null;
  return viaColor ? [dir, fromColor, viaColor, toColor] : [dir, fromColor, toColor];
}

function fieldsToClasses(fields: Partial<StyleProps>): string[] {
  const classes: string[] = [];
  const add = (value: string | null | undefined) => {
    if (value) classes.push(value);
  };

  const grid = lookup(GRID_COLS, fields.gridCols);
  if (grid) {
    add("grid");
    add(grid);
  } else if (fields.direction && DIRECTION[fields.direction]) {
    add("flex");
    add(DIRECTION[fields.direction]);
  }
  add(spacingClass("gap", fields.gap));
  add(spacingClass("gap-x", fields.gapX));
  add(spacingClass("gap-y", fields.gapY));
  add(lookup(ALIGN, fields.align));
  add(lookup(JUSTIFY, fields.justify));
  add(lookup(FLEX_WRAP, fields.flexWrap));
  add(lookup(DISPLAY, fields.display));

  add(sizeClass("w", fields.width));
  add(sizeClass("h", fields.height));
  add(lookup(MAX_WIDTH, fields.maxWidth));
  add(lookup(POSITION, fields.position));
  add(offsetClass("top", fields.top));
  add(offsetClass("right", fields.right));
  add(offsetClass("bottom", fields.bottom));
  add(offsetClass("left", fields.left));
  add(lookup(Z_INDEX, fields.zIndex));
  add(lookup(OVERFLOW, fields.overflow));
  add(lookup(OPACITY, fields.opacity));
  add(lookup(ALIGN_SELF, fields.alignSelf));
  if (fields.flexGrow !== undefined) add(fields.flexGrow === 1 ? "grow" : "grow-0");
  if (fields.flexShrink !== undefined) add(fields.flexShrink === 1 ? "shrink" : "shrink-0");

  add(spacingClass("p", fields.padding));
  add(spacingClass("px", fields.paddingX));
  add(spacingClass("py", fields.paddingY));
  add(spacingClass("m", fields.margin));
  add(fields.marginX === "auto" ? "mx-auto" : spacingClass("mx", fields.marginX));
  add(spacingClass("my", fields.marginY));

  add(colorClass("text", fields.textColor, fields.textOpacity));
  add(colorClass("bg", fields.bgColor, fields.bgOpacity));
  gradientClasses(fields.bgGradient).forEach(add);

  add(lookup(FONT_SIZE, fields.fontSize));
  add(lookup(FONT_WEIGHT, fields.fontWeight));
  add(lookup(FONT_FAMILY, fields.fontFamily));
  add(lookup(LINE_HEIGHT, fields.lineHeight));
  add(lookup(LETTER_SPACING, fields.letterSpacing));
  add(lookup(TEXT_ALIGN, fields.textAlign));
  add(lookup(TEXT_TRANSFORM, fields.textTransform));
  add(lookup(TEXT_DECORATION, fields.textDecoration));

  add(lookup(BORDER_WIDTH, fields.borderWidth));
  add(colorClass("border", fields.borderColor, fields.borderOpacity));
  add(lookup(RADIUS, fields.borderRadius));
  add(lookup(SHADOW, fields.shadow));
  add(colorClass("shadow", fields.shadowColor, 30));
  add(lookup(RING_WIDTH, fields.ringWidth));
  add(colorClass("ring", fields.ringColor));

  add(lookup(BLUR, fields.blur));
  add(lookup(BACKDROP_BLUR, fields.backdropBlur));
  add(lookup(SCALE, fields.scale));
  add(lookup(ROTATE, fields.rotate));
  add(lookup(TRANSLATE_X, fields.translateX));
  add(lookup(TRANSLATE_Y, fields.translateY));
  add(lookup(TRANSITION, fields.transition));
  add(lookup(DURATION, fields.duration));
  add(lookup(OBJECT_FIT, fields.objectFit));
  add(lookup(ASPECT, fields.aspectRatio));
  add(lookup(CURSOR, fields.cursor));

  return classes;
}

export function styleToClasses(style: NodeStyle): string {
  const classes: string[] = [];
  for (const layer of STYLE_LAYER_KEYS) {
    const fields = style[layer];
    if (!fields) continue;
    const prefix = layer === "base" ? "" : `${layer}:`;
    classes.push(...fieldsToClasses(fields).map((className) => `${prefix}${className}`));
  }
  return classes.join(" ");
}