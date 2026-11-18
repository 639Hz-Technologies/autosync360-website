// Sends the /leads emails through Postmark (the same account as the website's contact form), and,
// when GMAIL_USER + GMAIL_APP_PASSWORD are set, checks that inbox for replies (IMAP) before each follow-up.
// Bounces and spam complaints come from Postmark's bounce list.
// LEADS_DRY_RUN=1 renders and logs instead of sending (local testing).
import crypto from "node:crypto";
import { ImapFlow } from "imapflow";
import { renderEmail, SCHEDULE_DAYS, TEST_SCHEDULE_MINUTES, STEPS } from "./lead-emails.mjs";
import { db, mediaUrl, reportUrl, unsubscribeUrl } from "./leads.mjs";

const env = k => process.env[k] || "";
const dryRun = () => env("LEADS_DRY_RUN") === "1";
const fromAddress = () => env("LEADS_FROM_EMAIL") || env("GMAIL_USER") || env("FROM_EMAIL");
const replyTo = () => env("LEADS_REPLY_TO") || env("GMAIL_USER") || fromAddress();
// A separate Postmark server for /leads keeps outreach apart from the contact form; falls back to the shared one.
const postmarkToken = () => env("LEADS_POSTMARK_TOKEN") || env("POST_MARK_API");
const gmailOn = () => !!(env("GMAIL_USER") && env("GMAIL_APP_PASSWORD"));

/** Who the emails come from / where replies go (shown in the /leads preview). */
export const senderInfo = () => ({ from: fromAddress() || "(LEADS_FROM_EMAIL not set)", replyTo: replyTo() });

/** Settings still missing before /leads can send (names as they appear in Netlify). */
export function mailMissing() {
  const m = [];
  if (!postmarkToken()) m.push("POST_MARK_API");
  if (!fromAddress()) m.push("LEADS_FROM_EMAIL");
  if (!env("BUSINESS_ADDRESS")) m.push("BUSINESS_ADDRESS");
  return m;
}

class PermanentError extends Error {}

async function postmark(path, init = {}) {
  const res = await fetch(`https://api.postmarkapp.com/${path}`, {
    ...init,
    headers: { accept: "application/json", "content-type": "application/json", "x-postmark-server-token": postmarkToken(), ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.ErrorCode && data.ErrorCode !== 0)) {
    const msg = `Postmark ${res.status}: ${data.Message || "request failed"}`;
    // 406 = recipient is on Postmark's inactive list (hard bounce / spam complaint): don't retry.
    throw data.ErrorCode === 406 ? new PermanentError(msg) : new Error(msg);
  }
  return data;
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

  // Our own Message-ID so follow-ups can reply into the same thread.
  const domain = fromAddress().split("@")[1] || "autosync360.com";
  const messageId = `<lead-${crypto.randomUUID()}@${domain}>`;
  const headers = [
    { Name: "Message-ID", Value: messageId },
    { Name: "List-Unsubscribe", Value: `<${ctx.unsubscribeUrl}>` },
    { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
  ];
  if (step > 0 && lead.first_message_id) headers.push({ Name: "In-Reply-To", Value: lead.first_message_id }, { Name: "References", Value: lead.first_message_id });

  const quote = s => `"${String(s).replace(/["\\]/g, "")}"`;
  const message = {
    From: `${quote(ctx.senderName)} <${fromAddress()}>`,
    To: lead.contact_name ? `${quote(lead.contact_name)} <${lead.contact_email}>` : lead.contact_email,
    ...(lead.cc?.length ? { Cc: lead.cc.map(c => (c.name ? `${quote(c.name)} <${c.email}>` : c.email)).join(", ") } : {}),
    ReplyTo: replyTo(),
    Subject: subject,
    HtmlBody: html,
    TextBody: text,
    MessageStream: env("POSTMARK_LEADS_STREAM") || "outbound",
    Tag: "lead-outreach",
    Metadata: { lead_id: String(lead.id), email_number: String(step + 1) },
    TrackOpens: false,
    TrackLinks: "None",
    Headers: headers,
  };

  if (dryRun()) {
    console.log(`[dry run] email ${step + 1} → ${lead.contact_email}: ${subject}`);
    return { messageId, subject, html, text, message };
  }
  const r = await postmark("email", { method: "POST", body: JSON.stringify(message) });
  return { messageId, postmarkId: r.MessageID, subject, html, text };
}

/** After email `step` went out: what to store on the lead. Test runs use minutes instead of days. */
export function afterSend(lead, step, sent) {
  const next = step + 1;
  const base = step === 0 ? new Date().toISOString() : lead.created_at;
  const due = next >= STEPS ? null
    : lead.test_mode ? addDays(base, TEST_SCHEDULE_MINUTES[next] / 1440)
    : addDays(base, SCHEDULE_DAYS[next]);
  return {
    step: next,
    last_sent_at: new Date().toISOString(),
    next_send_at: due,
    status: next < STEPS ? "active" : "done",
    ...(step === 0 ? { subject: sent.subject, first_message_id: sent.messageId } : {}),
    history: [...(lead.history || []), { at: new Date().toISOString(), email: next, messageId: sent.messageId, postmarkId: sent.postmarkId }],
  };
}

/** Before a follow-up: "replied" if they wrote back (Gmail inbox, when connected), "bounced" if Postmark has a
 *  hard bounce for them, "complained" if they marked it spam, else null. */
export async function openChecks() {
  if (dryRun()) return { check: async () => null, close: async () => {} };

  let client = null, lock = null;
  if (gmailOn()) {
    try {
      client = new ImapFlow({
        host: "imap.gmail.com", port: 993, secure: true, logger: false,
        auth: { user: env("GMAIL_USER"), pass: env("GMAIL_APP_PASSWORD").replace(/\s+/g, "") },
      });
      await client.connect();
      const boxes = await client.list();
      lock = await client.getMailboxLock(boxes.find(b => b.specialUse === "\\All")?.path || "INBOX");
    } catch (err) {
      console.error("Gmail reply check unavailable:", err.message);
      client = null;
    }
  }

  return {
    async check(email, since) {
      // Our own outgoing mail lands in the same inbox: never count it as their reply (e.g. testing to yourself).
      const ours = [fromAddress(), replyTo(), env("GMAIL_USER")].map(a => a.toLowerCase());
      if (client && !ours.includes(email.toLowerCase()) && (await client.search({ from: email, since: new Date(since) }, { uid: true })).length) return "replied";
      const day = new Date(since).toISOString().slice(0, 10);
      const b = await postmark(`bounces?count=20&offset=0&emailFilter=${encodeURIComponent(email)}&fromdate=${day}`);
      const mine = (b.Bounces || []).filter(x => x.Email?.toLowerCase() === email.toLowerCase());
      if (mine.some(x => x.Type === "SpamComplaint")) return "complained";
      if (mine.some(x => x.Inactive || x.Type === "HardBounce" || x.Type === "BadEmailAddress")) return "bounced";
      return null;
    },
    async close() {
      if (!client) return;
      lock?.release();
      await client.logout().catch(() => {});
    },
  };
}

/** Real follow-ups only go out Mon–Fri, 9am–6pm Eastern. Test runs go anytime. */
export function inBusinessHours(d = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hour12: false })
    .formatToParts(d).map(p => [p.type, p.value]));
  const hour = Number(parts.hour) % 24;
  return !["Sat", "Sun"].includes(parts.weekday) && hour >= 9 && hour < 18;
}

/** Sends every follow-up that's due. Used by the scheduled leads-followups function (runs every minute). */
export async function runFollowups({ limit = 15, now: nowDate = new Date() } = {}) {
  const now = nowDate.toISOString();
  const onlyTests = inBusinessHours(nowDate) ? "" : "&test_mode=is.true";
  const due = await db.select(`select=*&status=eq.active&next_send_at=lte.${encodeURIComponent(now)}${onlyTests}&order=next_send_at.asc&limit=${limit}`);
  if (!due.length) return { due: 0, sent: 0, replied: 0, failed: 0 };

  const result = { due: due.length, sent: 0, replied: 0, failed: 0 };
  const inbox = await openChecks();
  try {
    for (const lead of due) {
      // Claim it first so an overlapping run can't double-send: push next_send_at out (an hour; 2 min for tests).
      const claimed = await db.updateWhere(lead.id, `step=eq.${lead.step}&status=eq.active`, { next_send_at: addDays(now, lead.test_mode ? 2 / 1440 : 1 / 24) });
      if (!claimed) continue;
      try {
        // A reply from the GM or anyone CC'd stops the sequence. A bounce/complaint from a CC drops just that CC
        // (a spam complaint from anyone stops everything); from the GM it stops the lead.
        let seen = await inbox.check(lead.contact_email, lead.created_at);
        const cc = [];
        for (const c of lead.cc || []) {
          if (seen) break;
          const r = await inbox.check(c.email, lead.created_at);
          if (r === "replied" || r === "complained") seen = r;
          else if (r !== "bounced") cc.push(c);
        }
        if (!seen && cc.length !== (lead.cc || []).length) {
          lead.cc = cc;
          await db.update(lead.id, { cc });
        }
        if (seen) {
          const status = { replied: "replied", bounced: "failed", complained: "unsubscribed" }[seen];
          await db.update(lead.id, { status, next_send_at: null, ...(seen === "replied" && lead.pipeline_stage === "new" ? { pipeline_stage: "replied", stage_changed_at: now } : {}), history: [...(lead.history || []), { at: now, event: `${seen} (detected)` }] });
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
        const tries = err instanceof PermanentError ? 3 : history.filter(h => h.error).length;
        await db.update(lead.id, tries >= 3 ? { history, status: "failed", next_send_at: null } : { history }).catch(() => {});
      }
    }
  } finally {
    await inbox.close();
  }
  return result;
}
