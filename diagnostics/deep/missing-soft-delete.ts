// path: diagnostics/missing-soft-delete.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await client.rpc("list_table_columns");
  if (error) throw error;
  const colMap: Record<string, Set<string>> = {};
  for (const { table_name, column_name } of data as any[]) {
    if (!colMap[table_name]) colMap[table_name] = new Set();
    colMap[table_name].add(column_name);
  }
  const missing: string[] = [];
  for (const [table, cols] of Object.entries(colMap)) {
    if (!cols.has("deleted_at") && !cols.has("is_deleted")) {
      missing.push(table);
    }
  }
  await fs.writeFile("diagnostics/missing-soft-delete.json", JSON.stringify(missing, null, 2));
  if (missing.length) {
    console.log("[diagnostics] ⚠️  Tables missing soft delete columns! See diagnostics/missing-soft-delete.json");
  } else {
    console.log("[diagnostics] ✅ All tables have soft delete columns.");
  }
}
main();