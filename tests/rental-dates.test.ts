import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localDateTime,
  nextPickup,
  returnMinimum,
  suggestedReturn,
} from "../lib/rental-dates";

test("choosing pickup selects a later return automatically", () => {
  assert.equal(suggestedReturn("2027-01-10T10:00"), "2027-01-11T10:00");
  assert.equal(
    suggestedReturn("2027-01-10T10:00", "2027-01-09T10:00"),
    "2027-01-11T10:00",
  );
  assert.equal(
    suggestedReturn("2027-01-10T10:00", "2027-01-12T10:00"),
    "2027-01-12T10:00",
  );
});
test("date minimums reject pickup in the past and equal return times", () => {
  const now = new Date("2027-01-10T10:00:30");
  assert.ok(new Date(nextPickup(now)) > now);
  assert.equal(returnMinimum("2027-01-10T10:00"), "2027-01-10T10:01");
  assert.equal(localDateTime(new Date("invalid")), "");
});
