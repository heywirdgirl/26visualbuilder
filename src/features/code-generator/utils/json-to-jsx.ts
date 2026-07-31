// src/features/code-generator/utils/json-to-jsx.ts


import { TreeNode } from "@/core/types/builder.types";
import { PropMeta } from "@/core/types/node-definition.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { getRendererEntry } from "@/features/canvas-preview/constants/renderer-map";
import { styleToClasses } from "@/core/utils/style-to-classes";
import { escapeJsxText, escapeAttr } from "@/core/utils/escape-jsx-text";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";

export interface ComponentFileInfo {
  pascalName: string;
  importPath: string;
}
export type ComponentFileMap = Record<string, ComponentFileInfo>;

const META_ONLY_KEYS = new Set(["text", "name", "slug"]);

function indent(level: number) {
  return "  ".repeat(level);
}

function genericAttrs(propsSchema: PropMeta[], nodeProps: Record<string, unknown>): string {
  return propsSchema
    .filter((meta) => !META_ONLY_KEYS.has(meta.key))
    .map((meta) => {
      const value = nodeProps[meta.key];
      const attrName = meta.key === "checked" ? "defaultChecked" : meta.key;
      if (meta.inputType === "checkbox") return ` ${attrName}={${!!value}}`;
      if (meta.inputType === "number") return ` ${attrName}={${Number(value ?? 0)}}`;
      return ` ${attrName}="${escapeAttr(value)}"`;
    })
    .join("");
}

export function nodeToJsx(node: TreeNode, level: number, componentFileMap: ComponentFileMap): string {
  const pad = indent(level);

  if (node.type === SYSTEM_NODE_IDS.componentInstance) {
    const info = node.referenceId ? componentFileMap[node.referenceId] : undefined;
    if (!info) return `${pad}{/* Component Instance lỗi tham chiếu: ${node.referenceId ?? "?"} */}`;
    return `${pad}<${info.pascalName} />`;
  }

  const def = getNodeDefinition(node.type);
  const entry = getRendererEntry(node.type);

  if (!def || !entry) {
    return `${pad}{/* Node type không tồn tại trong registry: ${node.type} */}`;
  }

  // Trước Phase 2: leaf node (Button/Input/text) KHÔNG có className trong code xuất ra
  // vì chỉ container mới đọc layout. Giờ mọi node đều gọi styleToClasses — Button có
  // margin/màu riêng từ Inspector sẽ xuất đúng ra code, không còn thiếu như trước.
  const className = styleToClasses(node.style);
  const classAttr = className ? ` className="${escapeAttr(className)}"` : "";

  if (def.canHaveChildren) {
    const childrenJsx = node.children.map((c) => nodeToJsx(c, level + 1, componentFileMap)).join("\n");
    if (entry.toJsx) return entry.toJsx(node, childrenJsx, className, pad);

    const attrs = genericAttrs(def.propsSchema, node.props);
    if (node.children.length === 0) {
      return `${pad}<${entry.jsxTagName}${classAttr}${attrs} />`;
    }
    return `${pad}<${entry.jsxTagName}${classAttr}${attrs}>\n${childrenJsx}\n${pad}</${entry.jsxTagName}>`;
  }

  if (entry.toJsx) return entry.toJsx(node, "", className, pad);

  const attrs = genericAttrs(def.propsSchema, node.props);
  const hasTextProp = def.propsSchema.some((m) => m.key === "text");

  if (hasTextProp) {
    return `${pad}<${entry.jsxTagName}${classAttr}${attrs}>${escapeJsxText(node.props.text)}</${entry.jsxTagName}>`;
  }
  return `${pad}<${entry.jsxTagName}${classAttr}${attrs} />`;
}

export function collectImports(
  node: TreeNode,
  componentFileMap: ComponentFileMap,
  imports: Set<string> = new Set()
): Set<string> {
  if (node.type === SYSTEM_NODE_IDS.componentInstance) {
    const info = node.referenceId ? componentFileMap[node.referenceId] : undefined;
    if (info) imports.add(`import ${info.pascalName} from "${info.importPath}";`);
    return imports;
  }

  const entry = getRendererEntry(node.type);
  if (entry?.importStatement) imports.add(entry.importStatement);

  if (node.type === "html.icon") {
    const name = (node.props as { name?: string }).name;
    if (name && /^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
      imports.add(`import { ${name} } from "lucide-react";`);
    }
  }

  node.children.forEach((c) => collectImports(c, componentFileMap, imports));
  return imports;
}