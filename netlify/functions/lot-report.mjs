// Public "lot report" page linked from the Klaviyo emails: autosync360.com/lot/<lead id>
// Shows the photos/video taken on the visit. Not indexed; the id is an unguessable UUID.
import { db, mediaUrl, esc } from "../lib/leads.mjs";

export const config = { path: "/lot/:id" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PHONE = "866-AUTO-239", PHONE_HREF = "tel:8662886239";
const DIRECT = "239-382-7039", DIRECT_HREF = "tel:+12393827039"; // owner's direct line

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
@media(min-width:900px){.points{grid-template-columns:repeat(4,1fr);gap:12px}.points li{flex-direction:column;gap:10px}}
@media(min-width:1200px){.wrap{max-width:1180px}}
.points li{display:flex;gap:12px;align-items:flex-start;background:#f6f8fc;border-radius:12px;padding:14px}
.points .ic{flex:none;width:34px;height:34px;border-radius:10px;background:rgba(37,99,235,.1);color:#2563eb;display:flex;align-items:center;justify-content:center}
.points b{display:block;color:#0b1220;font-size:15px}
.points span{font-size:14px;color:#64748b;line-height:1.5}
.cta.end{margin:32px 0 56px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.cta.end h3{font:700 20px 'Space Grotesk',sans-serif;color:#0b1220}
.direct{margin:0 0 18px;color:#0b1220;font-weight:500}
.direct a{color:#2563eb;font-weight:700;text-decoration:none;white-space:nowrap}
.top{padding:22px 0 14px}
.top h1{font-size:clamp(24px,3.2vw,32px)}
.note{margin-top:8px;max-width:820px;color:#334155;font-size:16px;line-height:1.6}
.note a{color:#2563eb;font-weight:700;text-decoration:none;white-space:nowrap}
.top .btns{margin-top:12px}
.top .btn{padding:10px 18px;font-size:14px}
header .btn{white-space:nowrap}
@media(max-width:520px){header .btn{padding:8px 12px;font-size:13px}.top .btn{padding:9px 13px;font-size:13px;margin-right:6px}.note{font-size:15px}}
.strip{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 18px}
@media(min-width:900px){.strip{grid-template-columns:repeat(4,1fr)}}
.strip li{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:10px;padding:8px 10px;font-size:13px;font-weight:600;color:#0b1220;line-height:1.3}
.strip .ic{flex:none;width:26px;height:26px;border-radius:8px;background:rgba(37,99,235,.1);color:#2563eb;display:flex;align-items:center;justify-content:center}
.media-h{font:700 20px 'Space Grotesk',sans-serif;color:#0b1220;margin:0 0 12px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;background:#2563eb;color:#fff;margin:0 8px 8px 0}
.btn.g{background:transparent;color:#1e293b;border:1px solid rgba(15,23,42,.15)}
footer{color:#94a3b8;font-size:13px;padding:0 0 32px}
.lb{position:fixed;inset:0;z-index:50;background:rgba(5,8,15,.94);display:none;align-items:center;justify-content:center;touch-action:pan-y}
.lb.open{display:flex}
.lb img{max-width:calc(100vw - 140px);max-height:calc(100vh - 110px);object-fit:contain;border-radius:8px;user-select:none;-webkit-user-drag:none}
.lb button{position:absolute;width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font:400 30px/52px Inter,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center}
.lb button:hover{background:rgba(255,255,255,.28)}
.lb button[hidden]{display:none}
.lb .x{top:16px;right:16px;font-size:28px}
.lb .prev{left:20px;top:50%;transform:translateY(-50%)}
.lb .next{right:20px;top:50%;transform:translateY(-50%)}
.lb .count{position:absolute;bottom:20px;left:0;right:0;text-align:center;color:#cbd5e1;font-size:14px;font-weight:600}
@media(max-width:700px){.lb img{max-width:100vw;max-height:calc(100vh - 140px);border-radius:0}.lb .prev,.lb .next{top:auto;bottom:56px;transform:none;width:48px;height:48px}.lb .prev{left:16px}.lb .next{right:16px}}
</style></head><body>
<header><div class="wrap"><a href="/"><img src="/autosync360-wordmark.png" alt="AutoSync 360"></a><a class="btn g" href="${PHONE_HREF}" style="margin:0">${PHONE}</a></div></header>
<main class="wrap">${body}</main>
<footer class="wrap">© ${new Date().getFullYear()} AutoSync 360</footer>
<div class="lb" role="dialog" aria-modal="true" aria-label="Photo viewer">
  <img alt="">
  <button class="x" type="button" aria-label="Close">&times;</button>
  <button class="prev" type="button" aria-label="Previous photo">&#8249;</button>
  <button class="next" type="button" aria-label="Next photo">&#8250;</button>
  <div class="count"></div>
</div>
<script>
(function () {
  var links = [].slice.call(document.querySelectorAll(".grid a"));
  var lb = document.querySelector(".lb");
  if (!links.length || !lb) return;
  var img = lb.querySelector("img"), prev = lb.querySelector(".prev"), next = lb.querySelector(".next"), count = lb.querySelector(".count");
  var i = 0;
  function show(n) {
    i = Math.max(0, Math.min(links.length - 1, n));
    img.src = links[i].href;
    img.alt = (links[i].querySelector("img") || {}).alt || "";
    prev.hidden = i === 0;
    next.hidden = i === links.length - 1;
    count.textContent = links.length > 1 ? (i + 1) + " / " + links.length : "";
    var ahead = links[i + 1];
    if (ahead) new Image().src = ahead.href;
  }
  function open(n) { show(n); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
  function close() { lb.classList.remove("open"); document.body.style.overflow = ""; img.removeAttribute("src"); }
  links.forEach(function (a, n) { a.addEventListener("click", function (e) { e.preventDefault(); open(n); }); });
  lb.querySelector(".x").addEventListener("click", close);
  prev.addEventListener("click", function (e) { e.stopPropagation(); show(i - 1); });
  next.addEventListener("click", function (e) { e.stopPropagation(); show(i + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(i - 1);
    else if (e.key === "ArrowRight") show(i + 1);
  });
  var x0 = null;
  lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
  });
})();
</script>
</body></html>`, {
  status: 200,
  headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow, noarchive, noimageindex", "referrer-policy": "no-referrer", "cache-control": "public, max-age=60" },
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
    [lead] = await db.select(`select=id,created_at,dealership,contact_name,media&id=eq.${id}&limit=1`);
  } catch (err) {
    console.error("lot-report:", err);
  }
  if (!lead) return notFound();

  const date = new Date(lead.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const media = lead.media || [];
  const videos = media.filter(m => m.type === "video");
  const photos = media.filter(m => m.type !== "video");
  const first = (lead.contact_name || "").trim().split(/\s+/)[0] || "there";
  const nPhotos = photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : "";
  const nVideos = videos.length ? (videos.length === 1 ? "a quick video" : `${videos.length} videos`) : "";
  const took = [nPhotos, nVideos].filter(Boolean).join(" and ") || "photos";

  return page(`${lead.dealership} lot photos | AutoSync 360`, `
    <section class="top">
      <h1>${esc(lead.dealership)}</h1>
      <p class="note">Hi ${esc(first)}, I stopped by ${esc(lead.dealership)} on ${esc(date)} and took ${esc(took)} of your inventory. I'd love to come by, show you a quick demo, and detail one of your vehicles for $1. That $1 also sets us up in your system as a paid vendor, so switching later is easy. You can call me directly at <a href="${DIRECT_HREF}">${DIRECT}</a>, and I'll get something on the calendar so we can swing by.</p>
      <div class="btns"><a class="btn" href="${DIRECT_HREF}">Call ${DIRECT}</a><a class="btn g" href="/#demo">Learn about AutoSync 360</a></div>
    </section>
    <ul class="strip">
      <li><span class="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>Built around your CSI score</li>
      <li><span class="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>Front-line ready, on time</li>
      <li><span class="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h-2v-6l2-5h9l4 5h3v6h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span>Deliveries handled</li>
      <li><span class="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Your pet peeves, done every time</li>
    </ul>
    <h2 class="media-h">${videos.length ? "Video and photos from your lot" : "Photos from your lot"}</h2>
    ${videos.map(v => `<video controls playsinline preload="metadata" src="${esc(mediaUrl(v.path))}"></video>`).join("")}
    <div class="grid">${photos.map(p => `<a href="${esc(mediaUrl(p.path))}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(mediaUrl(p.path))}" alt="Vehicle on the ${esc(lead.dealership)} lot"></a>`).join("")}</div>
    <section class="cta end">
      <h3>Ready for your $1 demo? Call me directly and I'll get something on the calendar so we can swing by.</h3>
      <a class="btn" style="margin:0" href="${DIRECT_HREF}">Call ${DIRECT}</a>
    </section>`);
};
