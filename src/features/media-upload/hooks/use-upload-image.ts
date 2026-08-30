// features/media-upload/hooks/use-upload-image.ts


"use client";

import { useState } from "react";

export function useUploadImage() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-thumbnail", { method: "POST", body: formData });

      // Đọc dạng text trước — tránh "Unexpected end of JSON input" che mất lỗi thật khi
      // server trả về response không phải JSON hợp lệ (VD lỗi 500 chưa được bắt).
      const text = await res.text();
      let data: { success?: boolean; publicUrl?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        console.error("[r2] Response không phải JSON hợp lệ:", text);
        window.alert(`Upload thất bại (status ${res.status}) — kiểm tra console.`);
        return null;
      }

      if (!res.ok || !data.success) {
        window.alert(data.error ?? `Upload thất bại (status ${res.status}).`);
        return null;
      }
      return data.publicUrl ?? null;
    } catch (err) {
      console.error("[r2] Upload thất bại:", err);
      window.alert("Upload thất bại — kiểm tra console.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}