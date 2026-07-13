import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Edge-cached proxy for The Space Devs Launch Library.
// Their public API is aggressively rate-limited (HTTP 429) during busy
// hours; caching at the edge means one origin fetch serves everyone.

export const Route = createFileRoute("/api/public/launches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
        const upstream = `https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=${limit}&mode=list`;
        try {
          const res = await fetch(upstream, { headers: { accept: "application/json" } });
          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: "LAUNCHES_UNAVAILABLE", status: res.status }),
              { status: 502, headers: { "content-type": "application/json" } },
            );
          }
          const json = await res.json();
          return new Response(JSON.stringify(json), {
            headers: {
              "content-type": "application/json; charset=utf-8",
              // Launch data changes slowly. 5 min fresh, 1 day stale.
              "cache-control":
                "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
            },
          });
        } catch {
          return new Response(
            JSON.stringify({ error: "LAUNCHES_UNAVAILABLE" }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});