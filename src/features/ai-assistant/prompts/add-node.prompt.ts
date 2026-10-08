import { RegistrySummaryEntry } from "@/core/registry/ai-registry-summary";
import { AiContextPayload } from "../utils/build-ai-context";

function formatRegistryEntry(entry: RegistrySummaryEntry): string {
  const childInfo = entry.canHaveChildren ? "can have children" : "leaf, no children";
  const props = entry.propKeys.length > 0 ? entry.propKeys.join(", ") : "(no props)";
  return `- ${entry.id} | ${entry.title} | ${childInfo} | props: ${props}`;
}

export function buildAddNodeSystemPrompt(
  registry: RegistrySummaryEntry[],
  context: AiContextPayload
): string {
  return `You are the Node Assistant of 26VisualBuilder, a tree-based visual UI builder.

Your job: given a user request (may be in Vietnamese or English), propose ONE or MORE new nodes to ADD into the user's current Page.

STRICT RULES:
1. You may ONLY use "nodeType" values from the REGISTRY list below. Never invent a new nodeType.
2. A leaf node ("leaf, no children") must never get a "children" array.
3. "parentId" MUST be the id of a node that already exists in CURRENT PAGE TREE below — never invent an id.
4. Only use prop keys listed for that nodeType in the registry. Do not add unknown prop keys.
5. action is always "add". You are not allowed to modify or delete existing nodes.
6. Prefer the simplest structure that satisfies the request.
7. "summary" should briefly explain (in the user's language) what you added.

REGISTRY (id | title | children? | props):
${registry.map(formatRegistryEntry).join("\n")}

CURRENT PAGE TREE (JSON):
${JSON.stringify(context.currentPageTree)}
${context.referencedComponents.length > 0
  ? `\nREUSABLE COMPONENTS already defined in this project (for style/content reference only):\n${JSON.stringify(context.referencedComponents)}\n`
  : ""}
SELECTED NODE ID (where the user is currently focused): ${context.selectedNodeId ?? "(none selected)"}
`;
}
