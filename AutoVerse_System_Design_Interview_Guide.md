# AutoVerse: System Design Interview Guide

**Audience:** Fresh graduates and junior React / Next.js developers.

**Order:** Easy foundations first, then practical junior-level design.

**Goal:** Explain how a feature works, why you chose an approach, and what you would change when requirements change.

You do not need a large-company architecture to answer these questions. Start with a small solution you can explain. Add complexity when a concrete requirement justifies it.

This guide uses the actual AutoVerse repository. **Current AutoVerse** describes existing code; **Possible improvement** describes a design you could add. The learning examples are separate from application code. No application features were changed to create this guide.

## How to Think Through a Design Question

Use this five-step pattern before choosing hooks or libraries:

1. **Clarify the task.** What should the user be able to do? How much data exists? Is it already loaded?
2. **Describe the data.** What comes from the database? What does the user change? What can be calculated?
3. **Assign responsibility.** What belongs in a component, the URL, the server, or the database?
4. **Walk through one interaction.** Explain what happens after the user clicks or types.
5. **Check a failure and a tradeoff.** What if the request fails? What changes if the dataset grows?

For example: "I would keep filter controls in the browser, send the selected criteria to the server when needed, and let the database find matching cars. That avoids downloading the whole fleet."

**Useful vocabulary:** State is information that changes. Derived data is information you calculate from other data. A tradeoff is a benefit you gain together with a cost you accept. A source of truth is the authoritative place to read a value.

## Question Map

| Level | Questions |
| --- | --- |
| 1: Foundations | [1. Filter 500 items](#q1), [2. Components](#q2), [3. State](#q3), [4. Shared state](#q4), [5. Pagination](#q5), [6. Theme persistence](#q6) |
| 2: Data and user experience | [7. URL filters](#q7), [8. Client/server responsibilities](#q8), [9. Request states](#q9), [10. Performance](#q10), [11. Data models](#q11), [12. Booking flow](#q12) |
| 3: Trust and feature coordination | [13. Access control](#q13), [14. Admin edits](#q14), [15. Optimistic UI](#q15), [16. Order lifecycle](#q16), [17. Email failures](#q17), [18. AI assistant](#q18) |
| 4: Junior stretch questions | [19. Analytics](#q19), [20. Growth and caching](#q20), [21. Duplicate submissions](#q21), [22. Competing bookings](#q22), [23. Testing](#q23), [24. Whole-system walkthrough](#q24) |

---

## Level 1: Foundations

<a id="q1"></a>
### 1. There are 500 items on a website. How would you structure filtering and sorting in React?

**What they are checking:** Can you organize data, state, and components, and explain where the work belongs? The number 500 alone does not determine the architecture.

**Step by step**

1. Clarify whether all 500 items are already loaded and reasonably small. Also clarify the filter fields, sort options, and whether users need fresh server data.
2. For a small list already available in the browser, keep the original items unchanged. Store the search text, selected filters, sort choice, and current page.
3. Calculate the displayed result in this order: **filter all items -> sort the matches -> take the current page**.
4. Let a catalogue parent coordinate the controls and list. Individual cards receive an item through props.
5. Show an empty state when nothing matches. Reset to the first page when filters or sort order change.
6. If the data is large, expensive to download, private, or frequently changing, send the criteria to the server and paginate there. The browser must not filter only one downloaded page and pretend that it searched the full dataset.

```text
Original 500 items + selected filters + sort option
                          |
                          v
                 Matching items
                          |
                          v
                  Sorted matches
                          |
                          v
                Current page of cards
```

**Small learning example**

This is a client-side example receiving the complete list through props. AutoVerse's actual homepage uses server-side database filtering instead. It assumes each car has a unique ID and a finite numeric daily price.

```tsx
"use client";

import { useState } from "react";

type Car = {
  id: string;
  make: string;
  model: string;
  pricePerDay: number;
};

type SortOrder = "price-low" | "price-high";
const PAGE_SIZE = 20;

export default function CatalogueExample({ cars }: { cars: Car[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("price-low");
  const [page, setPage] = useState(1);

  const query = search.trim().toLowerCase();
  const matches = cars.filter((car) =>
    `${car.make} ${car.model}`.toLowerCase().includes(query),
  );

  // Copy before sorting so the original list stays unchanged.
  const sorted = [...matches].sort((a, b) => {
    const priceDifference = a.pricePerDay - b.pricePerDay;
    const comparison = sort === "price-low"
      ? priceDifference
      : -priceDifference;
    return comparison || a.id.localeCompare(b.id);
  });

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visibleCars = sorted.slice(start, start + PAGE_SIZE);

  return (
    <section>
      <label>
        Search cars
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </label>

      <label>
        Sort by daily price
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as SortOrder);
            setPage(1);
          }}
        >
          <option value="price-low">Low to high</option>
          <option value="price-high">High to low</option>
        </select>
      </label>

      <p>{matches.length} matching cars</p>
      {visibleCars.length === 0 && <p>No cars match your search.</p>}
      <ul>
        {visibleCars.map((car) => (
          <li key={car.id}>
            {car.make} {car.model}: ${car.pricePerDay}/day
          </li>
        ))}
      </ul>

      <button
        disabled={safePage === 1}
        onClick={() => setPage(safePage - 1)}
      >
        Previous
      </button>
      <span> Page {safePage} of {pageCount} </span>
      <button
        disabled={safePage === pageCount}
        onClick={() => setPage(safePage + 1)}
      >
        Next
      </button>
    </section>
  );
}
```

The ID comparison gives equal-price items a consistent order. The example calculates results during rendering; it does not store separate filtered and sorted arrays in state. Copying before sorting also avoids changing the input array. See React's [array update guidance](https://react.dev/learn/updating-arrays-in-state).

**Current AutoVerse:** [CarFilters.tsx](./components/CarFilters.tsx) writes criteria to the URL. [app/page.tsx](./app/page.tsx) reads them and queries Prisma using `where`, `orderBy`, and `take`. [ShowMore.tsx](./components/ShowMore.tsx) increases the result limit. There is no catalogue `/api/cars` endpoint involved in this flow.

**Interview answer:**

> "First I would check whether the 500 items are already loaded and small enough to handle in the browser. If they are, I would store the original list and the user's filter, sort, and page choices, then derive the results by filtering, sorting, and paginating. I would separate the controls from the list, use stable item IDs, and handle empty results. If the data needs server-side querying, I would send those criteria to the backend. AutoVerse uses that server-side approach through URL parameters and Prisma."

**Common mistake:** Immediately saying "Redux and useMemo" without explaining the data flow or whether either tool is needed.

<a id="q2"></a>
### 2. How would you split the catalogue into React components?

**What they are checking:** Can you give each component a clear job?

**Step by step**

1. Start with a page that coordinates data and the selected criteria.
2. Put search, filters, and sorting controls in a filter component.
3. Put list layout in a grid and each vehicle's presentation in a card.
4. Give pagination or Show More its own control when that makes the page easier to read.

```text
CataloguePage
  ├── CarFilters
  ├── CarGrid
  │     └── CarCard (one per car)
  └── Pagination / ShowMore
```

This tree is a possible separation, not a requirement to create every component immediately. AutoVerse currently renders its catalogue grid directly in app/page.tsx and reuses CarCard.

**Current AutoVerse:** `CarFilters`, `CarCard`, and `ShowMore` already have separate responsibilities. Cards use database IDs as keys. A stable key helps React track the same item when ordering changes. See [React list rendering](https://react.dev/learn/rendering-lists).

**Interview answer:**

> "I would separate controls, list layout, item presentation, and pagination. The parent coordinates the data. I would extract components when they have a clear responsibility or are reused."

**Common mistake:** Making every card fetch the entire catalogue or own its own copy of the selected filters.

<a id="q3"></a>
### 3. What should be React state, and what should be calculated?

**What they are checking:** Can you avoid keeping multiple versions of the same information synchronized?

**Step by step**

1. Identify inputs that can change independently: search, selected make, sort choice, and page.
2. Keep those inputs in state when the component owns them.
3. Calculate matching items, result count, and visible items from those inputs and the source data.
4. Avoid an Effect whose only purpose is to copy these calculations into another state variable.

| Value | Role in a client-side catalogue |
| --- | --- |
| Full list | Source data from props or a fetching layer |
| Search / selected filters | User input state |
| Filtered list | Derived data |
| Match count | Derived data |
| Whether a dropdown is open | Local UI state |

**AutoVerse connection:** The homepage owns the returned cars, while CarFilters owns editable controls. In RentForm, duration and total are calculated from dates and daily price. The server should still independently calculate the authoritative booking price.

**Interview answer:**

> "I store values that change independently. If I can calculate a value from existing props and state, I usually calculate it instead of storing another copy. That reduces synchronization bugs."

**Common mistake:** Storing `cars`, `filteredCars`, `sortedCars`, and `visibleCars` separately, then forgetting to update one. See [React state structure](https://react.dev/learn/choosing-the-state-structure).

<a id="q4"></a>
### 4. Search, sorting, and the list all need shared information. Where should the state live?

**What they are checking:** Can you decide who owns state before adding a global store?

**Step by step**

1. Find the nearest parent that coordinates the affected components.
2. Keep shared choices there and pass values down through props.
3. Pass callbacks down so controls can request changes.
4. Keep unrelated state, such as whether one menu is open, inside that component.
5. Consider Context or a store only if many distant components need the same changing data.

**AutoVerse connection:** `OrderTabs` coordinates tab, status, and sort choices before passing orders to OrderList. Catalogue filters use URL navigation to coordinate with a server-rendered page; that is another ownership pattern.

**Interview answer:**

> "For one page I would start with state in the nearest shared parent and pass values and callbacks through props. A global store becomes useful when the same state needs to be shared more widely."

**Common mistake:** Using a global store solely because more than one component exists. See [sharing state between components](https://react.dev/learn/sharing-state-between-components).

<a id="q5"></a>
### 5. How would you add pagination without breaking filtering and sorting?

**What they are checking:** Do the results remain correct when several features interact?

**Step by step**

1. Find all matching items, then sort them.
2. Select one page from that ordered result.
3. Reset the page when the user changes criteria.
4. Keep a consistent ordering, including a tie-breaker such as ID for equal prices.
5. Disable unavailable navigation and handle zero matches.

Example: if the cheapest car is item 400 in the original data, sorting only the first 20 items will never find it. That is why pagination comes after filtering and sorting.

**Current AutoVerse:** The database applies filters and ordering before `take: limit + 1`. The extra record tells the page whether Show More is needed. Show More increases the total returned limit; it fetches the growing result again rather than only a new page. Filter changes currently preserve the existing limit.

**Possible improvement:** Reset the limit when criteria change, validate/cap it on the server, and use a stable secondary sort. For a much larger list, fetch separate pages instead of repeatedly fetching an expanding prefix.

**Interview answer:**

> "I filter and sort the complete search space first, then select a page. When criteria change, I return to page one. If pagination happens on the server, filtering and sorting must happen there too."

**Common mistake:** Filtering the current server page and calling it the total search result.

<a id="q6"></a>
### 6. How would you keep a user's dark-mode choice after a refresh?

**What they are checking:** Can you choose storage based on who needs to read the value?

**Step by step**

1. Keep the active theme in browser UI state for immediate toggling.
2. Save the preference in persistent storage.
3. Read the preference when the site starts.
4. Apply the initial theme early enough to reduce a flash of the wrong colors.

For a preference used only in the browser, localStorage is an option. A cookie can also be sent with requests if the server needs the preference. Database storage would help share the choice across devices, but needs an account and more implementation work.

**Current AutoVerse:** Navbar writes a one-year `theme` cookie. The root layout's inline script reads it before first paint and applies the `dark` class. Dark is the fallback. VERO separately uses localStorage for temporary chat history.

**Interview answer:**

> "I would persist the theme and apply it during startup. I would use localStorage for a browser-only preference, or a cookie if server rendering needs to know the choice. I would also check the first paint so the theme does not visibly jump."

**Common mistake:** Calling localStorage from server code or assuming browser storage automatically synchronizes across devices.

---

## Level 2: Data and User Experience

<a id="q7"></a>
### 7. How would you make filtered catalogue links shareable?

**What they are checking:** Can you distinguish a temporary form edit from an applied search?

**Step by step**

1. Represent applied criteria in query parameters, such as `/?manufacturer=toyota&sort=price-low`.
2. Read those parameters to populate controls and load results.
3. Update the URL when the user applies a search or changes an immediately applied control.
4. Check refresh, copied links, and browser Back/Forward behavior.
5. Parse and validate URL values on the server; the URL is editable input.

**Current AutoVerse:** CarFilters keeps draft inputs locally and pushes an applied URL. app/page.tsx queries from that URL. Its control state is initialized from search parameters; synchronization of mounted controls during later URL changes should be explicitly tested rather than assumed.

**Tradeoff:** An Apply button lets users adjust several controls before requesting results. Immediate updates feel quicker but can produce more navigation or network work.

**Interview answer:**

> "I would use the URL for applied filters so refresh and sharing preserve the search. Local state can hold draft form values, but displayed results should correspond to the applied URL. I would test browser navigation as well as clicking Apply."

**Common mistake:** Calling both draft controls and applied URL values the authoritative state without explaining when they synchronize.

<a id="q8"></a>
### 8. Which work belongs in React, and which belongs on the server?

**What they are checking:** Can you separate interaction, data access, and trusted decisions?

**Step by step**

1. Keep interactive inputs and immediate feedback in Client Components.
2. Load database-backed results in server code when the framework supports it.
3. Keep database credentials and external-service secrets on the server.
4. Validate mutations and access permissions on the server even when the browser already checks them.

```text
Browser control -> URL or server request -> server validation/query
                <- results or clear error <- database
```

**Current AutoVerse:** app/page.tsx queries Prisma as a Server Component. CarFilters and RentForm are Client Components. Booking uses a server action; VERO uses a POST route.

**Interview answer:**

> "The browser handles interaction, while server code accesses the database and makes trusted decisions. In Next.js I can query from a Server Component and use small Client Components where state or event handlers are needed."

**Common mistake:** Putting database access or a secret API key inside a client-side bundle. See [Next.js server and client responsibilities](https://nextjs.org/docs/app/getting-started/server-and-client-components).

<a id="q9"></a>
### 9. What should happen while search results load, or if requests fail or finish out of order?

**What they are checking:** Can you design the experience around the request, not just the successful response?

**Step by step**

1. Show a loading or updating state while the request is pending.
2. Separate an empty result from a failed request: "No matches" means the search succeeded.
3. Show an understandable error and a way to retry when it fails.
4. For search-as-you-type, consider debouncing: wait briefly after typing stops before requesting results. An explicit Apply button may already reduce requests sufficiently.
5. Prevent an old response from replacing newer results. For a manually managed fetch, cleanup can cancel obsolete requests with AbortController and/or ignore responses that are no longer current.

Example: search for `BMW`, then `Toyota`. If BMW responds last, the page must still show the Toyota result.

**AutoVerse connection:** Catalogue filtering currently uses Next.js navigation, not a manual fetch Effect. The repository has loading boundaries and an error page. The stale-response pattern becomes relevant if you build a separate client-fetching autocomplete or search feature.

**Interview answer:**

> "I would handle loading, success, no matches, and failure separately. For live server search I would reduce unnecessary requests and ensure older responses cannot overwrite the newest search."

**Common mistake:** Assuming responses always arrive in the same order as requests. References: [React Effect cleanup](https://react.dev/reference/react/useEffect) and [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

<a id="q10"></a>
### 10. The catalogue feels slow. What would you investigate first?

**What they are checking:** Can you locate a problem before choosing an optimization?

**Step by step**

1. Reproduce the slowness: initial load, typing, sorting, scrolling, or navigation?
2. Inspect the browser's Network panel and performance tools. Separate slow requests from slow JavaScript or rendering.
3. Check whether large images or unnecessary downloaded fields dominate the work.
4. Reduce rendered items with pagination. Consider virtualization only for a genuinely long scrolling list; it renders mainly the visible rows.
5. If repeated calculations are measurably expensive, consider useMemo. It can reuse a calculation when dependencies stay the same; it does not avoid recalculation when the search actually changes.

**AutoVerse connection:** Catalogue limits and separate featured queries affect database work; image size/loading affects the browser. Show More grows the rendered list, so that path deserves measurement as the fleet grows.

**Interview answer:**

> "I would measure whether the delay comes from the network, database, calculations, or rendering. Then I would fix the largest cause. I would not add memoization or a global store just because the list has 500 items."

**Common mistake:** Saying useMemo makes network requests faster or guarantees fast typing. See [useMemo's purpose and limits](https://react.dev/reference/react/useMemo).

<a id="q11"></a>
### 11. How would you model users, cars, and bookings?

**What they are checking:** Can you translate product features into related records?

**Step by step**

1. Give every user, car, and order a unique ID.
2. Store vehicle facts in Car, such as make, model, and current daily price.
3. Store each booking in Order with userId, carId, dates, status, and the agreed total.
4. Link records using IDs instead of copying the full user and vehicle into every order.
5. Decide which historical values must be captured at booking time. A later vehicle price change should not silently change an existing order's agreed total.

```text
User 1 -------- many Orders many -------- 1 Car
                         |
                         └── optional Review
```

**Current AutoVerse:** Prisma has User, Car, Order, Review, and ChatAnalytic models. Orders store a Decimal total. Review exists in the schema, but its end-to-end UI is unfinished. Deleting a car or user cascades to related orders/reviews.

**Possible improvement:** For a real rental operation, consider archiving vehicles instead of deleting booking history, and store the agreed daily rate if invoices need to retain it.

**Interview answer:**

> "I would separate users, cars, and orders. Each order references its customer and car and stores its own dates, status, and agreed price. I would also decide which historical data must survive later edits."

**Common mistake:** Treating an order's agreed price as whatever the car happens to cost today.

<a id="q12"></a>
### 12. Walk me through a reliable car-booking flow.

**What they are checking:** Can you follow one action through the complete system?

**Step by step**

1. The customer selects a car and dates; the form previews the expected total.
2. On submit, the server identifies the signed-in user.
3. It validates the car, date range, rental policy, and relevant availability.
4. It reads the trusted daily rate and calculates the authoritative total. A browser preview is for convenience, not a trusted price.
5. It saves the order and returns a clear result. Only then does the UI show success or navigate to the order list.
6. If anything fails before saving, keep the form values and explain what the customer should change or retry.

For money, use a consistent representation such as database Decimal or integer cents rather than casually mixing rounded display numbers with stored totals.

**Current AutoVerse:** RentForm calls createOrder, then navigates to profile orders. The action checks identity, basic input validity, car existence, and the available flag, but accepts the supplied total and does not check overlapping reservations or fully enforce date rules.

**Interview answer:**

> "I would preview the booking in the browser, but the server would validate it and calculate the final price before saving. I would only show success after the order is stored. AutoVerse has the basic flow; server-side pricing and date-specific availability are improvements I would make."

**Common mistake:** Assuming a disabled form field prevents someone from submitting a modified request.

---

## Level 3: Trust and Feature Coordination

<a id="q13"></a>
### 13. How would you stop customers from viewing other users' orders or using admin actions?

**What they are checking:** Do you understand the difference between identity and permission?

**Step by step**

1. **Authentication:** identify who is signed in.
2. **Authorization:** decide what that person may do.
3. For an order, check that the signed-in user owns it or has an explicitly permitted admin role.
4. For an admin mutation, check the role on the server for every request.
5. Use frontend visibility for a clear interface, but keep enforcement in trusted server code.

**Current AutoVerse:** Clerk handles authentication. Local User.role determines admin permissions. The admin layout guards pages, admin actions call checkAdmin, and getOrderById checks owner/admin access.

Example: changing `/profile/orders/abc` to `/profile/orders/xyz` must not grant access to someone else's order. Guessing an ID should never be enough.

**Interview answer:**

> "A login proves identity; it does not grant access to every resource. I would check ownership for customer orders and check the admin role inside each protected server operation. Hiding buttons is only a UI decision."

**Common mistake:** Trusting a userId or role sent by the browser instead of reading the authenticated identity and trusted permissions.

<a id="q14"></a>
### 14. An admin changes a car's availability. How should the rest of the application react?

**What they are checking:** Can you keep different views consistent after a write?

**Step by step**

1. Submit the car ID and requested change to a protected server operation.
2. Validate the allowed field/value and save the change.
3. Refresh or invalidate affected views so subsequent reads use updated data. Invalidation means marking an old cached result as no longer current.
4. Show pending and failure feedback on the toggle.
5. Recheck availability during booking even if the user opened the page earlier.

**Current AutoVerse:** toggleCarStatus updates Prisma and revalidates selected paths, including the catalogue and detail page. The admin table uses optimistic state. Booking also checks the available flag.

**Important limit:** Updating stored data or revalidating a path does not automatically push a live update into every already-open browser tab. Decide whether refresh, periodic checks, or live updates are necessary for the feature. Even with live updates, a final server check is still required.

**Interview answer:**

> "I would save the change through an authorized server operation, refresh the affected views, and handle a failed toggle clearly. I would still validate availability when someone books because their page may be stale."

**Common mistake:** Assuming an item visible in a previously loaded page must still be bookable.

<a id="q15"></a>
### 15. How would you make cancellation feel immediate without lying about success?

**What they are checking:** Can you separate fast feedback from confirmed data?

**Step by step**

1. Show a temporary cancelled/pending state as the request starts. This is an optimistic update: predict the likely result before confirmation.
2. Prevent repeated clicks while the request is pending.
3. Let the server check ownership, current status, and cancellation cutoff.
4. If the server rejects it, restore or refresh the authoritative state and show the reason.
5. If it succeeds, reconcile the view with the saved order.

**Current AutoVerse:** OrderList uses useOptimistic and calls cancelOrder. The server can return `{ success: false, message }` for a rejected cancellation. The current list handler does not inspect that result.

**Possible improvement:** Explicitly handle both returned failures and thrown/network errors. Do not assume an optimistic hook understands an unsuccessful result object by itself.

**Interview answer:**

> "I would update the interface immediately but treat it as temporary until the server confirms. On failure I would restore the real state and explain why cancellation was rejected. An optimistic update still needs explicit error handling."

**Common mistake:** Assuming every awaited request succeeded just because it did not throw an exception.

<a id="q16"></a>
### 16. How would you organize order statuses and automatic progression?

**What they are checking:** Can you define valid changes instead of allowing arbitrary edits?

**Step by step**

1. Write down the statuses and permitted transitions.
2. Put transition rules in server code so every client follows the same policy.
3. Restrict UI choices to valid next states for clearer feedback.
4. Decide when time-based transitions run: during a request, or on a schedule.
5. Make repeated runs safe: only update orders still in the expected starting state.

```text
PENDING -> CONFIRMED -> ACTIVE -> COMPLETED
                cancellation rules are a separate policy
```

**Current AutoVerse:** Admin actions validate transitions. syncOrderStatuses changes confirmed rentals to active and expired active rentals to completed when the profile layout runs. This is triggered by requests, so it does not guarantee updates at a fixed time. Admin rules currently also allow COMPLETED -> CANCELLED, while customer cancellation rejects completed orders.

**Possible improvement:** Agree on one product policy, centralize shared transition definitions, and use a scheduled task if progression must happen without visits. Decide whether automatic transitions should send notifications.

**Interview answer:**

> "I would define the allowed transitions and enforce them on the server. If status must advance at a predictable time, I would use a scheduled process rather than depending on someone opening a page. Repeated runs should not repeat completed work."

**Common mistake:** Calling a request-triggered helper a background scheduler.

<a id="q17"></a>
### 17. A booking is saved, but the confirmation email fails. What should happen?

**What they are checking:** Can you separate the core business action from an external side effect?

**Step by step**

1. Treat the saved order as the authoritative booking result.
2. Attempt the notification after the order is saved.
3. If email fails, keep the booking and let the customer see it in their account.
4. Record the delivery failure so it can be investigated or retried.
5. If reliable delivery becomes a requirement, save a pending notification record and let a separate worker retry it. A worker is a process that performs background jobs.

The last step adds operational work, so it is a later improvement rather than a mandatory starting architecture. Retrying delivery also needs a way to avoid accidentally sending the same notification repeatedly.

**Current AutoVerse:** lib/email.ts initializes Resend lazily, skips delivery without a key, and catches sending errors. Booking and manual status actions call it, but there is no durable notification retry process. Automatic order progression does not email customers.

**Interview answer:**

> "I would keep the saved booking even if email fails. The customer can confirm it in their account. I would log the delivery failure, and add persistent retryable notification jobs if reliable delivery is required."

**Common mistake:** Telling the customer the booking failed after it was saved, causing them to submit again.

<a id="q18"></a>
### 18. How would you design an AI assistant that recommends cars from the real fleet?

**What they are checking:** Can you integrate an external service while keeping your application in control?

**Step by step**

1. Send user messages to your server, keeping the AI provider key there.
2. Read a relevant, limited selection of available vehicles from the database.
3. Give the model those records and ask for recommendations that reference real IDs.
4. Validate returned IDs against the inventory before building recommendation cards.
5. Handle provider timeouts, failures, and quota limits with useful feedback.
6. Link a recommendation into the normal booking flow. Revalidate its price and availability when booking; the model does not authorize the purchase or reservation.

**Current AutoVerse:** VERO's server route supplies up to 15 candidate cars to Gemini, parses a hidden RECOMMENDED line, falls back to name matching, and resolves cards from the available inventory. Chat history is browser-local; analytics stores submitted messages and shown IDs.

**Possible improvement:** Validate message structure and length, limit retained/sent history, add request timeouts and server-side rate limits, and avoid inferring actual seats from class labels. A rate limit restricts requests over a time window; HTTP 429 indicates too many requests. See [HTTP 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429).

**Interview answer:**

> "I would let the model explain recommendations, while my server supplies the inventory and validates the IDs. Booking would remain a normal protected operation. If AI fails, users should still be able to browse and book through the catalogue."

**Common mistake:** Treating generated text as a trusted source of price, availability, or permission.

---

## Level 4: Junior Stretch Questions

These questions add failure cases and growth. A clear explanation of the problem and one reasonable solution is enough; you do not need to recite advanced infrastructure terms.

<a id="q19"></a>
### 19. How would you build the VERO analytics dashboard?

**What they are checking:** Can you define what a metric means and load the right data?

**Step by step**

1. Decide what each event represents: one message, one conversation session, or one booking? These are different things.
2. Store only the fields required for the analysis, with an intentional privacy/retention policy.
3. Apply the same date range to related charts, counts, rankings, and feed queries.
4. Aggregate counts for statistics, and paginate detailed records separately.
5. Define labels accurately and handle empty periods and missing/deleted cars.

**Current AutoVerse:** ChatAnalytic stores one submitted message and its recommended IDs per successful logged request. The page labels these Conversations, but does not store a conversation-session ID. It shows statistics, activity chart, top vehicles, and eight feed records per page. Unique Users excludes anonymous messages.

**Possible improvement:** Move expensive aggregation into database queries when measurements justify it. Keep list-page totals distinct from the number of loaded records. If tracking bookings attributed to VERO is required, add an explicit association; recommended cars alone do not prove conversion.

**Interview answer:**

> "I would define the events before building charts. I would filter all dashboard queries consistently, aggregate statistics, and paginate the detailed feed. I would make clear whether a count means messages, sessions, or actual bookings."

**Common mistake:** Calling ten messages from one person ten unique customers.

<a id="q20"></a>
### 20. What would you change if AutoVerse grew from 500 cars to 50,000?

**What they are checking:** Can you evolve a working design without rebuilding everything prematurely?

**Step by step**

1. Keep the complete searchable dataset in the database and send small result pages to the browser.
2. Validate query inputs, cap page sizes, select necessary fields, and use deterministic sorting.
3. Measure database queries and consider indexes that support actual filters and ordering. Indexes speed some reads but cost storage and extra work on writes.
4. Measure image delivery and page rendering separately from query time.
5. Cache appropriate public results if repeated reads are costly. A cache stores a reusable previous result; decide its lifetime and how updates make it stale.

**Current AutoVerse:** Filtering already happens in Prisma, but Show More repeatedly requests a growing prefix. The schema has several vehicle indexes; that does not guarantee every combined search is efficient.

**Possible improvement:** Use bounded pages. If deep paging becomes expensive, consider cursor pagination, which continues after a known ordered record. A public catalogue cache must vary by applied criteria. User order data needs user-aware access and must not leak through shared caching. Booking still requires fresh server validation.

**Interview answer:**

> "I would preserve the current component structure, move or keep search in the database, return bounded pages, and measure slow queries. I would add targeted indexes or caching when measurements show a benefit. A cached listing would not replace validation during booking."

**Common mistake:** Proposing microservices or a distributed cache before identifying an actual bottleneck.

<a id="q21"></a>
### 21. How would you stop a double-click or retry from creating two bookings?

**What they are checking:** Can you distinguish UI prevention from reliable server behavior?

**Step by step**

1. Disable the button and show pending feedback after the first submission.
2. Recognize that retries, multiple tabs, or a lost response can still reach the server more than once.
3. Assign an idempotency key to one booking attempt: a unique request identifier reused when retrying that same attempt.
4. On the server, scope the key to the user/operation and enforce uniqueness in persistent storage. Reusing it with different booking details should be rejected.
5. Save the key and order consistently. A retry returns the existing result instead of creating another order; concurrent requests for the same key must be handled too.

Idempotency means repeating the same operation has the same intended effect as performing it once. This does not mean two intentionally separate bookings should share one key.

**Current AutoVerse:** RentForm disables submission while loading, but createOrder does not implement persistent duplicate-request protection.

**Interview answer:**

> "I would disable repeat clicks for usability, then add server-side idempotency for retries. One booking attempt gets one persistent key, so if the response is lost, retrying retrieves the original booking rather than creating a second one."

**Common mistake:** Assuming cancelling a browser request guarantees the server did not save the order.

<a id="q22"></a>
### 22. Two different customers try to book the same car for overlapping dates. How would you prevent both from succeeding?

**What they are checking:** Can you reason about concurrent actions? Concurrent means they can run at the same time.

**Step by step**

1. Clarify whether pending orders reserve a car, and whether such holds expire.
2. Define overlap precisely. For a proposed end-exclusive range, `[10 June, 12 June)` and `[12 June, 14 June)` do not overlap. This assumes end is after start; same-day rentals need an explicit rule.
3. Check for blocking orders on the same car where `existingStart < requestedEnd` and `existingEnd > requestedStart`.
4. Make that check and insertion safe against concurrent requests. One approach is a transaction that locks the same car row before checking and inserting. Every booking path must follow the locking protocol.
5. Return a clear conflict message to the customer who cannot reserve the dates.

```text
Transaction begins
  -> Lock this car's row
  -> Recheck blocking date ranges
  -> Reject conflict OR create the order
Transaction commits and releases the lock
```

This briefly serializes booking attempts for the same car, which is a reasonable simple tradeoff. A transaction groups work, but a check-and-insert inside a default-isolation transaction alone is not enough to solve competing checks. Proper locking, a suitable database constraint, or serializable execution with retries is needed. See [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

**Current AutoVerse:** The available flag is a global switch, and createOrder does not check overlapping date ranges. This is a proposed improvement, not an existing guarantee. Idempotency from Question 21 solves repeats of one attempt; it does not resolve competing customers.

**Interview answer:**

> "Both requests could read available before either saves. I would enforce date-conflict rules on the server and coordinate the check-and-create in the database, for example by locking the same car during that transaction. The losing request gets an availability conflict."

**Common mistake:** Saying a single boolean or disabling the button prevents double-booking across users.

<a id="q23"></a>
### 23. How would you test the design rather than only checking that the page opens?

**What they are checking:** Can you turn requirements into observable behavior?

**Step by step**

1. Test pure logic with small inputs: combined filters, numeric price order, equal-price ties, empty matches, and page boundaries.
2. Test interactions: changing a filter updates the list, applying search updates the URL, and changing criteria resets paging.
3. Test server rules directly: another user's order is blocked, manipulated prices are ignored/recalculated, invalid dates are rejected, and forbidden status changes fail.
4. Test failure behavior: slow search, rejected cancellation, AI outage, and email failure after a saved booking.
5. Test the main end-to-end journey: browse -> choose dates -> book -> see the order -> cancel when allowed. Add concurrency/idempotency tests when those protections are implemented.

**Current AutoVerse:** No automated test framework or test script is configured. Manual checks, TypeScript checking, and a production build provide useful feedback, but they do not prove the booking rules are correct.

**Interview answer:**

> "I would test calculations and rules with small cases, component interactions through user actions, and one complete booking journey. I would also test rejected requests and failures, because a successful page render does not prove access control or date availability."

**Common mistake:** Claiming TypeScript detects a wrong cancellation policy. Types and business behavior answer different questions.

<a id="q24"></a>
### 24. Give me a simple design for the whole AutoVerse application.

**What they are checking:** Can you connect the features into a coherent system and explain priorities?

**Step by step**

1. Identify the users: guests discover cars, customers manage their rentals, and admins manage the platform.
2. Describe the main data: users, vehicles, orders, and optional analytics records.
3. Keep the first architecture small: one Next.js application, one PostgreSQL database, and external services for authentication, email, and AI.
4. Walk through browsing and booking, including server-side validation and ownership checks.
5. Mention one failure strategy and one improvement justified by actual requirements.

```text
Browser: catalogue, forms, profile, admin UI, chat
                         |
                         v
Next.js: pages, server actions, chat endpoint
       |             |           |          |
       v             v           v          v
   PostgreSQL      Clerk       Resend     Gemini
   Cars/orders     Identity    Email      Suggestions
```

The arrows show responsibilities rather than every network call. Clerk also provides browser-side authentication UI.

**Current AutoVerse:** This is broadly the existing architecture. Its server catalogue queries, role checks, and separate chat route are concrete examples you can discuss. Booking overlap protection, server-calculated pricing, and durable notification retries are improvements, so describe them honestly.

**Interview answer:**

> "I would use Next.js for the pages and server operations, with PostgreSQL for users, cars, and orders. React components handle filters, forms, and feedback. The server queries catalogue results, checks permissions, validates dates and prices, and stores bookings. Clerk handles identity; email and AI are supporting integrations. I would keep browsing and booking usable if AI fails. Before adding infrastructure, my next priority would be reliable booking validation and preventing conflicting reservations."

**Common mistake:** Listing technologies without explaining which responsibility each one owns.

---

## Practice: Turn Answers Into Understanding

For each question, read the steps, close the document, and explain the flow out loud for about one minute. Then change one assumption and explain what you would change.

| Session | Focus | Small practice task |
| --- | --- | --- |
| 1 | Questions 1-4 | Draw the catalogue components and label state ownership. |
| 2 | Questions 5-8 | Explain why filtering one server page misses results. |
| 3 | Questions 9-12 | Trace one search and one booking, including failures. |
| 4 | Questions 13-16 | Explain ownership checks and rejected cancellation. |
| 5 | Questions 17-20 | Trace email failure and an unavailable AI provider. |
| 6 | Questions 21-24 | Explain duplicate requests versus competing customers. |

Use these follow-ups during practice:

- "What assumption made you choose that approach?"
- "Where is the authoritative value stored?"
- "What if this request fails after the database saves?"
- "What if the data changes in another browser?"
- "What would you simplify for a small project?"

## An Honest Way to Talk About Your Project

Use this pattern: **what exists -> why it works that way -> its current limit -> your next improvement**.

Example:

> "In AutoVerse, catalogue filters are applied through URL parameters and server-side Prisma queries. This keeps search shareable and avoids downloading every car. Show More currently reloads an expanding result set. If the fleet grew, I would use bounded pages and measure the database queries."

It is also reasonable to say:

> "I have not implemented that protection yet. I understand the failure case, and my next step would be to validate the rule on the server and test concurrent requests."

Engineering judgment becomes visible when you can explain assumptions, responsibilities, and failure behavior. Practice the reasoning rather than memorizing a technology list.
