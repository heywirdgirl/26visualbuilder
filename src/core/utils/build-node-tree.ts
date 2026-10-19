import type { DefaultChildSpec } from "@/core/types/node-definition.types";
import type { TreeNode } from "@/core/types/builder.types";
import type { NodeDefinition } from "@/core/types/node-definition.types";
import type { NodeStyle, StyleProps } from "@/core/types/style.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { resolveDefaultStyle } from "@/core/registry/default-presets";
import { getStylePreset } from "@/core/registry/style-presets";

const MAX_DEPTH = 12;

function resolveSpecStyle(
  def: NodeDefinition,
  preset?: string,
  override?: Record<string, unknown>
): NodeStyle {
  const presetStyle = getStylePreset(preset)?.style;
  const style: NodeStyle = presetStyle ? structuredClone(presetStyle) : resolveDefaultStyle(def);
  if (override) {
    style.base = { ...style.base, ...(structuredClone(override) as Partial<StyleProps>) };
  }
  return style;
}

function build(spec: DefaultChildSpec, depth: number): TreeNode | null {
  if (depth > MAX_DEPTH) return null;
  const def = getNodeDefinition(spec.defId);
  if (!def) return null;

  const childSpecs = spec.children ?? def.defaultChildren ?? [];
  return {
    id: crypto.randomUUID(),
    type: spec.defId,
    props: { ...structuredClone(def.defaultProps), ...structuredClone(spec.props ?? {}) },
    style: resolveSpecStyle(def, spec.preset, spec.style),
    children: childSpecs.map((child) => build(child, depth + 1)).filter((node): node is TreeNode => node !== null),
  };
}

export function buildNodeFromSpec(
  defId: string,
  overrideProps?: Record<string, unknown>,
  childSpecs?: DefaultChildSpec[],
  depth = 0
): TreeNode | null {
  return build({ defId, props: overrideProps, children: childSpecs }, depth);
}

export function buildNodeTree(spec: DefaultChildSpec): TreeNode | null {
  return build(spec, 0);
}
