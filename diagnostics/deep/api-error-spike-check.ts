// path: diagnostics/api-error-spike-check.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

async function main() {
  try {
    // Modify table name as per your schema!
    const { data, error } = await client.from("api_errors").select("*").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    if (error) throw error;
    const total = data.length;
    const byType: Record<string, number> = {};
    data.forEach((e: any) => {
      byType[e.error_code || e.type || "unknown"] = (byType[e.error_code || e.type || "unknown"] || 0) + 1;
    });
    await fs.writeFile("diagnostics/api-error-spike-check.json", JSON.stringify({ total, byType }, null, 2));
    if (total > 0) {
      console.log(`[diagnostics] ⚠️  API errors found in last 24h! See diagnostics/api-error-spike-check.json`);
    } else {
      console.log(`[diagnostics] ✅ No API errors in last 24h.`);
    }
  } catch (e) {
    console.log("[diagnostics] (Skipped) Could not check API errors (table missing or misconfigured)");
  }
}
main();