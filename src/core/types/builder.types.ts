// src/core/types/builder.types.ts

export type FlexDirection = "flex-row" | "flex-col";

// Property layout chung — áp dụng cho MỌI node có canHaveChildren: true
export interface LayoutProps {
  direction?: FlexDirection;
  gap?: number;
  padding?: number;
  align?: "items-start" | "items-center" | "items-end";
  justify?: "justify-start" | "justify-center" | "justify-between" | "justify-end";
}

export interface TreeNode {
  id: string;
  type: string; // Node Definition id trong Registry, VD "html.div", "shadcn.button"
  props: Record<string, unknown>;
  children: TreeNode[];
}

