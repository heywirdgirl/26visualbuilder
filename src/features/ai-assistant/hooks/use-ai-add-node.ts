"use client";

import { useState } from "react";
import { useBuilderStore, findNode } from "@/core/store/builder-store";
import { buildAiContext } from "../utils/build-ai-context";
import { AiResponse } from "../schemas/ai-output.schema";

export function useAiAddNode() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { tree, activePageId, activeNodeId, applyAiOperations } = useBuilderStore.getState();
      if (!activePageId) {
        setError("Chưa có trang nào đang mở.");
        return null;
      }

      const pageNode = findNode(tree, activePageId);
      if (!pageNode) {
        setError("Không tìm thấy trang hiện tại.");
        return null;
      }

      const context = buildAiContext(tree, pageNode, activeNodeId);
      const response = await fetch("/api/ai/add-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      });
      const text = await response.text();

      let json: { success?: boolean; data?: AiResponse; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        setError(`AI thất bại (status ${response.status}).`);
        return null;
      }

      if (!response.ok || !json.success || !json.data) {
        setError(json.error ?? "AI thất bại — thử lại.");
        return null;
      }

      const result = applyAiOperations(json.data.operations);
      return {
        summary: json.data.summary ?? "Đã thêm nội dung mới.",
        appliedCount: result.appliedCount,
        skippedCount: result.skippedTopLevel + result.skippedNested,
      };
    } catch (error) {
      console.error("[ai] generate thất bại:", error);
      setError("AI thất bại — kiểm tra console.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, error };
}
