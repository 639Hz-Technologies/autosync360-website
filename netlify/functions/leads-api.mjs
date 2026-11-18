// API behind autosync360.com/leads (password protected field tool).
//   POST /api/leads/login   {password}                 → {token}
//   POST /api/leads/upload  {type}                     → {path, uploadUrl, url}   (phone PUTs the file to uploadUrl)
//   POST /api/leads/send    {dealership, address, contactName, contactTitle, email, issues[], notes, media[], force}
//                                                      → saves the lead and sends email 1 via Postmark (follow-ups: leads-followups)
//   POST /api/leads/preview {same as send}             → {subject, html} of email 1, nothing sent
//   GET  /api/leads/list                               → recent leads for the Campaign tab
//   POST /api/leads/status  {id, status}               → replied / stopped (no more follow-ups)
//   POST /api/leads/stage   {id, stage}                → move on the Pipe board (leaving "new" stops the emails)
//   POST /api/leads/note    {id, text}                 → add a note to the lead
//   POST /api/leads/demo    {id, demoAt}               → set/clear the demo date (moves New/Replied → Demo scheduled)
//   POST /api/leads/places  {input, sessionToken, lat, lng} → Google car-dealer suggestions
//   POST /api/leads/place   {placeId, sessionToken}    → name, address, website, phone for the picked dealer
import crypto from "node:crypto";
import dns from "node:dns/promises";
import { ISSUES } from "../../src/leads/issues.js";
import { mailMissing, senderInfo, sendLeadEmail, afterSend } from "../lib/lead-mail.mjs";
import { renderEmail } from "../lib/lead-emails.mjs";
import {
  json, missingEnv, checkPassword, issueToken, isAuthed, db, signedUpload, MEDIA_PATH, mediaUrl, reportUrl, unsubscribeUrl,
  placesEnabled, placesAutocomplete, placeDetails,
} from "../lib/leads.mjs";

export const config = { path: "/api/leads/*" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Bounces hurt sender reputation, so catch dead domains and common typos before sending.
const TYPOS = { "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gnail.com": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com", "outllook.com": "outlook.com", "iclod.com": "icloud.com", "icloud.co": "icloud.com" };
async function emailDomainProblem(email) {
  const domain = email.split("@")[1];
  if (TYPOS[domain]) return `Did you mean @${TYPOS[domain]}? "${domain}" looks like a typo.`;
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx.some(r => r.exchange && r.exchange !== ".")) return `${domain} doesn't accept email. Double-check the address.`;
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") return `${domain} doesn't accept email. Double-check the address.`;
    // Any other DNS hiccup: don't block the send.
  }
  return null;
}
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/x-m4v": "m4v" };
const clean = (s, max = 300) => String(s ?? "").trim().slice(0, max);
const STAGES = ["new", "replied", "demo_scheduled", "demo_completed", "vendor_setup", "proposal_sent", "closed_won", "lost"];
const now = () => new Date().toISOString();

async function getLead(id) {
  if (!/^[0-9a-f-]{36}$/.test(String(id))) return null;
  const [row] = await db.select(`select=id,status,pipeline_stage,notes_log,history&id=eq.${id}&limit=1`);
  return row || null;
}

// Moving a lead on the board. Anything past "new" means you're talking to them: stop the email sequence.
function stagePatch(row, stage) {
  const p = { pipeline_stage: stage, stage_changed_at: now(), history: [...(row.history || []), { at: now(), event: `stage: ${stage}` }] };
  if (stage !== "new" && row.status === "active") Object.assign(p, { status: "replied", next_send_at: null });
  return p;
}

export default async (req) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/leads\/?/, "");

  const missing = missingEnv(["LEADS_PASSWORD", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
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

    if (route === "preview" && req.method === "POST") {
      const lead = { id: "preview", ...parseLead(await req.json()) };
      const media = lead.media;
      const { subject, html } = renderEmail(0, lead, {
        photos: media.filter(m => m.type !== "video").map(m => mediaUrl(m.path)),
        hasVideo: media.some(m => m.type === "video"),
        reportUrl: reportUrl("preview"), unsubscribeUrl: unsubscribeUrl("preview"),
        senderName: process.env.LEADS_SENDER_NAME || "AutoSync 360",
        phone: process.env.LEADS_PHONE || "866-AUTO-239",
        businessAddress: process.env.BUSINESS_ADDRESS || "(business address goes here)",
      });
      return json({ subject, html, ...senderInfo() });
    }

    if (route === "list" && req.method === "GET") {
      const rows = await db.select("select=id,created_at,dealership,address,contact_name,contact_title,contact_email,phone,website,status,media,step,next_send_at,last_sent_at,test_mode,pipeline_stage,stage_changed_at,demo_at,notes,notes_log,issues,issues_other&order=created_at.desc&limit=300");
      return json({ leads: rows.map(r => ({ ...r, report_url: reportUrl(r.id), media_count: (r.media || []).length, media: undefined })) });
    }

    if (route === "status" && req.method === "POST") {
      const { id, status } = await req.json();
      if (!["replied", "stopped"].includes(status)) return json({ error: "Bad status" }, 400);
      const cur = await getLead(id);
      if (!cur) return json({ error: "Lead not found" }, 404);
      const row = await db.update(id, { status, next_send_at: null, ...(status === "replied" && cur.pipeline_stage === "new" ? { pipeline_stage: "replied", stage_changed_at: now() } : {}) });
      return json({ ok: true, status });
    }

    if (route === "stage" && req.method === "POST") {
      const { id, stage } = await req.json();
      if (!STAGES.includes(stage)) return json({ error: "Unknown stage" }, 400);
      const row = await getLead(id);
      if (!row) return json({ error: "Lead not found" }, 404);
      return json({ lead: await db.update(id, stagePatch(row, stage)) });
    }

    if (route === "note" && req.method === "POST") {
      const { id, text } = await req.json();
      const t = clean(text, 4000);
      if (!t) return json({ error: "Note is empty" }, 400);
      const row = await getLead(id);
      if (!row) return json({ error: "Lead not found" }, 404);
      return json({ lead: await db.update(id, { notes_log: [...(row.notes_log || []), { at: now(), text: t }] }) });
    }

    if (route === "demo" && req.method === "POST") {
      const { id, demoAt } = await req.json();
      const when = demoAt ? new Date(demoAt) : null;
      if (when && isNaN(when)) return json({ error: "Bad date" }, 400);
      const row = await getLead(id);
      if (!row) return json({ error: "Lead not found" }, 404);
      const patch = { demo_at: when ? when.toISOString() : null };
      if (when && ["new", "replied"].includes(row.pipeline_stage)) Object.assign(patch, stagePatch(row, "demo_scheduled"));
      return json({ lead: await db.update(id, patch) });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("leads-api error:", err);
    return json({ error: err.message || "Something went wrong" }, 500);
  }
};

function parseLead(body) {
  return {
    dealership: clean(body.dealership, 120),
    address: clean(body.address, 200),
    contact_name: clean(body.contactName, 120),
    contact_title: clean(body.contactTitle, 80),
    contact_email: clean(body.email, 200).toLowerCase(),
    place_id: clean(body.placeId, 300) || null,
    website: clean(body.website, 300) || null,
    phone: clean(body.phone, 40) || null,
    issues: (Array.isArray(body.issues) ? body.issues : []).filter(k => ISSUES[k]),
    issues_other: clean(body.issuesOther, 300) || null,
    test_mode: body.testMode === true,
    notes: clean(body.notes, 2000),
    media: (Array.isArray(body.media) ? body.media : [])
      .filter(m => MEDIA_PATH.test(m?.path || ""))
      .slice(0, 30)
      .map(m => ({ path: m.path, type: m.type === "video" ? "video" : "image" })),
  };
}

async function send(body) {
  const missing = mailMissing();
  if (missing.length) return json({ error: `Email isn't set up yet (missing ${missing.join(", ")} in Netlify).` }, 500);

  const lead = parseLead(body);
  if (!lead.dealership) return json({ error: "Dealership name is required." }, 400);
  if (!EMAIL.test(lead.contact_email)) return json({ error: "That email address doesn't look right." }, 400);
  const domainProblem = await emailDomainProblem(lead.contact_email);
  if (domainProblem) return json({ error: domainProblem }, 400);
  if (!lead.media.length) return json({ error: "Add at least one photo or video." }, 400);

  // Never email someone who unsubscribed; don't put the same person in twice (unless you confirm).
  const prior = await db.select(`select=id,dealership,status&contact_email=eq.${encodeURIComponent(lead.contact_email)}&status=in.(active,unsubscribed)&limit=5`);
  if (prior.some(p => p.status === "unsubscribed")) return json({ error: `${lead.contact_email} unsubscribed earlier, so we can't email them again.` }, 409);
  const dup = prior.find(p => p.status === "active");
  if (dup && !body.force && !lead.test_mode) return json({ duplicate: dup, error: `${lead.contact_email} is already in the campaign (${dup.dealership}).` }, 409);

  const row = await db.insert({ ...lead, status: "active", step: 0 });
  let sent;
  try {
    sent = await sendLeadEmail(0, row);
  } catch (err) {
    await db.update(row.id, { status: "failed", history: [{ at: new Date().toISOString(), error: String(err.message).slice(0, 300) }] });
    throw new Error(`Saved, but the email didn't send: ${err.message}`);
  }
  await db.update(row.id, afterSend(row, 0, sent));
  return json({ ok: true, id: row.id, report_url: reportUrl(row.id) });
}
