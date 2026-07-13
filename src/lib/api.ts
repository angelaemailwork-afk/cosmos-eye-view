// Public data sources — no keys required.

export interface IssPosition {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/h
  visibility: string;
  timestamp: number;
}

export async function fetchIssPosition(): Promise<IssPosition> {
  const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544", { cache: "no-store" });
  if (!res.ok) throw new Error("ISS API failed");
  return res.json();
}

export interface IssCrewMember { name: string; craft: string }
export async function fetchPeopleInSpace(): Promise<{ number: number; people: IssCrewMember[] }> {
  const res = await fetch("http://api.open-notify.org/astros.json").catch(() => null);
  if (!res || !res.ok) {
    // Fallback (open-notify is http-only; may be blocked)
    return { number: 0, people: [] };
  }
  return res.json();
}

export interface Launch {
  id: string;
  name: string;
  status: { name: string; abbrev: string };
  net: string; // ISO date
  window_start: string;
  window_end: string;
  image?: string | { image_url?: string };
  mission?: { name: string; description: string; type: string; orbit?: { name: string } } | null;
  launch_service_provider?: { name: string; type: string };
  pad?: { name: string; location?: { name: string; country_code: string } };
  webcast_live?: boolean;
  vidURLs?: Array<{ url: string }>;
}

export async function fetchUpcomingLaunches(limit = 12): Promise<Launch[]> {
  const res = await fetch(`/api/public/launches?limit=${limit}`);
  if (!res.ok) throw new Error("Launches API failed");
  const json = await res.json();
  return json.results ?? [];
}

export interface NewsArticle {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
}

export async function fetchSpaceNews(limit = 15): Promise<NewsArticle[]> {
  const res = await fetch(`/api/public/news?limit=${limit}`);
  if (!res.ok) throw new Error("News API failed");
  const json = await res.json();
  return json.results ?? [];
}

/** NASA SDO near-real-time solar image URL for a given wavelength (AIA channel). */
export function sdoImageUrl(wavelength: string, size = 1024): string {
  return `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_${size}_${wavelength}.jpg`;
}

export const SDO_WAVELENGTHS = [
  { code: "0304", label: "AIA 304 Å", desc: "Chromosphere / transition region · 50,000 K", color: "text-orange-400" },
  { code: "0171", label: "AIA 171 Å", desc: "Upper transition region · 600,000 K", color: "text-amber-300" },
  { code: "0193", label: "AIA 193 Å", desc: "Corona and hot flare plasma · 1.25M K", color: "text-yellow-400" },
  { code: "0211", label: "AIA 211 Å", desc: "Active regions of the corona · 2M K", color: "text-purple-300" },
  { code: "0335", label: "AIA 335 Å", desc: "Active regions of the corona · 2.5M K", color: "text-blue-300" },
  { code: "0094", label: "AIA 094 Å", desc: "Flaring regions of the corona · 6M K", color: "text-green-300" },
  { code: "0131", label: "AIA 131 Å", desc: "Flaring regions · 10M K", color: "text-teal-300" },
  { code: "HMIIF", label: "HMI Intensitygram", desc: "Visible surface (photosphere)", color: "text-slate-200" },
  { code: "HMIB", label: "HMI Magnetogram", desc: "Solar magnetic field polarity", color: "text-slate-300" },
] as const;

export function formatCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Launched";
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `T− ${d > 0 ? `${d}d ` : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Reverse geocode ISS lat/lon → country (best-effort, open API). */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (!r.ok) return null;
    const j = await r.json();
    return j.countryName || j.locality || "Over the ocean";
  } catch { return null; }
}