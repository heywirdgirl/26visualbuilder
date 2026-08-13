
// src/core/providers/client-provider.tsx




"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useAuthSync } from "@/features/auth/hooks/use-auth-sync";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useAuthSync(); // 👈 mới — chạy 1 lần duy nhất cho toàn app

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return <TooltipProvider>{children}</TooltipProvider>;
}