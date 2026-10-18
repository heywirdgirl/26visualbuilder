import type { DefaultChildSpec } from "@/core/types/node-definition.types";
import type { TreeNode } from "@/core/types/builder.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { resolveDefaultStyle } from "@/core/registry/default-presets";

const MAX_DEPTH = 8;

export function buildNodeFromSpec(
  defId: string,
  overrideProps?: Record<string, unknown>,
  childSpecs?: DefaultChildSpec[],
  depth = 0
): TreeNode | null {
  if (depth > MAX_DEPTH) return null;
  const def = getNodeDefinition(defId);
  if (!def) return null;

  const specs = childSpecs ?? def.defaultChildren ?? [];
  return {
    id: crypto.randomUUID(),
    type: defId,
    props: { ...structuredClone(def.defaultProps), ...structuredClone(overrideProps ?? {}) },
    style: resolveDefaultStyle(def),
    children: specs
      .map((spec) => buildNodeFromSpec(spec.defId, spec.props, spec.children, depth + 1))
      .filter((node): node is TreeNode => node !== null),
  };
}

export function buildNodeTree(spec: DefaultChildSpec): TreeNode | null {
  return buildNodeFromSpec(spec.defId, spec.props, spec.children);
}
