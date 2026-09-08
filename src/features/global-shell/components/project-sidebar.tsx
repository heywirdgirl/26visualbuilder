"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { useRecentProjects } from "../hooks/use-recent-projects";
import { cn } from "@/core/utils/cn";

export function ProjectSidebar() {
  const router = useRouter();
  const user = useBuilderStore((s) => s.user);
  const recentProjects = useBuilderStore((s) => s.recentProjects);
  const isLoadingProjects = useBuilderStore((s) => s.isLoadingProjects);
  const projectsError = useBuilderStore((s) => s.projectsError);
  const highlightedProjectId = useBuilderStore((s) => s.highlightedProjectId);
  const setSidebarOpen = useBuilderStore((s) => s.setProjectSidebarOpen);
  const { fetchRecentProjects } = useRecentProjects();

  const close = () => setSidebarOpen(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSidebarOpen]);

  const handleProjectClick = (id: string) => {
    close();
    router.push(`/editor/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="My Projects">
      <button type="button" className="flex-1 bg-black/30 cursor-default" onClick={close} aria-label="Close projects" />
      <div className="w-[85vw] max-w-sm sm:w-80 bg-white h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-sm font-semibold">My Projects</span>
          <button type="button" onClick={close} className="text-muted-foreground hover:text-foreground" aria-label="Close projects">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {!user ? (
            <p className="text-sm text-muted-foreground text-center py-8">Đăng nhập để xem project của bạn.</p>
          ) : isLoadingProjects ? (
            <p className="text-sm text-muted-foreground text-center py-8">Đang tải...</p>
          ) : projectsError ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 mb-2">{projectsError}</p>
              <button type="button" onClick={() => void fetchRecentProjects()} className="text-xs text-primary underline">Thử lại</button>
            </div>
          ) : recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chưa có project nào.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 pb-1">Recent</p>
              {recentProjects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className={cn(
                    "text-left text-sm rounded-md px-3 py-2 hover:bg-muted flex items-center justify-between",
                    project.id === highlightedProjectId && "bg-primary/10 border border-primary/40"
                  )}
                >
                  <span className="truncate">{project.name}</span>
                  {project.id === highlightedProjectId && (
                    <span className="text-[10px] text-primary shrink-0 ml-2">✨ Just now</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t">
          <Link href="/projects" onClick={close} className="text-sm text-primary hover:underline">View all projects →</Link>
        </div>
      </div>
    </div>
  );
}
