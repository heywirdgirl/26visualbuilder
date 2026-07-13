
// src/core/providers/client-provider.tsx
"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null; // tránh mismatch SSR/CSR với Zustand

  return <TooltipProvider>{children}</TooltipProvider>;
}