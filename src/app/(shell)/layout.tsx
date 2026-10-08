// src/app/layout.tsx (hoặc ShellLayout)
import { GlobalTopbar } from "@/features/global-shell/components/global-topbar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <GlobalTopbar />
      {/* Adding pt-14 (padding top) so main content isn't overlapped by fixed header */}
      <main className="pt-14">{children}</main>
    </div>
  );
}
