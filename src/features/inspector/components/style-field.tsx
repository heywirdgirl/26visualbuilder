// features/inspector/components/style-field.tsx


"use client";

import { X } from "lucide-react";

export function StyleField({
  label,
  showClear,
  onClear,
  children,
}: {
  label: string;
  showClear?: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-center justify-between">
        {label}
        {showClear && (
          <button
            type="button" onClick={onClear}
            title="Reset về kế thừa từ breakpoint nhỏ hơn"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
      {children}
    </label>
  );
}
