import { promises as fs } from "fs";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const mediaDir = "./public/uploads"; // Adjust as needed
  const files = new Set(await fs.readdir(mediaDir));
  const { data, error } = await client.from("photos").select("file_name"); // Adjust table/column as needed
  if (error) throw error;
  const referenced = new Set(data.map((row: any) => row.file_name));
  const orphaned = Array.from(files).filter(f => !referenced.has(f));
  await fs.writeFile("diagnostics/orphaned-static-assets.json", JSON.stringify(orphaned, null, 2));
  if (orphaned.length) {
    console.log("[diagnostics] ⚠️  Orphaned files found! See diagnostics/orphaned-static-assets.json");
  } else {
    console.log("[diagnostics] ✅ No orphaned static assets detected.");
  }
}
main();