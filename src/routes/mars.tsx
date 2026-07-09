import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/cosmos/GlassCard";
import { Orbit, ExternalLink } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/mars")({
  head: () => ({
    meta: [
      { title: "Mars Rover Photos — Cosmos Live" },
      {
        name: "description",
        content:
          "Browse the latest photographs sent back by NASA's Curiosity, Perseverance, Opportunity and Spirit rovers on the surface of Mars.",
      },
      { property: "og:title", content: "Mars Rover Photos — Cosmos Live" },
      {
        property: "og:description",
        content: "Latest images from NASA rovers on the surface of Mars.",
      },
    ],
  }),
  component: MarsPage,
});

const ROVERS = [
  { id: "curiosity", label: "Curiosity", years: "2012 – present" },
  { id: "perseverance", label: "Perseverance", years: "2021 – present" },
  { id: "opportunity", label: "Opportunity", years: "2004 – 2018" },
  { id: "spirit", label: "Spirit", years: "2004 – 2010" },
] as const;

interface RoverPhoto {
  id: number;
  img_src: string;
  earth_date: string;
  sol: number;
  camera: { full_name: string; name: string };
  rover: { name: string };
}

async function fetchLatest(rover: string): Promise<RoverPhoto[]> {
  const res = await fetch(
    `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=DEMO_KEY`
  );
  if (!res.ok) throw new Error("Mars photos unavailable — NASA API may be rate-limited.");
  const json = await res.json();
  return (json.latest_photos ?? []) as RoverPhoto[];
}

function MarsPage() {
  const [rover, setRover] = useState<(typeof ROVERS)[number]["id"]>("perseverance");
  const q = useQuery({
    queryKey: ["mars", rover],
    queryFn: () => fetchLatest(rover),
    staleTime: 10 * 60_000,
    retry: 1,
  });

  const active = ROVERS.find((r) => r.id === rover)!;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
        <Orbit className="h-3.5 w-3.5 text-primary" /> Mars Surface
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-glow">
        Latest from the <span className="gradient-aurora-text">Red Planet</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Raw photographs sent back by NASA rovers from the surface of Mars. Every image below is authentic,
        unretouched telemetry — data from another world.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {ROVERS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRover(r.id)}
            className={`rounded-lg px-4 py-2 text-sm transition border ${
              rover === r.id
                ? "bg-primary/15 border-primary/40 text-foreground"
                : "glass border-transparent hover:bg-primary/10"
            }`}
          >
            <div className="font-medium">{r.label}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.years}</div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {q.isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}
        {q.error && (
          <GlassCard>
            <div className="text-sm text-destructive">
              Couldn&apos;t reach NASA&apos;s Mars Rover API. It rate-limits demo traffic — try another rover
              or refresh in a moment.
            </div>
          </GlassCard>
        )}
        {q.data && q.data.length === 0 && (
          <GlassCard>
            <div className="text-sm text-muted-foreground">
              No recent photos returned for {active.label}. This rover&apos;s mission may have concluded —
              try Curiosity or Perseverance.
            </div>
          </GlassCard>
        )}
        {q.data && q.data.length > 0 && (
          <>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              {q.data.length} photos · Latest sol {q.data[0].sol} · {new Date(q.data[0].earth_date).toDateString()}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {q.data.slice(0, 24).map((p) => (
                <a
                  key={p.id}
                  href={p.img_src}
                  target="_blank"
                  rel="noreferrer"
                  className="group glass rounded-2xl overflow-hidden block hover:-translate-y-0.5 transition"
                >
                  <div className="aspect-square bg-black/50 overflow-hidden">
                    <img
                      src={p.img_src}
                      alt={`${p.rover.name} · ${p.camera.full_name}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium">{p.camera.full_name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Sol {p.sol} · {p.earth_date}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition" />
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Data: NASA / JPL-Caltech Mars Rover Photos API. Public domain imagery for education and public use.
      </p>
    </div>
  );
}