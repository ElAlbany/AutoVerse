"use client";
import RouteError from "@/components/RouteError";
export default function ErrorPage(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="av-shell av-page">
      <RouteError {...props} />
    </main>
  );
}
