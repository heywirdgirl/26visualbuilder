import { TreeNode } from "@/core/types/builder.types";
import { AiNode, AiOperation } from "@/core/types/ai-operation.types";
import { NodeDefinition, PropInputType } from "@/core/types/node-definition.types";
import { StyleProps, STYLE_PROP_KEYS } from "@/core/types/style.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";

export interface ApplyAiOperationsResult {
  tree: TreeNode;
  appliedCount: number;
  skippedTopLevel: number;
  skippedNested: number;
}

function findNodeLocal(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeLocal(child, id);
    if (found) return found;
  }
  return null;
}

function coerceValue(inputType: PropInputType, raw: unknown, fallback: unknown): unknown {
  switch (inputType) {
    case "number": {
      const number = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(number) ? number : fallback;
    }
    case "checkbox": {
      if (typeof raw === "boolean") return raw;
      if (raw === "true") return true;
      if (raw === "false") return false;
      return fallback;
    }
    default:
      return typeof raw === "string" ? raw : fallback;
  }
}

function mergeProps(def: NodeDefinition, aiProps: Record<string, unknown> | undefined): Record<string, unknown> {
  const merged = structuredClone(def.defaultProps);
  if (!aiProps) return merged;

  for (const prop of def.propsSchema) {
    if (prop.key in aiProps) {
      merged[prop.key] = coerceValue(prop.inputType, aiProps[prop.key], merged[prop.key]);
    }
  }
  return merged;
}

function mergeStyle(def: NodeDefinition, aiStyle: Record<string, unknown> | undefined): Partial<StyleProps> {
  const merged: Partial<StyleProps> = structuredClone(def.defaultStyle ?? {});
  if (!aiStyle) return merged;

  for (const key of STYLE_PROP_KEYS) {
    if (key in aiStyle) {
      (merged as Record<string, unknown>)[key] = aiStyle[key];
    }
  }
  return merged;
}

function buildNodeRecursive(
  aiNode: AiNode,
  parentDef: NodeDefinition,
  stats: { skippedNested: number }
): TreeNode | null {
  const nodeDef = getNodeDefinition(aiNode.nodeType);
  if (!nodeDef || (nodeDef.nodeKind !== "html" && nodeDef.nodeKind !== "shadcn")) {
    return null;
  }
  if (!canContain(parentDef, nodeDef.nodeKind)) {
    return null;
  }

  const children = parentDef.canHaveChildren
    ? (aiNode.children ?? []).map((child) => {
        const builtChild = buildNodeRecursive(child, nodeDef, stats);
        if (!builtChild) stats.skippedNested++;
        return builtChild;
      }).filter((child): child is TreeNode => child !== null)
    : [];

  return {
    id: crypto.randomUUID(),
    type: aiNode.nodeType,
    props: mergeProps(nodeDef, aiNode.props),
    style: { base: mergeStyle(nodeDef, aiNode.style) },
    children,
  };
}

export function applyAiOperationsToTree(
  tree: TreeNode,
  operations: AiOperation[]
): ApplyAiOperationsResult {
  const newTree = structuredClone(tree);
  const stats = { skippedNested: 0 };
  let appliedCount = 0;
  let skippedTopLevel = 0;

  for (const operation of operations) {
    const parentNode = findNodeLocal(newTree, operation.parentId);
    if (!parentNode) {
      skippedTopLevel++;
      continue;
    }

    const parentDef = getNodeDefinition(parentNode.type);
    if (!parentDef) {
      skippedTopLevel++;
      continue;
    }

    const rootNode = buildNodeRecursive(operation.node, parentDef, stats);
    if (!rootNode) {
      skippedTopLevel++;
      continue;
    }

    parentNode.children.push(rootNode);
    appliedCount++;
  }

  return {
    tree: newTree,
    appliedCount,
    skippedTopLevel,
    skippedNested: stats.skippedNested,
  };
}
