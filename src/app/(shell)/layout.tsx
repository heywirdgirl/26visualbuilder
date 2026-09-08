import { GlobalTopbar } from "@/features/global-shell/components/global-topbar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalTopbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
