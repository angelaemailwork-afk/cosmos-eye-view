import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Server-side NASA APOD proxy with:
// - real NASA_API_KEY if provided (env), else DEMO_KEY
// - graceful fallback: if a given date is rate-limited or missing, walk back
//   up to 5 previous days so the client always gets something to render
// - edge caching so repeat viewers don't hit NASA at all

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function tryFetch(date: string, key: string) {
  const url = `https://api.nasa.gov/planetary/apod?api_key=${key}&date=${date}&thumbs=true`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return { ok: false as const, status: res.status };
  const json = await res.json();
  return { ok: true as const, json };
}

export const Route = createFileRoute("/api/public/apod")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const requested = url.searchParams.get("date") || ymd(new Date());
        const key = process.env.NASA_API_KEY || "DEMO_KEY";

        const start = new Date(requested + "T12:00:00Z");
        let lastStatus = 500;
        for (let i = 0; i < 5; i++) {
          const d = new Date(start);
          d.setUTCDate(d.getUTCDate() - i);
          const date = ymd(d);
          try {
            const r = await tryFetch(date, key);
            if (r.ok) {
              return new Response(
                JSON.stringify({ ...r.json, _servedDate: date, _fallback: i > 0 }),
                {
                  headers: {
                    "content-type": "application/json; charset=utf-8",
                    // Cache successful responses at the edge for 1h,
                    // allow stale for a day while revalidating.
                    "cache-control":
                      "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
                  },
                },
              );
            }
            lastStatus = r.status;
            // Only walk backwards on rate-limit / not-found style errors.
            if (r.status !== 429 && r.status !== 404 && r.status !== 400) break;
          } catch {
            // network glitch — try the previous day
          }
        }

        return new Response(
          JSON.stringify({
            error: "APOD_UNAVAILABLE",
            status: lastStatus,
            message:
              "NASA APOD is temporarily unavailable. This is usually a short rate-limit spike — try again shortly.",
          }),
          {
            status: 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});