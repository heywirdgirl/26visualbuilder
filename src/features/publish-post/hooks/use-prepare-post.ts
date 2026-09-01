"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuilderStore, getPageNamesInOrder } from "@/core/store/builder-store";
import { useSaveProject } from "@/features/cloud-save/hooks/use-save-project";
import { captureActivePageClean } from "@/features/canvas-preview/utils/capture-active-page";

export function usePreparePost() {
  const router = useRouter();
  const { saveProject } = useSaveProject();
  const [isPreparing, setIsPreparing] = useState(false);

  const preparePost = async () => {
    const { user, tree, currentProjectId } = useBuilderStore.getState();
    if (!user) {
      window.alert("Đăng nhập trước khi đăng bài.");
      return;
    }

    setIsPreparing(true);
    try {
      // posts.project_id bắt buộc trỏ tới project THẬT SỰ đã lưu (RLS policy insert kiểm
      // tra owner) — tự Save hộ nếu chưa từng lưu, người dùng không cần tự nhớ 2 bước.
      if (!currentProjectId) {
        await saveProject();
      }

      const finalProjectId = useBuilderStore.getState().currentProjectId;
      if (!finalProjectId) {
        window.alert("Cần lưu project trước khi đăng bài.");
        return;
      }

      const thumbnail = await captureActivePageClean({ pixelRatio: 2 });
      if (!thumbnail) {
        window.alert("Không chụp được ảnh Canvas — thử lại.");
        return;
      }

      useBuilderStore.getState().setDraftPost({
        tree: structuredClone(tree),
        thumbnail,
        pageNames: getPageNamesInOrder(tree),
      });

      router.push("/post");
    } finally {
      setIsPreparing(false);
    }
  };

  return { preparePost, isPreparing };
}
