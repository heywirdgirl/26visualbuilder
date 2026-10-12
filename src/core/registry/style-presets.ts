import { NodeStyle } from "@/core/types/style.types";

export interface StylePreset {
  description: string;
  style: NodeStyle;
}

export const STYLE_PRESETS: Record<string, StylePreset> = {
  "page-container": {
    description: "centered page wrapper: max-width 6xl, side padding, vertical stack gap 8",
    style: { base: { direction: "flex-col", gap: 8, maxWidth: "6xl", marginX: "auto", paddingX: 4 }, md: { paddingX: 8 } },
  },
  section: {
    description: "vertical section: stack gap 6, vertical padding 12 (16 on md+)",
    style: { base: { direction: "flex-col", gap: 6, paddingY: 12 }, md: { paddingY: 16 } },
  },
  hero: {
    description: "centered hero block: stacked, centered items and text, large vertical padding",
    style: {
      base: { direction: "flex-col", align: "items-center", textAlign: "center", gap: 6, paddingY: 16, paddingX: 4 },
      md: { paddingY: 24 },
    },
  },
  stack: { description: "vertical stack, gap 4", style: { base: { direction: "flex-col", gap: 4 } } },
  "stack-lg": { description: "vertical stack, gap 8", style: { base: { direction: "flex-col", gap: 8 } } },
  row: {
    description: "horizontal row, vertically centered, gap 4",
    style: { base: { direction: "flex-row", align: "items-center", gap: 4 } },
  },
  "row-between": {
    description: "horizontal row, centered, items pushed to both ends (navbars, headers)",
    style: { base: { direction: "flex-row", align: "items-center", justify: "justify-between", gap: 4 } },
  },
  "row-wrap": {
    description: "horizontal row that wraps (tags, badges, logos)",
    style: { base: { direction: "flex-row", flexWrap: "flex-wrap", align: "items-center", gap: 3 } },
  },
  "grid-2": {
    description: "responsive grid: 1 column on mobile, 2 on md+, gap 6",
    style: { base: { gridCols: 1, gap: 6 }, md: { gridCols: 2 } },
  },
  "grid-3": {
    description: "responsive grid: 1 column on mobile, 2 on md, 3 on lg (cards, pricing, features), gap 6",
    style: { base: { gridCols: 1, gap: 6 }, md: { gridCols: 2 }, lg: { gridCols: 3 } },
  },
  "grid-4": {
    description: "responsive grid: 1 column on mobile, 2 on md, 4 on lg (products, logos), gap 6",
    style: { base: { gridCols: 1, gap: 6 }, md: { gridCols: 2 }, lg: { gridCols: 4 } },
  },
  card: {
    description: "elevated white card: padding 6, rounded-2xl, soft shadow, subtle border, lifts on hover",
    style: {
      base: {
        direction: "flex-col", gap: 4, padding: 6, bgColor: "white", borderRadius: "2xl",
        shadow: "md", borderWidth: 1, borderColor: "zinc-100", transition: "all", duration: 200,
      },
      hover: { shadow: "xl", translateY: -1 },
    },
  },
  "card-featured": {
    description: "highlighted card (e.g. recommended pricing tier): blue ring, bigger shadow",
    style: {
      base: {
        direction: "flex-col", gap: 4, padding: 6, bgColor: "white", borderRadius: "2xl",
        shadow: "xl", ringWidth: 2, ringColor: "blue-500", transition: "all", duration: 200,
      },
      hover: { translateY: -1 },
    },
  },
  "card-dark": {
    description: "dark card: zinc-900 background, white text, rounded-2xl",
    style: {
      base: { direction: "flex-col", gap: 4, padding: 6, bgColor: "zinc-900", textColor: "white", borderRadius: "2xl", shadow: "lg" },
    },
  },
  "card-glass": {
    description: "glassmorphism card (use over dark or colorful backgrounds): translucent white, backdrop blur, thin border",
    style: {
      base: {
        direction: "flex-col", gap: 4, padding: 6, bgColor: "white", bgOpacity: 10, backdropBlur: "lg",
        borderWidth: 1, borderColor: "white", borderOpacity: 20, borderRadius: "2xl",
      },
    },
  },
  "surface-muted": {
    description: "soft gray panel: zinc-100 background, rounded-xl, padding 6",
    style: { base: { direction: "flex-col", gap: 4, padding: 6, bgColor: "zinc-100", borderRadius: "xl" } },
  },
  "heading-hero": {
    description: "hero headline: 4xl (6xl on md+), extrabold, tight tracking, zinc-900",
    style: {
      base: { fontSize: "4xl", fontWeight: "extrabold", letterSpacing: "tight", lineHeight: "tight", textColor: "zinc-900" },
      md: { fontSize: "6xl" },
    },
  },
  "heading-section": {
    description: "section title: 3xl bold, tight tracking, zinc-900",
    style: { base: { fontSize: "3xl", fontWeight: "bold", letterSpacing: "tight", textColor: "zinc-900" } },
  },
  "heading-card": {
    description: "card title: xl semibold, zinc-900",
    style: { base: { fontSize: "xl", fontWeight: "semibold", textColor: "zinc-900" } },
  },
  "text-lead": {
    description: "intro paragraph under a headline: lg (xl on md+), relaxed, zinc-500",
    style: { base: { fontSize: "lg", lineHeight: "relaxed", textColor: "zinc-500" }, md: { fontSize: "xl" } },
  },
  "text-body": {
    description: "body text: base size, relaxed line height, zinc-700",
    style: { base: { fontSize: "base", lineHeight: "relaxed", textColor: "zinc-700" } },
  },
  "text-muted": {
    description: "small secondary text: sm, zinc-500",
    style: { base: { fontSize: "sm", textColor: "zinc-500" } },
  },
  price: {
    description: "big price figure: 4xl extrabold zinc-900",
    style: { base: { fontSize: "4xl", fontWeight: "extrabold", textColor: "zinc-900" } },
  },
  eyebrow: {
    description: "small uppercase label above a headline: xs, semibold, wide tracking, blue-500",
    style: { base: { fontSize: "xs", fontWeight: "semibold", textTransform: "uppercase", letterSpacing: "widest", textColor: "blue-500" } },
  },
  "button-primary": {
    description: "primary button: zinc-900 background, white text, rounded-xl, lifts on hover",
    style: {
      base: { bgColor: "zinc-900", textColor: "white", borderRadius: "xl", paddingX: 6, paddingY: 3, transition: "all", duration: 200 },
      hover: { shadow: "lg", translateY: -1 },
    },
  },
  "button-block": {
    description: "full-width primary button (use at the bottom of cards)",
    style: {
      base: { width: "full", bgColor: "zinc-900", textColor: "white", borderRadius: "xl", paddingY: 3, transition: "all", duration: 200 },
      hover: { shadow: "lg" },
    },
  },
  "button-accent": {
    description: "accent button: blue-500 background, white text, rounded-xl",
    style: {
      base: { bgColor: "blue-500", textColor: "white", borderRadius: "xl", paddingX: 6, paddingY: 3, transition: "all", duration: 200 },
      hover: { shadow: "lg", translateY: -1 },
    },
  },
  "badge-pill": {
    description: "small pill badge: tinted blue background, blue text, fully rounded",
    style: {
      base: { bgColor: "blue-500", bgOpacity: 10, textColor: "blue-500", borderRadius: "full", paddingX: 3, paddingY: 1, fontSize: "xs", fontWeight: "medium" },
    },
  },
  "image-cover": {
    description: "full-width image, 16:9, cropped to fill, rounded-xl",
    style: { base: { width: "full", aspectRatio: "video", objectFit: "cover", borderRadius: "xl" } },
  },
  box: {
    description: "plain padded container (always visible when empty): stack gap 4, padding 4",
    style: { base: { direction: "flex-col", gap: 4, padding: 4 } },
  },
  navbar: {
    description: "top bar: row, centered, space-between, padding x 6 / y 4",
    style: { base: { direction: "flex-row", align: "items-center", justify: "justify-between", gap: 4, paddingX: 6, paddingY: 4 } },
  },
  footer: {
    description: "page footer: stacked, zinc-100 background, generous padding",
    style: { base: { direction: "flex-col", gap: 4, paddingX: 6, paddingY: 8, bgColor: "zinc-100" } },
  },
  list: {
    description: "vertical list, gap 2",
    style: { base: { direction: "flex-col", gap: 2 } },
  },
  "list-item": {
    description: "list row: horizontal, centered, gap 2",
    style: { base: { direction: "flex-row", align: "items-center", gap: 2 } },
  },
  link: {
    description: "inline link: blue-500, underline on hover",
    style: {
      base: { direction: "flex-row", align: "items-center", gap: 1, textColor: "blue-500", transition: "colors" },
      hover: { textDecoration: "underline" },
    },
  },
  label: {
    description: "form label: sm, medium, zinc-700",
    style: { base: { fontSize: "sm", fontWeight: "medium", textColor: "zinc-700" } },
  },
  "input-field": {
    description: "form field: full width, thin border, rounded-lg, blue focus ring",
    style: {
      base: { width: "full", borderWidth: 1, borderColor: "zinc-300", borderRadius: "lg", paddingX: 3, paddingY: 2, transition: "all" },
      focus: { ringWidth: 2, ringColor: "blue-500" },
    },
  },
  "button-soft": {
    description: "shape-only button polish (keeps the component's own variant colors): rounded-xl, lifts on hover",
    style: { base: { borderRadius: "xl", transition: "all", duration: 200 }, hover: { translateY: -1, shadow: "md" } },
  },
};

export function getStylePreset(name?: string): StylePreset | undefined {
  return name && Object.prototype.hasOwnProperty.call(STYLE_PRESETS, name) ? STYLE_PRESETS[name] : undefined;
}