// features/app-shell/components/app-shell.tsx

"use client";

import Link from "next/link";
import { useState } from "react";

import { ChevronDown, FolderKanban, Newspaper, Download,ImageDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { TreeView } from "@/features/nodes-tree/components/tree-view";
import { InspectorPanel } from "@/features/inspector/components/inspector-panel";
import { PreviewWorkspace } from "@/features/canvas-preview/components/preview-workspace";
import { CodeModal } from "@/features/code-generator/components/code-modal";
import { ExportImageDialog } from "@/features/export-image/components/export-image-dialog";
import { ExportProjectButton } from "@/features/export-project/components/export-project-button";
import { SaveProjectButton } from "@/features/cloud-save/components/save-project-button";
import { PostProjectButton } from "@/features/publish-post/components/post-project-button";
import { LoginButton } from "@/features/auth/components/login-button";
import { useTreeShortcuts } from "@/features/nodes-tree/hooks/use-tree-shortcuts";
import { useBuilderStore } from "@/core/store/builder-store";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell() {
   const [exportImageOpen, setExportImageOpen] = useState(false);
  useTreeShortcuts();
  const menuHidden = useBuilderStore((s) => s.menuHidden);
  const toggleMenuHidden = useBuilderStore((s) => s.toggleMenuHidden);
  const editMode = useBuilderStore((s) => s.editMode);
  
  const user = useBuilderStore((s) => s.user);

  return (
    <div className="flex h-screen w-screen overflow-hidden">

    <aside className={cn(
          "fixed top-0 left-0 z-[60] w-60 border-r bg-white/80 backdrop-blur flex flex-col shrink-0 h-screen transition-transform duration-300 ease-in-out",
          menuHidden ? "-translate-x-full" : "translate-x-0"
        )}>
  {/* Action Area được chia làm 2 hàng chuẩn Flexbox */}
  <div className="flex flex-col gap-2 p-4 border-b">
    
    {/* HÀNG 1: Logo Visual + Save + Auth */}
    <div className="flex items-center justify-between gap-1.5 w-full">
      <button
        onClick={toggleMenuHidden}
        className="bg-black/80 text-white text-xs px-4 py-1.5 rounded-full shadow-sm hover:bg-black transition-colors shrink-0"
      >
        Visual
      </button>

      <div className="flex items-center gap-1.5">
        <SaveProjectButton />
        <LoginButton />
      </div>
    </div>

    {/* HÀNG 2: Core Actions + Dropdown Menu */}
    <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-border/40">
      <div className="flex items-center gap-1">
        <PostProjectButton />
        <CodeModal />
      </div>

      {/* Dropdown Menu tối ưu chuẩn UI */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
            <ChevronDown className="h-4 w-4" />
            <span className="sr-only">More Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          side="right" 
          sideOffset={4} 
          className="w-44 z-[7000]"
        >
          <DropdownMenuItem onSelect={() => setExportImageOpen(true)} className="cursor-pointer">
            <ImageDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            Export Image
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <div className="w-full">
              <ExportProjectButton />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/" className="flex items-center py-1 text-xs">
              <Newspaper className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              Feed
            </Link>
          </DropdownMenuItem>
          {user && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/projects" className="flex items-center py-1 text-xs">
                <FolderKanban className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Projects
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  {/* TreeView hiển thị nội dung bên dưới */}
  <div className="flex-1 overflow-y-auto">
    <TreeView />
  </div>
</aside>

      <main className="flex-1 relative">
        <PreviewWorkspace />
        {editMode && <InspectorPanel />}
      </main>
      {menuHidden && (
            <button
              onClick={toggleMenuHidden}
              className="fixed top-4 left-4 z-[60] bg-black/80 text-white text-xs px-4 py-1.5 rounded-full shadow-lg hover:bg-black transition-all duration-200"
            >
              Visual
            </button>
          )}
        <ExportImageDialog open={exportImageOpen} onOpenChange={setExportImageOpen} />
    </div>
  );
}
