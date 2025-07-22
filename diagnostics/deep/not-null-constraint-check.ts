// path: diagnostics/not-null-constraint-check.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await client.from("information_schema.columns")
    .select("table_name,column_name,is_nullable")
    .eq("table_schema", "public");
  if (error) throw error;
  const nullable: Record<string, string[]> = {};
  for (const { table_name, column_name, is_nullable } of data as any[]) {
    // Ignore id columns and auto-generated timestamps
    if (is_nullable === "YES" && !["id", "created_at", "updated_at", "deleted_at"].includes(column_name)) {
      if (!nullable[table_name]) nullable[table_name] = [];
      nullable[table_name].push(column_name);
    }
  }
  await fs.writeFile("diagnostics/not-null-constraint-report.json", JSON.stringify(nullable, null, 2));
  if (Object.keys(nullable).length) {
    console.log("[diagnostics] ⚠️  Nullable columns found! See diagnostics/not-null-constraint-report.json");
  } else {
    console.log("[diagnostics] ✅ All columns are NOT NULL where expected.");
  }
}
main();