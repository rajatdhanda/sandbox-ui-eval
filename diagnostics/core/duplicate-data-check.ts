// path: diagnostics/duplicate-data-check.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

// Specify columns you care about for duplicate-checking
const columnsToCheck = [
  { table: "users", column: "email" },
  // Add more {table, column} combos for your business logic
];

async function main() {
  const report: Record<string, any> = {};
  for (const { table, column } of columnsToCheck) {
    const { data, error } = await client.rpc("find_duplicate_values", { p_table: table, p_column: column });
    if (error) continue;
    if (data.length) report[`${table}.${column}`] = data;
  }
  await fs.writeFile("diagnostics/duplicate-data-report.json", JSON.stringify(report, null, 2));
  if (Object.keys(report).length) {
    console.log("[diagnostics] ⚠️  Duplicate values found! See diagnostics/duplicate-data-report.json");
  } else {
    console.log("[diagnostics] ✅ No duplicate data found in checked columns.");
  }
}
main();