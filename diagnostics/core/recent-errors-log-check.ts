// path: diagnostics/recent-errors-log-check.ts
// Only works if you have a table or endpoint for app errors! Example shown for "app_errors" table.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

async function main() {
  try {
    const { data, error } = await client.from("app_errors").select("*").gte("created_at", new Date(Date.now()-24*60*60*1000).toISOString());
    if (error) throw error;
    await fs.writeFile("diagnostics/recent-errors-log.json", JSON.stringify(data, null, 2));
    if (data.length) {
      console.log(`[diagnostics] ⚠️  Recent errors found in app_errors table! See diagnostics/recent-errors-log.json`);
    } else {
      console.log("[diagnostics] ✅ No recent errors logged.");
    }
  } catch (e) {
    console.log("[diagnostics] (Skipped) Could not check error logs (table missing or misconfigured)");
  }
}
main();