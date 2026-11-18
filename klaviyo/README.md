# /leads → Klaviyo setup

How it works: on a lot visit you open **autosync360.com/leads**, log in, add photos/video, enter the GM's email and hit **Send**.
The site saves the lead (Supabase "Auto Sync App" → `lead_prospects`, media in the `lead-media` bucket) and sends Klaviyo a
**`Lot Visit Submitted`** event for that email. A Klaviyo flow on that event sends the four emails below.
Tap **Replied** or **Stop** on the Campaign tab: that sets the profile's `lead_status`, and the flow filter drops them.

| # | When | Template | Subject |
|---|------|----------|---------|
| 1 | Right away | `1-lot-photos.html` | `Photos from your lot at {{ event.dealership }}` |
| 2 | Day 3 | `2-bump.html` | `{{ event.dealership }} lot photos` |
| 3 | Day 7 | `3-consistency.html` | `Keeping {{ event.dealership }}'s front line clean` |
| 4 | Day 14 | `4-close-file.html` | `Close the file on {{ event.dealership }}?` |

## 1. Send from autosync360.com (one time, ~15 min + DNS wait)

1. Klaviyo → **Settings → Domains → Add sending domain**. Use `send.autosync360.com` (Klaviyo's recommended subdomain; the From address is still `you@autosync360.com`).
2. Klaviyo shows CNAME/TXT records. Add them where autosync360.com's DNS lives: **Google Cloud DNS** (the nameservers are `ns-cloud-a*.googledomains.com`). Click **Verify** in Klaviyo once they're in.
3. Change the DMARC record at `_dmarc.autosync360.com` from strict to relaxed alignment, or Klaviyo mail will fail DMARC:
   `v=DMARC1; p=none; sp=none; rua=mailto:dev@639hz.com; fo=1; adkim=r; aspf=r; pct=100`
   (Today it says `adkim=s; aspf=s`. Relaxed is the normal setting and still covers Google Workspace and Postmark.)
4. Klaviyo → **Settings → Organization**: set the business name and a real mailing address. It prints in every footer, which the law requires (CAN-SPAM).

## 2. API key → Netlify

1. Klaviyo → **Settings → API keys → Create Private API Key**, custom scopes: **Events: Full**, **Profiles: Full**, **Templates: Full**.
2. Netlify → autosync360 → **Site configuration → Environment variables**, add:
   - `KLAVIYO_PRIVATE_KEY`: the key from step 1
   - `LEADS_PASSWORD`: the team password for /leads
   - `SUPABASE_URL`: `https://ikxcgwrhfwdzifqfoqbk.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase → Auto Sync App → Project Settings → API keys → `service_role` (secret)
   - `LEADS_SENDER_NAME`: the name to sign the emails with
   - `GOOGLE_MAPS_API_KEY` (optional, but you want it): turns on the dealership lookup. Typing "Sunshine" suggests nearby
     car dealers from Google; picking one fills in the exact name, address, website and phone, and offers `@theirdomain.com`
     for the email. Create it in Google Cloud Console → APIs & Services: enable **Places API (New)**, create an API key, and
     restrict it to that API. The key stays on the server. Cost is a fraction of a cent per lookup, well inside Google's free monthly credit at field volume.
3. Redeploy (or push) so the functions pick them up.

## 3. Templates

```bash
KLAVIYO_PRIVATE_KEY=pk_... node scripts/klaviyo-templates.mjs
```

That creates four code templates named "AS360 Lot Visit 1–4" in Klaviyo. To change wording later, edit the HTML here and rerun, or edit in Klaviyo directly.

## 4. Send one test to yourself first

Open autosync360.com/leads, add a photo, and use **your own email** as the GM. Klaviyo now knows the `Lot Visit Submitted`
metric (the flow trigger only shows up after the first event). The flow isn't live yet, so no email goes out.

## 5. Build the flow (Klaviyo → Flows → Create from scratch)

- **Trigger:** Metric → `Lot Visit Submitted`
- **Flow filter:** Properties about someone → `lead_status` **equals** `active`
  (Klaviyo checks this before every email, so Replied/Stop on /leads stops the next send.)
- **Email 1**, then **Time delay 3 days** → **Email 2**, then **4 days** → **Email 3**, then **7 days** → **Email 4**.
- For each email, use the template and subject from the table above, and set:
  - From name: your name. From email: `you@autosync360.com`. **Reply-to:** the inbox you actually read.
  - Turn **Smart Sending off** on Email 1 (a second dealership visit would otherwise get skipped).
  - Leave UTM tracking off: plain links look less like a blast.
- Preview the emails with your test event, then set the flow **Live**.

## Things to know

- **Replies don't stop the flow on their own.** Klaviyo can't see replies. When a GM writes back, tap **Replied** on the Campaign tab.
- **Klaviyo's rules.** Klaviyo's Acceptable Use Policy is written for people who opted in. A handful of personal, one-to-one emails
  after an in-person visit is low-risk. Volume, bounces and spam complaints are what get accounts reviewed. Keep it to real visits,
  double-check emails, and let people unsubscribe (the footer link does this). If Klaviyo ever flags the account, the same /leads
  form can be pointed at a Google Workspace mailbox instead.
- **Video size.** Phone videos go straight to Supabase storage. Supabase's free plan caps a single file at 50 MB (about 30–45 s of 1080p on an iPhone).
  Keep clips short, or raise the limit in Supabase → Storage settings on a paid plan.
