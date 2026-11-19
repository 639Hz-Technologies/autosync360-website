// Shared server code for /leads: password login, Supabase (table + media bucket), Google lookup.
//
// Env vars (Netlify → Site configuration → Environment variables):
//   LEADS_PASSWORD             password for autosync360.com/leads
//   SUPABASE_URL               https://ikxcgwrhfwdzifqfoqbk.supabase.co ("Auto Sync App" project)
//   SUPABASE_SERVICE_ROLE_KEY  that project's service_role key (server only, never in the browser)
//   POST_MARK_API              Postmark server token (same one the contact form uses); LEADS_POSTMARK_TOKEN overrides it
//   LEADS_FROM_EMAIL           optional, From address (defaults to GMAIL_USER, then FROM_EMAIL); must be on a Postmark-verified domain
//   LEADS_REPLY_TO             optional, where replies go (defaults to GMAIL_USER)
//   GMAIL_USER / GMAIL_APP_PASSWORD  optional, lets follow-ups check that inbox for replies (IMAP) and stop automatically
//   BUSINESS_ADDRESS           mailing address printed in every email footer (required by CAN-SPAM)
//   LEADS_SENDER_NAME          optional, the name signed on the emails (defaults to "AutoSync 360")
//   LEADS_PHONE                optional, phone in the signature (defaults to 866-AUTO-239)
//   SITE_URL                   optional, defaults to https://autosync360.com
//   GOOGLE_MAPS_API_KEY        optional, enables the Google dealership lookup (Places API (New))
import crypto from "node:crypto";

export const BUCKET = "lead-media";
const SESSION_DAYS = 30;

const env = k => process.env[k] || "";
export const siteUrl = () => (env("SITE_URL") || "https://autosync360.com").replace(/\/$/, "");
// Photos/videos are served through our own domain (lead-media function) so they carry noindex headers.
export const mediaUrl = path => `${siteUrl()}/lot-media/${path}`;
export const reportUrl = id => `${siteUrl()}/lot/${id}`;
export const unsubscribeUrl = id => `${siteUrl()}/unsubscribe/${id}`;

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });

export function missingEnv(keys) {
  return keys.filter(k => !env(k));
}

// ---- Login: a signed, expiring token. Changing LEADS_PASSWORD logs everyone out. ----
const secret = () => `${env("LEADS_PASSWORD")}:${env("SUPABASE_SERVICE_ROLE_KEY")}`;
const sign = s => crypto.createHmac("sha256", secret()).update(s).digest("base64url");

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(pw) {
  return !!env("LEADS_PASSWORD") && safeEqual(pw || "", env("LEADS_PASSWORD"));
}

export function issueToken() {
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  return `${exp}.${sign(exp)}`;
}

export function isAuthed(req) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [exp, sig] = t.split(".");
  return !!exp && !!sig && Number(exp) > Date.now() && safeEqual(sig, sign(exp));
}

// ---- Supabase (REST, service role) ----
async function sbFetch(path, init = {}) {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.headers || {}) },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${data?.message || data?.error || text}`);
  return data;
}

// Read any table, with the total row count (for paging). Used by the Data tab (dealer_directory).
export async function sbRead(table, query) {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${base}/rest/v1/${table}?${query}`, { headers: { apikey: key, authorization: `Bearer ${key}`, prefer: "count=exact" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  return { data: text ? JSON.parse(text) : [], total: Number((res.headers.get("content-range") || "").split("/")[1]) };
}

export const db = {
  select: query => sbFetch(`/rest/v1/lead_prospects?${query}`),
  insert: row => sbFetch(`/rest/v1/lead_prospects`, { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(row) }).then(r => r[0]),
  // PATCH with extra PostgREST filters, e.g. "step=eq.1": returns the row only if it still matched.
  updateWhere: (id, filters, patch) => sbFetch(`/rest/v1/lead_prospects?id=eq.${encodeURIComponent(id)}&${filters}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(patch) }).then(r => r[0]),
  update: (id, patch) => sbFetch(`/rest/v1/lead_prospects?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(patch) }).then(r => r[0]),
};

// A one-time URL the phone uploads a photo/video straight to (no size limit from Netlify in the way).
export async function signedUpload(path) {
  const data = await sbFetch(`/storage/v1/object/upload/sign/${BUCKET}/${path}`, { method: "POST", body: "{}" });
  return `${env("SUPABASE_URL").replace(/\/$/, "")}/storage/v1${data.url}`;
}

// Paths are always generated by us: "YYYY-MM/<uuid>.<ext>"
export const MEDIA_PATH = /^\d{4}-\d{2}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|mp4|mov|webm|m4v)$/;

// ---- Google Places (New): dealership lookup on the form. Optional: without GOOGLE_MAPS_API_KEY the form is plain text. ----
export const placesEnabled = () => !!env("GOOGLE_MAPS_API_KEY");

async function places(path, init) {
  const res = await fetch(`https://places.googleapis.com/v1/${path}`, {
    ...init,
    headers: { "x-goog-api-key": env("GOOGLE_MAPS_API_KEY"), "content-type": "application/json", ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Places ${res.status}: ${data?.error?.message || "request failed"}`);
  return data;
}

// Car dealers matching what was typed, biased toward where the rep is standing.
export async function placesAutocomplete({ input, sessionToken, lat, lng }) {
  const body = { input, sessionToken, includedPrimaryTypes: ["car_dealer"], includedRegionCodes: ["us"] };
  if (Number.isFinite(lat) && Number.isFinite(lng)) body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 40000 } };
  const data = await places("places:autocomplete", { method: "POST", body: JSON.stringify(body) });
  return (data.suggestions || []).map(s => s.placePrediction).filter(Boolean).slice(0, 5).map(p => ({
    placeId: p.placeId,
    name: p.structuredFormat?.mainText?.text || p.text?.text || "",
    secondary: p.structuredFormat?.secondaryText?.text || "",
  }));
}

export async function placeDetails({ placeId, sessionToken }) {
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId || "")) throw new Error("Bad place id");
  const qs = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
  const p = await places(`places/${placeId}${qs}`, {
    method: "GET",
    headers: { "x-goog-fieldmask": "id,displayName,formattedAddress,websiteUri,nationalPhoneNumber" },
  });
  return {
    placeId: p.id,
    name: p.displayName?.text || "",
    address: (p.formattedAddress || "").replace(/, USA$/, ""),
    website: p.websiteUri || "",
    phone: p.nationalPhoneNumber || "",
  };
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
