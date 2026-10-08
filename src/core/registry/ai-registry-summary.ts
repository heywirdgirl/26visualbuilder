import { nodeRegistry } from "./node-registry";

export interface RegistrySummaryEntry {
  id: string;
  title: string;
  nodeKind: string;
  canHaveChildren: boolean;
  propKeys: string[];
}

export function getAiRegistrySummary(): RegistrySummaryEntry[] {
  return Object.values(nodeRegistry)
    .filter((def) => def.nodeKind === "html" || def.nodeKind === "shadcn")
    .map((def) => ({
      id: def.id,
      title: def.title,
      nodeKind: def.nodeKind,
      canHaveChildren: def.canHaveChildren,
      propKeys: def.propsSchema.map((prop) => prop.key),
    }));
}
