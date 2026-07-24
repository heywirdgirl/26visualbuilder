// core/registry/node-registry.ts

import { NodeDefinition, NodeCategory } from "@/core/types/node-definition.types";
import { htmlNodes } from "./html-nodes";
import { shadcnNodes } from "./shadcn-nodes"; // 👈 sẽ thêm ở Phase A bước 2

function buildRegistry(defs: NodeDefinition[]): Record<string, NodeDefinition> {
  return defs.reduce((acc, def) => {
    acc[def.id] = def;
    return acc;
  }, {} as Record<string, NodeDefinition>);
}

export const nodeRegistry: Record<string, NodeDefinition> = buildRegistry([
  ...htmlNodes,
  ...shadcnNodes, // 👈 merge tiếp khi có file shadcn-nodes.ts
]);

export function getNodeDefinition(id: string): NodeDefinition | undefined {
  return nodeRegistry[id];
}

export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  return Object.values(nodeRegistry).filter((def) => def.category === category);
}

export function searchNodes(query: string): NodeDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return Object.values(nodeRegistry);
  return Object.values(nodeRegistry).filter(
    (def) =>
      def.title.toLowerCase().includes(q) ||
      def.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}