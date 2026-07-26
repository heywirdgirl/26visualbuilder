// core/registry/system-nodes.ts

import { NodeDefinition } from "@/core/types/node-definition.types";

// 4 definition ID cố định — Store (Phase 2) và Add Node Palette (Phase 5) dùng hằng số này,
// không gõ tay string "system.page" rải rác nhiều nơi.
export const SYSTEM_NODE_IDS = {
  folder: "system.folder",
  page: "system.page",
  component: "system.component",
  componentInstance: "system.component-instance",
} as const;

export const systemNodes: NodeDefinition[] = [
  {
    id: SYSTEM_NODE_IDS.folder,
    title: "Folder",
    category: "System",
    nodeKind: "folder",
    tags: ["folder", "system", "organize"],
    canHaveChildren: true,
    defaultProps: { name: "New Folder" },
    propsSchema: [{ key: "name", label: "Tên folder", inputType: "text" }],
  },
  {
    id: SYSTEM_NODE_IDS.page,
    title: "Page",
    category: "System",
    nodeKind: "page",
    tags: ["page", "route", "system"],
    canHaveChildren: true,
    defaultProps: { name: "New Page", slug: "", direction: "flex-col", gap: 4, padding: 4 },
    propsSchema: [
      { key: "name", label: "Tên trang", inputType: "text" },
      { key: "slug", label: "Đường dẫn (slug)", inputType: "text" },
    ],
  },
  {
    id: SYSTEM_NODE_IDS.component,
    title: "Component",
    category: "System",
    nodeKind: "component",
    tags: ["component", "reusable", "system"],
    canHaveChildren: true,
    defaultProps: { name: "New Component", direction: "flex-col", gap: 4, padding: 4 },
    propsSchema: [{ key: "name", label: "Tên component", inputType: "text" }],
  },
  {
    id: SYSTEM_NODE_IDS.componentInstance,
    title: "Component Instance",
    category: "System",
    nodeKind: "component-instance",
    tags: ["component", "instance", "system"],
    canHaveChildren: false,
    defaultProps: {}, // referenceId nằm trên TreeNode (data cây thật), không phải defaultProps ở đây
    propsSchema: [],
  },
];