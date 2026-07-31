// scripts/generate-ui-templates.mjs



import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(__dirname, "..", "src", "components", "ui");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "component-templates");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "ui-files.json");

async function main() {
  const entries = await readdir(UI_DIR);
  const tsxFiles = entries.filter((f) => f.endsWith(".tsx"));

  const manifest = {};
  for (const file of tsxFiles) {
    const slug = file.replace(/\.tsx$/, "");
    manifest[slug] = await readFile(path.join(UI_DIR, file), "utf-8");
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`✔ Đã tạo ${OUTPUT_FILE} — ${tsxFiles.length} file: ${tsxFiles.join(", ")}`);
}

main().catch((err) => {
  console.error("Lỗi generate-ui-templates:", err);
  process.exit(1);
});
