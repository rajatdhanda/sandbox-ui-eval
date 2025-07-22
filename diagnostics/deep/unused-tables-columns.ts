import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

// --- 1. Get env ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[diagnostics] ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// --- 2. Get live schema (all tables/columns in public) ---
async function getLiveSchema() {
  const { data, error } = await client.rpc("list_table_columns");
  if (error) throw error;
  return data as { table_name: string, column_name: string }[];
}

// --- 3. Parse generated types for used tables/columns ---
async function getUsedSchema() {
  const file = await fs.readFile("lib/supabase/generated-types.ts", "utf8");
  const matches = file.matchAll(/(\w+):\s*{[^}]*Row:\s*{([^}]*)}/g);
  const used: Record<string, Set<string>> = {};
  for (const match of matches) {
    const table = match[1];
    const rowBlock = match[2];
    const fields = Array.from(rowBlock.matchAll(/(\w+):/g)).map(m => m[1]);
    used[table] = new Set(fields);
  }
  return used;
}

// --- 4. Diff live vs used ---
async function main() {
  try {
    const live = await getLiveSchema();
    const used = await getUsedSchema();
    const unused: Record<string, string[]> = {};

    for (const { table_name, column_name } of live) {
      if (!(table_name in used)) {
        if (!unused[table_name]) unused[table_name] = [];
        unused[table_name].push(column_name);
      } else if (!used[table_name].has(column_name)) {
        if (!unused[table_name]) unused[table_name] = [];
        unused[table_name].push(column_name);
      }
    }

    await fs.writeFile("diagnostics/unused-tables-columns.json", JSON.stringify(unused, null, 2));
    if (Object.keys(unused).length === 0) {
      console.log("[diagnostics] ✅ All tables/columns are referenced by generated types!");
    } else {
      console.log("[diagnostics] ⚠️  Unused tables/columns found! See diagnostics/unused-tables-columns.json");
    }
  } catch (e: any) {
    console.error("[diagnostics] ❌ Check failed:", e.message);
    process.exit(1);
  }
}
main();