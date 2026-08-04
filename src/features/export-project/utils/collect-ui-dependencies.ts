// features/export-project/utils/collect-ui-dependencies.ts


import { TreeNode } from "@/core/types/builder.types";
import { getUiDependencies } from "@/core/registry/ui-dependencies";

// Duyệt TOÀN BỘ Project Tree (App/Pages + Components/mọi Component canonical) — không cần
// resolve Component Instance riêng, vì nội dung thật của mọi Component đã nằm sẵn ngay
// trong CÙNG cây này (đúng kiến trúc "Everything is Node" từ V1.9). Instance chỉ là node
// rỗng trỏ referenceId, children luôn [] nên không quét trùng lặp hay lặp vô hạn.
export function collectRequiredUiSlugs(root: TreeNode): string[] {
  const slugs = new Set<string>();

  function walk(node: TreeNode) {
    getUiDependencies(node.type).forEach((slug) => slugs.add(slug));
    node.children.forEach(walk);
  }
  walk(root);

  return Array.from(slugs);
}
