// core/registry/system-nodes.ts

import { NodeDefinition } from "@/core/types/node-definition.types";

export const SYSTEM_NODE_IDS = {
  folder: "system.folder",
  page: "system.page",
  component: "system.component",
  componentInstance: "system.component-instance",
} as const;

const pageComponentDefaultStyle = { direction: "flex-col" as const, gap: 4, padding: 4 };

export const systemNodes: NodeDefinition[] = [
  {
    id: SYSTEM_NODE_IDS.folder,
    title: "Folder",
    category: "System",
    nodeKind: "folder",
    version: 1,
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
    version: 1,
    tags: ["page", "route", "system"],
    canHaveChildren: true,
    defaultProps: { name: "New Page", slug: "" },
    defaultStyle: pageComponentDefaultStyle,
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
    version: 1,
    tags: ["component", "reusable", "system"],
    canHaveChildren: true,
    defaultProps: { name: "New Component" },
    defaultStyle: pageComponentDefaultStyle,
    propsSchema: [{ key: "name", label: "Tên component", inputType: "text" }],
  },
  {
    id: SYSTEM_NODE_IDS.componentInstance,
    title: "Component Instance",
    category: "System",
    nodeKind: "component-instance",
    version: 1,
    tags: ["component", "instance", "system"],
    canHaveChildren: false,
    defaultProps: {},
    propsSchema: [],
  },
];