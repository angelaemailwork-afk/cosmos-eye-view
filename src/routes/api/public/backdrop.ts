import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Edge-cached backdrop image list.
// Previously the browser did 2 large NASA search requests + 30 asset
// lookups on every page load. Now that fan-out happens once on the
// server and the result is cached (module memory + CDN) for a day.

type Item = { href: string; title: string };
let cache: { at: number; items: Item[] } | null = null;
const TTL = 6 * 60 * 60 * 1000;

async function build(): Promise<Item[]> {
  const queries = ["James Webb Space Telescope", "Hubble Space Telescope"];
  const raw: Array<{ href: string; data?: Array<{ title?: string; keywords?: string[]; description?: string }> }> = [];
  const responses = await Promise.all(
    queries.map((q) =>
      fetch(
        `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&keywords=${encodeURIComponent(q)}&page_size=40`,
        { headers: { accept: "application/json" } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ),
  );
  for (const json of responses) raw.push(...((json as any)?.collection?.items ?? []));

  const filtered = raw.filter((it) => {
    const d = it.data?.[0];
    const hay = `${d?.title ?? ""} ${(d?.keywords ?? []).join(" ")} ${d?.description ?? ""}`.toLowerCase();
    return hay.includes("hubble") || hay.includes("webb") || hay.includes("jwst");
  });
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  const resolved = await Promise.all(
    filtered.slice(0, 12).map(async (it) => {
      try {
        const r = await fetch(it.href);
        if (!r.ok) return null;
        const assets: string[] = await r.json();
        // Prefer the medium render — the large ones were multi-MB each.
        const url =
          assets.find((u) => u.endsWith("~medium.jpg")) ||
          assets.find((u) => u.endsWith("~large.jpg")) ||
          assets.find((u) => u.endsWith("~orig.jpg"));
        if (!url) return null;
        return { href: url.replace(/^http:/, "https:"), title: it.data?.[0]?.title ?? "NASA image" } as Item;
      } catch {
        return null;
      }
    }),
  );
  return resolved.filter((x): x is Item => !!x);
}

export const Route = createFileRoute("/api/public/backdrop")({
  server: {
    handlers: {
      GET: async () => {
        if (!cache || Date.now() - cache.at > TTL) {
          try {
            const items = await build();
            if (items.length) cache = { at: Date.now(), items };
          } catch {
            /* keep any previous cache */
          }
        }
        return new Response(JSON.stringify({ items: cache?.items ?? [] }), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});