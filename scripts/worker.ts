import "dotenv/config";
import { runJobsOnce } from "../src/lib/jobs/handlers";
import { runRetention } from "../src/lib/privacy/retention";

let stopping = false;
process.on("SIGTERM", () => (stopping = true));
process.on("SIGINT", () => (stopping = true));

async function main() {
  let lastRetention = 0;
  console.log("worker started");
  while (!stopping) {
    const n = await runJobsOnce(20).catch((e) => (console.error(e), 0));
    if (Date.now() - lastRetention > 24 * 3600_000) {
      await runRetention().then((s) => console.log("retention", s)).catch(console.error);
      lastRetention = Date.now();
    }
    if (n === 0) await new Promise((r) => setTimeout(r, 2000));
  }
  process.exit(0);
}
main();
