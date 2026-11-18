// Scheduled: sends the day 3 / 7 / 14 follow-ups for /leads through Postmark, as replies in the same
// thread. Before each one it checks for a reply (Gmail inbox, if connected) and Postmark bounces/spam
// complaints, and stops if it finds one.
// Runs every minute. Real leads only get emails Mon–Fri 9am–6pm Eastern (checked in runFollowups);
// "test run" leads go out 1 minute apart at any time.
import { missingEnv } from "../lib/leads.mjs";
import { mailMissing, runFollowups } from "../lib/lead-mail.mjs";

export const config = { schedule: "* * * * *" };

export default async () => {
  const missing = [...missingEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]), ...mailMissing()];
  if (missing.length) {
    console.log("leads-followups skipped, missing env:", missing.join(", "));
    return;
  }
  const r = await runFollowups();
  console.log(`leads-followups: ${r.due} due, ${r.sent} sent, ${r.replied} replied, ${r.failed} failed/bounced`);
};
