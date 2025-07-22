// path: diagnostics/permissions-crud-diagnostics.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

const roles = ["anon", "authenticated"];
const actions = ["select", "insert", "update", "delete"];

async function main() {
  const { data, error } = await client.rpc("list_table_permissions");
  if (error) throw error;
  const issues: Record<string, any> = {};

  for (const { table_name, role, action, allowed } of data as any[]) {
    if (roles.includes(role) && actions.includes(action) && !allowed) {
      if (!issues[table_name]) issues[table_name] = {};
      if (!issues[table_name][role]) issues[table_name][role] = [];
      issues[table_name][role].push(action);
    }
  }

  await fs.writeFile("diagnostics/permissions-crud-report.json", JSON.stringify(issues, null, 2));
  if (Object.keys(issues).length) {
    console.log("[diagnostics] ⚠️  CRUD permission issues found! See diagnostics/permissions-crud-report.json");
  } else {
    console.log("[diagnostics] ✅ All tables have CRUD permissions for anon/authenticated.");
  }
}
main();