// Public "lot report" page linked from the Klaviyo emails: autosync360.com/lot/<lead id>
// Shows the photos/video taken on the visit. Not indexed; the id is an unguessable UUID.
import { db, mediaUrl, esc } from "../lib/leads.mjs";

export const config = { path: "/lot/:id" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PHONE = "866-AUTO-239", PHONE_HREF = "tel:8662886239";

const page = (title, body) => new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,noimageindex"><meta name="referrer" content="no-referrer"><title>${esc(title)}</title>
<link rel="icon" href="/favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font:16px/1.6 Inter,system-ui,sans-serif;color:#1e293b;background:#f6f8fc}
.wrap{max-width:980px;margin:0 auto;padding:0 16px}
header{background:#fff;border-bottom:1px solid rgba(15,23,42,.09)}
header .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
header img{height:24px;width:auto;mix-blend-mode:multiply;display:block}
h1{font:700 clamp(26px,4vw,38px)/1.15 'Space Grotesk',sans-serif;letter-spacing:-.02em;color:#0b1220}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#0891b2}
.intro{padding:40px 0 24px}.intro p{color:#64748b;margin-top:10px;max-width:640px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.grid a{display:block;border-radius:12px;overflow:hidden;background:#e2e8f0;aspect-ratio:4/3}
.grid img{width:100%;height:100%;object-fit:cover;display:block}
video{width:100%;border-radius:12px;background:#000;margin-bottom:12px;max-height:70vh}
.cta{margin:0 0 32px;background:#fff;border:1px solid rgba(15,23,42,.09);border-radius:16px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.05)}
.cta h2{font:700 clamp(24px,3vw,30px)/1.2 'Space Grotesk',sans-serif;color:#0b1220;letter-spacing:-.01em}
.cta .lead{color:#475569;margin:10px 0 20px;max-width:760px}
.points{list-style:none;display:grid;grid-template-columns:1fr;gap:12px;margin:0 0 24px}
@media(min-width:700px){.points{grid-template-columns:1fr 1fr;gap:14px}}
.points li{display:flex;gap:12px;align-items:flex-start;background:#f6f8fc;border-radius:12px;padding:14px}
.points .ic{flex:none;width:34px;height:34px;border-radius:10px;background:rgba(37,99,235,.1);color:#2563eb;display:flex;align-items:center;justify-content:center}
.points b{display:block;color:#0b1220;font-size:15px}
.points span{font-size:14px;color:#64748b;line-height:1.5}
.cta.end{margin:32px 0 56px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.cta.end h3{font:700 20px 'Space Grotesk',sans-serif;color:#0b1220}
.media-h{font:700 20px 'Space Grotesk',sans-serif;color:#0b1220;margin:0 0 12px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;background:#2563eb;color:#fff;margin:0 8px 8px 0}
.btn.g{background:transparent;color:#1e293b;border:1px solid rgba(15,23,42,.15)}
footer{color:#94a3b8;font-size:13px;padding:0 0 32px}
</style></head><body>
<header><div class="wrap"><a href="/"><img src="/autosync360-wordmark.png" alt="AutoSync 360"></a><a class="btn g" href="${PHONE_HREF}" style="margin:0">${PHONE}</a></div></header>
<main class="wrap">${body}</main>
<footer class="wrap">© ${new Date().getFullYear()} AutoSync 360</footer>
</body></html>`, {
  status: 200,
  headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow, noarchive, noimageindex", "referrer-policy": "no-referrer", "cache-control": "public, max-age=300" },
});

export default async (req, context) => {
  const id = String(context.params?.id || "").toLowerCase();
  const notFound = () => {
    const r = page("Not found | AutoSync 360", `<section class="intro"><h1>This page isn't available.</h1><p>Call us at <a href="${PHONE_HREF}">${PHONE}</a>.</p></section>`);
    return new Response(r.body, { status: 404, headers: r.headers });
  };
  if (!UUID.test(id)) return notFound();

  let lead;
  try {
    [lead] = await db.select(`select=id,created_at,dealership,media&id=eq.${id}&limit=1`);
  } catch (err) {
    console.error("lot-report:", err);
  }
  if (!lead) return notFound();

  const date = new Date(lead.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const media = lead.media || [];
  const videos = media.filter(m => m.type === "video");
  const photos = media.filter(m => m.type !== "video");

  return page(`${lead.dealership} lot photos | AutoSync 360`, `
    <section class="intro">
      <div class="eyebrow">Lot visit · ${esc(date)}</div>
      <h1>${esc(lead.dealership)}</h1>
      <p>${photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : ""}${photos.length && videos.length ? " and " : ""}${videos.length ? `${videos.length === 1 ? "a video" : `${videos.length} videos`}` : ""} of your inventory, taken on our visit.</p>
    </section>
    <section class="cta">
      <h2>Your dirtiest vehicle, detailed for $1.</h2>
      <p class="lead">AutoSync 360 is a CSI-driven detailing company with over a decade at dealerships and recon centers. Pick the worst car on your lot and we'll detail it for $1. That also gets us set up in your system as a paid vendor, so switching later is easy.</p>
      <ul class="points">
        <li><span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span><div><b>Built around your CSI score</b><span>Every car a customer touches is spotless, so your CSI and survey scores reflect it.</span></div></li>
        <li><span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span><div><b>Front-line ready, on time</b><span>Inventory detailed and on the line when you need it, not days later. No more cars sitting in recon.</span></div></li>
        <li><span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h-2v-6l2-5h9l4 5h3v6h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><div><b>Deliveries handled</b><span>We prep sold units for delivery so every customer drives off in a car that looks brand new.</span></div></li>
        <li><span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span><div><b>Your pet peeves, done every time</b><span>Tell us once how you want it: tires, glass, jambs, decals, whatever bugs you. It's done that way on every car, and you never have to repeat yourself.</span></div></li>
      </ul>
      <a class="btn" href="${PHONE_HREF}">Call ${PHONE}</a><a class="btn g" href="/#demo">Learn about AutoSync 360</a>
    </section>
    <h2 class="media-h">Photos from your lot</h2>
    ${videos.map(v => `<video controls playsinline preload="metadata" src="${esc(mediaUrl(v.path))}"></video>`).join("")}
    <div class="grid">${photos.map(p => `<a href="${esc(mediaUrl(p.path))}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(mediaUrl(p.path))}" alt="Vehicle on the ${esc(lead.dealership)} lot"></a>`).join("")}</div>
    <section class="cta end">
      <h3>Ready for your $1 demo? Reply to our email or call to pick a day.</h3>
      <a class="btn" style="margin:0" href="${PHONE_HREF}">Call ${PHONE}</a>
    </section>`);
};
