# Fleet calendar UX and site icons

Implemented on the `rental-platform-upgrade` branch. The former `codex/rental-platform-upgrade` branch was renamed at the user's request, preserving its commits.

## Site identity

The tab favicon now uses the overlapping Georgia AV monogram from the homepage navbar, with ivory/pine colours. `app/favicon.ico` contains 16, 32 and 48 pixel images, `app/icon.svg` supplies a scalable browser icon, and `app/apple-icon.png` supplies the 180 pixel touch icon. Next.js supplies the icon metadata using its [file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons). The rendered head was inspected and contained all three icon links with the expected MIME types and sizes.

## Fleet workflow

- Choose a branch, search by make/model/fleet code, or filter by in-service/offline status. The overview cards provide shortcuts to those service filters.
- Use Previous, Next, Today or a start date, and choose a 7, 14 or 28 day range. Navigation preserves the branch/search/service filters and starts on the first vehicle page. Date columns align to UTC midnight and show weekday, day and month.
- The timeline has a sticky date header and vehicle column, horizontal mouse dragging, arrow controls and a current-time marker. Rental, checkout hold, maintenance and preparation have distinct labels and colours. Preparation is a separate interval rather than being described as rental time.
- Select a vehicle or event to open one focused workspace. Its Schedule, Maintenance and Vehicle settings sections contain booking links, reassignment, maintenance blocks, service controls and branch transfer. Native modal dialogs trap focus, support Escape, and restore focus on dismissal.
- The vehicle-list view provides compact, readable schedules. It is selected automatically on initial mobile entry; users can switch views explicitly.
- Review exceptions in the attention panel. Overdue rentals remain visually occupied until staff record return. Missing assignments offer only suitable same-model vehicles at the booked branch without a schedule/preparation conflict or another overdue rental. The existing transaction and overlap checks remain authoritative when saving.
- Vehicle results are paginated in stable code/id order, twenty per page. This replaces the silent hundred-vehicle cutoff and the long repeated set of forms. Reassignment options are loaded independently of the visible page.
- Current vehicle status remains accurate while viewing a future or historical period. The schedule count is for the selected period and service filter; overview fleet counts are for the branch/search, with links to each service status. Attention is scoped to the branch and is independent of the selected dates/search/service filter.
- Refresh requests current server data and updates the displayed timestamp. An empty schedule does not imply that a paused listing, offline vehicle or closed branch can accept new rentals.

Maintenance fields explicitly represent UTC. Start selection suggests an end one hour later when needed, and sets the minimum end later than start. The server parser now enforces UTC rather than interpreting the input using the host's local timezone. No database migration is required.

## Verification

- `npm test`: nineteen tests, including calendar UTC boundaries, invalid date fallback, filter-preserving navigation, maintenance UTC parsing, preparation/early-return rendering, expired holds, overdue occupation and reassignment suitability.
- `RUN_DB_TESTS=1 npm run test:inventory`: five integration tests. The new test loads real query results from isolated development fixtures, checks pagination beyond twenty units, service counts, current maintenance outside a future view, current overdue status while viewing history, and period-independent exception visibility. Fixtures are removed by their own random IDs. No customer data, emails or external payments are changed by these tests.
- The first integration attempt could not reach Neon; connectivity recovered and the complete suite passed on retry.
- TypeScript and production build passed. The temporary preview URL returned 404 in production. All three icon routes returned 200 with the expected MIME types. An anonymous admin request emitted Next.js’s streaming sign-in redirect and did not render the protected fleet workspace.
- Browser checks exercised the actual workspace component with synthetic schedule data in a temporary development-only harness. Tested: timeline arrows/dragging, sticky vehicle labels, vehicle panel sections, same-branch free-unit options, exception guidance, UTC auto-end fields, Escape dismissal, add-vehicle controls, and light/dark layouts. At a 390 pixel mobile viewport the page content was 382 pixels wide; the modal fit the viewport.
- The temporary harness was removed before commit. The actual admin route still requires administrator authentication before querying or rendering data. A signed-in admin mutation was not exercised in the browser; server guards and existing transactional behavior were preserved.

Preview screenshots use sample vehicles and bookings, not customer records:

- [Desktop timeline, light](screenshots/fleet-calendar-desktop-light.png)
- [Mobile vehicle list, light](screenshots/fleet-calendar-mobile-light.png)
- [Mobile vehicle panel, dark](screenshots/fleet-vehicle-mobile-dark.png)
