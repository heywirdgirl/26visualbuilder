// src/core/registry/ai-registry-summary.ts

import { nodeRegistry } from "./node-registry";

export interface RegistrySummaryEntry {
  id: string;
  title: string;
  nodeKind: string;
  canHaveChildren: boolean;
  propKeys: string[];
  prefilled: boolean;
  sealed: boolean;
}

export function getAiRegistrySummary(): RegistrySummaryEntry[] {
  return Object.values(nodeRegistry)
    .filter(
      (def) =>
        (def.nodeKind === "html" || def.nodeKind === "shadcn") &&
        !def.parentOnly
    )
    .map((def) => ({
      id: def.id,
      title: def.title,
      nodeKind: def.nodeKind,
      canHaveChildren: def.canHaveChildren,
      propKeys: def.propsSchema.map((prop) => prop.key),
      prefilled: def.tier === "component" && (def.defaultChildren?.length ?? 0) > 0,
      sealed: !!def.allowedChildIds,
    }));
}
