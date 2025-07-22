import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

const requiredAuditColumns = ["created_at", "updated_at"];

async function getTableColumns() {
  const { data, error } = await client.rpc("list_table_columns");
  if (error) throw error;
  return data as { table_name: string, column_name: string }[];
}

async function main() {
  try {
    const columns = await getTableColumns();
    // Map table -> set of columns
    const colMap: Record<string, Set<string>> = {};
    for (const { table_name, column_name } of columns) {
      if (!colMap[table_name]) colMap[table_name] = new Set();
      colMap[table_name].add(column_name);
    }

    const missing: Record<string, string[]> = {};
    for (const table in colMap) {
      const missingCols = requiredAuditColumns.filter(c => !colMap[table].has(c));
      if (missingCols.length) missing[table] = missingCols;
    }

    await fs.writeFile("diagnostics/missing-audit-columns.json", JSON.stringify(missing, null, 2));
    if (Object.keys(missing).length === 0) {
      console.log("[diagnostics] ✅ All tables have audit columns!");
    } else {
      console.log("[diagnostics] ⚠️  Missing audit columns found! See diagnostics/missing-audit-columns.json");
    }
  } catch (e: any) {
    console.error("[diagnostics] ❌ Check failed:", e.message);
    process.exit(1);
  }
}
main();