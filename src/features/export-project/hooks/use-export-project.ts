// features/export-project/hooks/use-export-project.ts


"use client";

import { useState } from "react";
import { useBuilderStore } from "@/core/store/builder-store";
import { exportProject } from "@/features/code-generator/utils/export-project";
import { getProjectTemplateFiles } from "../constants/project-template-files";
import { collectRequiredUiSlugs } from "../utils/collect-ui-dependencies";
import { fetchUiFiles } from "../utils/fetch-ui-files";
import { buildProjectZip, downloadBlob } from "../utils/build-zip";
import { slugifyPathSegment } from "@/features/code-generator/utils/path-utils";

export function useExportProject() {
  const tree = useBuilderStore((s) => s.tree);
  const [isExporting, setIsExporting] = useState(false);

  const exportProjectZip = async (projectName: string) => {
    setIsExporting(true);
    try {
      const templateFiles = getProjectTemplateFiles(projectName);
      const generatedFiles = exportProject(tree); // app/page.tsx, components/Header.tsx... (V1.9)
      const requiredSlugs = collectRequiredUiSlugs(tree);
      const uiFiles = await fetchUiFiles(requiredSlugs); // chỉ đúng file ui/*.tsx thật cần dùng

      const allFiles = [...templateFiles, ...generatedFiles, ...uiFiles];
      const blob = await buildProjectZip(allFiles);
      downloadBlob(blob, `${slugifyPathSegment(projectName)}.zip`);
    } catch (err) {
      console.error("Export Project thất bại:", err);
      window.alert(
        err instanceof Error ? err.message : "Không thể xuất project — kiểm tra console để biết chi tiết."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return { exportProjectZip, isExporting };
}
