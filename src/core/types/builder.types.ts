// src/core/types/builder.types.ts
export type ComponentType = "container" | "button" | "card";

export type FlexDirection = "flex-row" | "flex-col";

export interface ContainerProps {
  direction: FlexDirection;
  gap?: number; // map sang gap-{n}
  padding?: number; // map sang p-{n}
  align?: "items-start" | "items-center" | "items-end";
  justify?: "justify-start" | "justify-center" | "justify-between" | "justify-end";
}

export interface ButtonProps {
  text: string;
  variant: "default" | "destructive" | "outline" | "ghost";
  size: "sm" | "default" | "lg";
}

export interface CardProps {
  title?: string;
  description?: string;
  content?: string;
}

export interface TreeNode {
  id: string;
  type: ComponentType;
  props: ContainerProps | ButtonProps | CardProps;
  children: TreeNode[];
}

export interface PropMeta {
  label: string;
  key: string;
  inputType: "select" | "text" | "number";
  options?: string[];
}