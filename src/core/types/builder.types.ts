// src/core/types/builder.types.ts

import { NodeStyle } from "./style.types";

export interface TreeNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style: NodeStyle; // 👈 mới — thay hoàn toàn cho direction/gap/padding từng nằm lẫn trong props
  children: TreeNode[];
  referenceId?: string;
}
