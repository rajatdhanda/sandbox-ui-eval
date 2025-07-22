import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

// Add more keywords as your compliance needs require
const piiKeywords = ["email", "name", "phone", "address", "dob", "ssn", "passport", "credit", "token", "password"];

async function getTableColumns() {
  const { data, error } = await client.rpc("list_table_columns");
  if (error) throw error;
  return data as { table_name: string, column_name: string }[];
}

async function main() {
  try {
    const columns = await getTableColumns();
    const pii: Record<string, string[]> = {};
    for (const { table_name, column_name } of columns) {
      if (piiKeywords.some(k => column_name.toLowerCase().includes(k))) {
        if (!pii[table_name]) pii[table_name] = [];
        pii[table_name].push(column_name);
      }
    }
    await fs.writeFile("diagnostics/pii-detection.json", JSON.stringify(pii, null, 2));
    if (Object.keys(pii).length === 0) {
      console.log("[diagnostics] ✅ No likely PII columns detected.");
    } else {
      console.log("[diagnostics] ⚠️  PII-like columns found! See diagnostics/pii-detection.json");
    }
  } catch (e: any) {
    console.error("[diagnostics] ❌ Check failed:", e.message);
    process.exit(1);
  }
}
main();