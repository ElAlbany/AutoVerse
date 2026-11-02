import { test } from "node:test";
import assert from "node:assert/strict";
import { RentalError, actionError, runAction } from "../lib/action-result";

test("actions preserve business errors and redact infrastructure errors", async () => {
  assert.equal(actionError(new RentalError("No cars remain.")), "No cars remain.");
  const result = await runAction(async () => { throw new Error("postgresql://secret"); });
  assert.deepEqual(result, { ok: false, error: "This action could not be completed. Please try again." });
  assert.deepEqual(await runAction(async () => {}), { ok: true });
  assert.deepEqual(await runAction(async () => { throw new RentalError("Choose a branch."); }), { ok: false, error: "Choose a branch." });
});
