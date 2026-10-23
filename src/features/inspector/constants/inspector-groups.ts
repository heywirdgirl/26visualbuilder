import {
  Star,
  Sparkles,
  LayoutGrid,
  Ruler,
  Space,
  Layers,
  Move,
  Type,
  Palette,
  Blend,
  RotateCw,
  type LucideIcon,
} from "lucide-react";
import type { NodeDefinition } from "@/core/types/node-definition.types";
import type { StyleProps, NodeStyle } from "@/core/types/style.types";
import { anyKeyHasValue } from "@/core/utils/style-cascade";
import {
  FIELD_SPEC_BY_KEY,
  fieldAppliesTo,
  getNodeKind,
  type NodeKind,
  type StyleFieldSpec,
} from "./style-field-schema";

export type GroupId =
  | "common" | "preset" | "layout" | "sizing" | "spacing" | "self-layout"
  | "position" | "typography" | "appearance" | "effects" | "transform";

export interface InspectorGroup {
  id: GroupId;
  label: string;
  icon: LucideIcon;
  fields: (keyof StyleProps)[];
}

const COMMON_KEYS_BY_KIND: Record<NodeKind, (keyof StyleProps)[]> = {
  container: ["direction", "gap", "padding", "bgColor", "borderRadius"],
  text: ["fontSize", "fontWeight", "textColor", "textAlign"],
  button: ["paddingX", "paddingY", "borderRadius", "bgColor", "textColor", "shadow", "translateY", "transition"],
  field: ["width", "paddingX", "paddingY", "borderRadius", "bgColor", "textColor"],
  media: ["width", "aspectRatio", "objectFit", "borderRadius"],
  leaf: ["width", "padding", "borderRadius", "bgColor"],
};

export const INSPECTOR_GROUPS: InspectorGroup[] = [
  { id: "common", label: "Hay dùng", icon: Star, fields: [] },
  { id: "preset", label: "Preset", icon: Sparkles, fields: [] },
  {
    id: "layout", label: "Layout", icon: LayoutGrid,
    fields: ["direction", "gridCols", "gap", "gapX", "gapY", "align", "justify", "flexWrap", "display"],
  },
  { id: "sizing", label: "Kích thước", icon: Ruler, fields: ["width", "height", "maxWidth", "aspectRatio", "objectFit"] },
  { id: "spacing", label: "Khoảng cách", icon: Space, fields: ["padding", "paddingX", "paddingY", "margin", "marginX", "marginY"] },
  { id: "self-layout", label: "Tự căn", icon: Layers, fields: ["alignSelf", "flexGrow", "flexShrink"] },
  { id: "position", label: "Vị trí", icon: Move, fields: ["position", "top", "right", "bottom", "left", "zIndex"] },
  {
    id: "typography", label: "Chữ", icon: Type,
    fields: [
      "fontSize", "fontWeight", "fontFamily", "textAlign", "lineHeight", "letterSpacing",
      "textTransform", "textDecoration", "textColor", "textOpacity",
    ],
  },
  {
    id: "appearance", label: "Giao diện", icon: Palette,
    fields: [
      "bgColor", "bgOpacity", "borderWidth", "borderColor", "borderOpacity", "borderRadius",
      "ringWidth", "ringColor", "shadow", "shadowColor",
    ],
  },
  { id: "effects", label: "Hiệu ứng", icon: Blend, fields: ["opacity", "overflow", "blur", "backdropBlur", "cursor"] },
  { id: "transform", label: "Biến đổi", icon: RotateCw, fields: ["scale", "rotate", "translateX", "translateY", "transition", "duration"] },
];

export function getGroupKeys(group: InspectorGroup, kind: NodeKind): (keyof StyleProps)[] {
  if (group.id === "preset") return [];
  if (group.id === "common") return COMMON_KEYS_BY_KIND[kind];
  return group.fields.filter((key) => {
    const spec = FIELD_SPEC_BY_KEY.get(key);
    return !!spec && fieldAppliesTo(spec, kind);
  });
}

export function getGroupFields(group: InspectorGroup, kind: NodeKind): StyleFieldSpec[] {
  return getGroupKeys(group, kind)
    .map((key) => FIELD_SPEC_BY_KEY.get(key))
    .filter((spec): spec is StyleFieldSpec => !!spec);
}

export function getVisibleGroups(kind: NodeKind): InspectorGroup[] {
  return INSPECTOR_GROUPS.filter(
    (group) => group.id === "common" || group.id === "preset" || getGroupKeys(group, kind).length > 0
  );
}

export function groupHasValue(style: NodeStyle, keys: (keyof StyleProps)[]): boolean {
  return anyKeyHasValue(style, keys);
}

export type PresetGroupId = "layout" | "surface" | "text" | "action" | "media" | "other";

export const PRESET_GROUPS: { id: PresetGroupId; label: string; names: string[] }[] = [
  {
    id: "layout",
    label: "Layout",
    names: ["page-container", "section", "hero", "box", "stack", "stack-lg", "row", "row-between", "row-wrap", "grid-2", "grid-3", "grid-4", "navbar", "footer", "list", "list-item"],
  },
  { id: "surface", label: "Surface", names: ["card", "card-featured", "card-dark", "card-glass", "surface-muted"] },
  {
    id: "text",
    label: "Text",
    names: ["heading-hero", "heading-section", "heading-card", "text-lead", "text-body", "text-muted", "price", "eyebrow", "label", "link"],
  },
  { id: "action", label: "Action", names: ["button-primary", "button-block", "button-accent", "button-soft", "badge-pill"] },
  { id: "media", label: "Media & Form", names: ["image-cover", "input-field"] },
];

const PRESET_RELEVANCE_BY_KIND: Record<NodeKind, PresetGroupId[]> = {
  container: ["layout", "surface"],
  text: ["text"],
  button: ["action"],
  field: ["media"],
  media: ["media"],
  leaf: ["surface"],
};

const PRESET_RELEVANCE_BY_DEF: Record<string, PresetGroupId[]> = {
  "html.a": ["text", "action"],
  "shadcn.badge": ["action", "text"],
  "shadcn.avatar": ["media"],
  "shadcn.alert": ["surface", "text"],
};

export function relevantPresetGroups(def?: NodeDefinition): PresetGroupId[] {
  if (!def) return ["layout"];
  return PRESET_RELEVANCE_BY_DEF[def.id] ?? PRESET_RELEVANCE_BY_KIND[getNodeKind(def)];
}
