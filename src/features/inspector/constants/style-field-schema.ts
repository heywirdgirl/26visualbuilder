import type { NodeDefinition } from "@/core/types/node-definition.types";
import type { StyleProps, OpacityStep } from "@/core/types/style.types";

export type NodeKind = "container" | "text" | "button" | "field" | "media" | "leaf";

export type EnumOption = { value: string | number; label: string };

export type FieldControl =
  | { kind: "enum"; options: EnumOption[] }
  | { kind: "int"; min: number; max: number }
  | { kind: "size"; keywords: string[] }
  | { kind: "color" };

export interface StyleFieldSpec {
  key: keyof StyleProps;
  label: string;
  control: FieldControl;
  appliesTo?: NodeKind[];
}

const KIND_OVERRIDE: Record<string, NodeKind> = {
  "html.a": "text",
  "shadcn.badge": "button",
  "shadcn.avatar": "media",
};

export function getNodeKind(def?: NodeDefinition): NodeKind {
  if (!def) return "leaf";
  const override = KIND_OVERRIDE[def.id];
  if (override) return override;
  if (def.canHaveChildren) return "container";
  if (def.category === "Typography") return "text";
  if (def.category === "Media") return "media";
  if (def.category === "Form") return def.tags.includes("action") ? "button" : "field";
  return "leaf";
}

const SIZE_KEYWORDS = ["auto", "full", "screen", "fit", "1/2", "1/3", "2/3", "1/4", "3/4"];
const OPACITY_STEPS: OpacityStep[] = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const SPACING_STEPS = Array.from({ length: 25 }, (_, i) => i);

const en = (
  key: keyof StyleProps,
  label: string,
  values: readonly (string | number)[],
  appliesTo?: NodeKind[]
): StyleFieldSpec => ({
  key,
  label,
  appliesTo,
  control: { kind: "enum", options: values.map((v) => ({ value: v, label: String(v) })) },
});

const int = (
  key: keyof StyleProps,
  label: string,
  min = 0,
  max = 24,
  appliesTo?: NodeKind[]
): StyleFieldSpec => ({ key, label, appliesTo, control: { kind: "int", min, max } });

const size = (key: keyof StyleProps, label: string, appliesTo?: NodeKind[]): StyleFieldSpec => ({
  key,
  label,
  appliesTo,
  control: { kind: "size", keywords: SIZE_KEYWORDS },
});

const color = (key: keyof StyleProps, label: string, appliesTo?: NodeKind[]): StyleFieldSpec => ({
  key,
  label,
  appliesTo,
  control: { kind: "color" },
});

const TEXT_KINDS: NodeKind[] = ["text", "button"];
const TEXT_KINDS_ALL: NodeKind[] = ["text", "button", "field"];

export const FIELD_SPECS: StyleFieldSpec[] = [
  en("direction", "Hướng", ["flex-row", "flex-col"], ["container"]),
  en("gridCols", "Số cột grid", [1, 2, 3, 4, 6, 12], ["container"]),
  int("gap", "Khoảng cách con", 0, 24, ["container"]),
  int("gapX", "Gap ngang", 0, 24, ["container"]),
  int("gapY", "Gap dọc", 0, 24, ["container"]),
  en("align", "Căn trục phụ", ["items-start", "items-center", "items-end"], ["container"]),
  en("justify", "Căn trục chính", ["justify-start", "justify-center", "justify-between", "justify-end"], ["container"]),
  en("flexWrap", "Xuống dòng", ["flex-nowrap", "flex-wrap", "flex-wrap-reverse"], ["container"]),
  en("display", "Display", ["block", "inline-block", "hidden"]),
  size("width", "Rộng"),
  size("height", "Cao"),
  en("maxWidth", "Max width", ["sm", "md", "lg", "xl", "2xl", "4xl", "6xl", "7xl", "full", "prose"]),
  en("aspectRatio", "Tỉ lệ", ["auto", "square", "video"], ["media"]),
  en("objectFit", "Object fit", ["cover", "contain", "fill"], ["media"]),
  int("padding", "Padding"),
  int("paddingX", "Padding ngang"),
  int("paddingY", "Padding dọc"),
  int("margin", "Margin"),
  en("marginX", "Margin ngang", ["auto", ...SPACING_STEPS]),
  int("marginY", "Margin dọc"),
  en("alignSelf", "Tự căn", ["self-auto", "self-start", "self-center", "self-end", "self-stretch"]),
  en("flexGrow", "Flex grow", [0, 1]),
  en("flexShrink", "Flex shrink", [0, 1]),
  en("position", "Position", ["static", "relative", "absolute", "fixed", "sticky"]),
  int("top", "Top", -256, 256),
  int("right", "Right", -256, 256),
  int("bottom", "Bottom", -256, 256),
  int("left", "Left", -256, 256),
  en("zIndex", "Z-index", [0, 10, 20, 30, 40, 50]),
  en("fontSize", "Cỡ chữ", ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"], TEXT_KINDS),
  en("fontWeight", "Độ đậm", ["light", "normal", "medium", "semibold", "bold", "extrabold"], TEXT_KINDS),
  en("fontFamily", "Font", ["sans", "serif", "mono"], TEXT_KINDS),
  en("textAlign", "Căn chữ", ["left", "center", "right"], TEXT_KINDS_ALL),
  en("lineHeight", "Line height", ["none", "tight", "snug", "normal", "relaxed", "loose"], TEXT_KINDS),
  en("letterSpacing", "Letter spacing", ["tighter", "tight", "normal", "wide", "wider", "widest"], TEXT_KINDS),
  en("textTransform", "Viết hoa", ["uppercase", "lowercase", "capitalize", "normal-case"], TEXT_KINDS),
  en("textDecoration", "Gạch chân", ["underline", "line-through", "no-underline"], TEXT_KINDS),
  color("textColor", "Màu chữ", TEXT_KINDS_ALL),
  en("textOpacity", "Độ mờ chữ", OPACITY_STEPS, TEXT_KINDS_ALL),
  color("bgColor", "Màu nền"),
  en("bgOpacity", "Độ mờ nền", OPACITY_STEPS),
  en("borderWidth", "Độ dày viền", [0, 1, 2, 4]),
  color("borderColor", "Màu viền"),
  en("borderOpacity", "Độ mờ viền", OPACITY_STEPS),
  en("borderRadius", "Bo góc", ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"]),
  en("ringWidth", "Ring", [0, 1, 2, 4, 8]),
  color("ringColor", "Màu ring"),
  en("shadow", "Bóng đổ", ["none", "sm", "md", "lg", "xl", "2xl"]),
  color("shadowColor", "Màu bóng"),
  en("opacity", "Opacity", [0, 25, 50, 75, 100]),
  en("overflow", "Overflow", ["visible", "hidden", "scroll", "auto"]),
  en("blur", "Blur", ["none", "sm", "md", "lg", "xl"]),
  en("backdropBlur", "Backdrop blur", ["none", "sm", "md", "lg", "xl", "2xl"]),
  en("cursor", "Con trỏ", ["pointer", "default", "not-allowed"]),
  en("scale", "Scale (%)", [50, 75, 90, 95, 100, 105, 110, 125]),
  en("rotate", "Xoay (độ)", [-45, -12, -6, -3, -2, -1, 1, 2, 3, 6, 12, 45, 90, 180]),
  en("translateX", "Dịch ngang", [-4, -2, -1, 1, 2, 4]),
  en("translateY", "Dịch dọc", [-4, -2, -1, 1, 2, 4]),
  en("transition", "Transition", ["none", "all", "colors", "shadow", "transform"]),
  en("duration", "Thời lượng (ms)", [75, 150, 200, 300, 500, 700]),
];

export const FIELD_SPEC_BY_KEY = new Map<keyof StyleProps, StyleFieldSpec>(
  FIELD_SPECS.map((spec) => [spec.key, spec] as const)
);

export function fieldAppliesTo(spec: StyleFieldSpec, kind: NodeKind): boolean {
  return !spec.appliesTo || spec.appliesTo.includes(kind);
}
