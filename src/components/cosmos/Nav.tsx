import { Link } from "@tanstack/react-router";
import { Rocket, Newspaper, Sun, Satellite, Home, Camera, Orbit, Sparkles, ExternalLink } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/apod", label: "Picture of the Day", icon: Camera },
  { to: "/iss", label: "ISS Live", icon: Satellite },
  { to: "/mars", label: "Mars", icon: Orbit },
  { to: "/solar", label: "Solar", icon: Sun },
  { to: "/launches", label: "Launches", icon: Rocket },
  { to: "/news", label: "News", icon: Newspaper },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl bg-background/50">
      <div className="bg-primary/10 border-b border-primary/20 text-center py-1.5 px-4 text-[11px] tracking-wide text-foreground/80 flex items-center justify-center gap-2">
        <Sparkles className="h-3 w-3 text-primary" />
        <span>
          Created by <span className="font-semibold text-foreground">Angela_seh</span> · A free window into the cosmos for science lovers everywhere
        </span>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-9 w-9 rounded-lg glass shadow-glow grid place-items-center">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight text-glow">Cosmos Live</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mission Control</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group relative px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              activeProps={{ className: "text-foreground bg-primary/10 border border-primary/30" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://linktr.ee/LinktreeAngela"
            target="_blank"
            rel="noreferrer"
            aria-label="Whole — Angela’s Linktree with contacts and donation options (opens in a new tab)"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-sm hover:bg-primary/25 hover:shadow-glow hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Whole</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:inline">Live telemetry</span>
          </div>
        </div>
      </div>
      {/* mobile */}
      <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-3">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            activeProps={{ className: "text-foreground bg-primary/10 border border-primary/30" }}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}