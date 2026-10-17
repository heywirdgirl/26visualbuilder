// src/core/registry/default-presets.ts

import { NodeDefinition } from "@/core/types/node-definition.types";
import { NodeStyle } from "@/core/types/style.types";
import { getStylePreset } from "./style-presets";

// defId -> preset applied when adding a node. Unmapped nodes keep their definition default.
export const DEFAULT_PRESET_BY_NODE: Record<string, string> = {
  "html.div": "box",
  "html.main": "box",
  "html.article": "box",
  "html.section": "section",
  "html.header": "navbar",
  "html.footer": "footer",
  "html.aside": "surface-muted",
  "html.nav": "row",
  "html.h1": "heading-hero",
  "html.h2": "heading-section",
  "html.h3": "heading-card",
  "html.p": "text-body",
  "html.label": "label",
  "shadcn.label": "label",
  "html.ul": "list",
  "html.ol": "list",
  "html.li": "list-item",
  "html.a": "link",
  "html.button": "button-primary",
  "html.input": "input-field",
  "html.textarea": "input-field",
  "html.select": "input-field",
  "shadcn.button": "button-soft",
  "html.img": "image-cover",
  "shadcn.card": "card",
};

export function resolveDefaultStyle(def: NodeDefinition): NodeStyle {
  const preset = getStylePreset(DEFAULT_PRESET_BY_NODE[def.id])?.style;
  if (preset) return structuredClone(preset);
  return { base: structuredClone(def.defaultStyle ?? {}) };
}
