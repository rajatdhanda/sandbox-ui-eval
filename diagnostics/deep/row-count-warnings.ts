// path: diagnostics/row-count-warnings.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

const MIN_ROWS = 1;    // Warn if table has less than this
const MAX_ROWS = 50000; // Warn if table has more than this

async function main() {
  const { data, error } = await client.rpc("list_table_row_counts");
  if (error) throw error;
  const warnings: Record<string, string> = {};
  for (const { table_name, row_count } of data as any[]) {
    if (row_count < MIN_ROWS) {
      warnings[table_name] = `⚠️ Table has only ${row_count} row(s)`;
    } else if (row_count > MAX_ROWS) {
      warnings[table_name] = `⚠️ Table has ${row_count} rows, consider archiving or partitioning`;
    }
  }
  await fs.writeFile("diagnostics/row-count-warnings.json", JSON.stringify(warnings, null, 2));
  if (Object.keys(warnings).length) {
    console.log("[diagnostics] ⚠️  Row count warnings found! See diagnostics/row-count-warnings.json");
  } else {
    console.log("[diagnostics] ✅ All tables have sensible row counts.");
  }
}
main();