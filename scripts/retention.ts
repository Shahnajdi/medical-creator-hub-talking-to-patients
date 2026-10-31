import "dotenv/config";
import { runRetention } from "../src/lib/privacy/retention";
import { closeDb } from "../src/db";

runRetention()
  .then((s) => console.log("Retention complete", s))
  .finally(() => closeDb());
