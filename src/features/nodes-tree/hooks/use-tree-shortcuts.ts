// src/features/nodes-tree/hooks/use-tree-shortcuts.ts
import { useEffect } from "react";
import { useBuilderStore } from "@/core/store/builder-store";


export function useTreeShortcuts() {
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const moveNode = useBuilderStore((s) => s.moveNode);
  const indentNode = useBuilderStore((s) => s.indentNode);
  const outdentNode = useBuilderStore((s) => s.outdentNode);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!activeNodeId) return;

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowUp" && e.altKey) {
        e.preventDefault();
        moveNode(activeNodeId, "up");
      }
      if (e.key === "ArrowDown" && e.altKey) {
        e.preventDefault();
        moveNode(activeNodeId, "down");
      }
      if (e.key === "Tab") {
        e.preventDefault(); // chặn Tab nhảy focus mặc định của browser
        if (e.shiftKey) {
          outdentNode(activeNodeId);
        } else {
          indentNode(activeNodeId);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNodeId, moveNode, indentNode, outdentNode]);
}