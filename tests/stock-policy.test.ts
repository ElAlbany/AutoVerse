import { test } from "node:test";
import assert from "node:assert/strict";
import { selectedBranch, stockQuantity } from "../lib/stock-policy";

test("stock quantities accept bounded integers and reject ambiguous numeric input", () => {
  assert.equal(stockQuantity("0"), 0);
  assert.equal(stockQuantity("3"), 3);
  assert.equal(stockQuantity("1000"), 1000);
  for (const value of [null, "", "-1", "1.5", "1e2", "Infinity", "1001", 3])
    assert.throws(() => stockQuantity(value), /whole number/);
});
test("branch browsing respects the requested branch and defaults to Frankfurt", () => {
  const branches = [{ id: "tirana" }, { id: "branch-main" }];
  assert.equal(selectedBranch(branches, "tirana")?.id, "tirana");
  assert.equal(selectedBranch(branches)?.id, "branch-main");
  assert.equal(selectedBranch(branches, "unknown")?.id, "branch-main");
  assert.equal(selectedBranch([{ id: "tirana" }])?.id, "tirana");
  assert.equal(selectedBranch([]), undefined);
});
