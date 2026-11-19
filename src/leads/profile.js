// "Volume" section on a Pipe lead: how big the store is and how they handle detailing today.
// Shared by the Pipe pop-up and the leads-api function (which validates what's saved). Add fields here.
export const LOT_WASH = ["Daily", "Several times a week", "Once a week", "Twice a month", "Once a month", "Less than once a month", "Never / not sure"];

export const PROFILE_FIELDS = [
  { key: "used_per_month", label: "Used cars sold / month", type: "number" },
  { key: "new_per_month", label: "New cars sold / month", type: "number" },
  { key: "deliveries_per_month", label: "Deliveries / month", type: "number" },
  { key: "pdis_per_month", label: "PDIs / month", type: "number" },
  { key: "cars_on_lot", label: "Cars on the lot", type: "number" },
  { key: "recon_days", label: "Recon turn time (days)", type: "number" },
  { key: "lot_wash", label: "How often they wash the lot", type: "select", options: LOT_WASH },
  { key: "current_vendor", label: "Current detail vendor", type: "text" },
  { key: "price_per_detail", label: "What they pay per detail", type: "text" },
];

// Keeps only known fields: whole numbers 0–100000, listed options, short text. Empty = removed.
export function cleanProfile(input) {
  const out = {};
  for (const f of PROFILE_FIELDS) {
    const v = input?.[f.key];
    if (v === undefined || v === null || String(v).trim() === "") continue;
    if (f.type === "number") {
      const n = Math.round(Number(String(v).replace(/[, ]/g, "")));
      if (Number.isFinite(n) && n >= 0 && n <= 100000) out[f.key] = n;
    } else if (f.type === "select") {
      if (f.options.includes(v)) out[f.key] = v;
    } else {
      out[f.key] = String(v).trim().slice(0, 120);
    }
  }
  return out;
}
