
// src/features/global-shell/components/global-topbar.tsx

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { useRecentProjects } from "../hooks/use-recent-projects";
import { ProjectSidebar } from "./project-sidebar";
import { LoginButton } from "@/features/auth/components/login-button";

export function GlobalTopbar() {
  const user = useBuilderStore((s) => s.user);
  const projectCount = useBuilderStore((s) => s.projectCount);
  const projectsLoaded = useBuilderStore((s) => s.projectsLoaded);
  const sidebarOpen = useBuilderStore((s) => s.projectSidebarOpen);
  const setSidebarOpen = useBuilderStore((s) => s.setProjectSidebarOpen);
  const { fetchRecentProjects } = useRecentProjects();
  const previousCount = useRef(projectCount);
  const [showBump, setShowBump] = useState(false);

  useEffect(() => {
    if (user && !projectsLoaded) void fetchRecentProjects();
  }, [user, projectsLoaded, fetchRecentProjects]);

  useEffect(() => {
    if (projectsLoaded && projectCount > previousCount.current) {
      setShowBump(true);
      const timer = setTimeout(() => setShowBump(false), 1800);
      previousCount.current = projectCount;
      return () => clearTimeout(timer);
    }
    previousCount.current = projectCount;
  }, [projectCount, projectsLoaded]);

  return (
    <>

// Thay 'sticky' bằng 'fixed top-0 left-0 right-0 w-full h-14 z-50'
<header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-white/90 backdrop-blur px-4 py-2.5">
  <Link href="/" className="text-sm font-semibold">Visual</Link>

  <div className="flex items-center gap-2">
    <LoginButton />
    <button
      type="button"
      onClick={() => setSidebarOpen(true)}
      className="flex items-center gap-1.5 text-sm border rounded-md px-2.5 py-1.5 hover:bg-muted"
      aria-label="Open projects"
    >
      <Menu className="h-4 w-4" />
      {user && (
        <span className="relative">
          {projectCount}
          {showBump && (
            <span className="absolute -top-3 -right-3 text-[10px] font-bold text-green-600 animate-bounce">
              +1
            </span>
          )}
        </span>
      )}
    </button>
  </div>
</header>

      {sidebarOpen && <ProjectSidebar />}
    </>
  );
}
