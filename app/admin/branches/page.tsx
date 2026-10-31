import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { freeUnitWhere } from "@/lib/inventory";
import { validatePeriod } from "@/lib/rental-policy";
import { saveBranch } from "@/app/actions/branches";
import ActionForm from "@/components/admin/ActionForm";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const start = params.start
    ? new Date(params.start + "Z")
    : new Date(Date.now() + 3600000);
  const end = params.end
    ? new Date(params.end + "Z")
    : new Date(start.getTime() + 86400000);
  let error = "";
  try {
    validatePeriod(start, end);
  } catch (e) {
    error = e instanceof Error ? e.message : "Invalid dates.";
  }
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: {
      units: {
        include: {
          car: {
            select: {
              id: true,
              make: true,
              model: true,
              archived: true,
              available: true,
            },
          },
        },
      },
    },
  });
  const free = error
    ? []
    : await prisma.vehicleUnit.findMany({
        where: {
          ...freeUnitWhere(start, end),
          car: { archived: false, available: true },
        },
        select: { id: true },
      });
  const freeIds = new Set(free.map((u) => u.id));
  const fields = (b?: (typeof branches)[number]) => (
    <>
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="av-form-row">
        <label className="av-field">
          Branch name
          <input name="name" required maxLength={100} defaultValue={b?.name} />
        </label>
        <label className="av-field">
          City
          <input name="city" required maxLength={100} defaultValue={b?.city} />
        </label>
      </div>
      <label className="av-field">
        Collection address
        <input name="address" maxLength={300} defaultValue={b?.address || ""} />
      </label>
      <label className="av-muted flex gap-3">
        <input
          name="active"
          type="checkbox"
          defaultChecked={b?.active ?? true}
        />
        Accept new bookings
      </label>
    </>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Branches & stock</h1>
      <p className="av-muted">
        Stock is calculated from physical vehicles, bookings, maintenance and
        preparation time. Cancellation releases a vehicle; a return releases it
        after preparation. Existing bookings remain when a branch is closed.
      </p>
      <form className="av-panel flex flex-wrap items-end gap-4">
        <label className="av-field">
          Pickup (UTC)
          <input
            type="datetime-local"
            name="start"
            defaultValue={
              Number.isFinite(start.getTime())
                ? start.toISOString().slice(0, 16)
                : ""
            }
            required
          />
        </label>
        <label className="av-field">
          Return (UTC)
          <input
            type="datetime-local"
            name="end"
            defaultValue={
              Number.isFinite(end.getTime())
                ? end.toISOString().slice(0, 16)
                : ""
            }
            required
          />
        </label>
        <button className="av-button">Check stock</button>
      </form>
      {error && (
        <p role="alert" className="av-alert">
          {error}
        </p>
      )}
      <details className="av-panel">
        <summary className="cursor-pointer">Create a branch</summary>
        <ActionForm action={saveBranch} label="Create branch">
          {fields()}
        </ActionForm>
      </details>
      {branches.map((b) => {
        const groups = new Map<
          string,
          { name: string; total: number; enabled: number; free: number }
        >();
        for (const u of b.units) {
          const g = groups.get(u.carId) || {
            name: `${u.car.make} ${u.car.model}`,
            total: 0,
            enabled: 0,
            free: 0,
          };
          g.total++;
          if (u.enabled) g.enabled++;
          if (freeIds.has(u.id)) g.free++;
          groups.set(u.carId, g);
        }
        return (
          <section key={b.id} className="av-panel space-y-4">
            <h2 className="text-2xl">
              {b.name}{" "}
              <span className="av-muted text-sm">
                {b.active ? "Open" : "Closed to new bookings"}
              </span>
            </h2>
            <p className="av-muted">
              {b.city} Â· {b.address || "Add collection instructions"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...groups].map(([id, g]) => (
                <div key={id} className="av-alert">
                  <strong>{g.name}</strong>
                  <p className="av-muted">
                    {g.total} physical Â· {g.enabled} in service Â·{" "}
                    {error ? "â€”" : g.free} available for these dates
                  </p>
                </div>
              ))}
            </div>
            {!b.units.length && (
              <p className="av-muted">
                No vehicles assigned. Add or transfer units in Fleet.
              </p>
            )}
            <details>
              <summary className="cursor-pointer">Edit branch</summary>
              <ActionForm action={saveBranch} label="Save branch">
                {fields(b)}
              </ActionForm>
            </details>
          </section>
        );
      })}
    </div>
  );
}
