
// src/core/providers/client-provider.tsx




"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useSyncExternalStore } from "react";
import { useAuthSync } from "@/features/auth/hooks/use-auth-sync";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  useAuthSync(); // 👈 mới — chạy 1 lần duy nhất cho toàn app

  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!hydrated) return null;

  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}