// Scheduled: sends the day 3 / 7 / 14 follow-ups for /leads, from the same Gmail, as replies in the
// same thread. Before each one it checks the inbox: if the GM replied (or the address bounced) it stops.
// Runs every hour, 9am–5pm Eastern, Monday–Friday (times below are UTC).
import { missingEnv } from "../lib/leads.mjs";
import { MAIL_ENV, runFollowups } from "../lib/lead-mail.mjs";

export const config = { schedule: "0 13-21 * * 1-5" };

export default async () => {
  const missing = missingEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", ...MAIL_ENV]);
  if (missing.length) {
    console.log("leads-followups skipped, missing env:", missing.join(", "));
    return;
  }
  const r = await runFollowups();
  console.log(`leads-followups: ${r.due} due, ${r.sent} sent, ${r.replied} replied, ${r.failed} failed/bounced`);
};
