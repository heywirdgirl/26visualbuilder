"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useAiAddNode } from "../hooks/use-ai-add-node";

export function AiAddNodePopover({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { generate, isGenerating, error } = useAiAddNode();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const result = await generate(prompt.trim());
    if (!result) return;

    if (result.skippedCount > 0) {
      toast.warning(`${result.summary} (bỏ qua ${result.skippedCount} phần không hợp lệ)`);
    } else {
      toast.success(result.summary);
    }
    setPrompt("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={disabled}
          title="Thêm bằng AI"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="z-[7000] flex w-80 flex-col gap-2 p-3">
        <p className="text-xs font-medium">✨ Ask AI</p>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder='VD: "Thêm badge New màu xanh phía trên"'
          rows={3}
          disabled={isGenerating}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          {isGenerating ? "Đang tạo..." : "Generate"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
