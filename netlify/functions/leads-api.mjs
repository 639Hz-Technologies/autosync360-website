// API behind autosync360.com/leads (password protected field tool).
//   POST /api/leads/login   {password}                 → {token}
//   POST /api/leads/upload  {type}                     → {path, uploadUrl, url}   (phone PUTs the file to uploadUrl)
//   POST /api/leads/send    {dealership, address, contactName, contactTitle, email, issues[], notes, media[], force}
//                                                      → saves the lead, fires the Klaviyo event that starts the email flow
//   GET  /api/leads/list                               → recent leads for the Campaign tab
//   POST /api/leads/status  {id, status}               → replied / stopped / active (mirrored to Klaviyo)
//   POST /api/leads/places  {input, sessionToken, lat, lng} → Google car-dealer suggestions
//   POST /api/leads/place   {placeId, sessionToken}    → name, address, website, phone for the picked dealer
import crypto from "node:crypto";
import { ISSUES, issuesSentence } from "../../src/leads/issues.js";
import {
  json, missingEnv, checkPassword, issueToken, isAuthed, db, signedUpload, MEDIA_PATH, mediaUrl, reportUrl,
  klaviyoLotVisit, klaviyoSetStatus, placesEnabled, placesAutocomplete, placeDetails,
} from "../lib/leads.mjs";

export const config = { path: "/api/leads/*" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/x-m4v": "m4v" };
const clean = (s, max = 300) => String(s ?? "").trim().slice(0, max);

export default async (req) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/leads\/?/, "");

  const missing = missingEnv(["LEADS_PASSWORD", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "KLAVIYO_PRIVATE_KEY"]);
  if (missing.length) {
    console.error("leads-api missing env:", missing);
    return json({ error: `Server not configured yet (missing ${missing.join(", ")}).` }, 500);
  }

  try {
    if (route === "login" && req.method === "POST") {
      const { password } = await req.json().catch(() => ({}));
      if (!checkPassword(password)) {
        await new Promise(r => setTimeout(r, 800)); // slow down guessing
        return json({ error: "Wrong password." }, 401);
      }
      return json({ token: issueToken() });
    }

    if (!isAuthed(req)) return json({ error: "Please log in again." }, 401);

    if (route === "upload" && req.method === "POST") {
      const { type } = await req.json();
      const ext = EXT[String(type).toLowerCase()];
      if (!ext) return json({ error: `Unsupported file type: ${type}` }, 400);
      const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
      return json({ path, uploadUrl: await signedUpload(path), url: mediaUrl(path) });
    }

    if (route === "places" && req.method === "POST") {
      if (!placesEnabled()) return json({ disabled: true, suggestions: [] });
      const { input, sessionToken, lat, lng } = await req.json();
      if (clean(input).length < 2) return json({ suggestions: [] });
      return json({ suggestions: await placesAutocomplete({ input: clean(input, 120), sessionToken: clean(sessionToken, 64), lat: lat == null ? NaN : Number(lat), lng: lng == null ? NaN : Number(lng) }) });
    }

    if (route === "place" && req.method === "POST") {
      if (!placesEnabled()) return json({ error: "Google lookup isn't set up." }, 400);
      const { placeId, sessionToken } = await req.json();
      return json(await placeDetails({ placeId, sessionToken: clean(sessionToken, 64) }));
    }

    if (route === "send" && req.method === "POST") return await send(await req.json());

    if (route === "list" && req.method === "GET") {
      const rows = await db.select("select=id,created_at,dealership,address,contact_name,contact_email,status,media,issues&order=created_at.desc&limit=100");
      return json({ leads: rows.map(r => ({ ...r, report_url: reportUrl(r.id), media_count: (r.media || []).length, media: undefined })) });
    }

    if (route === "status" && req.method === "POST") {
      const { id, status } = await req.json();
      if (!["replied", "stopped", "active"].includes(status)) return json({ error: "Bad status" }, 400);
      const row = await db.update(id, { status });
      if (!row) return json({ error: "Lead not found" }, 404);
      await klaviyoSetStatus(row.contact_email, status);
      return json({ ok: true, status });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("leads-api error:", err);
    return json({ error: err.message || "Something went wrong" }, 500);
  }
};

async function send(body) {
  const lead = {
    dealership: clean(body.dealership, 120),
    address: clean(body.address, 200),
    contact_name: clean(body.contactName, 120),
    contact_title: clean(body.contactTitle, 80),
    contact_email: clean(body.email, 200).toLowerCase(),
    place_id: clean(body.placeId, 300) || null,
    website: clean(body.website, 300) || null,
    phone: clean(body.phone, 40) || null,
    issues: (Array.isArray(body.issues) ? body.issues : []).filter(k => ISSUES[k]),
    notes: clean(body.notes, 2000),
    media: (Array.isArray(body.media) ? body.media : [])
      .filter(m => MEDIA_PATH.test(m?.path || ""))
      .slice(0, 30)
      .map(m => ({ path: m.path, type: m.type === "video" ? "video" : "image" })),
  };

  if (!lead.dealership) return json({ error: "Dealership name is required." }, 400);
  if (!EMAIL.test(lead.contact_email)) return json({ error: "That email address doesn't look right." }, 400);
  if (!lead.media.length) return json({ error: "Add at least one photo or video." }, 400);

  // Don't put the same person in the campaign twice (unless you confirm).
  if (!body.force) {
    const dup = await db.select(`select=id,dealership,created_at&contact_email=eq.${encodeURIComponent(lead.contact_email)}&status=eq.active&limit=1`);
    if (dup.length) return json({ duplicate: dup[0], error: `${lead.contact_email} is already in the campaign (${dup[0].dealership}).` }, 409);
  }

  const row = await db.insert({ ...lead, status: "active", step: 1, last_sent_at: new Date().toISOString() });

  const photos = lead.media.filter(m => m.type === "image").map(m => mediaUrl(m.path));
  const video = lead.media.find(m => m.type === "video");
  const first = lead.contact_name.split(/\s+/)[0] || "";
  const props = {
    dealership: lead.dealership,
    address: lead.address,
    street: lead.address.split(",")[0].trim(),
    contact_first_name: first,
    issues: lead.issues,
    issues_text: issuesSentence(lead.issues),
    report_url: reportUrl(row.id),
    photo_count: photos.length,
    photo_1: photos[0] || "", photo_2: photos[1] || "", photo_3: photos[2] || "", photo_4: photos[3] || "",
    has_video: !!video,
    video_url: video ? mediaUrl(video.path) : "",
    media_phrase: video && photos.length ? "photos and a quick video" : video ? "a quick video" : "photos",
    sender_name: process.env.LEADS_SENDER_NAME || "The AutoSync 360 Team",
    visit_date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/New_York" }),
  };

  try {
    await klaviyoLotVisit(row, props);
  } catch (err) {
    await db.update(row.id, { status: "failed", history: [{ at: new Date().toISOString(), error: err.message }] });
    throw new Error(`Saved, but Klaviyo didn't accept it: ${err.message}`);
  }

  await db.update(row.id, { history: [{ at: new Date().toISOString(), event: "klaviyo:lot_visit" }] });
  return json({ ok: true, id: row.id, report_url: props.report_url });
}
