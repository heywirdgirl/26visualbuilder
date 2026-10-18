import { TreeNode } from "@/core/types/builder.types";

function collectFixes(node: TreeNode, fixes: Map<string, string>) {
  const assign = (list: TreeNode[], prefix: string) =>
    list.forEach((n, i) => {
      const value = `${prefix}-${i + 1}`;
      if ((n.props as { value?: string }).value !== value) fixes.set(n.id, value);
    });

  if (node.type === "shadcn.tabs") {
    const triggers = node.children
      .filter((child) => child.type === "shadcn.tabs-list")
      .flatMap((list) => list.children.filter((trigger) => trigger.type === "shadcn.tabs-trigger"));
    const contents = node.children.filter((child) => child.type === "shadcn.tabs-content");
    assign(triggers, "tab");
    assign(contents, "tab");
  }

  if (node.type === "shadcn.accordion") {
    assign(node.children.filter((child) => child.type === "shadcn.accordion-item"), "item");
  }

  if (node.type === "shadcn.toggle-group") {
    assign(node.children.filter((child) => child.type === "shadcn.toggle-group-item"), "item");
  }

  node.children.forEach((child) => collectFixes(child, fixes));
}

function applyFixes(node: TreeNode, fixes: Map<string, string>) {
  const value = fixes.get(node.id);
  if (value) node.props = { ...node.props, value };
  node.children.forEach((child) => applyFixes(child, fixes));
}

export function normalizeClusterValues(tree: TreeNode): TreeNode | null {
  const fixes = new Map<string, string>();
  collectFixes(tree, fixes);
  if (fixes.size === 0) return null;
  const next = structuredClone(tree);
  applyFixes(next, fixes);
  return next;
}
