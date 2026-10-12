import { TreeNode } from "@/core/types/builder.types";

function nodeLabel(node: TreeNode): string {
  const props = node.props as Record<string, unknown>;
  const text = props.text ?? props.name ?? props.label ?? props.title ?? props.placeholder ?? props.alt;
  return typeof text === "string" && text ? ` "${text.slice(0, 40)}"` : "";
}

export function outlineTree(node: TreeNode, selectedId: string | null, depth = 0, lines: string[] = []): string[] {
  const mark = node.id === selectedId ? "   <-- SELECTED" : "";
  const reference = node.referenceId ? ` -> component ${node.referenceId}` : "";
  lines.push(`${"  ".repeat(depth)}- [${node.id}] ${node.type}${nodeLabel(node)}${reference}${mark}`);
  node.children.forEach((child) => outlineTree(child, selectedId, depth + 1, lines));
  return lines;
}

export function findInTree(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findInTree(child, id);
    if (found) return found;
  }
  return null;
}