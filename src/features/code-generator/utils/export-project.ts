// features/code-generator/utils/export-project.ts


import { TreeNode } from "@/core/types/builder.types";
import { GeneratedFile } from "@/core/types/generated-file.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { APP_FOLDER_ID, COMPONENTS_FOLDER_ID } from "@/core/store/builder-store";
import { nodeToJsx, collectImports, ComponentFileMap } from "./json-to-jsx";
import { slugifyPathSegment, toPascalCase } from "./path-utils";

interface PageEntry { node: TreeNode; folderPath: string[] }
interface ComponentEntry { node: TreeNode; folderPath: string[] }

// Duyệt đệ quy 1 Folder — thu thập mọi Page/Component tìm được, kèm đường dẫn folder
// thật tính từ chỗ bắt đầu quét xuống tới nó (hỗ trợ Folder lồng nhiều cấp, theo Node Rules).
function collectPagesAndComponents(
  folderNode: TreeNode,
  currentPath: string[],
  pages: PageEntry[],
  components: ComponentEntry[]
) {
  for (const child of folderNode.children) {
    const def = getNodeDefinition(child.type);
    if (!def) continue;

    if (def.nodeKind === "folder") {
      const segment = slugifyPathSegment(String((child.props as { name?: string }).name ?? "folder"));
      collectPagesAndComponents(child, [...currentPath, segment], pages, components);
    } else if (def.nodeKind === "page") {
      pages.push({ node: child, folderPath: currentPath });
    } else if (def.nodeKind === "component") {
      components.push({ node: child, folderPath: currentPath });
    }
    // html/shadcn/component-instance không hợp lệ làm con trực tiếp Folder (Node Rules đã
    // chặn từ Add Node) — bỏ qua an toàn nếu có dữ liệu lạ.
  }
}

function buildPageFilePath(folderPath: string[], slug: string): string {
  const segments = [...folderPath, ...(slug ? [slugifyPathSegment(slug)] : [])];
  return segments.length > 0 ? `app/${segments.join("/")}/page.tsx` : "app/page.tsx";
}

function buildComponentFilePath(folderPath: string[], pascalName: string): string {
  return `components/${[...folderPath, pascalName].join("/")}.tsx`;
}

function buildImportPath(filePath: string): string {
  return "@/" + filePath.replace(/\.tsx$/, "");
}

function renderFileBody(root: TreeNode, componentFileMap: ComponentFileMap, exportName: string): string {
  const imports = collectImports(root, componentFileMap);
  const body = nodeToJsx(root, 1, componentFileMap);
  const importLines = Array.from(imports).join("\n");

  return `${importLines ? importLines + "\n\n" : ""}export default function ${exportName}() {
  return (
${body}
  );
}`;
}

export function exportProject(tree: TreeNode): GeneratedFile[] {
  const appFolder = tree.children.find((c) => c.id === APP_FOLDER_ID);
  const componentsFolder = tree.children.find((c) => c.id === COMPONENTS_FOLDER_ID);

  const pages: PageEntry[] = [];
  const components: ComponentEntry[] = [];
  if (appFolder) collectPagesAndComponents(appFolder, [], pages, components);
  if (componentsFolder) collectPagesAndComponents(componentsFolder, [], pages, components);

  // Bước 1: chốt trước tên PascalCase + đường dẫn cho MỌI Component.
  const componentFileMap: ComponentFileMap = {};
  const usedNames = new Set<string>();
  for (const { node, folderPath } of components) {
    const rawName = String((node.props as { name?: string }).name ?? "Component");
    let pascalName = toPascalCase(rawName);
    let suffix = 2;
    while (usedNames.has(pascalName)) {
      pascalName = `${toPascalCase(rawName)}${suffix}`;
      suffix++;
    }
    usedNames.add(pascalName);

    const filePath = buildComponentFilePath(folderPath, pascalName);
    componentFileMap[node.id] = { pascalName, importPath: buildImportPath(filePath) };
  }

  const files: GeneratedFile[] = [];

  for (const { node, folderPath } of pages) {
    const slug = String((node.props as { slug?: string }).slug ?? "");
    const filePath = buildPageFilePath(folderPath, slug);
    const fnName = toPascalCase(String((node.props as { name?: string }).name ?? "Page")) + "Page";
    files.push({ path: filePath, content: renderFileBody(node, componentFileMap, fnName) });
  }

  for (const { node } of components) {
    const info = componentFileMap[node.id];
    files.push({
      path: info.importPath.replace(/^@\//, "") + ".tsx",
      content: renderFileBody(node, componentFileMap, info.pascalName),
    });
  }

  // Home (app/page.tsx) luôn hiện tab đầu tiên.
  files.sort((a, b) => {
    if (a.path === "app/page.tsx") return -1;
    if (b.path === "app/page.tsx") return 1;
    return a.path.localeCompare(b.path);
  });

  return files;
}