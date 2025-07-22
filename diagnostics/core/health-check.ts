import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const API_ENDPOINTS = [
  "http://localhost:3000/api/healthz",
  "http://localhost:3000/api/users",
  // Add more endpoints as needed
];

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testApiEndpoints() {
  const results: Record<string, string> = {};
  for (const url of API_ENDPOINTS) {
    try {
      const res = await axios.get(url);
      results[url] = `OK (${res.status})`;
    } catch (err: any) {
      results[url] = `ERROR: ${err.message}`;
    }
  }
  return results;
}

async function testDbConnection() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from("users").select("*").limit(1);
    return error ? `ERROR: ${error.message}` : "OK";
  } catch (err: any) {
    return `ERROR: ${err.message}`;
  }
}

async function main() {
  console.log("=== API ENDPOINTS ===");
  const apiResults = await testApiEndpoints();
  for (const [url, result] of Object.entries(apiResults)) {
    console.log(`${url}: ${result}`);
  }

  console.log("\n=== DATABASE ===");
  const dbResult = await testDbConnection();
  console.log("Supabase connection:", dbResult);
}

main();