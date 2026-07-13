// src/features/code-generator/components/code-modal.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/core/store/builder-store";
import { treeToJsx } from "../utils/json-to-jsx";

export function CodeModal() {
  const tree = useBuilderStore((s) => s.tree);
  const [copied, setCopied] = useState(false);

  const code = treeToJsx(tree);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Xem Code</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generated JSX</DialogTitle>
        </DialogHeader>

        <pre className="bg-muted rounded-md p-4 text-sm overflow-auto max-h-[60vh]">
          <code>{code}</code>
        </pre>

        <Button onClick={handleCopy} className="self-end">
          {copied ? "Đã copy!" : "Copy code"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}