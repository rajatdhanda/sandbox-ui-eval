import { join, relative } from "path";
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import "dotenv/config";

const ROOT = process.cwd();
const SRC_FOLDERS = ["app", "components", "pages", "lib"];

function walk(dir: string, all: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, all);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      all.push(full);
    }
  }
  return all;
}

function getImports(file: string): string[] {
  const content = readFileSync(file, "utf8");
  return Array.from(content.matchAll(/from ['"]([^'"]+)['"]/g)).map(m => m[1]);
}

function main() {
  const files: string[] = [];
  for (const dir of SRC_FOLDERS) {
    try {
      walk(join(ROOT, dir), files);
    } catch {}
  }

  const usage: Record<string, string[]> = {};
  for (const file of files) {
    usage[relative(ROOT, file)] = getImports(file);
  }

  writeFileSync(
    join(ROOT, "diagnostics/file-usage-map.json"),
    JSON.stringify(usage, null, 2)
  );
  console.log("File usage map written to diagnostics/file-usage-map.json");
}

main();