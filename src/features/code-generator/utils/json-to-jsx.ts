// src/features/code-generator/utils/json-to-jsx.ts

import { TreeNode, ContainerProps, ButtonProps, CardProps } from "@/core/types/builder.types";
import { containerToClasses } from "@/features/inspector/utils/tailwind-mapper";

function indent(level: number) {
  return "  ".repeat(level);
}

function nodeToJsx(node: TreeNode, level: number): string {
  const pad = indent(level);

  switch (node.type) {
    case "container": {
      const props = node.props as ContainerProps;
      const className = containerToClasses(props);
      const childrenJsx = node.children.map((c) => nodeToJsx(c, level + 1)).join("\n");

      if (node.children.length === 0) {
        return `${pad}<div className="${className}" />`;
      }
      return `${pad}<div className="${className}">\n${childrenJsx}\n${pad}</div>`;
    }

    case "button": {
      const props = node.props as ButtonProps;
      const variantAttr = props.variant !== "default" ? ` variant="${props.variant}"` : "";
      const sizeAttr = props.size !== "default" ? ` size="${props.size}"` : "";
      return `${pad}<Button${variantAttr}${sizeAttr}>${props.text}</Button>`;
    }

    case "card": {
      const props = node.props as CardProps;
      const lines = [
        `${pad}<Card>`,
        `${pad}  <CardHeader>`,
        `${pad}    <CardTitle>${props.title}</CardTitle>`,
      ];
      if (props.description) {
        lines.push(`${pad}    <CardDescription>${props.description}</CardDescription>`);
      }
      lines.push(`${pad}  </CardHeader>`);
      if (props.content) {
        lines.push(`${pad}  <CardContent>${props.content}</CardContent>`);
      }
      lines.push(`${pad}</Card>`);
      return lines.join("\n");
    }

    default:
      return "";
  }
}

function collectImports(node: TreeNode, imports: Set<string>) {
  if (node.type === "button") {
    imports.add(`import { Button } from "@/components/ui/button";`);
  }
  if (node.type === "card") {
    imports.add(
      `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";`
    );
  }
  node.children.forEach((c) => collectImports(c, imports));
}

export function treeToJsx(root: TreeNode): string {
  const imports = new Set<string>();
  collectImports(root, imports);

  const body = nodeToJsx(root, 1);
  const importLines = Array.from(imports).join("\n");

  return `${importLines ? importLines + "\n\n" : ""}export default function GeneratedComponent() {
  return (
${body}
  );
}`;
}