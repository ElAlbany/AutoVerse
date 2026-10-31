import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Authentication is read per resource; each mutation and protected layout
// performs its own server-side ownership or administrator check.
export default clerkMiddleware((_auth, request) => {
  const headers = new Headers(request.headers);
  headers.set(
    "x-autoverse-path",
    request.nextUrl.pathname + request.nextUrl.search
  );
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
