// path: diagnostics/enum-consistency-check.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

// Add your table/column pairs and expected enums
const enumChecks = [
  { table: "users", column: "status", expected: ["active", "inactive", "pending"] },
  // Add more as needed
];

async function main() {
  const report: Record<string, any> = {};
  for (const { table, column, expected } of enumChecks) {
    const { data, error } = await client.from(table).select(column);
    if (error) continue;
    const found = new Set(data.map((row: any) => row[column]));
    const unexpected = Array.from(found).filter((val) => !expected.includes(val));
    if (unexpected.length) report[`${table}.${column}`] = unexpected;
  }
  await fs.writeFile("diagnostics/enum-consistency-report.json", JSON.stringify(report, null, 2));
  if (Object.keys(report).length) {
    console.log("[diagnostics] ⚠️  Enum inconsistencies found! See diagnostics/enum-consistency-report.json");
  } else {
    console.log("[diagnostics] ✅ All enum values are consistent.");
  }
}
main();