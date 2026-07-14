import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Edge-cached proxy for The Space Devs Launch Library.
// Their public API is aggressively rate-limited (HTTP 429). We keep the
// last successful payload per-limit in module memory so we can always
// return usable data (with a `_stale: true` marker) instead of 502s.

type CacheEntry = { at: number; json: unknown };
const memCache = new Map<number, CacheEntry>();

export const Route = createFileRoute("/api/public/launches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
        const upstream = `https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=${limit}&mode=list`;
        const cached = memCache.get(limit);
        try {
          const res = await fetch(upstream, { headers: { accept: "application/json" } });
          if (!res.ok) {
            if (cached) {
              return new Response(
                JSON.stringify({ ...(cached.json as object), _stale: true, _upstreamStatus: res.status }),
                {
                  headers: {
                    "content-type": "application/json; charset=utf-8",
                    "cache-control": "public, max-age=30, s-maxage=60",
                  },
                },
              );
            }
            return new Response(
              JSON.stringify({ error: "LAUNCHES_UNAVAILABLE", status: res.status, results: [], fallback: true }),
              { status: 200, headers: { "content-type": "application/json" } },
            );
          }
          const json = await res.json();
          memCache.set(limit, { at: Date.now(), json });
          return new Response(JSON.stringify(json), {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control":
                "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
            },
          });
        } catch {
          if (cached) {
            return new Response(
              JSON.stringify({ ...(cached.json as object), _stale: true }),
              { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30" } },
            );
          }
          return new Response(
            JSON.stringify({ error: "LAUNCHES_UNAVAILABLE", results: [], fallback: true }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});