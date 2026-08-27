// features/app-shell/components/app-shell.tsx



"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { TreeView } from "@/features/nodes-tree/components/tree-view";
import { InspectorPanel } from "@/features/inspector/components/inspector-panel";
import { PreviewWorkspace } from "@/features/canvas-preview/components/preview-workspace";
import { CodeModal } from "@/features/code-generator/components/code-modal";
import { ExportImageButton } from "@/features/export-image/components/export-image-button";
import { ExportProjectButton } from "@/features/export-project/components/export-project-button";
import { SaveProjectButton } from "@/features/cloud-save/components/save-project-button";
import { LoginButton } from "@/features/auth/components/login-button";
import { useTreeShortcuts } from "@/features/nodes-tree/hooks/use-tree-shortcuts";
import { useBuilderStore } from "@/core/store/builder-store";
import { Button } from "@/components/ui/button";

export function AppShell() {
  useTreeShortcuts();

  const menuHidden = useBuilderStore((s) => s.menuHidden);
  const toggleMenuHidden = useBuilderStore((s) => s.toggleMenuHidden);
  const user = useBuilderStore((s) => s.user);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {!menuHidden && (
        <aside className="fixed z-[60] w-64 border-r bg-white/68 flex flex-col shrink-0">
          <button
            onClick={toggleMenuHidden}
            className="fixed top-4 left-4 z-[60] bg-black/68 text-white text-xs px-3 py-2 rounded-full shadow-lg"
          >
            Scene Tree
          </button>
          <div className="flex items-center gap-2 p-3 border-b pt-16 flex-wrap">
            <CodeModal />
            <ExportImageButton />
            <ExportProjectButton />
            <SaveProjectButton />
            {user && (
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
                  My Projects
                </Button>
              </Link>
            )}
            <LoginButton />
          </div>
          <TreeView />
        </aside>
      )}

      <main className="flex-1 relative">
        <PreviewWorkspace />
        {!menuHidden && <InspectorPanel />}
      </main>

      {menuHidden && (
        <button
          onClick={toggleMenuHidden}
          className="fixed top-4 left-4 z-[60] bg-black/46 text-white text-xs px-3 py-2 rounded-full shadow-lg"
        >
          Scene Tree
        </button>
      )}
    </div>
  );
}
