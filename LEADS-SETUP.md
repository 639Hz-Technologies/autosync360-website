# /leads: field outreach setup

**What it does:** at a dealership you open **autosync360.com/leads**, log in, and look up the dealer (Google fills in the address).
Then you snap photos and video of the dirty inventory, enter the GM's email, and hit **Send**.

- **Email 1** goes out right away through **Postmark**: the same account as the website's contact form.
- **Follow-ups** go out on days 3, 7 and 14 as replies in the same thread (weekdays, 9am–5pm Eastern).
- **Replies** go to your Gmail (`GMAIL_USER`). Before each follow-up the site checks that inbox; if the GM wrote back, it stops.
- **Bounces and spam complaints:** Postmark tracks these, and the sequence stops for that address.
- **Manual stop:** tap **Replied** or **Stop** on the Campaign tab anytime.
- **Every email** carries an unsubscribe link and your mailing address, as US law requires (CAN-SPAM).
  Anyone who unsubscribes is never emailed again.
- **No tracking:** open and click tracking are off, so the emails look personal.

Data lives in Supabase "Auto Sync App": the `lead_prospects` table, plus photos and video in the `lead-media` bucket.
The wording of all four emails is in `netlify/lib/lead-emails.mjs`.

## Netlify environment variables

Netlify → autosync360 → Site configuration → Environment variables.

| Key | Status / value |
|---|---|
| `LEADS_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Already set |
| `POST_MARK_API` | Already set (the contact form uses it) |
| `BUSINESS_ADDRESS` | Your mailing address for the email footer, e.g. `123 Main St, Orlando, FL 32801` |
| `LEADS_FROM_EMAIL` | Optional. The From address. Defaults to `GMAIL_USER`. Postmark must have this address's domain verified (Postmark → Sender Signatures) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Optional, recommended: replies go to this inbox, and follow-ups stop automatically when the GM replies |
| `LEADS_SENDER_NAME` | Your name, as signed on the emails |
| `LEADS_PHONE` | Optional; defaults to 866-AUTO-239 |
| `LEADS_REPLY_TO` | Optional; defaults to `GMAIL_USER` |
| `LEADS_POSTMARK_TOKEN` | Optional; a separate Postmark server token just for /leads (see below). Defaults to `POST_MARK_API` |
| `POSTMARK_LEADS_STREAM` | Optional; Postmark message stream (defaults to `outbound`) |
| `GOOGLE_MAPS_API_KEY` | Optional dealership lookup: Google Cloud → enable **Places API (New)** → create a key |

Redeploy after changing variables.

## Test it

1. On /leads, look up any dealership, add a photo, and use **your own email** as the GM.
2. Tap **Send & start campaign**, then **Preview email** to check From and Reply-to. Then hit **Send**.
3. If Postmark rejects the From address, the error shows on screen. Verify that address or domain in Postmark,
   or set `LEADS_FROM_EMAIL` to one that is.

## Good to know

- **Postmark's rules:** Postmark is meant for email people expect, and its terms don't allow cold or unsolicited email.
  Watch the bounce and spam-complaint rates in Postmark (Tag: `lead-outreach`). If Postmark flags the account, the website's
  contact form is affected too. To keep them apart, create a second Postmark server for /leads and put its token in
  `LEADS_POSTMARK_TOKEN`.
- **Video size:** the Supabase free plan caps one file at 50 MB (about 30–45 s of iPhone video).

## Data tab (Florida dealerships)

The Data tab reads `dealer_directory` in the Supabase "Auto Sync App" project: 4,101 Florida dealerships copied on
2026-11-18 from the Genius Leads database (`prospects`, category `dealership`, state FL). It's a snapshot. New scrapes in
Genius Leads don't show up until the copy is re-run (ask Claude to "refresh the Florida dealer data from Genius Leads";
the copy matches on Google place id, so re-running updates existing rows instead of duplicating them).
