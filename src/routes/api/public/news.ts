import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Edge-cached proxy for Spaceflight News API.
// Cached at the edge so the browser gets a fast local hit on repeat views.

export const Route = createFileRoute("/api/public/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") || 15), 100);
        const upstream = `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}`;
        try {
          const res = await fetch(upstream, { headers: { accept: "application/json" } });
          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: "NEWS_UNAVAILABLE", status: res.status }),
              { status: 502, headers: { "content-type": "application/json" } },
            );
          }
          const json = await res.json();
          return new Response(JSON.stringify(json), {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control":
                "public, max-age=60, s-maxage=180, stale-while-revalidate=86400",
            },
          });
        } catch {
          return new Response(
            JSON.stringify({ error: "NEWS_UNAVAILABLE" }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});