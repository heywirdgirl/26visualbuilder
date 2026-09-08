// core/store/builder-store.ts

import { create } from "zustand";
import { TreeNode } from "@/core/types/builder.types";
import { StyleProps, Breakpoint } from "@/core/types/style.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { useMemo } from "react";
import type { User } from "@supabase/supabase-js";
// ID cố định cho 2 folder gốc + trang Home mặc định — Phase 3/4/5 dùng lại để
// biết "đây là cấu trúc hệ thống, không cho xoá", không tính lại bằng string rời rạc.
export const APP_FOLDER_ID = "app-folder";
export const COMPONENTS_FOLDER_ID = "components-folder";
export const HOME_PAGE_ID = "home-page";
const PROTECTED_IDS = new Set(["root", APP_FOLDER_ID, COMPONENTS_FOLDER_ID]);

export interface RecentProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  updated_at: string;
}


interface BuilderState {
  tree: TreeNode;
  activeNodeId: string | null;
  activePageId: string | null;
  menuHidden: boolean;
  editMode: boolean;
  highlightReferenceId: string | null;
  previewContainerEl: HTMLElement | null;
  setPreviewContainerEl: (el: HTMLElement | null) => void;
  activeBreakpoint: Breakpoint;
  user: User | null;
  authLoading: boolean;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  loadProjectTree: (tree: TreeNode, projectId: string) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setActiveBreakpoint: (bp: Breakpoint) => void;
  clearNodeStyleOverride: (id: string, breakpoint: Breakpoint, key: keyof StyleProps) => void;

  setActiveNode: (id: string | null) => void;
  setActivePage: (id: string) => void;

  addNode: (parentId: string, defId: string) => void;
  addFolder: (parentId: string, name: string) => void;
  addPage: (parentId: string, name: string, slug: string) => void;
  addComponent: (parentId: string, name: string) => void;
  addComponentInstance: (parentId: string, componentNodeId: string) => void;

  removeNode: (id: string) => void;
  updateNodeProps: (id: string, props: Partial<TreeNode["props"]>) => void;
  updateNodeStyle: (id: string, breakpoint: Breakpoint, patch: Partial<StyleProps>) => void;
  moveNode: (id: string, direction: "up" | "down") => void;
  indentNode: (id: string) => void;
  outdentNode: (id: string) => void;

  toggleMenuHidden: () => void;
  toggleEditMode: () => void;
  setHighlightReferenceId: (id: string | null) => void;
  convertToComponent: (nodeId: string, name: string) => void;

  draftPostTree: TreeNode | null;
  draftPostThumbnail: string | null;
  draftPostPageNames: string[];
  recentProjects: RecentProject[];
  projectCount: number;
  projectsLoaded: boolean;
  projectSidebarOpen: boolean;
  highlightedProjectId: string | null;
  isLoadingProjects: boolean;
  projectsError: string | null;
  setDraftPost: (payload: { tree: TreeNode; thumbnail: string; pageNames: string[] }) => void;
  clearDraftPost: () => void;
  setRecentProjects: (projects: RecentProject[], count: number) => void;
  setProjectSidebarOpen: (open: boolean) => void;
  setHighlightedProjectId: (id: string | null) => void;
  setProjectsLoading: (loading: boolean) => void;
  setProjectsError: (error: string | null) => void;
  resetProjectCache: () => void;
}

export function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findParent(node: TreeNode, childId: string): TreeNode | null {
  for (const child of node.children) {
    if (child.id === childId) return node;
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}

// Đường đi root -> ... -> target (bao gồm target). Vì Component không thể lồng cấu trúc
// trong Component khác (xem node-rules.ts), trên đường đi luôn có TỐI ĐA 1 Component.
function getPathToNode(root: TreeNode, targetId: string, path: TreeNode[] = []): TreeNode[] | null {
  const nextPath = [...path, root];
  if (root.id === targetId) return nextPath;
  for (const child of root.children) {
    const found = getPathToNode(child, targetId, nextPath);
    if (found) return found;
  }
  return null;
}

export function findAncestorComponentId(tree: TreeNode, nodeId: string): string | null {
  const path = getPathToNode(tree, nodeId);
  if (!path) return null;
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].type === SYSTEM_NODE_IDS.component) return path[i].id;
  }
  return null;
}

// Duyệt subtree 1 Component, thu thập mọi Component khác nó chạm tới (trực tiếp/gián tiếp
// qua Instance). Dùng để chặn vòng lặp TRƯỚC khi cho phép addComponentInstance.
export function getReachableComponentIds(
  componentId: string,
  tree: TreeNode,
  visited: Set<string> = new Set()
): Set<string> {
  if (visited.has(componentId)) return visited;
  visited.add(componentId);

  const compNode = findNode(tree, componentId);
  if (!compNode) return visited;

  function walk(n: TreeNode) {
    if (n.type === SYSTEM_NODE_IDS.componentInstance && n.referenceId) {
      getReachableComponentIds(n.referenceId, tree, visited);
    }
    n.children.forEach(walk);
  }
  walk(compNode);
  return visited;
}

export function hasInstancesReferencing(tree: TreeNode, componentId: string): boolean {
  if (tree.type === SYSTEM_NODE_IDS.componentInstance && tree.referenceId === componentId) return true;
  return tree.children.some((c) => hasInstancesReferencing(c, componentId));
}

function findFirstPageId(tree: TreeNode): string | null {
  if (tree.type === SYSTEM_NODE_IDS.page) return tree.id;
  for (const child of tree.children) {
    const found = findFirstPageId(child);
    if (found) return found;
  }
  return null;
}


export function createDefaultProjectTree(): TreeNode {
  return {
    id: "root",
    type: SYSTEM_NODE_IDS.folder,
    props: { name: "Project" },
    style: { base: {} },
    children: [
      {
        id: APP_FOLDER_ID,
        type: SYSTEM_NODE_IDS.folder,
        props: { name: "App" },
        style: { base: {} },
        children: [
          {
            id: HOME_PAGE_ID,
            type: SYSTEM_NODE_IDS.page,
            props: { name: "Home", slug: "" },
            style: { base: { direction: "flex-col", gap: 4, padding: 4 } },
            children: [],
          },
        ],
      },
      {
        id: COMPONENTS_FOLDER_ID,
        type: SYSTEM_NODE_IDS.folder,
        props: { name: "Components" },
        style: { base: {} },
        children: [],
      },
    ],
  };
}

export const useBuilderStore = create<BuilderState>((set) => ({
  // 1. Default tree init — Project/App/Components/Home
tree: createDefaultProjectTree(),
  activeNodeId: null,
  activePageId: HOME_PAGE_ID,
  menuHidden: false,
  editMode: false,
  activeBreakpoint: "base",
  highlightReferenceId: null,
  previewContainerEl: null,
  user: null,
  authLoading: true,
  currentProjectId: null,
  draftPostTree: null,
  draftPostThumbnail: null,
  draftPostPageNames: [],
  recentProjects: [],
  projectCount: 0,
  projectsLoaded: false,
  projectSidebarOpen: false,
  highlightedProjectId: null,
  isLoadingProjects: false,
  projectsError: null,

  setActiveNode: (id) => set({ activeNodeId: id }),
  setActivePage: (id) => set({ activePageId: id }),

  addNode: (parentId, defId) =>
    set((state) => {
      const def = getNodeDefinition(defId);
      if (!def) return {};

      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      if (!parent) return {};

      const parentDef = getNodeDefinition(parent.type);
      if (!parentDef || !canContain(parentDef, def.nodeKind)) return {};

      parent.children.push({
        id: crypto.randomUUID(),
        type: defId,
        props: structuredClone(def.defaultProps),
        style: { base: structuredClone(def.defaultStyle ?? {}) },
        children: [],
      });
      return { tree: newTree };
    }),

  addFolder: (parentId, name) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      if (!parent) return {};
      const parentDef = getNodeDefinition(parent.type);
      if (!parentDef || !canContain(parentDef, "folder")) return {};

      parent.children.push({
        id: crypto.randomUUID(),
        type: SYSTEM_NODE_IDS.folder,
        props: { name },
        style: { base: {} },
        children: [],
      });
      return { tree: newTree };
    }),

  addPage: (parentId, name, slug) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      if (!parent) return {};
      const parentDef = getNodeDefinition(parent.type);
      if (!parentDef || !canContain(parentDef, "page")) return {};

      const pageDef = getNodeDefinition(SYSTEM_NODE_IDS.page); // 👈 dòng còn thiếu

      const newId = crypto.randomUUID();
      parent.children.push({
        id: newId,
        type: SYSTEM_NODE_IDS.page,
        props: { name, slug }, // 👈 bỏ direction/gap/padding thừa
        style: { base: structuredClone(pageDef?.defaultStyle ?? {}) },
        children: [],
      });
      return { tree: newTree, activePageId: newId };
    }),

  addComponent: (parentId, name) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      if (!parent) return {};
      const parentDef = getNodeDefinition(parent.type);
      if (!parentDef || !canContain(parentDef, "component")) return {};

      const componentDef = getNodeDefinition(SYSTEM_NODE_IDS.component); // 👈 dòng còn thiếu

      parent.children.push({
        id: crypto.randomUUID(),
        type: SYSTEM_NODE_IDS.component,
        props: { name }, // 👈 bỏ direction/gap/padding thừa
        style: { base: structuredClone(componentDef?.defaultStyle ?? {}) },
        children: [],
      });
      return { tree: newTree };
    }),

  addComponentInstance: (parentId, componentNodeId) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      const componentNode = findNode(newTree, componentNodeId);
      if (!parent || !componentNode || componentNode.type !== SYSTEM_NODE_IDS.component) return {};

      const parentDef = getNodeDefinition(parent.type);
      if (!parentDef || !canContain(parentDef, "component-instance")) return {};

      // Chặn vòng lặp: nếu parent đang nằm trong Component X, và Component sắp được
      // instance có thể (trực tiếp/gián tiếp) chạm lại X → không cho phép.
      const ancestorComponentId = findAncestorComponentId(newTree, parentId);
      if (ancestorComponentId) {
        const reachable = getReachableComponentIds(componentNodeId, newTree);
        if (reachable.has(ancestorComponentId)) return {};
      }

      parent.children.push({
        id: crypto.randomUUID(),
        type: SYSTEM_NODE_IDS.componentInstance,
        props: {},
        style: { base: {} },
        children: [],
        referenceId: componentNodeId,
      });
      return { tree: newTree };
    }),


  convertToComponent: (nodeId, name) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findParent(newTree, nodeId);
      const target = findNode(newTree, nodeId);
      if (!parent || !target) return {};

      const targetDef = getNodeDefinition(target.type);
      if (!targetDef || (targetDef.nodeKind !== "html" && targetDef.nodeKind !== "shadcn")) return {};

      const componentsFolder = findNode(newTree, COMPONENTS_FOLDER_ID);
      if (!componentsFolder) return {};

      function cloneWithNewIds(n: TreeNode): TreeNode {
        return { ...structuredClone(n), id: crypto.randomUUID(), children: n.children.map(cloneWithNewIds) };
      }
      const clonedContent = cloneWithNewIds(target);

      const newComponentId = crypto.randomUUID();
      const componentDef = getNodeDefinition(SYSTEM_NODE_IDS.component); // 👈 dòng còn thiếu

      componentsFolder.children.push({
        id: newComponentId,
        type: SYSTEM_NODE_IDS.component,
        props: { name }, // 👈 bỏ direction/gap/padding thừa
        style: { base: structuredClone(componentDef?.defaultStyle ?? {}) },
        children: [clonedContent],
      });

      const index = parent.children.findIndex((c) => c.id === nodeId);
      if (index === -1) return {};
      parent.children[index] = {
        id: nodeId,
        type: SYSTEM_NODE_IDS.componentInstance,
        props: {},
        style: { base: {} },
        children: [],
        referenceId: newComponentId,
      };

      return { tree: newTree };
    }),
  

  removeNode: (id) =>
    set((state) => {
      if (PROTECTED_IDS.has(id)) return {}; // không cho xoá root/App/Components folder

      const newTree = structuredClone(state.tree);
      const target = findNode(newTree, id);
      if (!target) return {};

      if (target.type === SYSTEM_NODE_IDS.component && hasInstancesReferencing(newTree, id)) {
        return {}; // Component đang được dùng nơi khác — chặn để tránh Instance mồ côi
      }

      const parent = findParent(newTree, id);
      if (!parent) return {};
      parent.children = parent.children.filter((c) => c.id !== id);

      const nextActivePageId =
        id === state.activePageId ? findFirstPageId(newTree) : state.activePageId;

      return { tree: newTree, activeNodeId: null, activePageId: nextActivePageId };
    }),

  updateNodeProps: (id, props) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const node = findNode(newTree, id);
      if (!node) return {};
      node.props = { ...node.props, ...props };
      return { tree: newTree };
    }),

  updateNodeStyle: (id, breakpoint, patch) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const node = findNode(newTree, id);
      if (!node) return {};
      if (breakpoint === "base") {
        node.style.base = { ...node.style.base, ...patch };
      } else {
        node.style[breakpoint] = { ...(node.style[breakpoint] ?? {}), ...patch };
      }
      return { tree: newTree };
    }),
  
  setActiveBreakpoint: (bp) => set({ activeBreakpoint: bp }),

  clearNodeStyleOverride: (id, breakpoint, key) =>
    set((state) => {
      if (breakpoint === "base") return {}; // base luôn có giá trị — không có gì để "reset về kế thừa"
      const newTree = structuredClone(state.tree);
      const node = findNode(newTree, id);
      if (!node || !node.style[breakpoint]) return {};
      delete node.style[breakpoint]![key];
      return { tree: newTree };
    }),
  
  moveNode: (id, direction) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findParent(newTree, id);
      if (!parent) return {};
      const index = parent.children.findIndex((c) => c.id === id);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= parent.children.length) return {};
      [parent.children[index], parent.children[swapWith]] = [
        parent.children[swapWith],
        parent.children[index],
      ];
      return { tree: newTree };
    }),

  indentNode: (id) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findParent(newTree, id);
      if (!parent) return {};

      const index = parent.children.findIndex((c) => c.id === id);
      if (index <= 0) return {};

      const movingNode = parent.children[index];
      const prevSibling = parent.children[index - 1];
      const movingDef = getNodeDefinition(movingNode.type);
      const prevDef = getNodeDefinition(prevSibling.type);
      if (!movingDef || !prevDef || !canContain(prevDef, movingDef.nodeKind)) return {};

      const [node] = parent.children.splice(index, 1);
      prevSibling.children.push(node);
      return { tree: newTree };
    }),

  outdentNode: (id) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findParent(newTree, id);
      if (!parent) return {};

      const grandparent = findParent(newTree, parent.id);
      if (!grandparent) return {};

      const movingNode = parent.children.find((c) => c.id === id);
      const grandparentDef = getNodeDefinition(grandparent.type);
      const movingDef = movingNode ? getNodeDefinition(movingNode.type) : undefined;
      if (!movingNode || !movingDef || !grandparentDef || !canContain(grandparentDef, movingDef.nodeKind))
        return {};

      const parentIndex = grandparent.children.findIndex((c) => c.id === parent.id);
      const nodeIndex = parent.children.findIndex((c) => c.id === id);
      if (nodeIndex === -1) return {};

      const [node] = parent.children.splice(nodeIndex, 1);
      grandparent.children.splice(parentIndex + 1, 0, node);
      return { tree: newTree };
    }),

  toggleMenuHidden: () => set((state) => ({ menuHidden: !state.menuHidden })),
  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
  setHighlightReferenceId: (id) => set({ highlightReferenceId: id }),
  setPreviewContainerEl: (el) => set({ previewContainerEl: el }),
setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),  setDraftPost: ({ tree, thumbnail, pageNames }) =>
    set({ draftPostTree: tree, draftPostThumbnail: thumbnail, draftPostPageNames: pageNames }),
  clearDraftPost: () => set({ draftPostTree: null, draftPostThumbnail: null, draftPostPageNames: [] }),  loadProjectTree: (tree, projectId) =>
    set({
      tree,
      currentProjectId: projectId,
      activeNodeId: null,
      activePageId: findFirstPageId(tree), // tự tìm Page đầu tiên trong cây vừa nạp — hàm này đã có sẵn từ V1.9
      editMode: false,
    }),
  setRecentProjects: (recentProjects, count) =>
    set({ recentProjects, projectCount: count, projectsLoaded: true }),
  setProjectSidebarOpen: (projectSidebarOpen) => set({ projectSidebarOpen }),
  setHighlightedProjectId: (highlightedProjectId) => set({ highlightedProjectId }),
  setProjectsLoading: (isLoadingProjects) => set({ isLoadingProjects }),
  setProjectsError: (projectsError) => set({ projectsError }),
  resetProjectCache: () =>
    set({
      recentProjects: [],
      projectCount: 0,
      projectsLoaded: false,
      isLoadingProjects: false,
      projectsError: null,
    }),

  
}));
  
export function useActiveNode() {
  return useBuilderStore((s) => (s.activeNodeId ? findNode(s.tree, s.activeNodeId) : null));
}

export function useActivePage() {
  return useBuilderStore((s) => (s.activePageId ? findNode(s.tree, s.activePageId) : null));
}

function collectComponents(node: TreeNode, acc: { id: string; name: string }[] = []) {
  if (node.type === SYSTEM_NODE_IDS.component) {
    acc.push({ id: node.id, name: String((node.props as { name?: string }).name ?? "Component") });
  }
  node.children.forEach((c) => collectComponents(c, acc));
  return acc;
}

// Dùng cho Add Node Palette — liệt kê mọi Component đã tạo để chọn thêm Instance.

export function useComponentList(): { id: string; name: string }[] {
  const tree = useBuilderStore((s) => s.tree);
  return useMemo(() => collectComponents(tree), [tree]);
}

function collectPageNames(node: TreeNode, acc: string[] = []): string[] {
  if (node.type === SYSTEM_NODE_IDS.page) {
    acc.push(String((node.props as { name?: string }).name ?? "Page"));
  }
  node.children.forEach((c) => collectPageNames(c, acc));
  return acc;
}

export function getPageNamesInOrder(tree: TreeNode): string[] {
  return collectPageNames(tree);
}

// Component đang chứa parentId (nếu có) — dùng để ẩn/chặn tự-instance-vào-chính-mình
// ngay ở UI, trước khi Store phải tự chặn vòng lặp ở tầng data.
export function useAncestorComponentId(nodeId: string | null): string | null {
  return useBuilderStore((s) => (nodeId ? findAncestorComponentId(s.tree, nodeId) : null));
}