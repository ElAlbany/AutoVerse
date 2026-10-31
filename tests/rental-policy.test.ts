import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bufferedEnd,
  canCancel,
  quoteRental,
  validatePeriod,
} from "../lib/rental-policy";
import { safeReturnTo } from "../lib/sign-in";

const now = new Date("2026-11-01T12:00:00Z");
test("quotes use exact cents and started 24-hour periods", () => {
  const quote = quoteRental(
    49.95,
    new Date("2026-11-02T12:00:00Z"),
    new Date("2026-11-03T12:01:00Z"),
    now,
  );
  assert.equal(quote.days, 2);
  assert.equal(quote.totalCents, 9990);
});
test("invalid, reversed, past and overlong periods are rejected", () => {
  for (const [a, b] of [
    ["invalid", "2026-11-02"],
    ["2026-11-02", "2026-11-01"],
    ["2026-11-01", "2026-11-02"],
    ["2026-11-02", "2027-04-01"],
  ])
    assert.throws(() => validatePeriod(new Date(a), new Date(b), now));
});
test("cancellation closes exactly 48 hours before pickup", () => {
  assert.equal(canCancel(new Date("2026-11-03T12:00:00Z"), now), false);
  assert.equal(canCancel(new Date("2026-11-03T12:00:01Z"), now), true);
});
test("preparation affects inventory but not charged duration", () => {
  assert.equal(bufferedEnd(now).toISOString(), "2026-11-01T13:00:00.000Z");
});
test("sign-in returns cannot redirect outside the application", () => {
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/\n/evil.test",
  ])
    assert.equal(safeReturnTo(value), "/profile/orders");
  assert.equal(
    safeReturnTo("/rent?carId=123&start=2026-12-01T10%3A00Z"),
    "/rent?carId=123&start=2026-12-01T10%3A00Z",
  );
});
