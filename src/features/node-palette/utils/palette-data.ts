import type { NodeCategory, NodeDefinition, NodeTier } from "@/core/types/node-definition.types";
import { getNodeDefinition, searchNodes } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";
import { commonNodeIds } from "../constants/common-node-ids";

export const CATEGORY_ORDER: NodeCategory[] = [
  "Layout",
  "Typography",
  "Form",
  "List",
  "Media",
  "Navigation",
  "Overlay",
  "Data Display",
  "Feedback",
  "Templates",
];

export interface PaletteGroup {
  key: string;
  label: string;
  defs: NodeDefinition[];
}

export interface PaletteData {
  sealed: boolean;
  parts: NodeDefinition[];
  searchResults: NodeDefinition[];
  element: PaletteGroup[];
  component: PaletteGroup[];
  counts: { element: number; component: number };
}

export function buildPaletteData(
  parentDef: NodeDefinition | undefined,
  query: string
): PaletteData {
  const q = query.trim();
  const allowed = (def: NodeDefinition) =>
    !!parentDef &&
    (def.nodeKind === "html" || def.nodeKind === "shadcn") &&
    canContain(parentDef, def.nodeKind, def);
  const defs = searchNodes(q).filter(allowed);
  const parts = defs.filter((def) => def.parentOnly);
  const normal = defs.filter((def) => !def.parentOnly);
  const tierOf = (def: NodeDefinition): NodeTier => def.tier ?? "element";

  const build = (tier: NodeTier): PaletteGroup[] => {
    const groups: PaletteGroup[] = [];
    const commonIds = new Set<string>();

    if (!q) {
      const common = commonNodeIds
        .map((id) => getNodeDefinition(id))
        .filter(
          (def): def is NodeDefinition =>
            !!def && allowed(def) && !def.parentOnly && tierOf(def) === tier
        );
      common.forEach((def) => commonIds.add(def.id));
      if (common.length) groups.push({ key: "__common", label: "Hay dùng", defs: common });
    }

    const byCategory = new Map<string, NodeDefinition[]>();
    for (const def of normal) {
      if (tierOf(def) !== tier || commonIds.has(def.id)) continue;
      if (!byCategory.has(def.category)) byCategory.set(def.category, []);
      byCategory.get(def.category)?.push(def);
    }
    const ordered = [
      ...CATEGORY_ORDER.filter((category) => byCategory.has(category)),
      ...[...byCategory.keys()].filter(
        (category) => !CATEGORY_ORDER.includes(category as NodeCategory)
      ),
    ];
    ordered.forEach((category) => {
      const categoryDefs = byCategory.get(category);
      if (categoryDefs) groups.push({ key: category, label: category, defs: categoryDefs });
    });
    return groups;
  };

  return {
    sealed: !!parentDef?.allowedChildIds,
    parts,
    searchResults: defs,
    element: build("element"),
    component: build("component"),
    counts: {
      element: normal.filter((def) => tierOf(def) === "element").length,
      component: normal.filter((def) => tierOf(def) === "component").length,
    },
  };
}
