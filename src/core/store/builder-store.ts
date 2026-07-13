// src/core/store/builder-store.ts

import { create } from "zustand";
import { TreeNode, ComponentType } from "@/core/types/builder.types";

interface BuilderState {
  tree: TreeNode;
  activeNodeId: string | null;
  menuHidden: boolean;

  setActiveNode: (id: string | null) => void;
  addNode: (parentId: string, type: ComponentType) => void;
  removeNode: (id: string) => void;
  updateNodeProps: (id: string, props: Partial<TreeNode["props"]>) => void;
  moveNode: (id: string, direction: "up" | "down") => void;
  indentNode: (id: string) => void;
  outdentNode: (id: string) => void;
  toggleMenuHidden: () => void;
}

const defaultProps = (type: ComponentType) => {
  switch (type) {
    case "container":
      return { direction: "flex-col", gap: 4, padding: 4 };
    case "button":
      return { text: "Button", variant: "default", size: "default" };
    case "card":
      return { title: "Card Title", description: "", content: "" };
  }
};

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

export const useBuilderStore = create<BuilderState>((set) => ({
  tree: {
    id: "root",
    type: "container",
    props: { direction: "flex-col", gap: 4, padding: 4 },
    children: [],
  },
  activeNodeId: null,
  menuHidden: false,

  setActiveNode: (id) => set({ activeNodeId: id }),

  addNode: (parentId, type) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      if (!parent) return {};
      parent.children.push({
        id: crypto.randomUUID(),
        type,
        props: defaultProps(type),
        children: [],
      });
      return { tree: newTree };
    }),

  removeNode: (id) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const parent = findParent(newTree, id);
      if (!parent) return {};
      parent.children = parent.children.filter((c) => c.id !== id);
      return { tree: newTree, activeNodeId: null };
    }),

  updateNodeProps: (id, props) =>
    set((state) => {
      const newTree = structuredClone(state.tree);
      const node = findNode(newTree, id);
      if (!node) return {};
      node.props = { ...node.props, ...props };
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

      const prevSibling = parent.children[index - 1];
      if (prevSibling.type !== "container") return {};

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

      const parentIndex = grandparent.children.findIndex((c) => c.id === parent.id);
      const nodeIndex = parent.children.findIndex((c) => c.id === id);
      if (nodeIndex === -1) return {};

      const [node] = parent.children.splice(nodeIndex, 1);
      grandparent.children.splice(parentIndex + 1, 0, node);
      return { tree: newTree };
    }),

  toggleMenuHidden: () =>
    set((state) => ({ menuHidden: !state.menuHidden })),
}));

export function useActiveNode() {
  return useBuilderStore((s) => (s.activeNodeId ? findNode(s.tree, s.activeNodeId) : null));
}