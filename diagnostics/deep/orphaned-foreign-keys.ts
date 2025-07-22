import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[diagnostics] ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type FKCheck = {
  childTable: string;
  childKey: string;
  parentTable: string;
  parentKey: string;
};

// Define all your FK relationships here!
const fkChecks: FKCheck[] = [
  // Example: orders.user_id references users.id
  { childTable: "orders", childKey: "user_id", parentTable: "users", parentKey: "id" },
  // Add more as needed...
];

// Run all FK checks
async function main() {
  const results: Record<string, any[]> = {};

  for (const fk of fkChecks) {
    try {
      // Find orphaned child rows (child rows whose FK does not match any parent row)
      const { data, error } = await client.rpc("orphaned_fk_rows", {
        child_table: fk.childTable,
        child_key: fk.childKey,
        parent_table: fk.parentTable,
        parent_key: fk.parentKey,
      });

      if (error) {
        results[`${fk.childTable}.${fk.childKey}->${fk.parentTable}.${fk.parentKey}`] = { error: error.message };
      } else {
        results[`${fk.childTable}.${fk.childKey}->${fk.parentTable}.${fk.parentKey}`] = data;
      }
    } catch (e: any) {
      results[`${fk.childTable}.${fk.childKey}->${fk.parentTable}.${fk.parentKey}`] = { error: e.message };
    }
  }

  await fs.writeFile("diagnostics/orphaned-foreign-keys.json", JSON.stringify(results, null, 2));
  if (Object.values(results).every(arr => Array.isArray(arr) && arr.length === 0)) {
    console.log("[diagnostics] ✅ No orphaned foreign keys detected!");
  } else {
    console.log("[diagnostics] ⚠️  Orphaned foreign keys found! See diagnostics/orphaned-foreign-keys.json");
  }
}

main();