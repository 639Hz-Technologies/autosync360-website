// "Data" tab on /leads: Florida dealerships from the Genius Leads database (read-only, live).
//   GENIUS_LEADS_URL               https://ejtfdjihsfybtnonjaru.supabase.co ("genius-leads" project)
//   GENIUS_LEADS_SERVICE_ROLE_KEY  that project's service_role key (server only)
import { db } from "./leads.mjs";

const env = k => process.env[k] || "";
export const directoryEnabled = () => !!(env("GENIUS_LEADS_URL") && env("GENIUS_LEADS_SERVICE_ROLE_KEY"));

const FIELDS = "id,place_id,name,address,city,zip,phone,website,rating,rating_count,lat,lng,socials";
const BASE = "category=eq.dealership&state=in.(FL,Florida,FLORIDA)";
const PAGE = 50;

async function gl(path, headers = {}) {
  const key = env("GENIUS_LEADS_SERVICE_ROLE_KEY");
  const res = await fetch(`${env("GENIUS_LEADS_URL").replace(/\/$/, "")}/rest/v1/${path}`, {
    headers: { apikey: key, authorization: `Bearer ${key}`, ...headers },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Genius Leads ${res.status}: ${text.slice(0, 200)}`);
  return { data: text ? JSON.parse(text) : [], range: res.headers.get("content-range") };
}

// Search text goes inside a PostgREST or=() filter: keep it to plain characters.
const safe = q => String(q || "").replace(/[^\p{L}\p{N}\s.'&-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);

function miles(a, b) {
  const R = 3958.8, rad = x => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** { q, city, sort: "reviews"|"az"|"near", lat, lng, offset } → { total, dealers[] } */
export async function searchDealers({ q, city, sort = "reviews", lat, lng, offset = 0 }) {
  const f = [BASE];
  const s = safe(q);
  if (s) f.push(`or=(name.ilike.*${encodeURIComponent(s)}*,city.ilike.*${encodeURIComponent(s)}*,address.ilike.*${encodeURIComponent(s)}*)`);
  if (city) f.push(`city=eq.${encodeURIComponent(String(city).slice(0, 60))}`);
  const off = Math.max(0, Math.min(Number(offset) || 0, 5000));
  const here = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  let total, dealers;
  if (sort === "near" && here) {
    // Nearest: grab everything within ~70 miles, then sort by distance here.
    f.push(`lat=gte.${here.lat - 1}`, `lat=lte.${here.lat + 1}`, `lng=gte.${here.lng - 1.1}`, `lng=lte.${here.lng + 1.1}`);
    const { data } = await gl(`prospects?select=${FIELDS}&${f.join("&")}&limit=3000`);
    const sorted = data.map(d => ({ ...d, miles: miles(here, d) })).sort((a, b) => a.miles - b.miles);
    total = sorted.length;
    dealers = sorted.slice(off, off + PAGE);
  } else {
    const order = sort === "az" ? "name.asc" : "rating_count.desc.nullslast,name.asc";
    const { data, range } = await gl(`prospects?select=${FIELDS}&${f.join("&")}&order=${order}&offset=${off}&limit=${PAGE}`, { prefer: "count=exact" });
    total = Number((range || "").split("/")[1]) || data.length;
    dealers = here ? data.map(d => ({ ...d, miles: miles(here, d) })) : data;
  }

  // Which of these are already AutoSync leads (matched by Google place id)?
  const ids = dealers.map(d => d.place_id).filter(Boolean);
  if (ids.length) {
    const mine = await db.select(`select=id,place_id,pipeline_stage,archived_at&place_id=in.(${ids.map(i => encodeURIComponent(`"${i}"`)).join(",")})`);
    const byPlace = Object.fromEntries(mine.map(m => [m.place_id, m]));
    dealers = dealers.map(d => (byPlace[d.place_id] ? { ...d, lead: byPlace[d.place_id] } : d));
  }
  return { total, offset: off, pageSize: PAGE, dealers };
}

let citiesCache = null;
/** All Florida cities with dealerships, with counts (cached per function instance). */
export async function dealerCities() {
  if (citiesCache && Date.now() - citiesCache.at < 6 * 3600e3) return citiesCache.list;
  const { data } = await gl(`prospects?select=city&${BASE}&limit=10000`);
  const counts = {};
  for (const { city } of data) if (city) counts[city] = (counts[city] || 0) + 1;
  const list = Object.entries(counts).map(([city, n]) => ({ city, n })).sort((a, b) => a.city.localeCompare(b.city));
  citiesCache = { at: Date.now(), list };
  return list;
}
