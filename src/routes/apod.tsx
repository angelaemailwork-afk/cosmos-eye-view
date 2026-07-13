import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/cosmos/GlassCard";
import { Camera, Calendar, ExternalLink } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/apod")({
  head: () => ({
    meta: [
      { title: "Astronomy Picture of the Day — Cosmos Live" },
      {
        name: "description",
        content:
          "NASA's Astronomy Picture of the Day (APOD): a new cosmic image or photograph every day, each with a short explanation from a professional astronomer.",
      },
      { property: "og:title", content: "Astronomy Picture of the Day — Cosmos Live" },
      {
        property: "og:description",
        content: "A new cosmic image each day, explained by professional astronomers.",
      },
    ],
  }),
  component: ApodPage,
});

interface Apod {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video";
  copyright?: string;
  thumbnail_url?: string;
  _servedDate?: string;
  _fallback?: boolean;
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function fetchApod(date: string): Promise<Apod> {
  // Hits our own edge-cached server route which walks back through recent
  // days if NASA is rate-limiting the requested date.
  const res = await fetch(`/api/public/apod?date=${date}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || "APOD unavailable — try again shortly.");
  }
  return res.json();
}

function ApodPage() {
  const today = toYmd(new Date());
  const [date, setDate] = useState(today);

  const q = useQuery({
    queryKey: ["apod", date],
    queryFn: () => fetchApod(date),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-12">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
        <Camera className="h-3.5 w-3.5 text-primary" /> NASA APOD
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-glow">
        Astronomy <span className="gradient-aurora-text">Picture of the Day</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        A new cosmic image every day, curated and explained by professional astronomers since 1995.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <input
            type="date"
            value={date}
            max={today}
            min="1995-06-16"
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent outline-none"
          />
        </label>
        <button
          onClick={() => setDate(today)}
          className="rounded-lg glass px-3 py-2 text-sm hover:bg-primary/10 transition"
        >
          Today
        </button>
        <button
          onClick={() => {
            const start = new Date(1995, 5, 16).getTime();
            const end = Date.now();
            const rand = new Date(start + Math.random() * (end - start));
            setDate(toYmd(rand));
          }}
          className="rounded-lg glass px-3 py-2 text-sm hover:bg-primary/10 transition"
        >
          Surprise me
        </button>
      </div>

      <GlassCard className="mt-8">
        {q.isLoading && (
          <div className="aspect-video w-full rounded-lg bg-white/5 animate-pulse" />
        )}
        {q.error && (
          <div className="text-sm text-destructive">
            {(q.error as Error)?.message || "Couldn't load APOD. Try another date in a moment."}
          </div>
        )}
        {q.data && (
          <>
            {q.data._fallback && q.data._servedDate && q.data._servedDate !== date && (
              <div className="mb-3 text-xs text-amber-300/90">
                NASA hasn&apos;t published {date} yet (or it&apos;s rate-limited) — showing {q.data._servedDate} instead.
              </div>
            )}
            <div className="rounded-lg overflow-hidden bg-black/40">
              {q.data.media_type === "image" ? (
                <img
                  src={q.data.url || q.data.hdurl}
                  alt={q.data.title}
                  className="w-full h-auto object-contain"
                  loading="eager"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (q.data?.hdurl && img.src !== q.data.hdurl) img.src = q.data.hdurl;
                    else if (q.data?.thumbnail_url) img.src = q.data.thumbnail_url;
                  }}
                />
              ) : (
                <div className="aspect-video">
                  <iframe
                    title={q.data.title}
                    src={q.data.url}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
            <div className="mt-5">
              <h2 className="font-display text-2xl font-semibold">{q.data.title}</h2>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {new Date(q.data.date).toDateString()}
                {q.data.copyright ? ` · © ${q.data.copyright.trim()}` : " · Public domain"}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                {q.data.explanation}
              </p>
              {q.data.hdurl && (
                <a
                  href={q.data.hdurl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  Open full-resolution image <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </>
        )}
      </GlassCard>

      <p className="mt-6 text-xs text-muted-foreground">
        Data: NASA / GSFC / APOD. Images are generally public domain unless a copyright is noted.
      </p>
    </div>
  );
}