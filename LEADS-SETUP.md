# /leads: field outreach setup

**What it does:** at a dealership you open **autosync360.com/leads**, log in, and look up the dealer (Google fills in the address).
Then you snap photos and video of the dirty inventory, enter the GM's email, and hit **Send**.

- **Email 1** goes out right away from your Google Workspace inbox, e.g. `you@autosync360.com`.
- **Follow-ups** go out on days 3, 7 and 14 as replies in the same thread (weekdays, 9am–5pm Eastern).
- **Before each follow-up**, the site checks your inbox. If the GM replied, or the address bounced, the sequence stops on its own.
  You can also tap **Replied** or **Stop** on the Campaign tab.
- **Every email** carries an unsubscribe link and your mailing address, as US law requires (CAN-SPAM).
  Anyone who unsubscribes is never emailed again.
- **Their replies** land in your Gmail like normal email, and everything sent is in your Sent folder.

Data lives in Supabase "Auto Sync App": the `lead_prospects` table, plus photos and video in the `lead-media` bucket.
The wording of all four emails is in `netlify/lib/lead-emails.mjs`.

## 1. Create a Google app password (5 min)

Use the Workspace account the emails should come from.

1. That account needs 2-Step Verification on: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) and create one named "AutoSync leads".
   Copy the 16-letter password.
   - If the page says app passwords aren't available, a Workspace admin has to allow them:
     admin.google.com → Security → Authentication → 2-Step Verification (allow), and Less secure apps / app passwords.

## 2. Netlify environment variables

Netlify → autosync360 → Site configuration → Environment variables. Already set: `LEADS_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
Add these:

| Key | Value |
|---|---|
| `GMAIL_USER` | The address the emails come from, e.g. `you@autosync360.com` |
| `GMAIL_APP_PASSWORD` | The app password from step 1 (mark as secret) |
| `BUSINESS_ADDRESS` | Your mailing address for the footer, e.g. `123 Main St, Orlando, FL 32801` |
| `LEADS_SENDER_NAME` | Your name, as signed on the emails |
| `LEADS_PHONE` | Optional; defaults to 866-AUTO-239 |
| `GOOGLE_MAPS_API_KEY` | Optional dealership lookup: Google Cloud → enable **Places API (New)** → create a key |

Then redeploy. `KLAVIYO_PRIVATE_KEY` is no longer used and can be deleted.

## 3. Test it

1. On /leads, look up any dealership, add a photo, and use **your own email** (or a second address you own) as the GM.
2. Tap **Send & start campaign**, then **Preview email**. Check it, then hit **Send**.
3. The email should arrive within a minute. Reply to it: the next follow-up run will mark it **Replied** on the Campaign tab.

## Good to know

- **Volume:** Google Workspace allows about 2,000 emails a day per user, far more than you'll send. Fresh mailboxes do better
  ramping up gradually: a handful a day at first.
- **Deliverability:** autosync360.com already has Google's SPF. Make sure Google **DKIM** is turned on
  (admin.google.com → Apps → Google Workspace → Gmail → Authenticate email).
- **Video size:** the Supabase free plan caps one file at 50 MB (about 30–45 s of iPhone video).
