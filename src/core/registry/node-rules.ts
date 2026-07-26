// core/registry/node-rules.ts

import { NodeDefinition, NodeKind } from "@/core/types/node-definition.types";

// Bảng rule cấp nodeKind — nguồn sự thật DUY NHẤT cho câu hỏi
// "Node A có được chứa Node B không". Thêm nodeKind mới chỉ cần sửa bảng này.
const STRUCTURAL_CHILD_KINDS: Partial<Record<NodeKind, NodeKind[]>> = {
  folder: ["folder", "page", "component"],
  page: ["html", "shadcn", "component-instance"],
  component: ["html", "shadcn", "component-instance"], // đệ quy: Component chứa Instance của Component khác
  "component-instance": [], // children resolve qua referenceId lúc render/export, KHÔNG lưu trong tree
};

export function getAllowedChildKinds(def: NodeDefinition): NodeKind[] {
  const structural = STRUCTURAL_CHILD_KINDS[def.nodeKind];
  if (structural) return structural;

  // html/shadcn: dùng canHaveChildren (Phase A cũ) để quyết định CÓ con hay không;
  // nếu có, con chỉ được là html/shadcn/component-instance — không thể là folder/page/component.
  return def.canHaveChildren ? ["html", "shadcn", "component-instance"] : [];
}

export function canContain(parentDef: NodeDefinition, childNodeKind: NodeKind): boolean {
  return getAllowedChildKinds(parentDef).includes(childNodeKind);
}