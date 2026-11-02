import Link from "next/link";
import type { loadBranchDetails } from "@/lib/branch-data";
import { money } from "@/lib/rental-policy";
import { saveBranch } from "@/app/actions/branches";
import ActionForm from "./ActionForm";
import BranchFields from "./BranchFields";
import AdminPagination from "./AdminPagination";
import StatusBadge from "../StatusBadge";

export type BranchDetails = NonNullable<
  Awaited<ReturnType<typeof loadBranchDetails>>
>;
export default function BranchDetailsView({ data }: { data: BranchDetails }) {
  const { branch, stats } = data;
  const id = branch.id;
  return (
    <div className="space-y-6">
      <Link className="av-text-link" href="/admin/branches">
        ← All branches
      </Link>
      <div className="av-branch-detail-heading">
        <div>
          <p className="av-eyebrow">
            {branch.city} ·{" "}
            {branch.active ? "Open for bookings" : "Closed to new bookings"}
          </p>
          <h1 className="text-3xl">{branch.name}</h1>
          <p className="av-muted mt-3">
            {branch.address || "Add the collection address in branch settings."}
          </p>
        </div>
        <Link
          className="av-button av-button-small"
          href={`/admin/cars/new?branchId=${id}`}
        >
          Add a car here
        </Link>
      </div>
      <div className="av-branch-stats">
        {[
          ["Car models", stats.models],
          ["Fleet quantity", stats.quantity],
          ["Available now", stats.availableNow],
          ["On hire", stats.onHire],
          ["Confirmed rentals", stats.upcoming],
        ].map(([label, value]) => (
          <div className="av-panel" key={label}>
            <span className="av-muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="av-muted">
        Fleet quantity includes in-service vehicles, including booked cars.
        Available now excludes current rentals, maintenance and preparation.{" "}
        {stats.offline} vehicles are out of service. Future bookings affect
        availability for their dates.
      </p>
      <section className="av-panel space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h2 className="text-2xl">This branch’s catalogue</h2>
          <Link className="av-text-link" href={`/admin/fleet?branchId=${id}`}>
            Open fleet calendar →
          </Link>
        </div>
        <form className="av-branch-stock-search">
          <label className="av-field">
            Search models
            <input
              name="search"
              defaultValue={data.search}
              placeholder="Make or model"
              maxLength={100}
            />
          </label>
          <label className="av-field">
            Pickup (UTC)
            <input
              type="datetime-local"
              name="start"
              defaultValue={data.start}
              required
            />
          </label>
          <label className="av-field">
            Return (UTC)
            <input
              type="datetime-local"
              name="end"
              defaultValue={data.end}
              min={data.start}
              required
            />
          </label>
          <button className="av-button av-button-small">Check stock</button>
        </form>
        {data.error && (
          <p className="av-alert" role="alert">
            {data.error}
          </p>
        )}
        <div className="av-branch-stock-list">
          {data.cars.map((car) => (
            <div className="av-branch-stock-row" key={car.id}>
              <div>
                <Link
                  className="av-text-link"
                  href={`/admin/cars/${car.id}/edit`}
                >
                  {car.year} {car.make} {car.model}
                </Link>
                <p className="av-muted">
                  {money(car.price)} / day ·{" "}
                  {car.available ? "Accepting bookings" : "Bookings paused"}
                </p>
              </div>
              <dl>
                <div>
                  <dt>Quantity</dt>
                  <dd>{car.quantity}</dd>
                </div>
                <div>
                  <dt>Available now</dt>
                  <dd>{car.availableNow}</dd>
                </div>
                <div>
                  <dt>For these dates</dt>
                  <dd>{car.availableForDates ?? "—"}</dd>
                </div>
              </dl>
              <Link
                className="av-button av-button-small av-button-outline"
                href={`/admin/cars/${car.id}/edit`}
              >
                Edit car & stock
              </Link>
            </div>
          ))}
        </div>
        {!data.cars.length && (
          <p className="av-muted">
            No models here yet, or none match your search. Add this branch’s
            first car and set its quantity.
          </p>
        )}
        <AdminPagination
          path={`/admin/branches/${id}`}
          search={data.search}
          filters={{ start: data.start, end: data.end }}
          pagination={data.pagination}
        />
      </section>
      <section className="av-panel space-y-4">
        <h2 className="text-2xl">Recent rental activity</h2>
        {data.recentOrders.length ? (
          data.recentOrders.map((order) => (
            <div className="av-branch-order" key={order.id}>
              <div>
                <Link
                  className="av-text-link"
                  href={`/profile/orders/${order.id}`}
                >
                  {order.vehicleName || `${order.car.make} ${order.car.model}`}
                </Link>
                <p className="av-muted">
                  {new Date(order.startDate).toLocaleDateString()} →{" "}
                  {new Date(order.endDate).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          ))
        ) : (
          <p className="av-muted">No rentals at this branch yet.</p>
        )}
      </section>
      <details className="av-panel">
        <summary className="cursor-pointer">Branch settings</summary>
        <div className="mt-5">
          <ActionForm action={saveBranch} label="Save branch">
            <BranchFields branch={branch} />
          </ActionForm>
        </div>
      </details>
    </div>
  );
}
