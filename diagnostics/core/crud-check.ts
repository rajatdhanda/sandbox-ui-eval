import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TABLE = "diagnostics_test"; // Create a table with at least 'id', 'value'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runCrud() {
  // Create
  const { data: createData, error: createErr } = await supabase.from(TABLE).insert([{ value: "test" }]).select();
  if (createErr || !createData?.length) return `CREATE failed: ${createErr?.message}`;
  const id = createData[0].id;

  // Read
  const { data: readData, error: readErr } = await supabase.from(TABLE).select("*").eq("id", id);
  if (readErr || !readData?.length) return `READ failed: ${readErr?.message}`;

  // Update
  const { error: updateErr } = await supabase.from(TABLE).update({ value: "test-updated" }).eq("id", id);
  if (updateErr) return `UPDATE failed: ${updateErr.message}`;

  // Delete
  const { error: deleteErr } = await supabase.from(TABLE).delete().eq("id", id);
  if (deleteErr) return `DELETE failed: ${deleteErr.message}`;

  return "CRUD OK";
}

runCrud().then(console.log).catch(console.error);