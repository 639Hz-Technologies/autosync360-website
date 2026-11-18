// autosync360.com/unsubscribe/<lead id>: linked from every /leads email footer.
// GET shows a confirm button (so email scanners that open links don't unsubscribe people by accident);
// POST unsubscribes. Gmail/Apple "Unsubscribe" buttons POST here directly (List-Unsubscribe-Post).
import { db, esc } from "../lib/leads.mjs";

export const config = { path: "/unsubscribe/:id" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const page = (body, status = 200) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">
<title>Unsubscribe | AutoSync 360</title><link rel="icon" href="/favicon.ico">
<style>body{margin:0;background:#f6f8fc;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1e293b}
.c{max-width:440px;margin:12vh auto 0;padding:32px 24px;background:#fff;border:1px solid rgba(15,23,42,.09);border-radius:14px;text-align:center}
img{height:24px;mix-blend-mode:multiply;margin-bottom:20px}h1{font-size:22px;margin:0 0 8px;color:#0b1220}p{color:#64748b;margin:0 0 20px}
button{border:0;background:#0b1220;color:#fff;font:600 15px inherit;padding:12px 22px;border-radius:10px;cursor:pointer}</style></head>
<body><div class="c"><img src="/autosync360-wordmark.png" alt="AutoSync 360">${body}</div></body></html>`,
  { status, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow, noarchive", "referrer-policy": "no-referrer", "cache-control": "no-store" } });

export default async (req, context) => {
  const id = String(context.params?.id || "").toLowerCase();
  if (!UUID.test(id)) return page(`<h1>Link not recognized</h1><p>Reply to the email with "unsubscribe" and we'll take you off the list.</p>`, 404);

  if (req.method === "POST") {
    try {
      const [lead] = await db.select(`select=id,contact_email,history&id=eq.${id}&limit=1`);
      if (lead) {
        // Unsubscribe every lead with this address, not just this one.
        const all = await db.select(`select=id,history&contact_email=eq.${encodeURIComponent(lead.contact_email)}`);
        const at = new Date().toISOString();
        for (const l of all) await db.update(l.id, { status: "unsubscribed", next_send_at: null, history: [...(l.history || []), { at, event: "unsubscribed" }] });
      }
    } catch (err) {
      console.error("unsubscribe failed:", err);
      return page(`<h1>Something went wrong</h1><p>Please reply to the email with "unsubscribe" and we'll take care of it.</p>`, 500);
    }
    return page(`<h1>You're unsubscribed</h1><p>We won't email you again. Sorry for the bother.</p>`);
  }

  return page(`<h1>Unsubscribe?</h1><p>You won't get any more emails from AutoSync 360 about your lot.</p>
<form method="post" action="/unsubscribe/${esc(id)}"><button type="submit">Unsubscribe</button></form>`);
};
