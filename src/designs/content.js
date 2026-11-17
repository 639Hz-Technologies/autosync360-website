// Shared copy for the design skeletons. Edit here and both designs update.
// Positioning: AI-powered operations platform for dealerships + the vendors that serve them.

export const brand = {
  name: "AutoSync 360",
  tagline: "AI-powered operations for dealerships and the vendors who serve them.",
  sub: "Track every vehicle from the auction lane to the front line, and let AI run the work in between. Dealers, fleets, transporters and service shops on one customizable platform.",
  phone: "866-AUTO-239",
  phoneHref: "tel:8662886239",
  email: "sales@autosync360.com",
};

// The core story: a vehicle's journey through AutoSync 360.
export const journey = [
  { icon: "auction", title: "Bought anywhere", desc: "Auction, trade-in or dealer trade. AutoSync creates the unit from the VIN and pulls in the auction condition report." },
  { icon: "camera", title: "Pickup inspection", desc: "The transporter scans the VIN, snaps photos and records a quick walkaround video, stamped with time and GPS." },
  { icon: "gps", title: "Tracked live by GPS", desc: "Watch every unit on the map with a live ETA. No calls, no guessing." },
  { icon: "dealerships", title: "Tap “Delivered”", desc: "Delivery photos and video are captured, the dealer signs off, and the car enters your workflow instantly." },
  { icon: "ai", title: "AI preps your team", desc: "Using the condition report and photos, AI builds the recon plan and emails or texts the right people before the car arrives." },
  { icon: "flag", title: "Recon to frontline", desc: "Detail, mechanical, body, tint: each stage tracked, invoiced and timed until it hits the line." },
];

// Photo + video condition proof: protects vendors and dealers.
export const protection = {
  title: "Protected on both ends.",
  desc: "Every handoff is documented with photos and a walkaround video, time-stamped and GPS-tagged. Transporters can prove the condition they picked up and delivered. Dealers can see exactly what's coming before it arrives.",
  pickup: ["24 photos · 45s walkaround video", "Manheim Orlando · 9:12 AM", "Matches auction condition report"],
  delivery: ["24 photos · 41s walkaround video", "Sunshine Ford · 2:38 PM", "No new damage detected"],
};

export const audiences = {
  dealer: {
    label: "For dealerships",
    title: "See every unit. Hit every frontline date.",
    desc: "One live view of every vehicle across auctions, transport, recon and your lot, with AI watching for anything that's about to slip.",
    points: ["Live location of every unit", "Recon pipeline board", "Vendor management & scorecards", "Time-to-frontline analytics", "Auto-invoicing & vendor payouts", "Multi-rooftop support"],
  },
  vendor: {
    label: "For vendors",
    title: "Get the job, do the job, get paid.",
    desc: "Transporters, mechanics, body shops, tint and detail shops get jobs from dealers in the app, prove delivery with GPS and photos, and invoice in one tap. Run your own shop on it too.",
    points: ["Accept dealer jobs in the app", "Photo + video proof of condition", "GPS-tracked pickup & delivery", "Log work and labor hours", "One-tap invoicing", "Run your own shop: inventory, payroll, team"],
  },
};

export const vendorTypes = [
  { key: "truck", name: "Transport" },
  { key: "mechanic", name: "Mechanical" },
  { key: "body", name: "Body & Paint" },
  { key: "tint", name: "Tint & PPF" },
  { key: "wash", name: "Detail & Wash" },
  { key: "audio", name: "Car Audio & Electronics" },
];

export const ai = {
  headline: "AI that runs the busywork, so your team runs the business.",
  sub: "AutoSync AI watches every vehicle, job and vendor across your operation and acts on it: assigning, alerting, invoicing. Every rule is yours to customize.",
  chat: [
    { from: "user", text: "Where's stock #4471 and when will it be frontline-ready?" },
    { from: "ai", text: "2022 Ford F-150 · In transit with Swift Haul, 12 mi out (ETA 2:40 PM). The auction report shows a rear bumper scuff and worn tires. I've booked body at 3:00 and tires + detail tomorrow, and sent the photos to your recon manager. Projected frontline: Thu." },
  ],
  features: [
    { icon: "invoicing", title: "Condition report → recon plan", desc: "Reads the auction condition report and photos, then builds the to-do list for each car automatically." },
    { icon: "messages", title: "Auto-notify your team", desc: "Emails and texts the right people with photos and ETA, so they're ready when the car arrives." },
    { icon: "ai", title: "Ask AutoSync", desc: "Ask anything in plain English: where a car is, what's late, what a vendor billed." },
    { icon: "workorders", title: "Smart routing", desc: "When a stage finishes, the next vendor or tech is assigned automatically." },
    { icon: "alert", title: "Delay prediction", desc: "Flags units likely to miss their frontline date before it happens." },
    { icon: "camera", title: "Photo & video damage check", desc: "Compares pickup and delivery photos to flag new damage." },
    { icon: "custom", title: "Custom workflows", desc: "Build your own stages, rules, forms and approvals. No code." },
  ],
};

export const modules = [
  { key: "gps", title: "Live GPS Tracking", desc: "Every vehicle's location and status from auction to frontline." },
  { key: "workorders", title: "Recon Workflow", desc: "Customizable stages, assignments, comments and handoffs." },
  { key: "inventory", title: "Inventory", desc: "Vehicles, parts and supplies with cost and location." },
  { key: "invoicing", title: "Billing & Invoicing", desc: "Job-to-invoice in one click. Syncs with QuickBooks." },
  { key: "payroll", title: "Payroll", desc: "Pay techs and staff from tracked hours and jobs." },
  { key: "messages", title: "Internal Messaging", desc: "Chat per vehicle, per team or with vendors, all in context." },
  { key: "intake", title: "VIN Scan Intake", desc: "Scan with a phone camera; year, make, model, trim auto-filled." },
  { key: "purchasing", title: "Purchase Orders", desc: "Request, approve and track orders with an audit trail." },
  { key: "team", title: "Team & Permissions", desc: "Departments, roles, clock-ins and labor hours." },
  { key: "reports", title: "Reports & Dashboards", desc: "Time-to-line, revenue vs. labor, vendor performance." },
  { key: "integrations", title: "Integrations", desc: "Connect accounting, payments, payroll and the apps you already use." },
  { key: "mobile", title: "iOS & Android Apps", desc: "For your team and your vendors. Works offline." },
];

export const stats = [
  { value: "100%", label: "of units visible, auction to frontline" },
  { value: "<10s", label: "to check in a vehicle by VIN scan" },
  { value: "1-tap", label: "vendor invoicing" },
  { value: "24/7", label: "live GPS on web, iOS & Android" },
];

// Integrations, grouped. `si` = Simple Icons key (real logo); others render a monogram.
// live: true  = already connected in the AutoSync backend today.
// live: false = has a usable API, but not built yet (shows "Soon").
export const integrationGroups = [
  { group: "Accounting & payments", items: [
    { name: "QuickBooks", si: "siQuickbooks", note: "Invoices sync", live: true },
    { name: "Xero", si: "siXero" },
    { name: "Stripe", si: "siStripe", note: "Card & ACH payments" },
  ]},
  { group: "Team & communication", items: [
    { name: "Twilio", si: "siTwilio", note: "SMS alerts" },
    { name: "Google Workspace", si: "siGoogle", note: "Gmail, Calendar & Drive" },
    { name: "Zapier", si: "siZapier", note: "5,000+ apps" },
  ]},
];

// Flat name list (used by Design B's chip row).
export const integrations = integrationGroups.flatMap(g => g.items.map(i => i.name));

export const enterprise = {
  title: "Enterprise: a dedicated partner in your growth.",
  desc: "Dealer groups and high-volume operations get a dedicated success manager who knows your stores, your vendors and your goals, and keeps pushing the numbers up.",
  points: ["Dedicated success manager", "Custom workflows & integrations", "Multi-rooftop & dealer groups", "Data migration & onboarding", "Roles, permissions & audit logs", "Priority support"],
};

export const faqs = [
  { q: "How does vehicle tracking work?", a: "Vendors' phones share GPS while a vehicle is in their care. Dealers see live location and ETA, and check-in happens automatically on arrival." },
  { q: "Can I customize the workflow?", a: "Yes. Stages, rules, forms, approvals and notifications are all configurable per store." },
  { q: "Does it replace my accounting or DMS?", a: "No. AutoSync connects to them. Invoices sync to QuickBooks and inventory can sync with your DMS." },
  { q: "Does it work for multiple rooftops?", a: "Yes. Dealer groups manage every store, vendor and vehicle from one account." },
  { q: "How long does setup take?", a: "Most dealers are live within a week. Enterprise accounts get guided onboarding." },
];
