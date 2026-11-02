export const VEHICLE_USES = [
  {
    id: "CITY",
    label: "City driving",
    description: "Everyday travel on maintained urban roads.",
  },
  {
    id: "INTERCITY",
    label: "Between cities",
    description: "Travel on maintained main roads and motorways.",
  },
  {
    id: "LONG_DISTANCE",
    label: "Long-distance touring",
    description: "Selected by the operator for longer journeys and comfort.",
  },
  {
    id: "SHORT_TRIPS",
    label: "Short trips",
    description: "A practical choice for errands and shorter journeys.",
  },
  {
    id: "FAMILY",
    label: "Family journeys",
    description:
      "Passenger capacity and child-seat arrangements must match your party.",
  },
  {
    id: "PAVED_MOUNTAIN",
    label: "Paved mountain routes",
    description:
      "Maintained paved routes only; weather, tyres, road access and rental rules still apply.",
  },
  {
    id: "ROUGH_ROAD",
    label: "Rough-road equipped",
    description:
      "Operator-approved equipment; route-specific permission is still required. No blanket off-road or dangerous-road approval.",
  },
] as const;

export function useLabel(id: string) {
  return VEHICLE_USES.find((tag) => tag.id === id)?.label || id;
}

export function validateVehicleUses(
  tags: string[],
  capabilities: {
    groundClearanceMm: number | null;
    lowRange4x4: boolean;
    suitableTyres: boolean;
    roughRoadApproved: boolean;
  },
) {
  if (tags.some((tag) => !VEHICLE_USES.some((option) => option.id === tag)))
    throw new Error("Choose only supported driving tags.");
  if (
    tags.includes("ROUGH_ROAD") &&
    (!capabilities.roughRoadApproved ||
      !capabilities.lowRange4x4 ||
      !capabilities.suitableTyres ||
      (capabilities.groundClearanceMm || 0) < 205)
  )
    throw new Error(
      "Rough-road tagging needs operator approval, verified low-range 4WD, suitable tyres and at least 205 mm ground clearance. AWD alone is insufficient.",
    );
  return [...new Set(tags)];
}
