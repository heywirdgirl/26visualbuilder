// src/features/code-generator/utils/json-to-jsx.ts


  import { TreeNode } from "@/core/types/builder.types";
import { PropMeta } from "@/core/types/node-definition.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { getRendererEntry } from "@/features/canvas-preview/constants/renderer-map";
import { containerToClasses } from "@/features/inspector/utils/tailwind-mapper";
import { escapeJsxText, escapeAttr } from "@/core/utils/escape-jsx-text";

function indent(level: number) {
  return "  ".repeat(level);
}

// Sinh JSX attrs generic từ propsSchema — chỉ dùng khi RendererEntry KHÔNG có toJsx riêng.
function genericAttrs(propsSchema: PropMeta[], nodeProps: Record<string, unknown>): string {
  return propsSchema
    .filter((meta) => meta.key !== "text") // "text" luôn xử lý như children, không phải attr
    .map((meta) => {
      const value = nodeProps[meta.key];
      const attrName = meta.key === "checked" ? "defaultChecked" : meta.key;
      if (meta.inputType === "checkbox") return ` ${attrName}={${!!value}}`;
      if (meta.inputType === "number") return ` ${attrName}={${Number(value ?? 0)}}`;
      return ` ${attrName}="${escapeAttr(value)}"`;
    })
    .join("");
}

function nodeToJsx(node: TreeNode, level: number): string {
  const pad = indent(level);
  const def = getNodeDefinition(node.type);
  const entry = getRendererEntry(node.type);

  if (!def || !entry) {
    return `${pad}{/* Node type không tồn tại trong registry: ${node.type} */}`;
  }

  const hasLayout = "direction" in node.props;
  const className = hasLayout ? containerToClasses(node.props as any) : "";
  const classAttr = className ? ` className="${escapeAttr(className)}"` : "";

  if (def.canHaveChildren) {
    const childrenJsx = node.children.map((c) => nodeToJsx(c, level + 1)).join("\n");

    if (entry.toJsx) return entry.toJsx(node, childrenJsx, className, pad);

    const attrs = genericAttrs(def.propsSchema, node.props);
    if (node.children.length === 0) {
      return `${pad}<${entry.jsxTagName}${classAttr}${attrs} />`;
    }
    return `${pad}<${entry.jsxTagName}${classAttr}${attrs}>\n${childrenJsx}\n${pad}</${entry.jsxTagName}>`;
  }

  // Leaf node (canHaveChildren: false)
  if (entry.toJsx) return entry.toJsx(node, "", className, pad);

  const attrs = genericAttrs(def.propsSchema, node.props);
  const hasTextProp = def.propsSchema.some((m) => m.key === "text");

  if (hasTextProp) {
    return `${pad}<${entry.jsxTagName}${classAttr}${attrs}>${escapeJsxText(node.props.text)}</${entry.jsxTagName}>`;
  }
  return `${pad}<${entry.jsxTagName}${classAttr}${attrs} />`;
}

function collectImports(node: TreeNode, imports: Set<string>) {
  const entry = getRendererEntry(node.type);
  if (entry?.importStatement) imports.add(entry.importStatement);

  // html.icon là trường hợp đặc biệt: tên component import phụ thuộc props.name lúc runtime,
  // không cố định như importStatement thường nên phải tự build ở đây.
  if (node.type === "html.icon") {
    const name = (node.props as { name?: string }).name;
    if (name && /^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
      imports.add(`import { ${name} } from "lucide-react";`);
    }
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