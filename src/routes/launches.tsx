import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchUpcomingLaunches, formatCountdown, type Launch } from "@/lib/api";
import { GlassCard } from "@/components/cosmos/GlassCard";
import { PageHeader } from "./iss";
import { Rocket, MapPin, ExternalLink, Radio } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";

export const Route = createFileRoute("/launches")({
  head: () => ({
    meta: [
      { title: "Upcoming Rocket Launches — Cosmos Live" },
      { name: "description", content: "Live countdowns for every upcoming rocket launch worldwide, powered by The Space Devs Launch Library." },
      { property: "og:title", content: "Upcoming Rocket Launches — Cosmos Live" },
      { property: "og:description", content: "Track every upcoming launch with live T-minus countdowns." },
    ],
  }),
  component: LaunchesPage,
});

function LaunchesPage() {
  const q = useQuery({ queryKey: ["launches"], queryFn: () => fetchUpcomingLaunches(20), staleTime: 60_000 });
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((t) => t + 1), 1000); return () => clearInterval(i); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <PageHeader
        eyebrow="Launch Manifest · Live countdowns"
        title="Upcoming Missions"
        sub="The next 20 rocket launches worldwide"
      />

      {q.isLoading && <div className="mt-8 text-center text-muted-foreground">Loading launch manifest…</div>}
      {q.error && <div className="mt-8 text-center text-destructive">Failed to load launches.</div>}

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((l) => <LaunchCard key={l.id} launch={l} />)}
      </div>
    </div>
  );
}

function LaunchCard({ launch }: { launch: Launch }) {
  const img = typeof launch.image === "string" ? launch.image : launch.image?.image_url;
  const mounted = useMounted();
  const status = launch.status?.abbrev ?? "TBD";
  const statusColor =
    status === "Go" ? "text-green-400 border-green-400/40 bg-green-400/10" :
    status === "TBD" ? "text-yellow-300 border-yellow-300/40 bg-yellow-300/10" :
    status === "Hold" ? "text-orange-400 border-orange-400/40 bg-orange-400/10" :
    "text-muted-foreground border-white/20 bg-white/5";

  return (
    <GlassCard className="p-0 overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        {img ? (
          <img src={img} alt={launch.name} className="h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground">
            <Rocket className="h-10 w-10" />
          </div>
        )}
        <div className={`absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest border ${statusColor}`}>
          {status}
        </div>
        {launch.webcast_live && (
          <div className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest bg-red-500/80 flex items-center gap-1">
            <Radio className="h-3 w-3" /> Live
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="font-mono text-2xl text-primary text-glow">
          {mounted ? formatCountdown(launch.net) : "T− …"}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
          {new Date(launch.net).toUTCString()}
        </div>

        <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{launch.name}</h3>

        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <div>{launch.launch_service_provider?.name}</div>
          {launch.pad?.location?.name && (
            <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{launch.pad.location.name}</div>
          )}
        </div>

        {launch.mission?.description && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{launch.mission.description}</p>
        )}

        {launch.vidURLs?.[0]?.url && (
          <a href={launch.vidURLs[0].url} target="_blank" rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            Official webcast <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </GlassCard>
  );
}