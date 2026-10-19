import type { DefaultChildSpec } from "./node-definition.types";

export interface BlockDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  spec: DefaultChildSpec;
}
