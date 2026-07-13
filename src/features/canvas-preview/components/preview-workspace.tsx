// src/features/canvas-preview/components/preview-workspace.tsx


"use client";

import { useEffect } from "react";
import { useBuilderStore } from "@/core/store/builder-store";
import { ComponentRenderer } from "./component-renderer";
import { ShadowRootWrapper } from "./shadow-root-wrapper";
import { cn } from "@/core/utils/cn";

export function PreviewWorkspace() {
  const tree = useBuilderStore((s) => s.tree);
  const menuHidden = useBuilderStore((s) => s.menuHidden);
  const toggleMenuHidden = useBuilderStore((s) => s.toggleMenuHidden);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        toggleMenuHidden();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMenuHidden]);

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-auto bg-white",
        menuHidden && "fixed inset-0 z-50"
      )}
    >
      <ShadowRootWrapper>
        <ComponentRenderer node={tree} />
      </ShadowRootWrapper>
    </div>
  );
}