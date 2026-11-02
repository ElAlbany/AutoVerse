export function searchValue(value: unknown, limit = 100) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function pageWindow(value: unknown, total: number, size = 20) {
  const pages = Math.max(1, Math.ceil(total / size));
  const requested = typeof value === "string" && /^[1-9]\d{0,8}$/.test(value) ? Number(value) : 1;
  const page = Math.min(requested, pages);
  return { page, pages, size, skip: (page - 1) * size, total };
}

export function analyticsRange(from: unknown, to: unknown) {
  const parse = (value: unknown) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  };
  const start = from ? parse(from) : undefined;
  const end = to ? parse(to) : undefined;
  if (start === null || end === null || (start && end && start > end)) {
    return { error: "Choose valid UTC dates with the end on or after the start. The custom date filter was not applied." };
  }
  return {
    start: start || undefined,
    end: end ? new Date(end.getTime() + 86400000 - 1) : undefined,
  };
}
