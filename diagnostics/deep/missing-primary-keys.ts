// path: diagnostics/missing-primary-keys.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await client.rpc("list_tables_without_primary_key");
  if (error) throw error;
  await fs.writeFile("diagnostics/missing-primary-keys.json", JSON.stringify(data, null, 2));
  if (data.length) {
    console.log("[diagnostics] ⚠️  Tables missing primary keys! See diagnostics/missing-primary-keys.json");
  } else {
    console.log("[diagnostics] ✅ All tables have primary keys.");
  }
}
main();