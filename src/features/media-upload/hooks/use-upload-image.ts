"use client";

import { useState } from "react";

export function useUploadImage() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Gửi thẳng tới route handler của chính app — cùng domain, không có bước
      // "xin presigned URL" riêng như phương án cũ, ít 1 vòng round-trip.
      const res = await fetch("/api/upload-thumbnail", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        window.alert(data.error ?? "Upload thất bại.");
        return null;
      }
      return data.publicUrl as string;
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
