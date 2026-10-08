import { TreeNode } from "@/core/types/builder.types";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { findNode } from "@/core/store/builder-store";

export interface AiContextPayload {
  currentPageTree: TreeNode;
  selectedNodeId: string | null;
  referencedComponents: TreeNode[];
}

function collectReferencedComponents(
  pageTree: TreeNode,
  fullTree: TreeNode,
  acc: TreeNode[] = [],
  seen = new Set<string>()
): TreeNode[] {
  function walk(node: TreeNode): void {
    if (
      node.type === SYSTEM_NODE_IDS.componentInstance &&
      node.referenceId &&
      !seen.has(node.referenceId)
    ) {
      const componentNode = findNode(fullTree, node.referenceId);
      if (componentNode) {
        seen.add(node.referenceId);
        acc.push(componentNode);
        walk(componentNode);
      }
    }
    node.children.forEach(walk);
  }

  walk(pageTree);
  return acc;
}

export function buildAiContext(
  fullTree: TreeNode,
  currentPageTree: TreeNode,
  selectedNodeId: string | null
): AiContextPayload {
  return {
    currentPageTree,
    selectedNodeId,
    referencedComponents: collectReferencedComponents(currentPageTree, fullTree),
  };
}
