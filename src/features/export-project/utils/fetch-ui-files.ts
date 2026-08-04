// features/export-project/utils/fetch-ui-files.ts


import { GeneratedFile } from "@/core/types/generated-file.types";

type UiFilesManifest = Record<string, string>;

export async function fetchUiFiles(slugs: string[]): Promise<GeneratedFile[]> {
  if (slugs.length === 0) return [];

  const res = await fetch("/component-templates/ui-files.json");
  if (!res.ok) {
    throw new Error(
      "Không tải được component-templates/ui-files.json — chạy `npm run generate:ui-templates` trước."
    );
  }
  const manifest: UiFilesManifest = await res.json();

  const files: GeneratedFile[] = [];
  for (const slug of slugs) {
    const content = manifest[slug];
    if (!content) {
      console.warn(`Thiếu file mẫu cho "${slug}" trong ui-files.json — ZIP sẽ thiếu file này.`);
      continue;
    }
    files.push({ path: `components/ui/${slug}.tsx`, content });
  }
  return files;
}
