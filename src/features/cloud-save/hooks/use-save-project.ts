// features/cloud-save/hooks/use-save-project.ts


"use client";

import { useCallback, useState } from "react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createClient } from "@/core/supabase/client";

export function useSaveProject() {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const saveProject = useCallback(async () => {
    // Đọc state qua getState() (không phải selector reactive) — vì đây là hành động 1 lần
    // theo click, cần giá trị MỚI NHẤT tại thời điểm bấm, không cần hook này re-render mỗi
    // khi tree đổi (mỗi lần sửa Inspector đều đổi tree — subscribe reactive ở đây sẽ khiến
    // component chứa nút Save render lại liên tục, rất lãng phí cho 1 nút bấm).
    const { user, tree, currentProjectId, setCurrentProjectId } = useBuilderStore.getState();

    if (!user) {
      window.alert("Đăng nhập trước khi lưu project lên Cloud.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      if (currentProjectId) {
        const { error } = await supabase
          .from("projects")
          .update({ tree_data: tree })
          .eq("id", currentProjectId);
        if (error) throw error;
      } else {
        const name = window.prompt("Tên project:", "My Project");
        if (!name || !name.trim()) {
          setIsSaving(false);
          return;
        }
        const { data, error } = await supabase
          .from("projects")
          .insert({ owner_id: user.id, name: name.trim(), tree_data: tree })
          .select("id")
          .single();
        if (error) throw error;
        setCurrentProjectId(data.id);
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error("[cloud-save] Lưu project thất bại:", err);
      window.alert(
        err instanceof Error ? err.message : "Không thể lưu project — kiểm tra console để biết chi tiết."
      );
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { saveProject, isSaving, justSaved };
}
