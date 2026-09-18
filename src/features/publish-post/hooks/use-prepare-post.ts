"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuilderStore } from "@/core/store/builder-store";
import { useSaveProject } from "@/features/cloud-save/hooks/use-save-project";
import { captureAllPagesClean } from "@/features/canvas-preview/utils/capture-all-pages";

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
      if (!currentProjectId) {
        await saveProject();
      }

      const finalProjectId = useBuilderStore.getState().currentProjectId;
      if (!finalProjectId) {
        window.alert("Cần lưu project trước khi đăng bài.");
        return;
      }

      // Chụp TUẦN TỰ mọi Page (không chỉ trang đang mở) — đúng quyết định "số ảnh phải
      // bằng số page". Có thể mất vài giây nếu project nhiều trang.
      const pageCaptures = await captureAllPagesClean({ pixelRatio: 2 });
      if (pageCaptures === null) {
        window.alert("Không chụp được ảnh Canvas — thử lại.");
        return;
      }
      if (pageCaptures.length === 0) {
        window.alert("Project chưa có Page nào để đăng bài.");
        return;
      }

      useBuilderStore.getState().setDraftPost({
        tree: structuredClone(tree),
        pageCaptures,
      });

      router.push("/post");
    } finally {
      setIsPreparing(false);
    }
  };

  return { preparePost, isPreparing };
}
