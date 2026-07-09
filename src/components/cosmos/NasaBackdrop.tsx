import { useEffect, useState } from "react";

interface NasaItem {
  href: string;
  title: string;
  center?: string;
}

/**
 * Full-viewport slideshow of the latest NASA telescope/observatory images.
 * Pulls from the public NASA Image Library (no API key required) and
 * cross-fades between images every ~9 seconds. Sits behind the StarField.
 */
export function NasaBackdrop() {
  const [items, setItems] = useState<NasaItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Query for recent telescope imagery: JWST, Hubble, Chandra.
        const q = encodeURIComponent("James Webb Space Telescope");
        const res = await fetch(
          `https://images-api.nasa.gov/search?q=${q}&media_type=image&year_start=2022`
        );
        if (!res.ok) return;
        const json = await res.json();
        const raw = (json?.collection?.items ?? []) as Array<{
          href: string;
          data?: Array<{ title?: string; center?: string; date_created?: string }>;
        }>;

        // Resolve each collection.json into a large preview image URL.
        const resolved = await Promise.all(
          raw.slice(0, 24).map(async (it) => {
            try {
              const r = await fetch(it.href);
              if (!r.ok) return null;
              const assets: string[] = await r.json();
              const large =
                assets.find((u) => u.endsWith("~large.jpg")) ||
                assets.find((u) => u.endsWith("~medium.jpg")) ||
                assets.find((u) => u.endsWith("~orig.jpg"));
              if (!large) return null;
              const item: NasaItem = {
                href: large,
                title: it.data?.[0]?.title ?? "NASA image",
                center: it.data?.[0]?.center,
              };
              return item;
            } catch {
              return null;
            }
          })
        );

        if (cancelled) return;
        const filtered = resolved.filter((x): x is NasaItem => !!x);
        // Shuffle so each visit differs.
        for (let i = filtered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }
        setItems(filtered);
      } catch {
        /* silently ignore — StarField still renders */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 9000);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[index];
  const next = items[(index + 1) % items.length];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-black">
      {[current, next].map((it, i) => (
        <img
          key={`${it.href}-${i}`}
          src={it.href}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ease-in-out"
          style={{
            opacity: i === 0 ? 0.55 : 0,
            transform: "scale(1.08)",
            filter: "saturate(1.05) contrast(1.05)",
          }}
          loading="eager"
          decoding="async"
        />
      ))}
      {/* darken for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.08 0.03 260 / 0.35) 0%, oklch(0.05 0.02 260 / 0.75) 70%, oklch(0.04 0.02 260 / 0.9) 100%)",
        }}
      />
      {/* attribution */}
      <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-white/40">
        NASA · {current.title.slice(0, 60)}
      </div>
    </div>
  );
}