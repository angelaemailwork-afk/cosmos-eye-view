import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Telescope } from "lucide-react";
import { PageHeader } from "./iss";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore the Solar System in 3D — Cosmos Live" },
      { name: "description", content: "Fly through the Solar System in your browser with NASA's Eyes — a real-time 3D visualisation of every planet, moon and spacecraft." },
      { property: "og:title", content: "Explore the Solar System in 3D — Cosmos Live" },
      { property: "og:description", content: "NASA's Eyes on the Solar System, embedded inside Cosmos Live." },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <PageHeader
        eyebrow="NASA Eyes · Interactive 3D"
        title="Explore the Solar System"
        sub="Fly to any planet, moon or active spacecraft — powered by NASA's Eyes on the Solar System"
      />

      <div className="mt-8 relative rounded-2xl overflow-hidden border border-white/10 shadow-glow bg-black/60">
        <div className="relative w-full aspect-video">
          <iframe
            src="https://eyes.nasa.gov/apps/solar-system/#/home"
            title="NASA's Eyes on the Solar System"
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            allow="fullscreen; accelerometer; gyroscope; xr-spatial-tracking"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Telescope className="h-4 w-4 text-primary" />
          Best viewed fullscreen · Use the in-frame controls to travel between worlds
        </div>
        <a
          href="https://eyes.nasa.gov/apps/solar-system/#/home"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg glass px-3 py-1.5 hover:bg-primary/10 transition"
        >
          Open on nasa.gov <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}