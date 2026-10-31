export function localDateTime(date: Date) {
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function nextPickup(now = new Date()) {
  return localDateTime(
    new Date(Math.ceil((now.getTime() + 60000) / 60000) * 60000),
  );
}

export function returnMinimum(pickup: string, fallback = nextPickup()) {
  const date = new Date(pickup);
  return Number.isFinite(date.getTime())
    ? localDateTime(new Date(date.getTime() + 60000))
    : fallback;
}

export function suggestedReturn(pickup: string, current = "") {
  const start = new Date(pickup),
    end = new Date(current);
  if (!Number.isFinite(start.getTime())) return current;
  if (Number.isFinite(end.getTime()) && end > start) return current;
  start.setDate(start.getDate() + 1);
  return localDateTime(start);
}
