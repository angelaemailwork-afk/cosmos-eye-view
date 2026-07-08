import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, lazy, Suspense } from "react";
import { fetchIssPosition, reverseGeocode, type IssPosition } from "@/lib/api";
import { GlassCard } from "@/components/cosmos/GlassCard";
import { Satellite, Globe2, Gauge, MapPin, Users, ExternalLink } from "lucide-react";

const EarthGlobe = lazy(() => import("@/components/cosmos/EarthGlobe").then((m) => ({ default: m.EarthGlobe })));

export const Route = createFileRoute("/iss")({
  head: () => ({
    meta: [
      { title: "ISS Live Tracker — Cosmos Live" },
      { name: "description", content: "Real-time International Space Station position, altitude, velocity, crew, and 3D orbit visualization." },
      { property: "og:title", content: "ISS Live Tracker — Cosmos Live" },
      { property: "og:description", content: "Follow the ISS in real-time with 3D orbit and telemetry." },
    ],
  }),
  component: IssPage,
});

function IssPage() {
  const iss = useQuery({ queryKey: ["iss-live"], queryFn: fetchIssPosition, refetchInterval: 3000 });
  const [history, setHistory] = useState<Array<{ lat: number; lon: number }>>([]);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    if (!iss.data) return;
    setHistory((h) => {
      const next = [...h, { lat: iss.data!.latitude, lon: iss.data!.longitude }];
      return next.slice(-120);
    });
  }, [iss.data]);

  useEffect(() => {
    if (!iss.data) return;
    const id = setTimeout(() => {
      reverseGeocode(iss.data!.latitude, iss.data!.longitude).then(setCountry);
    }, 200);
    return () => clearTimeout(id);
  }, [Math.round((iss.data?.latitude ?? 0) * 2), Math.round((iss.data?.longitude ?? 0) * 2)]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <PageHeader
        eyebrow="Live · updated every 3s"
        title="International Space Station"
        sub="Real-time orbital telemetry via wheretheiss.at"
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] mt-8">
        <GlassCard glow className="h-[520px] p-0 overflow-hidden relative">
          <Suspense fallback={<div className="h-full grid place-items-center text-muted-foreground text-sm">Loading 3D globe…</div>}>
            {iss.data ? (
              <EarthGlobe
                lat={iss.data.latitude}
                lon={iss.data.longitude}
                altitudeKm={iss.data.altitude}
                history={history}
              />
            ) : null}
          </Suspense>
          <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-muted-foreground pointer-events-none">
            3D Orbit · drag to rotate
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Satellite className="h-4 w-4" /> Telemetry
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Stat icon={<Gauge className="h-4 w-4" />} label="Altitude" value={iss.data ? `${iss.data.altitude.toFixed(1)} km` : "…"} />
              <Stat icon={<Gauge className="h-4 w-4" />} label="Velocity" value={iss.data ? `${iss.data.velocity.toFixed(0)} km/h` : "…"} />
              <Stat icon={<MapPin className="h-4 w-4" />} label="Latitude" value={iss.data ? iss.data.latitude.toFixed(3) : "…"} />
              <Stat icon={<MapPin className="h-4 w-4" />} label="Longitude" value={iss.data ? iss.data.longitude.toFixed(3) : "…"} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Globe2 className="h-4 w-4" /> Currently over
            </div>
            <div className="mt-3 text-2xl font-display font-semibold text-glow">
              {country ?? (iss.data ? "Locating…" : "…")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Visibility: {iss.data?.visibility ?? "—"}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Users className="h-4 w-4" /> Live view
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              NASA broadcasts the ISS Live HD Earth Viewing feed continuously on YouTube.
            </p>
            <a
              href="https://www.youtube.com/watch?v=P9C25Un7xaM"
              target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open ISS Live Stream <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}{label}
      </div>
      <div className="font-mono text-lg mt-1 text-glow">{value}</div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-primary/80">{eyebrow}</div>
      <h1 className="mt-2 text-4xl md:text-5xl font-display font-bold text-glow">{title}</h1>
      <p className="mt-2 text-muted-foreground">{sub}</p>
    </div>
  );
}
// silence unused var warning
void ({} as IssPosition);