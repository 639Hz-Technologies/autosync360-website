// The /leads email sequence. Edit the wording here; it goes live on the next deploy.
//
// Email 1 goes out (via Postmark) the moment you hit Send. The leads-followups function sends the
// rest as replies in the same thread, unless the GM has replied (it checks the inbox first),
// unsubscribed, or you tapped Replied/Stop on /leads.
import { issuesSentence } from "../../src/leads/issues.js";
import { esc } from "./leads.mjs";

// Days after email 1 that each email goes out (follow-ups go on weekdays, during business hours).
export const SCHEDULE_DAYS = [0, 3, 7, 14];

// v = { first, dealership, street, issues, hasVideo, photoCount, reportUrl }
const EMAILS = [
  v => ({
    subject: `Photos from your lot at ${v.dealership}`,
    body: [
      `Hi ${v.first},`,
      `I stopped by ${v.dealership}${v.street ? ` on ${v.street}` : ""} today and took ${v.hasVideo && v.photoCount ? "photos and a quick video" : v.hasVideo ? "a quick video" : "some photos"} of your inventory. ${issuesSentence(v.issues)}`,
      { media: 4 },
      "Shoppers see these cars online before they ever see them in person, and dirty wheels and dusty paint show up in every listing photo and every walk-around.",
      "We're AutoSync 360. Our team keeps dealership inventory front-line ready on a set schedule, right on your lot, so your porters aren't stuck doing it between deliveries.",
      "Are you the right person to talk to about this? If so, just reply and I'll swing back by to walk the lot with you. If not, who should I reach out to?",
    ],
    cta: v.hasVideo ? "See the photos and video" : `See all ${v.photoCount} photos`,
  }),
  v => ({
    body: [
      `Hi ${v.first},`,
      `Bumping this in case it got buried. Here are the photos from ${v.dealership} again.`,
      { media: 1 },
      "Worth a 10-minute walk around the lot this week?",
    ],
    cta: "View your lot photos",
  }),
  v => ({
    body: [
      `Hi ${v.first},`,
      "Most stores we talk to don't have a detailing problem, they have a consistency problem. Cars get cleaned for the photo shoot, then sit on the line for three weeks collecting dust.",
      `We put your front line on a recurring schedule so it stays clean between sales. Happy to put together a quote for ${v.dealership} based on your lot size. Want one?`,
    ],
    cta: "Your lot photos",
  }),
  v => ({
    body: [
      `Hi ${v.first},`,
      "I haven't heard back, so I'll assume the timing isn't right and stop reaching out.",
      `If keeping ${v.dealership}'s lot photo-ready moves up the list, just reply to this email. The photos will still be here.`,
    ],
    cta: "Your lot photos",
  }),
];

export const STEPS = EMAILS.length;

/**
 * @param step 0-based email number
 * @param lead lead_prospects row
 * @param ctx { photos: [url], hasVideo, reportUrl, unsubscribeUrl, senderName, phone, businessAddress, firstSubject }
 */
export function renderEmail(step, lead, ctx) {
  const v = {
    first: (lead.contact_name || "").trim().split(/\s+/)[0] || "there",
    dealership: lead.dealership,
    street: (lead.address || "").split(",")[0].trim(),
    issues: lead.issues,
    hasVideo: ctx.hasVideo,
    photoCount: ctx.photos.length,
  };
  const e = EMAILS[step](v);
  const subject = step === 0 ? e.subject : `Re: ${ctx.firstSubject || `Photos from your lot at ${lead.dealership}`}`;

  // Signature: "Name / AutoSync 360 · phone", or just "AutoSync 360 / phone" when the sender is the company.
  const isCompany = /^autosync\s*360$/i.test(ctx.senderName.trim());
  const companyLine = isCompany ? "" : "AutoSync 360 · ";
  const P = t => `<p style="margin:0 0 14px">${esc(t)}</p>`;
  const img = (u, w) => `<a href="${esc(ctx.reportUrl)}"><img src="${esc(u)}" width="${w}" alt="Photo from your lot" style="display:block;width:100%;max-width:${w}px;height:auto;border-radius:8px;border:0"></a>`;
  const media = n => {
    const ph = ctx.photos.slice(0, n);
    let out = "";
    if (n === 1 && ph[0]) out = `<div style="margin:0 0 14px">${img(ph[0], 520)}</div>`;
    else if (ph.length) {
      const rows = [];
      for (let i = 0; i < ph.length; i += 2) rows.push(`<tr><td width="50%" style="padding:3px">${img(ph[i], 260)}</td><td width="50%" style="padding:3px">${ph[i + 1] ? img(ph[i + 1], 260) : ""}</td></tr>`);
      out = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 12px">${rows.join("")}</table>`;
    }
    if (ctx.hasVideo && n > 1) out += `<p style="margin:0 0 14px"><a href="${esc(ctx.reportUrl)}" style="color:#2563eb;font-weight:600">&#9654; Watch the walkaround video</a></p>`;
    return out;
  };

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:20px 16px;font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1e293b">
${e.body.map(b => (typeof b === "string" ? P(b) : media(b.media))).join("\n")}
<p style="margin:6px 0 0"><a href="${esc(ctx.reportUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:11px 18px;border-radius:8px">${esc(e.cta)}</a></p>
<p style="margin:22px 0 0">${esc(ctx.senderName)}<br>${companyLine}<a href="tel:${esc(ctx.phone.replace(/[^\d+]/g, ""))}" style="color:#1e293b">${esc(ctx.phone)}</a><br><a href="https://autosync360.com" style="color:#2563eb">autosync360.com</a></p>
<p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#94a3b8">AutoSync 360 · ${esc(ctx.businessAddress)}<br>Not interested? <a href="${esc(ctx.unsubscribeUrl)}" style="color:#94a3b8">Unsubscribe</a> and we won't email again.</p>
</div></body></html>`;

  const text = [
    ...e.body.map(b => (typeof b === "string" ? b : b.media > 1 ? `Photos${ctx.hasVideo ? " and video" : ""}: ${ctx.reportUrl}` : "")).filter(Boolean),
    `${e.cta}: ${ctx.reportUrl}`,
    [ctx.senderName, `${companyLine}${ctx.phone}`, "https://autosync360.com"].join("\n"),
    [`AutoSync 360 · ${ctx.businessAddress}`, `Unsubscribe: ${ctx.unsubscribeUrl}`].join("\n"),
  ].join("\n\n");

  return { subject, html, text };
}
