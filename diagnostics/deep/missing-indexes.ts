import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

// Add more columns you want to check for index coverage
const suggestedIndexColumns = ["user_id", "email", "created_at", "updated_at"];

async function getIndexInfo() {
  const { data, error } = await client.rpc("list_table_indexes");
  if (error) throw error;
  return data as { table_name: string, index_column: string }[];
}

async function getTableColumns() {
  const { data, error } = await client.rpc("list_table_columns");
  if (error) throw error;
  return data as { table_name: string, column_name: string }[];
}

async function main() {
  try {
    const indexInfo = await getIndexInfo();
    const columns = await getTableColumns();

    // Build a map: table -> set of indexed columns
    const indexed: Record<string, Set<string>> = {};
    for (const { table_name, index_column } of indexInfo) {
      if (!indexed[table_name]) indexed[table_name] = new Set();
      indexed[table_name].add(index_column);
    }

    const missing: Record<string, string[]> = {};

    for (const { table_name, column_name } of columns) {
      if (suggestedIndexColumns.includes(column_name)) {
        if (!indexed[table_name] || !indexed[table_name].has(column_name)) {
          if (!missing[table_name]) missing[table_name] = [];
          missing[table_name].push(column_name);
        }
      }
    }

    await fs.writeFile("diagnostics/missing-indexes.json", JSON.stringify(missing, null, 2));
    if (Object.keys(missing).length === 0) {
      console.log("[diagnostics] ✅ All important columns are indexed!");
    } else {
      console.log("[diagnostics] ⚠️  Missing indexes found! See diagnostics/missing-indexes.json");
    }
  } catch (e: any) {
    console.error("[diagnostics] ❌ Check failed:", e.message);
    process.exit(1);
  }
}
main();