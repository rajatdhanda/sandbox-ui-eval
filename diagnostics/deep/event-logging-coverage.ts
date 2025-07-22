// path: diagnostics/event-logging-coverage.ts
import { promises as fs } from "fs";
const expectedEvents = [
  "user_created",
  "user_deleted",
  "user_updated",
  "order_created",
  "order_updated",
  "order_deleted",
  // Add your high-value events!
];
async function main() {
  // Pretend we read actual events from logs/event table or Sentry export, here just fake set:
  const foundEvents = new Set([
    // Fill this from a query to your logs/event table, or from Sentry, etc.
    "user_created", "order_created", "order_updated"
  ]);
  const missing = expectedEvents.filter(e => !foundEvents.has(e));
  await fs.writeFile("diagnostics/event-logging-coverage.json", JSON.stringify({ missing, found: Array.from(foundEvents) }, null, 2));
  if (missing.length) {
    console.log(`[diagnostics] ⚠️  Some important app events are not being logged! See diagnostics/event-logging-coverage.json`);
  } else {
    console.log(`[diagnostics] ✅ All key app events are logged.`);
  }
}
main();