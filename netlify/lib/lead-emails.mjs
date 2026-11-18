// The /leads email sequence. Edit the wording here; it goes live on the next deploy.
//
// Email 1 goes out (via Postmark) the moment you hit Send. The leads-followups function sends the
// rest as replies in the same thread, unless the GM has replied (it checks the inbox first),
// unsubscribed, or you tapped Replied/Stop on /leads.
import { issuesSentence } from "../../src/leads/issues.js";
import { esc } from "./leads.mjs";

// Days after email 1 that each email goes out (follow-ups go on weekdays, during business hours).
export const SCHEDULE_DAYS = [0, 3, 7, 14];

// The opening line of email 1. Kept blunt but clean: profanity gets cold email flagged by dealer spam filters.
const OPENER = "I'll be straight with you: your lot looks rough.";

// The offer, used in email 1 and repeated in the follow-ups.
const OFFER = "Here's my offer: give us your dirtiest vehicle and we'll detail it for $1. That $1 gets us set up in your system as a paid vendor, so when you're ready to make the switch, we're already one step closer.";

// v = { first, dealership, street, issues, issuesOther, hasVideo, photoCount, reportUrl }
const EMAILS = [
  v => ({
    subject: `Your lot at ${v.dealership}`,
    body: [
      `Hi ${v.first},`,
      OPENER,
      `I walked ${v.dealership}${v.street ? ` on ${v.street}` : ""} today and took ${v.hasVideo && v.photoCount ? "photos and a quick video" : v.hasVideo ? "a quick video" : "some photos"} of your inventory. ${issuesSentence(v.issues, v.issuesOther)}`,
      { media: 2 }, // 2 photos keeps a cold email light; the rest are on the lot page
      "These are the cars your customers walk up to, and the same cars in your online listings. Shoppers make up their minds from those photos before they ever call.",
      "We're AutoSync 360, a CSI-driven detailing company that understands what it takes to get vehicles front-line ready. We've been in the industry for over a decade, detailing vehicles at dealerships and recon centers. Our crew speaks English, communicates clearly with your sales and service teams, and uses common sense.",
      OFFER,
      "We're also a tech startup that does inventory management for dealerships, and we'd love to help you out there too.",
      "Can we come in next week and do a demo?",
    ],
    cta: v.hasVideo ? "See the photos and video" : `See all ${v.photoCount} photos`,
  }),
  v => ({
    body: [
      `Hi ${v.first},`,
      `Following up on the photos from ${v.dealership}. Your front line is what customers see first, in person and online.`,
      { media: 1 },
      "The offer stands: your dirtiest vehicle, detailed for $1. It gets AutoSync 360 set up as a paid vendor in your system, so switching later is easy. Can we come in next week and do a demo?",
    ],
    cta: "View your lot photos",
  }),
  v => ({
    body: [
      `Hi ${v.first},`,
      "Most stores don't have a detailing problem, they have a consistency problem. Cars get cleaned for the photo shoot, then sit on the line for weeks collecting dust, and CSI pays for it when a customer takes delivery of a car that isn't right.",
      `We've spent over a decade making dealership and recon center inventory front-line ready, on a schedule, without your team having to chase us. Happy to put together a quote for ${v.dealership} based on your lot size, or start with the $1 demo.`,
      "And since we're also a tech company building inventory management for dealerships, we can show you that side while we're there. Would next week work?",
    ],
    cta: "Your lot photos",
  }),
  v => ({
    body: [
      `Hi ${v.first},`,
      "I haven't heard back, so I'll assume the timing isn't right and stop reaching out.",
      `If getting ${v.dealership}'s front line ready moves up the list, just reply here. The $1 demo is still on the table, and the photos will still be here.`,
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
    issuesOther: lead.issues_other,
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
