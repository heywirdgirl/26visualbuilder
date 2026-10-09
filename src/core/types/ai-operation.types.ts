export interface AiNode {
  nodeType: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: AiNode[];
}

export interface AiOperation {
  action: "add";
  parentId: string;
  node: AiNode;
}
