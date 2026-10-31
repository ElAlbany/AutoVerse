import { test } from "node:test";
import assert from "node:assert/strict";
import { validateVehicleUses } from "../lib/vehicle-use";
const unverified = {
  groundClearanceMm: null,
  lowRange4x4: false,
  suitableTyres: false,
  roughRoadApproved: false,
};
test("rough-road claims require verified equipment and operator approval", () => {
  assert.throws(
    () => validateVehicleUses(["ROUGH_ROAD"], unverified),
    /AWD alone/,
  );
  const verified = {
    groundClearanceMm: 210,
    lowRange4x4: true,
    suitableTyres: true,
    roughRoadApproved: true,
  };
  for (const capability of [
    "lowRange4x4",
    "suitableTyres",
    "roughRoadApproved",
  ])
    assert.throws(() =>
      validateVehicleUses(["ROUGH_ROAD"], { ...verified, [capability]: false }),
    );
  assert.throws(() =>
    validateVehicleUses(["ROUGH_ROAD"], {
      ...verified,
      groundClearanceMm: 180,
    }),
  );
  assert.deepEqual(validateVehicleUses(["ROUGH_ROAD"], verified), [
    "ROUGH_ROAD",
  ]);
});
test("journey tags are explicit and use a controlled vocabulary", () => {
  assert.deepEqual(
    validateVehicleUses(["CITY", "INTERCITY", "CITY"], unverified),
    ["CITY", "INTERCITY"],
  );
  assert.throws(() =>
    validateVehicleUses(["SAFE_ON_ALL_MOUNTAINS"], unverified),
  );
});
