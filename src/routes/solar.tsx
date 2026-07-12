import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { sdoImageUrl, SDO_WAVELENGTHS } from "@/lib/api";
import { GlassCard } from "@/components/cosmos/GlassCard";
import { PageHeader } from "./iss";
import { Sun, Zap, Waves, ExternalLink, Orbit, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

const NASA_CONSENT_KEY = "nasa-eyes-consent";

export const Route = createFileRoute("/solar")({
  head: () => ({
    meta: [
      { title: "Solar Observatory — Cosmos Live" },
      { name: "description", content: "Near real-time solar imagery from NASA SDO across every wavelength — chromosphere to corona." },
      { property: "og:title", content: "Solar Observatory — Cosmos Live" },
      { property: "og:description", content: "Watch the Sun live in every wavelength via NASA SDO." },
    ],
  }),
  component: SolarPage,
});

function SolarPage() {
  const [wl, setWl] = useState<(typeof SDO_WAVELENGTHS)[number]>(SDO_WAVELENGTHS[0]);
  const [compare, setCompare] = useState<(typeof SDO_WAVELENGTHS)[number] | null>(SDO_WAVELENGTHS[2]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <PageHeader
        eyebrow="Near real-time · NASA SDO"
        title="Solar Observatory"
        sub="Solar Dynamics Observatory imagery refreshed every ~15 minutes"
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] mt-8">
        <GlassCard glow className="p-4">
          <div className={`grid gap-4 ${compare ? "grid-cols-2" : "grid-cols-1"}`}>
            <SolarView wavelength={wl} />
            {compare && <SolarView wavelength={compare} />}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Source: sdo.gsfc.nasa.gov · Latest available frame</span>
            <button
              onClick={() => setCompare(compare ? null : SDO_WAVELENGTHS[2])}
              className="rounded-md glass px-3 py-1.5 hover:bg-primary/10 transition"
            >
              {compare ? "Single view" : "Compare wavelengths"}
            </button>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              <Sun className="h-4 w-4" /> Wavelength
            </div>
            <div className="space-y-1.5">
              {SDO_WAVELENGTHS.map((w) => (
                <button
                  key={w.code}
                  onClick={() => setWl(w)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                    wl.code === w.code ? "bg-primary/15 border border-primary/40" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className={`font-medium ${w.color}`}>{w.label}</div>
                  <div className="text-[11px] text-muted-foreground">{w.desc}</div>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Zap className="h-4 w-4" /> Space Weather
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <Link2 href="https://www.swpc.noaa.gov/products/goes-x-ray-flux" label="Solar Flares (NOAA GOES)" />
              <Link2 href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast" label="Aurora Forecast" />
              <Link2 href="https://www.swpc.noaa.gov/products/real-time-solar-wind" label="Solar Wind" />
              <Link2 href="https://sdo.gsfc.nasa.gov/data/aiahmi/browse.php" label="SDO Image Archive" />
            </ul>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Waves className="h-4 w-4" /> About this data
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              The Solar Dynamics Observatory (SDO) images the Sun continuously across multiple wavelengths.
              Each filter reveals a different layer of the solar atmosphere, from the visible surface to the
              multi-million-degree corona.
            </p>
          </GlassCard>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Orbit className="h-4 w-4" /> NASA Eyes on the Solar System
            </div>
            <h2 className="mt-1 text-2xl font-semibold">Interactive 3D Solar System</h2>
            <p className="text-sm text-muted-foreground">
              Real-time positions of planets, moons, and active spacecraft — powered by NASA/JPL.
            </p>
          </div>
          <a
            href="https://eyes.nasa.gov/apps/solar-system/#/home"
            target="_blank"
            rel="noreferrer"
            className="text-xs inline-flex items-center gap-1 rounded-md glass px-3 py-1.5 hover:bg-primary/10 transition"
          >
            Open fullscreen <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Attribution:</strong> NASA Eyes on the Solar System is an
            official application developed by NASA/JPL-Caltech. It is embedded here via a public iframe for
            educational and non-commercial purposes. All imagery, telemetry, and 3D assets belong to NASA and
            its partners.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Consent note:</strong> Loading the embedded app may send
            limited technical data (such as your IP address and browser capabilities) to NASA servers so the
            experience can render correctly. By interacting with the viewer, you consent to NASA’s terms and
            privacy practices.
          </p>
        </div>

        <NasaEyesEmbed />
      </div>
    </div>
  );
}

function SolarView({ wavelength }: { wavelength: (typeof SDO_WAVELENGTHS)[number] }) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-square shadow-glow">
      <img src={sdoImageUrl(wavelength.code, 1024)} alt={`Latest ${wavelength.label} solar image`}
        loading="lazy" decoding="async"
        className="h-full w-full object-cover" />
      <div className="absolute bottom-2 left-2 text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-black/60">
        {wavelength.label}
      </div>
    </div>
  );
}

function Link2({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between text-muted-foreground hover:text-primary transition">
        {label} <ExternalLink className="h-3 w-3" />
      </a>
    </li>
  );
}

function NasaEyesEmbed() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [consented, setConsented] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const src = "https://eyes.nasa.gov/apps/solar-system/#/home";

  useEffect(() => {
    try {
      setConsented(localStorage.getItem(NASA_CONSENT_KEY) === "true");
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const toggleConsent = useCallback((next: boolean) => {
    setConsented(next);
    setStatus("loading");
    try {
      if (next) localStorage.setItem(NASA_CONSENT_KEY, "true");
      else localStorage.removeItem(NASA_CONSENT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleLoad = useCallback(() => setStatus("loading"), []);
  const handleError = useCallback(() => setStatus("error"), []);
  const retry = useCallback(() => {
    setStatus("loading");
  }, []);

  return (
    <GlassCard glow className="p-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-1 pb-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={consented}
            disabled={!hydrated}
            onChange={(e) => toggleConsent(e.target.checked)}
          />
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          I accept the consent note and want to load the NASA Eyes viewer.
        </label>
        {consented && (
          <button
            onClick={() => toggleConsent(false)}
            className="text-[11px] rounded-md glass px-2 py-1 hover:bg-primary/10 transition"
          >
            Revoke & unload
          </button>
        )}
      </div>

      <div
        className="relative w-full overflow-hidden rounded-xl bg-black"
        style={{ aspectRatio: "16 / 9" }}
      >
        {!consented && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <div className="space-y-2 max-w-md">
              <p className="text-base font-semibold">Consent required</p>
              <p className="text-sm text-muted-foreground">
                Check the box above to load NASA Eyes. Your choice is saved to this browser.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => toggleConsent(true)}
                disabled={!hydrated}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" /> Accept & load
              </button>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md glass px-4 py-2 text-sm font-medium hover:bg-primary/10 transition"
              >
                Open on NASA <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {consented && status === "loading" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm">
            <div className="relative h-12 w-12">
              <span className="absolute inset-0 rounded-full border-2 border-muted/30" />
              <span className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Loading NASA Eyes…</p>
              <p className="text-xs text-muted-foreground">This immersive 3D app may take a moment.</p>
            </div>
          </div>
        )}

        {consented && status === "error" ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
            <div className="space-y-2 max-w-md">
              <p className="text-base font-semibold">NASA Eyes could not load</p>
              <p className="text-sm text-muted-foreground">
                The iframe is blocked by your browser or NASA Eyes is temporarily unavailable.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md glass px-4 py-2 text-sm font-medium hover:bg-primary/10 transition"
              >
                Open on NASA <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ) : consented ? (
          <iframe
            src={src}
            title="NASA Eyes on the Solar System"
            className="absolute inset-0 h-full w-full"
            allow="fullscreen; accelerometer; gyroscope; xr-spatial-tracking"
            allowFullScreen
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : null}
      </div>
    </GlassCard>
  );
}