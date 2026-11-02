import Link from "next/link";
import type { pageWindow } from "@/lib/admin-query";

export default function AdminPagination({ path, search = "", filters = {}, pagination }: {
  path: string;
  search?: string;
  filters?: Record<string, string>;
  pagination: ReturnType<typeof pageWindow>;
}) {
  const { page, pages, skip, size, total } = pagination;
  const href = (next: number) => {
    const params = new URLSearchParams({ ...filters, page: String(next) });
    if (search) params.set("search", search);
    return `${path}?${params}`;
  };
  return (
    <nav aria-label="Results pagination" className="av-admin-pagination">
      <p className="av-muted">{total ? `${skip + 1}–${Math.min(skip + size, total)} of ${total}` : "No matching records"} · Page {page} of {pages}</p>
      <div className="flex gap-3">
        {page > 1 && <Link className="av-button av-button-small av-button-secondary" href={href(page - 1)}>Previous</Link>}
        {page < pages && <Link className="av-button av-button-small av-button-secondary" href={href(page + 1)}>Next</Link>}
      </div>
    </nav>
  );
}
