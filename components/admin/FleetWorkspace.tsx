"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import FleetMaintenanceForm from "./FleetMaintenanceForm";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  List,
  MapPin,
  Plus,
  Search,
  RefreshCw,
  X,
} from "lucide-react";
import {
  addVehicle,
  assignVehicle,
  releaseBlock,
  setVehicleEnabled,
} from "@/app/actions/fleet";
import {
  bookingIsOverdue,
  canAssignFleetVehicle,
  fleetDate,
  fleetHref,
  fleetSegments,
  fleetVehicleState,
  shiftFleetDate,
  type FleetBooking,
  type FleetReservation,
  type FleetVehicle,
  type FleetWorkspaceData,
} from "@/lib/fleet-calendar";
import ActionForm from "./ActionForm";

type Panel = "add" | "attention" | "help" | null;
const DAY = 86400000;

function FleetDialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="av-fleet-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="av-fleet-dialog-heading">
        <div>
          <p className="av-eyebrow">{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          type="button"
          className="av-icon-button"
          aria-label="Close panel"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
      </div>
      <div className="av-fleet-dialog-body">{children}</div>
    </dialog>
  );
}

function StateBadge({ kind, label }: { kind: string; label: string }) {
  return (
    <span className={`av-fleet-badge av-fleet-kind-${kind}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}
function visibleReservations(unit: FleetVehicle, data: FleetWorkspaceData) {
  return unit.reservations.filter((r) =>
    fleetSegments(r, data.now, data.window.end).some(
      (s) => s.start < data.window.end && s.end > data.window.start,
    ),
  );
}
function BookingAssignment({
  order,
  data,
}: {
  order: FleetBooking;
  data: FleetWorkspaceData;
}) {
  const choices = data.alternatives.filter((u) =>
    canAssignFleetVehicle(u, order, data.now),
  );
  return choices.length ? (
    <ActionForm
      key={order.id}
      action={assignVehicle}
      label="Save vehicle assignment"
    >
      <input type="hidden" name="orderId" value={order.id} />
      <label className="av-field">
        Choose a free vehicle
        <select name="unitId" required>
          <option value="">Select a fleet code</option>
          {choices.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code}
            </option>
          ))}
        </select>
      </label>
      <p className="av-muted">
        Only vehicles of this model at the booked branch, free for the full
        rental and preparation period, are listed. Availability is checked again
        when saved.
      </p>
    </ActionForm>
  ) : (
    <p className="av-alert">
      No suitable vehicle is free for the full booking. Add a real vehicle to
      this branch or resolve its conflicting schedule first.
    </p>
  );
}

function ReservationCard({
  reservation: r,
  data,
  expanded = false,
}: {
  reservation: FleetReservation;
  data: FleetWorkspaceData;
  expanded?: boolean;
}) {
  const overdue = bookingIsOverdue(r.order, data.now);
  const preparing = r.order?.status === "COMPLETED";
  return (
    <article
      className={`av-fleet-event-card ${overdue ? "av-fleet-event-overdue" : ""}`}
    >
      <div className="flex flex-wrap justify-between items-start gap-2">
        <strong>
          {r.order ? `Booking #${r.order.id.slice(0, 8)}` : r.reason}
        </strong>
        <StateBadge
          kind={
            overdue
              ? "overdue"
              : !r.order
                ? "maintenance"
                : preparing
                  ? "preparation"
                  : r.order.status === "PENDING"
                    ? "hold"
                    : "rental"
          }
          label={
            overdue
              ? "Overdue"
              : !r.order
                ? "Maintenance"
                : preparing
                  ? "Preparing"
                  : r.order.status === "PENDING"
                    ? "Checkout hold"
                    : r.order.status === "ACTIVE"
                      ? "On rent"
                      : "Confirmed"
          }
        />
      </div>
      <dl className="av-fleet-event-dates">
        <div>
          <dt>{r.order ? "Pickup" : "From"}</dt>
          <dd>{fleetDate(r.order?.startDate || r.startDate)}</dd>
        </div>
        <div>
          <dt>{r.order ? "Scheduled return" : "Until"}</dt>
          <dd>{fleetDate(r.order?.endDate || r.endDate)}</dd>
        </div>
      </dl>
      {r.order && (
        <p className="av-muted">
          {preparing ? "Preparation ends" : "Vehicle reserved through"}{" "}
          {fleetDate(r.endDate)} UTC
          {preparing ? "." : " · includes preparation."}
        </p>
      )}
      {overdue && (
        <p className="av-alert mt-3">
          Return has not been recorded. This car remains unavailable for new
          rentals. Review any upcoming booking before recording its return.
        </p>
      )}
      {r.order ? (
        <>
          <Link
            className="av-text-link mt-3"
            href={`/profile/orders/${r.order.id}`}
          >
            Open booking <ArrowRight size={14} />
          </Link>
          {["PENDING", "CONFIRMED", "ACTIVE"].includes(r.order.status) && (
            <details
              className="av-fleet-disclosure"
              open={expanded || undefined}
            >
              <summary>Change assigned vehicle</summary>
              <BookingAssignment order={r.order} data={data} />
            </details>
          )}
        </>
      ) : (
        <details className="av-fleet-disclosure">
          <summary>Release this maintenance block</summary>
          <p className="av-muted mb-3">
            Release only when the car no longer needs this time reserved.
          </p>
          <ActionForm action={releaseBlock} label="Release reserved time">
            <input type="hidden" name="id" value={r.id} />
          </ActionForm>
        </details>
      )}
    </article>
  );
}

function FleetTimeline({
  data,
  onSelect,
}: {
  data: FleetWorkspaceData;
  onSelect: (unit: FleetVehicle, reservationId?: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const from = new Date(data.window.start).getTime();
  const length = data.window.days * DAY;
  const todayOffset = ((new Date(data.now).getTime() - from) / length) * 100;
  return (
    <section className="av-fleet-timeline" aria-label="Fleet timeline">
      <div className="av-fleet-timeline-tools">
        <span>Choose a vehicle or a booking to see details.</span>
        <div>
          <button
            type="button"
            aria-label="Scroll schedule left"
            onClick={() =>
              viewport.current?.scrollBy({ left: -320, behavior: "smooth" })
            }
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Scroll schedule right"
            onClick={() =>
              viewport.current?.scrollBy({ left: 320, behavior: "smooth" })
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        className="av-fleet-scroll"
        role="region"
        aria-label="Vehicle schedule; scroll horizontally to see more dates"
        tabIndex={0}
        ref={viewport}
        onPointerDown={(e) => {
          if (
            e.pointerType === "mouse" &&
            e.button === 0 &&
            !(e.target as HTMLElement).closest("button,a,input")
          )
            drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft };
        }}
        onPointerMove={(e) => {
          if (
            drag.current &&
            e.buttons & 1 &&
            Math.abs(e.clientX - drag.current.x) > 5
          ) {
            e.currentTarget.setPointerCapture(e.pointerId);
            e.currentTarget.scrollLeft =
              drag.current.left - (e.clientX - drag.current.x);
            e.preventDefault();
          }
        }}
        onPointerUp={(e) => {
          drag.current = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="av-fleet-grid"
          style={{ minWidth: 210 + data.window.days * 64 }}
        >
          <div className="av-fleet-grid-row av-fleet-grid-head">
            <div className="av-fleet-vehicle-cell">
              <strong>Physical vehicle</strong>
              <small>Fleet code / current status</small>
            </div>
            <div
              className="av-fleet-day-headings"
              style={{ gridTemplateColumns: `repeat(${data.window.days},1fr)` }}
            >
              {Array.from({ length: data.window.days }, (_, i) => {
                const day = shiftFleetDate(data.window.date, i);
                const date = new Date(`${day}T00:00:00Z`);
                return (
                  <div
                    key={day}
                    className={day === data.window.today ? "is-today" : ""}
                  >
                    <span>
                      {date.toLocaleDateString("en-GB", {
                        timeZone: "UTC",
                        weekday: "short",
                      })}
                    </span>
                    <strong>
                      {date.getUTCDate()}{" "}
                      <small>
                        {date.toLocaleDateString("en-GB", {
                          timeZone: "UTC",
                          month: "short",
                        })}
                      </small>
                    </strong>
                    {day === data.window.today && <em>Today</em>}
                  </div>
                );
              })}
            </div>
          </div>
          {data.units.map((unit) => {
            const state = fleetVehicleState(unit, data.now);
            const reservations = visibleReservations(unit, data);
            const hasOverdue = reservations.some((r) =>
              bookingIsOverdue(r.order, data.now),
            );
            return (
              <div
                key={unit.id}
                className={`av-fleet-grid-row ${!unit.enabled ? "is-offline" : ""}`}
              >
                <button
                  type="button"
                  className="av-fleet-vehicle-cell av-fleet-vehicle-button"
                  aria-label={`Manage vehicle ${unit.code}`}
                  onClick={() => onSelect(unit)}
                >
                  <strong className="capitalize">
                    {unit.car.make} {unit.car.model}
                  </strong>
                  <span>{unit.code}</span>
                  <StateBadge {...state} />
                </button>
                <div
                  className="av-fleet-lanes"
                  style={{ backgroundSize: `${100 / data.window.days}% 100%` }}
                >
                  {todayOffset >= 0 && todayOffset < 100 && (
                    <span
                      className="av-fleet-now-line"
                      style={{ left: `${todayOffset}%` }}
                      title="Current time"
                    />
                  )}
                  {reservations
                    .flatMap((r) => fleetSegments(r, data.now, data.window.end))
                    .map((segment) => {
                      const left = Math.max(
                        0,
                        ((new Date(segment.start).getTime() - from) / length) *
                          100,
                      );
                      const right = Math.min(
                        100,
                        ((new Date(segment.end).getTime() - from) / length) *
                          100,
                      );
                      if (right <= left) return null;
                      return (
                        <button
                          key={`${segment.reservation.id}-${segment.kind}`}
                          type="button"
                          className={`av-fleet-bar av-fleet-kind-${segment.kind}`}
                          style={{
                            left: `${left}%`,
                            width: `${right - left}%`,
                            top: hasOverdue
                              ? segment.kind === "overdue"
                                ? 8
                                : 43
                              : 25,
                          }}
                          onClick={() => onSelect(unit, segment.reservation.id)}
                          aria-label={`${unit.code}: ${segment.label}, ${fleetDate(segment.start)} to ${fleetDate(segment.end)} UTC`}
                          title={`${segment.label} · ${fleetDate(segment.start)} → ${segment.kind === "overdue" ? "return not recorded" : fleetDate(segment.end)} UTC`}
                        >
                          {segment.label}
                          {segment.reservation.orderId &&
                            segment.kind !== "preparation" &&
                            ` · #${segment.reservation.orderId.slice(0, 6)}`}
                        </button>
                      );
                    })}
                  {!reservations.length && (
                    <span className="av-fleet-no-bookings">
                      No scheduled items
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="av-fleet-scroll-hint">
        Drag the empty schedule, use Shift + wheel, or use the arrows above to
        move across dates.
      </p>
    </section>
  );
}

export default function FleetWorkspace({ data }: { data: FleetWorkspaceData }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [view, setView] = useState<"timeline" | "list">("timeline");
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(
    null,
  );
  const [tab, setTab] = useState<"schedule" | "maintenance" | "settings">(
    "schedule",
  );
  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) setView("list");
  }, []);
  const unit = data.units.find((u) => u.id === selected);
  const selectedEvents = unit ? visibleReservations(unit, data) : [];
  const href = (changes: Record<string, string | number> = {}) =>
    fleetHref(data.window, data.filters, changes);
  const select = (vehicle: FleetVehicle, reservationId?: string) => {
    setSelected(vehicle.id);
    setSelectedReservation(reservationId || null);
    setTab("schedule");
  };
  const rangeEnd = shiftFleetDate(data.window.date, data.window.days - 1);
  const activeFilters = Boolean(
    data.filters.branchId ||
    data.filters.search ||
    data.filters.service !== "all",
  );
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <div className="av-fleet-workspace">
      <header className="av-fleet-heading">
        <div>
          <p className="av-eyebrow">Fleet operations</p>
          <h1>Fleet calendar</h1>
          <p className="av-muted">
            Plan bookings, returns and maintenance for each physical car.
          </p>
        </div>
        <div className="av-fleet-heading-actions">
          <button
            type="button"
            className="av-button av-button-outline av-button-small"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            className="av-button av-button-outline av-button-small"
            onClick={() => setPanel("help")}
          >
            <CircleHelp size={16} />
            How to use
          </button>
          <button
            type="button"
            className="av-button av-button-small"
            onClick={() => setPanel("add")}
          >
            <Plus size={17} />
            Add vehicle
          </button>
        </div>
      </header>
      <div className="av-fleet-stats" aria-label="Fleet overview">
        {[
          { label: "All vehicles", value: data.counts.all, service: "all" },
          {
            label: "In service",
            value: data.counts.enabled,
            service: "enabled",
          },
          { label: "Offline", value: data.counts.offline, service: "offline" },
        ].map((item) => (
          <Link
            prefetch={false}
            href={href({ service: item.service })}
            key={item.label}
            className={
              data.filters.service === item.service ? "is-selected" : ""
            }
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </Link>
        ))}
        <div>
          <span>Scheduled items in view</span>
          <strong>{data.counts.scheduled}</strong>
        </div>
      </div>
      {data.attention.total > 0 && (
        <section className="av-fleet-attention" aria-label="Fleet issues">
          <div>
            <strong>
              {data.attention.total}{" "}
              {data.attention.total === 1
                ? "fleet issue needs"
                : "fleet issues need"}{" "}
              attention
            </strong>
            <p>
              Overdue returns or missing vehicle assignments
              {data.filters.branchId
                ? " at this branch"
                : " across your branches"}
              .
            </p>
          </div>
          <button
            type="button"
            className="av-button av-button-small av-button-outline"
            onClick={() => setPanel("attention")}
          >
            Review issues <ArrowRight size={15} />
          </button>
        </section>
      )}
      <section
        className="av-fleet-board"
        aria-label="Schedule controls and vehicles"
      >
        <form
          action="/admin/fleet"
          className="av-fleet-filters"
          key={`${data.filters.search}-${data.filters.branchId}-${data.filters.service}-${data.window.date}-${data.window.days}`}
        >
          <input type="hidden" name="date" value={data.window.date} />
          <input type="hidden" name="days" value={data.window.days} />
          <label className="av-field av-fleet-search">
            <span>
              <Search size={14} />
              Find a vehicle
            </span>
            <input
              name="search"
              placeholder="Make, model or fleet code"
              maxLength={100}
              defaultValue={data.filters.search}
            />
          </label>
          <label className="av-field">
            <span>Collection branch</span>
            <select name="branchId" defaultValue={data.filters.branchId}>
              <option value="">All branches</option>
              {data.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {!b.active ? " · closed" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="av-field">
            <span>Service status</span>
            <select name="service" defaultValue={data.filters.service}>
              <option value="all">All vehicles</option>
              <option value="enabled">In service</option>
              <option value="offline">Offline</option>
            </select>
          </label>
          <button className="av-button av-button-small">Apply filters</button>
        </form>
        <div className="av-fleet-period">
          <div className="av-fleet-period-navigation">
            <Link
              prefetch={false}
              href={href({
                date: shiftFleetDate(data.window.date, -data.window.days),
              })}
              className="av-icon-button"
              aria-label={`Previous ${data.window.days} days`}
            >
              <ChevronLeft size={20} />
            </Link>
            <Link
              prefetch={false}
              href={href({ date: data.window.today })}
              className="av-button av-button-small av-button-outline"
            >
              Today
            </Link>
            <Link
              prefetch={false}
              href={href({
                date: shiftFleetDate(data.window.date, data.window.days),
              })}
              className="av-icon-button"
              aria-label={`Next ${data.window.days} days`}
            >
              <ChevronRight size={20} />
            </Link>
          </div>
          <div className="av-fleet-range-label">
            <strong>
              {fleetDate(data.window.start, false)} —{" "}
              {fleetDate(`${rangeEnd}T00:00:00Z`, false)} {rangeEnd.slice(0, 4)}
            </strong>
            <span>All schedule times are UTC</span>
          </div>
          <form action="/admin/fleet" className="av-fleet-period-form">
            <input
              type="hidden"
              name="branchId"
              value={data.filters.branchId}
            />
            <input type="hidden" name="search" value={data.filters.search} />
            <input type="hidden" name="service" value={data.filters.service} />
            <label>
              <span>Start date</span>
              <input
                aria-label="Schedule start date"
                name="date"
                type="date"
                min="2000-01-01"
                max="2099-12-01"
                defaultValue={data.window.date}
                key={data.window.date}
                required
              />
            </label>
            <label>
              <span>Show</span>
              <select
                name="days"
                aria-label="Schedule duration"
                defaultValue={data.window.days}
                key={data.window.days}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="28">28 days</option>
              </select>
            </label>
            <button className="av-button av-button-small av-button-outline">
              Go
            </button>
          </form>
        </div>
        <div className="av-fleet-view-bar">
          <div className="av-fleet-legend" aria-label="Schedule legend">
            <StateBadge kind="rental" label="Rental" />
            <StateBadge kind="hold" label="Checkout hold" />
            <StateBadge kind="maintenance" label="Maintenance" />
            <StateBadge kind="preparation" label="Preparation" />
          </div>
          <div className="av-fleet-view-switch" aria-label="Schedule view">
            <button
              type="button"
              aria-pressed={view === "timeline"}
              onClick={() => setView("timeline")}
            >
              <CalendarDays size={15} />
              Timeline
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List size={15} />
              Vehicle list
            </button>
          </div>
        </div>
        {data.units.length ? (
          view === "timeline" ? (
            <FleetTimeline data={data} onSelect={select} />
          ) : (
            <div className="av-fleet-vehicle-list">
              {data.units.map((u) => {
                const state = fleetVehicleState(u, data.now);
                const reservations = visibleReservations(u, data);
                return (
                  <article key={u.id}>
                    <div className="av-fleet-list-heading">
                      <div>
                        <h2 className="capitalize">
                          {u.car.make} {u.car.model}
                        </h2>
                        <p>
                          {u.code} · {u.branch.name}
                        </p>
                      </div>
                      <StateBadge {...state} />
                    </div>
                    {reservations.length ? (
                      <ul>
                        {reservations.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => select(u, r.id)}
                            >
                              <span>
                                {r.order
                                  ? `Booking #${r.order.id.slice(0, 8)}`
                                  : r.reason}
                              </span>
                              <span>
                                {fleetDate(r.startDate)} →{" "}
                                {fleetDate(r.order?.endDate || r.endDate)} UTC
                              </span>
                              <ChevronRight size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="av-muted">
                        No scheduled items in this period.
                      </p>
                    )}
                    <button
                      type="button"
                      className="av-text-link"
                      onClick={() => select(u)}
                    >
                      Manage vehicle <ArrowRight size={14} />
                    </button>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          <div className="av-panel av-empty">
            <h2>No vehicles match these filters.</h2>
            <p>Try a different branch, search or service status.</p>
            <Link
              href={fleetHref(data.window, {
                branchId: "",
                search: "",
                service: "all",
              })}
              className="av-button av-button-small"
            >
              Clear filters
            </Link>
          </div>
        )}
        <div className="av-fleet-pagination">
          <p>
            {data.total
              ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} of ${data.total} vehicles`
              : "0 vehicles"}
            {activeFilters && (
              <>
                {" "}
                ·{" "}
                <Link
                  href={fleetHref(data.window, {
                    branchId: "",
                    search: "",
                    service: "all",
                  })}
                >
                  Clear filters
                </Link>
              </>
            )}
          </p>
          <nav aria-label="Fleet pages">
            {data.page > 1 && (
              <Link prefetch={false} href={href({ page: data.page - 1 })}>
                <ArrowLeft size={14} />
                Previous
              </Link>
            )}
            <span>
              Page {data.page} of {pages}
            </span>
            {data.page < pages && (
              <Link prefetch={false} href={href({ page: data.page + 1 })}>
                Next
                <ArrowRight size={14} />
              </Link>
            )}
          </nav>
        </div>
      </section>
      <p className="av-fleet-footer-note">
        <Check size={15} />
        Updated {fleetDate(data.now)} UTC. Booking and maintenance changes are
        checked against the vehicle’s full schedule.{" "}
        <Link href="/admin/branches">Manage branches & stock →</Link>
      </p>

      <FleetDialog
        open={Boolean(unit)}
        onClose={() => setSelected(null)}
        eyebrow="Vehicle workspace"
        title={unit ? `${unit.car.make} ${unit.car.model}` : "Vehicle details"}
      >
        {unit && (
          <>
            <div className="av-fleet-unit-summary">
              <div>
                <strong>{unit.code}</strong>
                <p>
                  <MapPin size={14} />
                  {unit.branch.name}{" "}
                  {!unit.branch.active && "· branch closed to new bookings"}
                </p>
              </div>
              <StateBadge {...fleetVehicleState(unit, data.now)} />
            </div>
            {(!unit.car.available || unit.car.archived) && (
              <p className="av-alert">
                This listing is paused for new bookings. Existing rentals can
                still be managed.
              </p>
            )}
            <div className="av-fleet-tabs" aria-label="Vehicle sections">
              {[
                { id: "schedule", label: "Schedule" },
                { id: "maintenance", label: "Maintenance" },
                { id: "settings", label: "Vehicle settings" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={tab === item.id}
                  onClick={() => setTab(item.id as typeof tab)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {tab === "schedule" && (
              <div className="av-fleet-detail-schedule">
                <p className="av-muted">
                  {fleetDate(data.window.start, false)} –{" "}
                  {fleetDate(`${rangeEnd}T00:00:00Z`, false)} · UTC
                </p>
                {selectedEvents.length ? (
                  [...selectedEvents]
                    .sort((a, b) =>
                      a.id === selectedReservation
                        ? -1
                        : b.id === selectedReservation
                          ? 1
                          : a.startDate.localeCompare(b.startDate),
                    )
                    .map((r) => (
                      <ReservationCard
                        key={`${r.id}-${selectedReservation || ""}`}
                        reservation={r}
                        data={data}
                      />
                    ))
                ) : (
                  <div className="av-fleet-dialog-empty">
                    <CalendarDays size={26} />
                    <h3>No bookings in this period</h3>
                    <p>
                      Choose another date range or reserve time for maintenance.
                    </p>
                    <button
                      type="button"
                      className="av-button av-button-small"
                      onClick={() => setTab("maintenance")}
                    >
                      Schedule maintenance
                    </button>
                  </div>
                )}
              </div>
            )}
            {tab === "maintenance" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl">Reserve time off the road</h3>
                  <p className="av-muted mt-2">
                    Use this for servicing, repairs or cleaning. A block
                    prevents new rentals during that time.
                  </p>
                </div>
                <FleetMaintenanceForm
                  key={unit.id}
                  unitId={unit.id}
                  now={data.now}
                />
              </div>
            )}
            {tab === "settings" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl">Service status</h3>
                  <p className="av-muted my-3">
                    {unit.enabled
                      ? "Take this physical vehicle offline when it should no longer accept reservations. Resolve its upcoming bookings first."
                      : "Return this vehicle to service once it is ready to operate."}
                  </p>
                  <ActionForm
                    action={setVehicleEnabled}
                    label={
                      unit.enabled
                        ? "Take vehicle offline"
                        : "Return to service"
                    }
                  >
                    <input type="hidden" name="unitId" value={unit.id} />
                    <input
                      type="hidden"
                      name="enabled"
                      value={String(!unit.enabled)}
                    />
                  </ActionForm>
                </section>
                <section><h3 className="text-xl">Branch-owned listing</h3><p className="av-muted my-3">This vehicle belongs to {unit.branch.name}. Manage quantities on this branch’s car listing. To offer the model elsewhere, add a separate listing there.</p><Link className="av-text-link" href={`/admin/cars/${unit.carId}/edit`}>Edit listing & quantity →</Link></section>
              </div>
            )}
          </>
        )}
      </FleetDialog>
      <FleetDialog
        open={panel === "add"}
        onClose={() => setPanel(null)}
        title="Add a physical vehicle"
        eyebrow="Grow your fleet"
      >
        <p className="av-muted mb-5">
          One entry represents one actual car. For three identical cars, add
          three unique fleet codes to the same branch listing, or set its numeric quantity in car management.
        </p>
        <ActionForm action={addVehicle} label="Add vehicle to fleet">
          <label className="av-field">
            Car listing
            <select name="carId" required defaultValue="">
              <option value="" disabled>
                Choose a model
              </option>
              {data.cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.year} {c.make} {c.model} · {data.branches.find((branch) => branch.id === c.branchId)?.name}
                </option>
              ))}
            </select>
          </label>
          <label className="av-field">
            Unique fleet code
            <input
              name="code"
              maxLength={40}
              pattern="[a-zA-Z0-9-]{2,40}"
              placeholder="AV-101"
              required
            />
          </label>
        </ActionForm>
        <Link className="av-text-link mt-5" href="/admin/cars/new">
          Need a different model? Create a listing →
        </Link>
      </FleetDialog>
      <FleetDialog
        open={panel === "attention"}
        onClose={() => setPanel(null)}
        title="Bookings needing attention"
        eyebrow="Operations checklist"
      >
        <p className="av-muted mb-5">
          These issues are shown for{" "}
          {data.filters.branchId ? "the selected branch" : "all branches"},
          regardless of the calendar date or service filter.
        </p>
        {data.attention.overdue.map((o) => (
          <article
            key={o.id}
            className="av-fleet-event-card av-fleet-event-overdue"
          >
            <StateBadge kind="overdue" label="Overdue return" />
            <h3 className="mt-3">
              {o.vehicleName || `Booking #${o.id.slice(0, 8)}`}
            </h3>
            <p className="av-muted mt-2">
              Expected back {fleetDate(o.endDate)} UTC. Record the return from
              the booking after checking any affected next rental.
            </p>
            <Link
              className="av-text-link mt-3"
              href={`/profile/orders/${o.id}`}
            >
              Review booking <ArrowRight size={14} />
            </Link>
          </article>
        ))}
        {data.attention.conflicts.map((o) => (
          <article key={o.id} className="av-fleet-event-card">
            <StateBadge kind="hold" label="Vehicle assignment needed" />
            <h3 className="mt-3">
              {o.vehicleName || `Booking #${o.id.slice(0, 8)}`}
            </h3>
            <p className="av-muted my-3">
              {fleetDate(o.startDate)} → {fleetDate(o.endDate)} UTC. Assign an
              actual free vehicle before reopening the listing for new bookings.
            </p>
            <BookingAssignment order={o} data={data} />
            <Link
              className="av-text-link mt-3"
              href={`/profile/orders/${o.id}`}
            >
              Open booking <ArrowRight size={14} />
            </Link>
          </article>
        ))}
        {data.attention.total >
          data.attention.overdue.length + data.attention.conflicts.length && (
          <p className="av-muted">
            Showing the first 50 issues of each type. Review additional bookings
            in{" "}
            <Link href="/admin/orders" className="underline">
              Orders
            </Link>
            .
          </p>
        )}
        {!data.attention.total && (
          <p className="av-muted">No outstanding issues at this branch.</p>
        )}
      </FleetDialog>
      <FleetDialog
        open={panel === "help"}
        onClose={() => setPanel(null)}
        title="A clear view of every car"
        eyebrow="Calendar guide"
      >
        <ol className="av-fleet-help">
          <li>
            <strong>Choose where and when</strong>
            <p>
              Filter by branch or fleet code, then use Today, the arrows or a
              start date to view 7, 14 or 28 days. Every date and time here is
              UTC.
            </p>
          </li>
          <li>
            <strong>Read the schedule</strong>
            <p>
              Rentals, temporary checkout holds, maintenance and the 60-minute
              return preparation period have their own labels. The vertical line
              marks the current time. Current vehicle status is shown separately
              from the selected period.
            </p>
          </li>
          <li>
            <strong>Choose a car to manage it</strong>
            <p>
              Select its row, a schedule bar or a vehicle-list card. The panel
              contains its bookings, maintenance form and branch/service
              settings.
            </p>
          </li>
          <li>
            <strong>Resolve exceptions</strong>
            <p>
              Review overdue returns and bookings missing a vehicle in the
              attention panel. Availability is rechecked whenever you change an
              assignment.
            </p>
          </li>
        </ol>
        <p className="av-alert mt-5">
          An empty calendar means no scheduled items in that period. New rentals
          still depend on service status, branch opening and listing
          availability.
        </p>
      </FleetDialog>
    </div>
  );
}
