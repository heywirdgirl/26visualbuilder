## Bước 1 — Di chuyển file vào Route Group `(shell)`

Route Group `(shell)` (tên trong ngoặc) là cơ chế **có sẵn** của Next.js App Router — không ảnh hưởng URL, chỉ dùng để nhóm layout. `/editor`, `/post`, `/auth/*` đứng ngoài nhóm này nên **tự động không có Topbar**, không cần code loại trừ gì cả — đúng bản chất kỹ thuật đã note ở lượt trước, giờ áp dụng cụ thể. Quyết định thêm: `/post` (trang soạn bài đăng) cũng đứng **ngoài** `(shell)` — cùng lý do với Editor, đây là task tập trung, không cần Topbar gây phân tán.

```bash
mkdir -p "src/app/(shell)"
mv src/app/page.tsx "src/app/(shell)/page.tsx"
mv src/app/posts "src/app/(shell)/posts"
mv src/app/projects "src/app/(shell)/projects"
```

Không sửa nội dung bên trong 3 file/thư mục đó — chỉ đổi vị trí, mọi import đều dùng alias `@/` nên không bị ảnh hưởng.

## File mới: `src/app/(shell)/layout.tsx`

```tsx
import { GlobalTopbar } from "@/features/global-shell/components/global-topbar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalTopbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

Layout này **lồng bên trong** `src/app/layout.tsx` (RootLayout chứa `ClientProvider`/`useAuthSync` — vẫn áp dụng cho toàn app, kể cả Editor) — chỉ thêm Topbar cho riêng nhóm `(shell)`.

## Patch `core/store/builder-store.ts`

Thêm interface (đặt gần đầu file, cạnh các type khác):
```typescript
export interface RecentProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  updated_at: string;
}
```

Thêm vào interface `BuilderState`:
```typescript
  recentProjects: RecentProject[];
  projectCount: number;
  projectsLoaded: boolean;
  projectSidebarOpen: boolean;
  highlightedProjectId: string | null;
  setRecentProjects: (projects: RecentProject[], count: number) => void;
  setProjectSidebarOpen: (open: boolean) => void;
  setHighlightedProjectId: (id: string | null) => void;
  resetProjectCache: () => void;
```

Thêm vào default state (cạnh `draftPostPageNames: [],`):
```typescript
  recentProjects: [],
  projectCount: 0,
  projectsLoaded: false,
  projectSidebarOpen: false,
  highlightedProjectId: null,
```

Thêm action (cạnh `clearDraftPost`):
```typescript
  setRecentProjects: (recentProjects, count) =>
    set({ recentProjects, projectCount: count, projectsLoaded: true }),
  setProjectSidebarOpen: (projectSidebarOpen) => set({ projectSidebarOpen }),
  setHighlightedProjectId: (highlightedProjectId) => set({ highlightedProjectId }),
  resetProjectCache: () => set({ recentProjects: [], projectCount: 0, projectsLoaded: false }),
```

**Đúng đúng nguyên tắc đã giữ xuyên suốt project:** store chỉ chứa state + setter thuần, **không gọi Supabase trực tiếp trong này** — logic fetch thật nằm ở hook riêng bên dưới, giống hệt cách `use-save-project.ts`/`use-load-project.ts` đã tách.

## Vá 1 lỗ hổng nhỏ phát sinh — `features/auth/hooks/use-auth-sync.ts`

Nếu không sửa, đổi tài khoản trên cùng tab (đăng xuất rồi đăng nhập tài khoản khác) sẽ **hiện tạm project của người trước** trong sidebar, vì `projectsLoaded` vẫn `true` từ session cũ nên Topbar không fetch lại:

```typescript
// Đổi đoạn onAuthStateChange trong useAuthSync:
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  if (!mounted) return;
  const previousUserId = useBuilderStore.getState().user?.id;
  const nextUser = session?.user ?? null;
  if (nextUser?.id !== previousUserId) {
    useBuilderStore.getState().resetProjectCache(); // 👈 thêm — buộc fetch lại khi đổi user
  }
  setUser(nextUser);
  setAuthLoading(false);
});
```

## File mới: `features/global-shell/hooks/use-recent-projects.ts`

```typescript
"use client";

import { useCallback } from "react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createClient } from "@/core/supabase/client";

export function useRecentProjects() {
  const setRecentProjects = useBuilderStore((s) => s.setRecentProjects);

  const fetchRecentProjects = useCallback(async () => {
    const { user } = useBuilderStore.getState();
    if (!user) return;

    const supabase = createClient();
    // { count: "exact" } trong CÙNG 1 query — trả về vừa tổng số thật (cho badge ☰7),
    // vừa danh sách rút gọn (cho sidebar) — không cần gọi 2 lần như PRD gợi ý ngầm.
    const { data, count, error } = await supabase
      .from("projects")
      .select("id, name, description, thumbnail_url, updated_at", { count: "exact" })
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[global-shell] Tải danh sách project thất bại:", error);
      return;
    }

    setRecentProjects(data ?? [], count ?? 0);
  }, [setRecentProjects]);

  return { fetchRecentProjects };
}
```

## File mới: `features/global-shell/components/global-topbar.tsx`

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Menu } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { useRecentProjects } from "../hooks/use-recent-projects";
import { ProjectSidebar } from "./project-sidebar";

export function GlobalTopbar() {
  const user = useBuilderStore((s) => s.user);
  const projectCount = useBuilderStore((s) => s.projectCount);
  const projectsLoaded = useBuilderStore((s) => s.projectsLoaded);
  const sidebarOpen = useBuilderStore((s) => s.projectSidebarOpen);
  const setSidebarOpen = useBuilderStore((s) => s.setProjectSidebarOpen);
  const { fetchRecentProjects } = useRecentProjects();

  // Topbar chỉ mount 1 lần cho cả nhóm (shell) — layout không remount khi chuyển trang
  // trong cùng nhóm — nên fetch-on-mount ở đây không lặp lại quá mức khi điều hướng.
  useEffect(() => {
    if (user && !projectsLoaded) void fetchRecentProjects();
  }, [user, projectsLoaded, fetchRecentProjects]);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 backdrop-blur px-4 py-2.5">
        <Link href="/" className="text-sm font-semibold">26VisualBuilder</Link>

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-1.5 text-sm border rounded-md px-2.5 py-1.5 hover:bg-muted"
        >
          <Menu className="h-4 w-4" />
          {user && <span>{projectCount}</span>}
        </button>
      </header>

      {sidebarOpen && <ProjectSidebar />}
    </>
  );
}
```

## File mới: `features/global-shell/components/project-sidebar.tsx`

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { cn } from "@/core/utils/cn";

export function ProjectSidebar() {
  const router = useRouter();
  const user = useBuilderStore((s) => s.user);
  const recentProjects = useBuilderStore((s) => s.recentProjects);
  const highlightedProjectId = useBuilderStore((s) => s.highlightedProjectId);
  const setSidebarOpen = useBuilderStore((s) => s.setProjectSidebarOpen);

  const close = () => setSidebarOpen(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProjectClick = (id: string) => {
    close();
    router.push(`/editor/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={close} />

      <div className="w-full max-w-xs sm:w-80 bg-white h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-sm font-semibold">My Projects</span>
          <button onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!user ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Đăng nhập để xem project của bạn.
            </p>
          ) : recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chưa có project nào.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 pb-1">Recent</p>
              {recentProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProjectClick(p.id)}
                  className={cn(
                    "text-left text-sm rounded-md px-3 py-2 hover:bg-muted flex items-center justify-between",
                    p.id === highlightedProjectId && "bg-primary/10 border border-primary/40"
                  )}
                >
                  <span className="truncate">{p.name}</span>
                  {/* Badge "✨ Just now" hiện khi có highlight — TỰ TẮT sau 2-3s thuộc Task 4,
                      chưa code phần timeout ở đây theo đúng ranh giới Task 2/Task 4. */}
                  {p.id === highlightedProjectId && (
                    <span className="text-[10px] text-primary shrink-0 ml-2">✨ Just now</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <Link href="/projects" onClick={close} className="text-sm text-primary hover:underline">
            View all projects →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

--
Trước khi vào code, có 1 điểm PRD mô tả **khác hẳn** hành vi mình đã viết ở turn Clone trước đó — cần bạn biết rõ, vì đây là thay đổi hành vi có chủ đích, không phải tự ý đổi ý:

**Bỏ redirect tự động sang `/editor/<id>` sau khi Clone.** PRD mục 6-7 mô tả rõ: Clone xong **ở lại trang hiện tại** (Feed/Post Detail), thấy toast "✓ Added to your projects" + `☰ 7 → ☰ 8 +1` + project mới highlight trong sidebar — đúng mô hình "thêm vào thư viện của tôi" (giống bấm Star/Save trên GitHub), không phải "nhảy thẳng vào sửa ngay". Người dùng tự mở project qua sidebar khi nào sẵn sàng. Đây là quyết định UX hợp lý hơn cho ngữ cảnh feed xã hội — lướt tiếp được ngay, không bị ngắt luồng xem.

Cũng cần cài **toast thật** — trước giờ toàn bộ app dùng `window.alert` (chặn UI, không thể chạy song song animation `+1`), không phù hợp cho loại feedback "thoáng qua" PRD mô tả:

```bash
npx shadcn add sonner
```

## Patch `core/providers/client-provider.tsx`

```tsx
"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { useAuthSync } from "@/features/auth/hooks/use-auth-sync";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useAuthSync();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
```

## Patch `core/store/builder-store.ts`

Thêm vào interface `BuilderState` (bổ sung cạnh các field đã thêm ở Task 2 — cần cho trạng thái loading/error, đúng Acceptance Criteria mục 17 "loading state, error state"):

```typescript
  isLoadingProjects: boolean;
  projectsError: string | null;
  setProjectsLoading: (loading: boolean) => void;
  setProjectsError: (error: string | null) => void;
```

Thêm vào default state:
```typescript
  isLoadingProjects: false,
  projectsError: null,
```

Thêm action (cạnh `setRecentProjects`):
```typescript
  setProjectsLoading: (isLoadingProjects) => set({ isLoadingProjects }),
  setProjectsError: (projectsError) => set({ projectsError }),
```

Sửa `resetProjectCache` — reset thêm 2 field mới:
```typescript
  resetProjectCache: () =>
    set({ recentProjects: [], projectCount: 0, projectsLoaded: false, isLoadingProjects: false, projectsError: null }),
```

## Patch `features/global-shell/hooks/use-recent-projects.ts` — full file

```typescript
"use client";

import { useCallback } from "react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createClient } from "@/core/supabase/client";

export function useRecentProjects() {
  const setRecentProjects = useBuilderStore((s) => s.setRecentProjects);
  const setProjectsLoading = useBuilderStore((s) => s.setProjectsLoading);
  const setProjectsError = useBuilderStore((s) => s.setProjectsError);

  const fetchRecentProjects = useCallback(async () => {
    const { user } = useBuilderStore.getState();
    if (!user) return;

    setProjectsLoading(true);
    setProjectsError(null);

    const supabase = createClient();
    const { data, count, error } = await supabase
      .from("projects")
      .select("id, name, description, thumbnail_url, updated_at", { count: "exact" })
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[global-shell] Tải danh sách project thất bại:", error);
      setProjectsError("Không tải được danh sách project.");
      setProjectsLoading(false);
      return;
    }

    setRecentProjects(data ?? [], count ?? 0);
    setProjectsLoading(false);
  }, [setRecentProjects, setProjectsLoading, setProjectsError]);

  return { fetchRecentProjects };
}
```

## Cập nhật `features/publish-post/hooks/use-clone-post.ts` — full file (Task 3)

```typescript
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBuilderStore } from "@/core/store/builder-store";
import { useRecentProjects } from "@/features/global-shell/hooks/use-recent-projects";
import { clonePostAction } from "../actions/clone-post-action";

const HIGHLIGHT_DURATION_MS = 2500;

export function useClonePost() {
  const [isCloning, setIsCloning] = useState(false);
  const setHighlightedProjectId = useBuilderStore((s) => s.setHighlightedProjectId);
  const { fetchRecentProjects } = useRecentProjects();

  const clonePost = async (postId: string) => {
    setIsCloning(true);
    try {
      const res = await clonePostAction(postId);
      if (!res.success) {
        toast.error(res.error ?? "Clone thất bại.");
        return;
      }

      toast.success("✓ Added to your projects");
      await fetchRecentProjects(); // refresh list + count -> Topbar tự nhận projectCount mới, tự bump +1
      setHighlightedProjectId(res.projectId);
      setTimeout(() => setHighlightedProjectId(null), HIGHLIGHT_DURATION_MS);

      // KHÔNG redirect sang Editor nữa — ở lại Feed/Post Detail theo đúng PRD, người
      // dùng tự mở project qua sidebar khi sẵn sàng chỉnh sửa.
    } finally {
      setIsCloning(false);
    }
  };

  return { clonePost, isCloning };
}
```

## Cập nhật `features/global-shell/components/global-topbar.tsx` — full file (Task 4: animation `+1`)

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { useRecentProjects } from "../hooks/use-recent-projects";
import { ProjectSidebar } from "./project-sidebar";

export function GlobalTopbar() {
  const user = useBuilderStore((s) => s.user);
  const projectCount = useBuilderStore((s) => s.projectCount);
  const projectsLoaded = useBuilderStore((s) => s.projectsLoaded);
  const sidebarOpen = useBuilderStore((s) => s.projectSidebarOpen);
  const setSidebarOpen = useBuilderStore((s) => s.setProjectSidebarOpen);
  const { fetchRecentProjects } = useRecentProjects();

  useEffect(() => {
    if (user && !projectsLoaded) void fetchRecentProjects();
  }, [user, projectsLoaded, fetchRecentProjects]);

  // "+1" chỉ là hiệu ứng UI thoáng qua — không lưu DB, không cần global state,
  // tự phát hiện bằng cách so sánh projectCount đổi so với lần render trước.
  const prevCountRef = useRef(projectCount);
  const [showBump, setShowBump] = useState(false);

  useEffect(() => {
    if (projectsLoaded && projectCount > prevCountRef.current) {
      setShowBump(true);
      const timer = setTimeout(() => setShowBump(false), 1800);
      prevCountRef.current = projectCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = projectCount;
  }, [projectCount, projectsLoaded]);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 backdrop-blur px-4 py-2.5">
        <Link href="/" className="text-sm font-semibold">26VisualBuilder</Link>

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-1.5 text-sm border rounded-md px-2.5 py-1.5 hover:bg-muted"
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
      </header>

      {sidebarOpen && <ProjectSidebar />}
    </>
  );
}
```

## Cập nhật `features/global-shell/components/project-sidebar.tsx` — full file (Task 4: loading/error state + mobile width)

```tsx
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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProjectClick = (id: string) => {
    close();
    router.push(`/editor/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={close} />

      <div className="w-[85vw] max-w-sm sm:w-80 bg-white h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-sm font-semibold">My Projects</span>
          <button onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!user ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Đăng nhập để xem project của bạn.
            </p>
          ) : isLoadingProjects ? (
            <p className="text-sm text-muted-foreground text-center py-8">Đang tải...</p>
          ) : projectsError ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 mb-2">{projectsError}</p>
              <button onClick={() => fetchRecentProjects()} className="text-xs text-primary underline">
                Thử lại
              </button>
            </div>
          ) : recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chưa có project nào.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 pb-1">Recent</p>
              {recentProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProjectClick(p.id)}
                  className={cn(
                    "text-left text-sm rounded-md px-3 py-2 hover:bg-muted flex items-center justify-between",
                    p.id === highlightedProjectId && "bg-primary/10 border border-primary/40"
                  )}
                >
                  <span className="truncate">{p.name}</span>
                  {p.id === highlightedProjectId && (
                    <span className="text-[10px] text-primary shrink-0 ml-2">✨ Just now</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <Link href="/projects" onClick={close} className="text-sm text-primary hover:underline">
            View all projects →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---
**Đối chiếu nhanh Acceptance Criteria (mục 17 PRD):** Topbar ✅ (4 trang shell, ẩn ở Editor) · Sidebar ✅ (sort đúng, đóng 3 cách, responsive) · Clone ✅ (refresh list, count +1 có animation, highlight tạm, **không** tạo notification DB) · Regression: không đụng `clone_post()`, không đổi schema, không phá Editor/Feed/Post Detail (chỉ thêm layout bọc ngoài).

**Test nhanh:** vào `/` (chưa mở sidebar) → sang 1 post → bấm Clone → phải thấy toast "✓ Added to your projects" hiện góc màn hình (không chặn thao tác), **không** bị điều hướng đi đâu cả, `☰` số tăng lên kèm `+1` nảy lên rồi biến mất sau ~1.8s. Mở sidebar → project vừa clone phải nằm **đầu danh sách**, có viền + "✨ Just now" — đợi ~2.5s, đóng mở lại sidebar → viền/badge phải biến mất, chỉ còn tên project bình thường.
