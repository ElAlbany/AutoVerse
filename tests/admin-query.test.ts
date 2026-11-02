import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsRange, pageWindow, searchValue } from "../lib/admin-query";

test("admin pagination stays bounded for malformed and stale links", () => {
  for (const value of [undefined, "NaN", "-1", "0", "2x", "1e9", ["2"], "99999999999999"]) assert.equal(pageWindow(value, 100).page, 1);
  assert.deepEqual(pageWindow("999", 41), { page: 3, pages: 3, size: 20, skip: 40, total: 41 });
  assert.equal(pageWindow("2", 0).skip, 0);
  assert.equal(searchValue(["bad"]), "");
  assert.equal(searchValue(" x "), "x");
});
test("analytics date filters reject invalid calendar dates and include the complete UTC end day", () => {
  for (const [from, to] of [["invalid", "2026-11-02"], ["2026-02-30", "2026-03-01"], ["2026-11-03", "2026-11-02"], [["2026-11-01"], "2026-11-02"]]) assert.ok(analyticsRange(from, to).error);
  const range = analyticsRange("2026-10-25", "2026-10-25");
  assert.equal(range.start?.toISOString(), "2026-10-25T00:00:00.000Z");
  assert.equal(range.end?.toISOString(), "2026-10-25T23:59:59.999Z");
  assert.equal(analyticsRange(undefined, undefined).error, undefined);
});
