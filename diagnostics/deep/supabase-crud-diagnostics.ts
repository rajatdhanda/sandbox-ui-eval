import "dotenv/config"; // Always load env vars at the very top!
import { writeFileSync } from "fs";
import * as generated from "../lib/supabase/_generated";
import dotenv from "dotenv";
dotenv.config();

const TEST_DATA: Record<string, any> = {
  users: { full_name: "Diag Test User", email: `diag${Date.now()}@example.com` },
  classes: { name: "Diag Test Class" },
  children: { first_name: "Diag", last_name: "Child" },
  // Add other tables with minimal required fields!
};

async function testCrud(table: string, queries: any) {
  const result: any = { table };

  // CREATE
  if (queries[`insert${capitalize(table)}`]) {
    try {
      const insertRes = await queries[`insert${capitalize(table)}`]([TEST_DATA[table]]);
      result.create = { ok: !insertRes.error, error: insertRes.error?.message };
      if (insertRes.data && insertRes.data[0] && insertRes.data[0].id) result.createdId = insertRes.data[0].id;
    } catch (e: any) {
      result.create = { ok: false, error: e.message };
    }
  }

  // READ
  if (queries[`get${capitalize(table)}`]) {
    try {
      const readRes = await queries[`get${capitalize(table)}`]();
      result.read = { ok: !readRes.error, count: readRes.data?.length, error: readRes.error?.message };
    } catch (e: any) {
      result.read = { ok: false, error: e.message };
    }
  }

  // UPDATE
  if (result.createdId && queries[`update${capitalize(table)}`]) {
    try {
      const updateRes = await queries[`update${capitalize(table)}`](result.createdId, { updated_at: new Date().toISOString() });
      result.update = { ok: !updateRes.error, error: updateRes.error?.message };
    } catch (e: any) {
      result.update = { ok: false, error: e.message };
    }
  }

  // DELETE
  if (result.createdId && queries[`delete${capitalize(table)}`]) {
    try {
      const deleteRes = await queries[`delete${capitalize(table)}`](result.createdId);
      result.delete = { ok: !deleteRes.error, error: deleteRes.error?.message };
    } catch (e: any) {
      result.delete = { ok: false, error: e.message };
    }
  }

  return result;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function main() {
  // Discover all tables with generated query functions
  const tables = Object.keys(generated)
    .filter(k => k.startsWith("get") && typeof (generated as any)[k] === "function")
    .map(k => k.replace(/^get/, "").toLowerCase());

  const queries: any = {};
  for (const name of Object.keys(generated)) {
    queries[name] = (generated as any)[name];
  }

  const results = [];
  for (const table of tables) {
    results.push(await testCrud(table, queries));
  }

  writeFileSync("diagnostics/supabase-crud-report.json", JSON.stringify(results, null, 2));
  console.log("[diagnostics] Supabase CRUD diagnostics written to diagnostics/supabase-crud-report.json");
}

main();