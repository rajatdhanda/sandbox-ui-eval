import "dotenv/config";
import { promises as fs } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getLiveTablesAndColumns() {
  // Query the correct meta table with dotted name
  const { data: tables, error: tablesError } = await client
    .from("pg_meta.tables")
    .select("id, name, schema")
    .eq("schema", "public");
  if (tablesError) throw tablesError;

  const result: Record<string, string[]> = {};

  for (const table of tables || []) {
    const { data: columns, error: columnsError } = await client
      .from("pg_meta.columns")
      .select("name")
      .eq("table_id", table.id);

    if (columnsError) throw columnsError;
    result[table.name] = (columns || []).map((col: any) => col.name);
  }
  return result;
}

async function getGeneratedTypes() {
  const file = await fs.readFile("lib/supabase/generated-types.ts", "utf8");
  const matches = file.matchAll(/Tables:\s*{([^}]*)}/g);
  const tables: Record<string, string[]> = {};

  for (const match of matches) {
    const content = match[1];
    const tableBlocks = content.matchAll(/(\w+):\s*{[^}]*Row:\s*{([^}]*)}/g);
    for (const tb of tableBlocks) {
      const table = tb[1];
      const rowBlock = tb[2];
      const fields = Array.from(rowBlock.matchAll(/(\w+):/g)).map(m => m[1]);
      tables[table] = fields;
    }
  }
  return tables;
}

function diffTables(live: Record<string, string[]>, generated: Record<string, string[]>) {
  const drift: any[] = [];

  for (const table in live) {
    if (!generated[table]) {
      drift.push({ table, error: "Missing in generated types" });
      continue;
    }
    const liveCols = new Set(live[table]);
    const genCols = new Set(generated[table]);
    for (const col of live[table]) {
      if (!genCols.has(col)) {
        drift.push({ table, column: col, error: "Missing in generated types" });
      }
    }
    for (const col of generated[table]) {
      if (!liveCols.has(col)) {
        drift.push({ table, column: col, error: "Column not in live schema" });
      }
    }
  }
  for (const table in generated) {
    if (!live[table]) {
      drift.push({ table, error: "Exists in generated, not in live DB" });
    }
  }
  return drift;
}

async function main() {
  try {
    const live = await getLiveTablesAndColumns();
    const generated = await getGeneratedTypes();
    const drift = diffTables(live, generated);
    await fs.writeFile("diagnostics/supabase-schema-drift.json", JSON.stringify(drift, null, 2));
    if (drift.length === 0) {
      console.log("[diagnostics] ✅ No schema drift detected!");
    } else {
      console.log(`[diagnostics] ⚠️  Schema drift found! See diagnostics/supabase-schema-drift.json`);
    }
  } catch (e: any) {
    console.error("[diagnostics] ❌ Schema drift check failed:", e.message);
    process.exit(1);
  }
}

main();