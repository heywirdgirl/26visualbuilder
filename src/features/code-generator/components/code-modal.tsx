// src/features/code-generator/components/code-modal.tsx

"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/core/store/builder-store";
import { exportProject } from "../utils/export-project";

export function CodeModal() {
  const tree = useBuilderStore((s) => s.tree);
  const [copied, setCopied] = useState<string | null>(null);

  const files = useMemo(() => exportProject(tree), [tree]);

  const handleCopy = async (path: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(path);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Xem Code</Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Generated Project ({files.length} file{files.length !== 1 ? "s" : ""})
          </DialogTitle>
        </DialogHeader>

        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Chưa có Page hoặc Component nào để export.
          </p>
        ) : (
          <Tabs defaultValue={files[0].path}>
            <TabsList className="flex-wrap h-auto justify-start">
              {files.map((f) => (
                <TabsTrigger key={f.path} value={f.path} className="text-xs font-mono">
                  {f.path}
                </TabsTrigger>
              ))}
            </TabsList>

            {files.map((f) => (
              <TabsContent key={f.path} value={f.path} className="mt-2">
                <pre className="bg-muted rounded-md p-4 text-sm overflow-auto max-h-[55vh]">
                  <code>{f.content}</code>
                </pre>
                <Button size="sm" className="mt-2" onClick={() => handleCopy(f.path, f.content)}>
                  {copied === f.path ? "Đã copy!" : "Copy code"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}