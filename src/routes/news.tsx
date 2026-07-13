import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchSpaceNews } from "@/lib/api";
import { GlassCard } from "@/components/cosmos/GlassCard";
import { PageHeader } from "./iss";
import { Search, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Space News — Cosmos Live" },
      { name: "description", content: "Latest space news from NASA, ESA, SpaceX, Blue Origin, ISRO, JAXA and more, updated continuously." },
      { property: "og:title", content: "Space News — Cosmos Live" },
      { property: "og:description", content: "Breaking space news from every major agency and provider." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const q = useQuery({ queryKey: ["news"], queryFn: () => fetchSpaceNews(40), staleTime: 60_000 });
  const [query, setQuery] = useState("");
  const [site, setSite] = useState<string | null>(null);

  const sites = useMemo(() => Array.from(new Set(q.data?.map((a) => a.news_site) ?? [])).sort(), [q.data]);

  const filtered = useMemo(() => {
    return (q.data ?? []).filter((a) => {
      if (site && a.news_site !== site) return false;
      if (query && !`${a.title} ${a.summary}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [q.data, query, site]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <PageHeader
        eyebrow="Space News · Live feed"
        title="Breaking from orbit"
        sub="Aggregated from NASA, ESA, SpaceX, ISRO, JAXA and more"
      />

      <div className="mt-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-lg glass pl-10 pr-3 py-2.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip active={site === null} onClick={() => setSite(null)}>All</Chip>
          {sites.slice(0, 10).map((s) => (
            <Chip key={s} active={site === s} onClick={() => setSite(s)}>{s}</Chip>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="group">
            <GlassCard className="p-0 overflow-hidden h-full flex flex-col">
              <div className="aspect-video overflow-hidden bg-black/40">
                {a.image_url ? (
                  <img
                    src={a.image_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-[10px] uppercase tracking-widest text-primary">
                  {a.news_site} · {new Date(a.published_at).toLocaleDateString()}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold leading-tight group-hover:text-primary transition">
                  {a.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3 flex-1">{a.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition">
                  Read article <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </GlassCard>
          </a>
        ))}
      </div>

      {filtered.length === 0 && q.data && (
        <div className="mt-16 text-center text-muted-foreground">No articles match your filters.</div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition border ${
        active ? "bg-primary/20 border-primary/50 text-foreground" : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30"
      }`}>
      {children}
    </button>
  );
}