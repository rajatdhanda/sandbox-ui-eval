// path: diagnostics/column-defaults-check.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await client.from("information_schema.columns")
    .select("table_name,column_name,column_default,is_nullable")
    .eq("table_schema", "public");
  if (error) throw error;
  const missingDefaults: Record<string, string[]> = {};
  for (const { table_name, column_name, column_default, is_nullable } of data as any[]) {
    // Ignore id columns and created_at, updated_at
    if (
      is_nullable === "NO" &&
      !column_default &&
      !["id", "created_at", "updated_at", "deleted_at"].includes(column_name)
    ) {
      if (!missingDefaults[table_name]) missingDefaults[table_name] = [];
      missingDefaults[table_name].push(column_name);
    }
  }
  await fs.writeFile("diagnostics/column-defaults-report.json", JSON.stringify(missingDefaults, null, 2));
  if (Object.keys(missingDefaults).length) {
    console.log("[diagnostics] ⚠️  Missing column defaults! See diagnostics/column-defaults-report.json");
  } else {
    console.log("[diagnostics] ✅ All non-null columns have defaults where expected.");
  }
}
main();