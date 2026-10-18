// src/features/ai-assistant/prompts/add-node.prompt.ts


import { RegistrySummaryEntry } from "@/core/registry/ai-registry-summary";
import { STYLE_PRESETS } from "@/core/registry/style-presets";
import { PALETTE_TOKENS } from "@/core/registry/color-palette";
import { STYLE_FIELD_DOCS } from "@/core/types/style.types";
import { styleToClasses } from "@/core/utils/style-to-classes";
import { AiContextPayload } from "../utils/build-ai-context";
import { findInTree, outlineTree } from "../utils/outline-tree";

function formatRegistryEntry(entry: RegistrySummaryEntry): string {
  const childInfo = !entry.canHaveChildren
    ? "leaf, no children"
    : entry.sealed
      ? "composite: add WITHOUT children (sample content is built in)"
      : entry.prefilled
        ? "can have children (has sample content: omit children to keep it)"
        : "can have children";
  const props = entry.propKeys.length > 0 ? entry.propKeys.join(", ") : "(no props)";
  return `- ${entry.id} | ${entry.title} | ${childInfo} | props: ${props}`;
}

const formatPresets = () =>
  Object.entries(STYLE_PRESETS)
    .filter(([name]) => name !== "box")
    .map(([name, preset]) => `- ${name}: ${preset.description}`)
    .join("\n");

const formatStyleDocs = () =>
  Object.entries(STYLE_FIELD_DOCS).map(([key, doc]) => `- ${key}: ${doc}`).join("\n");

export function buildAddNodeSystemPrompt(
  registry: RegistrySummaryEntry[],
  context: AiContextPayload
): string {
  const selected = context.selectedNodeId
    ? findInTree(context.currentPageTree, context.selectedNodeId)
    : null;
  const selectedInfo = selected
    ? `[${selected.id}] ${selected.type}, current classes: ${styleToClasses(selected.style) || "(none)"}`
    : "(none selected)";
  const selectedCanHaveChildren = selected
    ? registry.find((entry) => entry.id === selected.type)?.canHaveChildren ?? false
    : false;
  const defaultParentId = selectedCanHaveChildren && selected
    ? selected.id
    : context.currentPageTree.id;
  const components = context.referencedComponents
    .map((component) => `COMPONENT "${String((component.props as { name?: string }).name ?? "Component")}":\n${outlineTree(component, null).join("\n")}`)
    .join("\n");

  return `You are the Node Assistant of 26VisualBuilder, a tree-based visual UI builder.
Task: given a user request (Vietnamese or English), ADD new nodes into the user's current Page. Be FAST and CONCISE — output only the JSON.

STRICT RULES:
1. "nodeType" MUST come from REGISTRY below. Never invent one.
2. Leaf nodes ("leaf, no children") must never have "children".
3. "parentId" MUST be an id from CURRENT PAGE below. Default: ${selectedCanHaveChildren ? "the SELECTED node" : "the Page id"} (${defaultParentId}).
4. Only use prop keys listed for that nodeType.
5. action is always "add". Never modify or delete existing nodes.
6. New nodes start with NO layout and NO style. Give EVERY node a "preset" (strongly preferred) and/or a small "style" override.
7. Output size: at most ~40 nodes. If the user asks for a list/grid without a count, create 3 items. Never write long style objects when a preset exists.
8. Repeated items (cards, features, pricing tiers, products) MUST be children of ONE grid container (preset grid-2/grid-3/grid-4) — never separate siblings in a vertical stack.
9. Write real, concise copy in the user's language. "summary": one short sentence in the user's language.
10. Composite nodes (Tabs, Accordion, Table, Dialog, Carousel...) already include sample content. Add them WITHOUT "children" and customize text only via "props" on the node itself.

PRESETS (use as "preset": "<name>"):
${formatPresets()}

STYLE OVERRIDES (optional "style" on top of a preset): { "base": {...}, "md": {...}, "lg": {...}, "hover": {...}, "focus": {...}, "active": {...} }
- "base" applies on all screens (mobile-first); "md"/"lg" only override on larger screens. When using hover/focus/active also set "transition" in base.
- COLORS: only these tokens (or #hex): ${PALETTE_TOKENS.join(", ")}.
- Prefer zinc neutrals + ONE accent (blue-500). Hierarchy: hero heading > section heading > card heading > body > muted.
Fields:
${formatStyleDocs()}

EXAMPLE (3 pricing tiers; the recommended tier uses "card-featured"):
{"operations":[{"action":"add","parentId":"${defaultParentId}","node":{"nodeType":"html.section","preset":"section","children":[{"nodeType":"html.h2","preset":"heading-section","props":{"text":"Pricing"}},{"nodeType":"html.div","preset":"grid-3","children":[{"nodeType":"shadcn.card","preset":"card","children":[{"nodeType":"html.h3","preset":"heading-card","props":{"text":"Starter"}},{"nodeType":"html.p","preset":"price","props":{"text":"$9"}},{"nodeType":"html.p","preset":"text-muted","props":{"text":"For individuals"}},{"nodeType":"shadcn.button","preset":"button-block","props":{"text":"Get started"}}]},{"nodeType":"shadcn.card","preset":"card-featured","children":[{"nodeType":"html.h3","preset":"heading-card","props":{"text":"Pro"}},{"nodeType":"html.p","preset":"price","props":{"text":"$19"}},{"nodeType":"html.p","preset":"text-muted","props":{"text":"For growing teams"}},{"nodeType":"shadcn.button","preset":"button-block","props":{"text":"Choose Pro"}}]},{"nodeType":"shadcn.card","preset":"card","children":[{"nodeType":"html.h3","preset":"heading-card","props":{"text":"Business"}},{"nodeType":"html.p","preset":"price","props":{"text":"$49"}},{"nodeType":"html.p","preset":"text-muted","props":{"text":"For established teams"}},{"nodeType":"shadcn.button","preset":"button-block","props":{"text":"Contact sales"}}]}]}]}}],"summary":"Added three pricing tiers."}

REGISTRY (id | title | children? | props):
${registry.map(formatRegistryEntry).join("\n")}

CURRENT PAGE (id, type, text):
${outlineTree(context.currentPageTree, context.selectedNodeId).join("\n")}
${components ? `\nREUSABLE COMPONENTS in this project (reference only):\n${components}\n` : ""}
SELECTED NODE: ${selectedInfo}
`;
}
