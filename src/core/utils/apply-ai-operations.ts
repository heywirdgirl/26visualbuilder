import { TreeNode } from "@/core/types/builder.types";
import { AiNode, AiOperation } from "@/core/types/ai-operation.types";
import { NodeDefinition, PropInputType } from "@/core/types/node-definition.types";
import { NodeStyle, StyleProps, STYLE_LAYER_KEYS, STYLE_PROP_KEYS } from "@/core/types/style.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";
import { getStylePreset } from "@/core/registry/style-presets";

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

function sanitizeStyleFields(raw: unknown): Partial<StyleProps> {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const key of STYLE_PROP_KEYS) {
    if (key in source) sanitized[key] = source[key];
  }
  return sanitized as Partial<StyleProps>;
}

type StyleLayers = Partial<Record<(typeof STYLE_LAYER_KEYS)[number], Partial<StyleProps>>>;

function parseAiStyle(aiStyle: Record<string, unknown> | undefined): StyleLayers {
  if (!aiStyle) return {};
  const hasLayers = STYLE_LAYER_KEYS.some((layer) => layer in aiStyle);
  const raw: Record<string, unknown> = hasLayers ? aiStyle : { base: aiStyle };
  const out: StyleLayers = {};
  for (const layer of STYLE_LAYER_KEYS) {
    if (raw[layer]) out[layer] = sanitizeStyleFields(raw[layer]);
  }
  return out;
}

function mergeStyle(aiStyle: Record<string, unknown> | undefined, presetName: string | undefined): NodeStyle {
  const presetStyle = getStylePreset(presetName)?.style;
  const preset = presetStyle ? structuredClone(presetStyle) : undefined;
  const ai = parseAiStyle(aiStyle);

  const result: NodeStyle = { base: { ...(preset?.base ?? {}), ...(ai.base ?? {}) } };
  for (const layer of STYLE_LAYER_KEYS) {
    if (layer === "base") continue;
    const merged = { ...(preset?.[layer] ?? {}), ...(ai[layer] ?? {}) };
    if (Object.keys(merged).length > 0) result[layer] = merged;
  }
  return result;
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
    style: mergeStyle(aiNode.style, aiNode.preset),
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
