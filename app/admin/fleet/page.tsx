import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  addVehicle,
  blockVehicle,
  releaseBlock,
  setVehicleEnabled,
  assignVehicle,
} from "@/app/actions/fleet";
import ActionForm from "@/components/admin/ActionForm";

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const search = (params.search || "").slice(0, 100);
  const now = new Date();
  const until = new Date(now.getTime() + 14 * 86400000);
  const [cars, units, conflicts, overdue] = await Promise.all([
    prisma.car.findMany({
      where: { archived: false },
      select: { id: true, make: true, model: true },
      orderBy: { make: "asc" },
      take: 250,
    }),
    prisma.vehicleUnit.findMany({
      where: search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { car: { model: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {},
      include: {
        car: true,
        reservations: {
          where: {
            active: true,
            endDate: { gt: now },
            startDate: { lt: until },
          },
          orderBy: { startDate: "asc" },
          include: { order: { select: { status: true } } },
        },
      },
      orderBy: { code: "asc" },
      take: 100,
    }),
    prisma.order.findMany({
      where: {
        inventoryConflict: true,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
      },
      include: { car: { include: { units: { where: { enabled: true } } } } },
      take: 50,
    }),
    prisma.order.findMany({
      where: { status: "ACTIVE", endDate: { lt: now } },
      select: { id: true, vehicleName: true, endDate: true },
      take: 50,
    }),
  ]);
  const fmt = (d: Date) =>
    d.toLocaleString("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <div className="space-y-6">
      <p className="av-eyebrow">Operations</p>
      <h1 className="text-3xl">Fleet & availability</h1>
      <p className="av-muted">
        Next 14 days · times shown in UTC · {units.length} vehicles shown.
        Rentals reserve a 60-minute preparation buffer. Add only physical
        vehicles you actually operate.
      </p>
      {!!overdue.length && (
        <section className="av-panel">
          <h2>Overdue vehicles need attention</h2>
          <p className="av-muted">
            These units are excluded from new allocation until staff record a
            return. Reassign any affected upcoming reservation before recording
            a late return.
          </p>
          {overdue.map((o) => (
            <p className="av-muted mt-3" key={o.id}>
              <Link className="underline" href={`/profile/orders/${o.id}`}>
                {o.vehicleName || o.id.slice(0, 8)}
              </Link>{" "}
              · expected {fmt(o.endDate)} UTC
            </p>
          ))}
        </section>
      )}
      {!!conflicts.length && (
        <section className="av-panel">
          <h2>Legacy assignments need attention</h2>
          <p className="av-muted mb-5">
            These listings were closed to new bookings during migration. Assign
            real units to each booking, then re-enable the listing in Cars.
          </p>
          {conflicts.map((o) => (
            <div
              key={o.id}
              className="py-4 border-t border-[var(--border-color)]"
            >
              <p className="av-muted mb-3">
                {o.car.make} {o.car.model} · {o.id.slice(0, 8)} ·{" "}
                {fmt(o.startDate)} → {fmt(o.endDate)}
              </p>
              <ActionForm action={assignVehicle} label="Assign vehicle">
                <input type="hidden" name="orderId" value={o.id} />
                <label className="av-field">
                  Physical vehicle
                  <select name="unitId" required>
                    {o.car.units.map((u) => (
                      <option value={u.id} key={u.id}>
                        {u.code}
                      </option>
                    ))}
                  </select>
                </label>
              </ActionForm>
            </div>
          ))}
        </section>
      )}
      <details className="av-panel">
        <summary className="cursor-pointer">Add a physical vehicle</summary>
        <div className="mt-5">
          <ActionForm action={addVehicle} label="Add to fleet">
            <label className="av-field">
              Listing
              <select name="carId" required>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.make} {c.model}
                  </option>
                ))}
              </select>
            </label>
            <label className="av-field">
              Unique internal fleet code
              <input name="code" required placeholder="AV-101" maxLength={40} />
            </label>
          </ActionForm>
        </div>
      </details>
      <form className="flex gap-3">
        <label className="av-field flex-1">
          <span className="sr-only">Search fleet</span>
          <input
            name="search"
            placeholder="Search fleet code or model"
            defaultValue={search}
          />
        </label>
        <button className="av-button">Search</button>
      </form>
      <section
        className="av-panel av-fleet-calendar"
        aria-label="Fleet reservations over the next fourteen days"
      >
        <div className="av-calendar-inner">
          <div className="av-calendar-row">
            <strong>Vehicle</strong>
            <div className="av-calendar-dates">
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i}>
                  {new Date(now.getTime() + i * 86400000).getUTCDate()}
                </span>
              ))}
            </div>
          </div>
          {units.map((u) => (
            <div className="av-calendar-row" key={u.id}>
              <span title={u.code}>
                {u.car.make} {u.car.model}
                <small>{u.code.slice(0, 18)}</small>
              </span>
              <div className="av-calendar-track">
                {u.reservations.map((r) => {
                  const left = Math.max(
                    0,
                    ((r.startDate.getTime() - now.getTime()) /
                      (14 * 86400000)) *
                      100,
                  );
                  const right = Math.min(
                    100,
                    ((r.endDate.getTime() - now.getTime()) / (14 * 86400000)) *
                      100,
                  );
                  return (
                    <span
                      key={r.id}
                      className={
                        r.orderId ? "av-calendar-rental" : "av-calendar-block"
                      }
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(0.5, right - left)}%`,
                      }}
                      title={`${r.order?.status || r.reason}: ${fmt(r.startDate)} to ${fmt(r.endDate)} UTC`}
                    >
                      {r.order?.status || "Maintenance"}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="av-muted mt-3">
          Pine: rental · Bronze: maintenance. Details and operational actions
          are listed below.
        </p>
      </section>
      <div className="space-y-4">
        {units.map((u) => (
          <section className="av-panel" key={u.id}>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="text-xl">
                  {u.car.make} {u.car.model}
                </h2>
                <p className="av-muted">
                  {u.code} · {u.enabled ? "In service" : "Offline"}
                </p>
              </div>
              <ActionForm
                action={setVehicleEnabled}
                label={u.enabled ? "Take offline" : "Return to service"}
              >
                <input type="hidden" name="unitId" value={u.id} />
                <input
                  type="hidden"
                  name="enabled"
                  value={String(!u.enabled)}
                />
              </ActionForm>
            </div>
            <div className="mt-4 space-y-3">
              {u.reservations.length ? (
                u.reservations.map((r) => (
                  <div key={r.id} className="av-alert">
                    <div className="flex justify-between flex-wrap gap-3">
                      <span>
                        {fmt(r.startDate)} → {fmt(r.endDate)} UTC ·{" "}
                        {r.order?.status || r.reason}
                      </span>
                      {r.orderId ? (
                        <div>
                          <Link
                            href={`/profile/orders/${r.orderId}`}
                            className="underline"
                          >
                            Booking {r.orderId.slice(0, 8)}
                          </Link>
                          <details className="mt-3">
                            <summary className="cursor-pointer">
                              Reassign vehicle
                            </summary>
                            <ActionForm action={assignVehicle} label="Assign">
                              <input
                                type="hidden"
                                name="orderId"
                                value={r.orderId}
                              />
                              <label className="av-field">
                                Physical vehicle
                                <select name="unitId">
                                  {units
                                    .filter(
                                      (other) =>
                                        other.carId === u.carId &&
                                        other.enabled,
                                    )
                                    .map((other) => (
                                      <option key={other.id} value={other.id}>
                                        {other.code}
                                      </option>
                                    ))}
                                </select>
                              </label>
                            </ActionForm>
                          </details>
                        </div>
                      ) : (
                        <ActionForm action={releaseBlock} label="Release block">
                          <input type="hidden" name="id" value={r.id} />
                        </ActionForm>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="av-muted">No reservations in the next 14 days.</p>
              )}
            </div>
            <details className="mt-5">
              <summary className="av-muted cursor-pointer">
                Schedule maintenance / cleaning
              </summary>
              <div className="mt-4">
                <ActionForm
                  action={blockVehicle}
                  label="Reserve maintenance time"
                >
                  <input type="hidden" name="unitId" value={u.id} />
                  <div className="av-form-row">
                    <label className="av-field">
                      Start (UTC)
                      <input name="start" type="datetime-local" required />
                    </label>
                    <label className="av-field">
                      End (UTC)
                      <input name="end" type="datetime-local" required />
                    </label>
                  </div>
                  <label className="av-field">
                    Reason
                    <input
                      name="reason"
                      maxLength={150}
                      placeholder="Maintenance"
                    />
                  </label>
                </ActionForm>
              </div>
            </details>
          </section>
        ))}
      </div>
    </div>
  );
}
