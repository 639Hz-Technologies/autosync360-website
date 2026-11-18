// Sends the /leads emails from your Google Workspace mailbox (SMTP) and checks that inbox for
// replies (IMAP) before each follow-up. Both use GMAIL_USER + GMAIL_APP_PASSWORD.
// LEADS_DRY_RUN=1 renders and logs instead of sending (local testing).
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { renderEmail, SCHEDULE_DAYS, STEPS } from "./lead-emails.mjs";
import { db, mediaUrl, reportUrl, unsubscribeUrl } from "./leads.mjs";

export const MAIL_ENV = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "BUSINESS_ADDRESS"];
const env = k => process.env[k] || "";
const dryRun = () => env("LEADS_DRY_RUN") === "1";

let transport;
function mailer() {
  if (dryRun()) return (transport ||= nodemailer.createTransport({ jsonTransport: true }));
  return (transport ||= nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: env("GMAIL_USER"), pass: env("GMAIL_APP_PASSWORD").replace(/\s+/g, "") },
  }));
}

const addDays = (d, n) => new Date(new Date(d).getTime() + n * 864e5).toISOString();

/** Renders and sends email `step` (0-based) for a lead. Returns { messageId, subject }. */
export async function sendLeadEmail(step, lead) {
  const media = lead.media || [];
  const ctx = {
    photos: media.filter(m => m.type !== "video").map(m => mediaUrl(m.path)),
    hasVideo: media.some(m => m.type === "video"),
    reportUrl: reportUrl(lead.id),
    unsubscribeUrl: unsubscribeUrl(lead.id),
    senderName: env("LEADS_SENDER_NAME") || "AutoSync 360",
    phone: env("LEADS_PHONE") || "866-AUTO-239",
    businessAddress: env("BUSINESS_ADDRESS"),
    firstSubject: lead.subject,
  };
  const { subject, html, text } = renderEmail(step, lead, ctx);
  const thread = step > 0 && lead.first_message_id ? { inReplyTo: lead.first_message_id, references: [lead.first_message_id] } : {};

  const info = await mailer().sendMail({
    from: { name: ctx.senderName, address: env("GMAIL_USER") },
    to: lead.contact_name ? { name: lead.contact_name, address: lead.contact_email } : lead.contact_email,
    subject, html, text, ...thread,
    list: { unsubscribe: { url: ctx.unsubscribeUrl, comment: "Unsubscribe" } },
    headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
  if (dryRun()) console.log(`[dry run] email ${step + 1} → ${lead.contact_email}: ${subject}`);
  return { messageId: info.messageId, subject, html, text };
}

/** After email `step` went out: what to store on the lead. */
export function afterSend(lead, step, sent) {
  const next = step + 1;
  const base = step === 0 ? new Date().toISOString() : lead.created_at;
  return {
    step: next,
    last_sent_at: new Date().toISOString(),
    next_send_at: next < STEPS ? addDays(base, SCHEDULE_DAYS[next]) : null,
    status: next < STEPS ? "active" : "done",
    ...(step === 0 ? { subject: sent.subject, first_message_id: sent.messageId } : {}),
    history: [...(lead.history || []), { at: new Date().toISOString(), email: next, messageId: sent.messageId }],
  };
}

/** Inbox check before a follow-up: "replied" if they wrote back, "bounced" if Gmail got a bounce for them, else null.
 *  Searches All Mail, so archived replies count too. */
export async function openInbox() {
  if (dryRun()) return { check: async () => null, close: async () => {} };
  const client = new ImapFlow({
    host: "imap.gmail.com", port: 993, secure: true, logger: false,
    auth: { user: env("GMAIL_USER"), pass: env("GMAIL_APP_PASSWORD").replace(/\s+/g, "") },
  });
  await client.connect();
  const boxes = await client.list();
  const all = boxes.find(b => b.specialUse === "\\All")?.path || "INBOX";
  const lock = await client.getMailboxLock(all);
  return {
    async check(email, since) {
      const after = new Date(since);
      if ((await client.search({ from: email, since: after }, { uid: true })).length) return "replied";
      if ((await client.search({ from: "mailer-daemon", body: email, since: after }, { uid: true })).length) return "bounced";
      return null;
    },
    async close() { lock.release(); await client.logout().catch(() => {}); },
  };
}

/** Sends every follow-up that's due. Used by the scheduled leads-followups function. */
export async function runFollowups({ limit = 15 } = {}) {
  const now = new Date().toISOString();
  const due = await db.select(`select=*&status=eq.active&next_send_at=lte.${encodeURIComponent(now)}&order=next_send_at.asc&limit=${limit}`);
  if (!due.length) return { due: 0, sent: 0, replied: 0, failed: 0 };

  const result = { due: due.length, sent: 0, replied: 0, failed: 0 };
  const inbox = await openInbox();
  try {
    for (const lead of due) {
      // Claim it first so an overlapping run can't double-send: push next_send_at out an hour.
      const claimed = await db.updateWhere(lead.id, `step=eq.${lead.step}&status=eq.active`, { next_send_at: addDays(now, 1 / 24) });
      if (!claimed) continue;
      try {
        const seen = await inbox.check(lead.contact_email, lead.created_at);
        if (seen) {
          await db.update(lead.id, { status: seen === "replied" ? "replied" : "failed", next_send_at: null, history: [...(lead.history || []), { at: now, event: seen === "replied" ? "reply detected" : "bounce detected" }] });
          result[seen === "replied" ? "replied" : "failed"]++;
          continue;
        }
        const sent = await sendLeadEmail(lead.step, lead);
        await db.update(lead.id, afterSend(lead, lead.step, sent));
        result.sent++;
      } catch (err) {
        console.error(`follow-up failed for ${lead.id}:`, err);
        result.failed++;
        // The claim already pushed it an hour out, so it retries next run. Give up after 3 tries.
        const history = [...(lead.history || []), { at: now, error: String(err.message || err).slice(0, 300) }];
        const tries = history.filter(h => h.error).length;
        await db.update(lead.id, tries >= 3 ? { history, status: "failed", next_send_at: null } : { history }).catch(() => {});
      }
    }
  } finally {
    await inbox.close();
  }
  return result;
}
