import { test } from "node:test";
import assert from "node:assert/strict";
import { parseComparison } from "../lib/comparison";

const car = { id: "car-1", make: "Audi", model: "A3", price: 50, image: "/vehicle-placeholder.svg", transmission: "a", fuel: "gas", seats: 5 };
test("corrupted or unexpected comparison data cannot break the page", () => {
  for (const raw of [null, "{", "null", "{}", '"text"', "[null, 4, {}]", "x".repeat(30001)]) assert.deepEqual(parseComparison(raw), []);
  assert.deepEqual(parseComparison(JSON.stringify([{ ...car, price: -1 }, { ...car, id: "../admin" }])), []);
});
test("comparison limits unique cars and sanitizes optional saved fields", () => {
  const parsed = parseComparison(JSON.stringify([car, car, ...[2, 3, 4].map((id) => ({ ...car, id: `car-${id}`, image: "javascript:alert(1)", usageTags: "invalid", seats: 99 }))]));
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].seats, 5);
  assert.equal(parsed[1].seats, null);
  assert.equal(parsed[1].image, "/vehicle-placeholder.svg");
  assert.deepEqual(parsed[1].usageTags, []);
});
