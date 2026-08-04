// features/export-project/utils/build-zip.ts


import JSZip from "jszip";
import { GeneratedFile } from "@/core/types/generated-file.types";

export async function buildProjectZip(files: GeneratedFile[]): Promise<Blob> {
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.path, f.content));
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
