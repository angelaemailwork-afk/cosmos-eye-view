import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/cosmos/GlassCard";
import { fetchIssPosition, fetchUpcomingLaunches, fetchSpaceNews, sdoImageUrl, formatCountdown } from "@/lib/api";
import { Rocket, Newspaper, Sun, Satellite, ArrowRight, Sparkles, Camera, Orbit, Telescope } from "lucide-react";
import { useEffect, useState } from "react";
import { useMounted } from "@/lib/use-mounted";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const iss = useQuery({ queryKey: ["iss"], queryFn: fetchIssPosition, refetchInterval: 5000 });
  const launches = useQuery({ queryKey: ["launches-home"], queryFn: () => fetchUpcomingLaunches(3), staleTime: 60_000 });
  const news = useQuery({ queryKey: ["news-home"], queryFn: () => fetchSpaceNews(3), staleTime: 60_000 });

  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(i); }, []);
  void tick;
  const mounted = useMounted();

  const next = launches.data?.[0];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      {/* Hero */}
      <section className="relative py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
          <Sparkles className="h-3 w-3 text-primary" /> Live · Real-time telemetry
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-glow">
          The universe,{" "}
          <span className="gradient-aurora-text">right now.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Track the International Space Station, watch the Sun in near real-time, and follow every rocket launch
          across the world — one mission control.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/iss" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:brightness-110 transition">
            Track the ISS →
          </Link>
          <Link to="/apod" className="rounded-lg glass px-5 py-2.5 text-sm font-medium hover:bg-primary/10 transition flex items-center gap-2">
            <Camera className="h-4 w-4" /> Picture of the Day
          </Link>
          <Link to="/mars" className="rounded-lg glass px-5 py-2.5 text-sm font-medium hover:bg-primary/10 transition flex items-center gap-2">
            <Orbit className="h-4 w-4" /> Mars rovers
          </Link>
          <Link to="/explore" className="rounded-lg glass px-5 py-2.5 text-sm font-medium hover:bg-primary/10 transition flex items-center gap-2">
            <Telescope className="h-4 w-4" /> Explore 3D
          </Link>
          <Link to="/launches" className="rounded-lg glass px-5 py-2.5 text-sm font-medium hover:bg-primary/10 transition">
            Next launch
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground max-w-xl mx-auto">
          A free educational window into the universe · Built by Angela_seh for students, teachers and everyone who loves the night sky.
        </p>
      </section>

      {/* Live dashboard */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-16">
        <GlassCard glow>
          <CardHeader icon={<Satellite className="h-4 w-4" />} label="ISS Live" to="/iss" />
          {iss.data ? (
            <div className="mt-4 space-y-1.5">
              <Metric label="Altitude" value={`${iss.data.altitude.toFixed(1)} km`} />
              <Metric label="Velocity" value={`${iss.data.velocity.toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h`} />
              <Metric label="Latitude" value={iss.data.latitude.toFixed(2)} />
              <Metric label="Longitude" value={iss.data.longitude.toFixed(2)} />
            </div>
          ) : <Skeleton lines={4} />}
        </GlassCard>

        <GlassCard>
          <CardHeader icon={<Rocket className="h-4 w-4" />} label="Next Launch" to="/launches" />
          {next ? (
            <div className="mt-4">
              <div className="text-sm font-medium">{next.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{next.launch_service_provider?.name}</div>
              <div className="mt-4 font-mono text-2xl text-primary text-glow">
                {mounted ? formatCountdown(next.net) : "T− …"}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {new Date(next.net).toUTCString()}
              </div>
            </div>
          ) : <Skeleton lines={3} />}
        </GlassCard>

        <GlassCard>
          <CardHeader icon={<Sun className="h-4 w-4" />} label="The Sun · Now" to="/solar" />
          <div className="mt-4 rounded-lg overflow-hidden aspect-square bg-black/40">
            <img src={sdoImageUrl("0304", 512)} alt="Latest AIA 304 solar image from NASA SDO"
              className="h-full w-full object-cover animate-float-slow" loading="lazy" />
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">SDO · AIA 304 Å</div>
        </GlassCard>

        <GlassCard className="md:col-span-2">
          <CardHeader icon={<Newspaper className="h-4 w-4" />} label="Space News" to="/news" />
          <div className="mt-4 divide-y divide-white/5">
            {news.data?.map((n) => (
              <a key={n.id} href={n.url} target="_blank" rel="noreferrer"
                className="flex gap-4 py-3 group">
                <img src={n.image_url} alt="" className="h-16 w-24 rounded-md object-cover shrink-0" loading="lazy" />
                <div className="min-w-0">
                  <div className="text-sm font-medium group-hover:text-primary transition line-clamp-2">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{n.news_site} · {new Date(n.published_at).toLocaleDateString()}</div>
                </div>
              </a>
            )) ?? <Skeleton lines={3} />}
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader icon={<Sparkles className="h-4 w-4" />} label="Mission Status" />
          <ul className="mt-4 space-y-3 text-sm">
            <StatusRow name="ISS Telemetry" online />
            <StatusRow name="SDO Solar Feed" online />
            <StatusRow name="Launch Library" online />
            <StatusRow name="Space News API" online />
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}

function CardHeader({ icon, label, to }: { icon: React.ReactNode; label: string; to?: string }) {
  const inner = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {icon} {label}
      </div>
      {to && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition" />}
    </div>
  );
  return to ? <Link to={to} className="group block">{inner}</Link> : inner;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function Skeleton({ lines = 3 }: { lines?: number }) {
  const widths = [82, 71, 90, 68, 95, 77, 86];
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded bg-white/5 animate-pulse" style={{ width: `${widths[i % widths.length]}%` }} />
      ))}
    </div>
  );
}

function StatusRow({ name, online }: { name: string; online: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{name}</span>
      <span className="flex items-center gap-2 text-xs">
        <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
        {online ? "Online" : "Offline"}
      </span>
    </li>
  );
}
