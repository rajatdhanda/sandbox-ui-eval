// path: diagnostics/crud-action-simulation.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const TEST_KEY = process.env.SUPABASE_TEST_KEY; // Set this to a real user's key in .env!
const client = createClient(SUPABASE_URL!, TEST_KEY!);

async function getTables() {
  // Use list_table_columns or information_schema.tables
  const { data, error } = await client.from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public");
  if (error) throw error;
  return data.map((row: any) => row.table_name);
}

async function run() {
  const tables = await getTables();
  const results: any = {};
  for (const table of tables) {
    results[table] = {};
    for (const action of ["select", "insert", "update", "delete"]) {
      try {
        if (action === "select") {
          await client.from(table).select("*").limit(1);
        } else if (action === "insert") {
          await client.from(table).insert({}); // Try empty insert
        } else if (action === "update") {
          await client.from(table).update({}).limit(1);
        } else if (action === "delete") {
          await client.from(table).delete().limit(1);
        }
        results[table][action] = "ok";
      } catch (e: any) {
        results[table][action] = e.message || "error";
      }
    }
  }
  await fs.writeFile("diagnostics/crud-action-simulation.json", JSON.stringify(results, null, 2));
  console.log("[diagnostics] CRUD simulation complete. See diagnostics/crud-action-simulation.json");
}
run();