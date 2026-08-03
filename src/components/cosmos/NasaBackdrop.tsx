import { useEffect, useState } from "react";

interface NasaItem {
  href: string;
  title: string;
}

/** Run work after first paint / when the browser is idle. */
function whenIdle(fn: () => void) {
  const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(fn, { timeout: 3000 });
  else setTimeout(fn, 1200);
}

/**
 * Full-viewport slideshow of the latest NASA telescope/observatory images.
 * Pulls from the public NASA Image Library (no API key required) and
 * cross-fades between images every ~9 seconds. Sits behind the StarField.
 */
export function NasaBackdrop() {
  const [items, setItems] = useState<NasaItem[]>([]);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Single small, edge-cached request — the heavy NASA fan-out now
        // happens on the server, not in every visitor's browser.
        const r = await fetch("/api/public/backdrop");
        if (!r.ok) return;
        const json: { items?: NasaItem[] } = await r.json();
        if (cancelled) return;
        setItems(json.items ?? []);
      } catch {
        /* silently ignore — StarField still renders */
      }
    }
    // Deferred so it never competes with the page's own data + JS.
    whenIdle(() => {
      if (!cancelled) load();
    });
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
            opacity: i === 0 && ready ? 0.55 : 0,
            transform: "scale(1.08)",
            filter: "saturate(1.05) contrast(1.05)",
          }}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={i === 0 ? () => setReady(true) : undefined}
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