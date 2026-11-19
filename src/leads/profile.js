// "Volume" section on a Pipe lead: how big the store is and how they handle detailing today.
// Shared by the Pipe pop-up and the leads-api function (which validates what's saved). Add fields here.
export const LOT_WASH = ["Daily", "Several times a week", "Once a week", "Twice a month", "Once a month", "Less than once a month", "Never / not sure"];

// A field with `price` shows as a pair: the volume on the left, what they pay per unit on the right.
export const PROFILE_FIELDS = [
  { key: "used_per_month", label: "Used cars sold / month", type: "number", price: { key: "used_price", label: "They pay per used car" } },
  { key: "new_per_month", label: "New cars sold / month", type: "number", price: { key: "new_price", label: "They pay per new car" } },
  { key: "deliveries_per_month", label: "Deliveries / month", type: "number", price: { key: "delivery_price", label: "They pay per delivery" } },
  { key: "pdis_per_month", label: "PDIs / month", type: "number", price: { key: "pdi_price", label: "They pay per PDI" } },
  { key: "cars_on_lot", label: "Cars on the lot", type: "number", price: { key: "lot_wash_price", label: "They pay per car (lot wash)" } },
  { key: "recon_days", label: "Recon turn time (days)", type: "number" },
  { key: "current_vendor", label: "Current detail vendor", type: "text" },
  { key: "lot_wash", label: "How often they wash the lot", type: "select", options: LOT_WASH },
  { key: "price_per_detail", label: "Other pricing notes", type: "text" },
];

// Every stored key, including the price half of each pair.
export const PROFILE_KEYS = PROFILE_FIELDS.flatMap(f => (f.price ? [f.key, f.price.key] : [f.key]));

// Dollars, up to 2 decimals: "$1,250.5" -> 1250.5. Returns null if it isn't a sensible amount.
export function parseMoney(v) {
  const n = Number(String(v).replace(/[$, ]/g, ""));
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n * 100) / 100 : null;
}
export const fmtMoney = n => `$${Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Keeps only known fields: whole numbers 0–100000, dollar amounts, listed options, short text. Empty = removed.
export function cleanProfile(input) {
  const out = {};
  for (const f of PROFILE_FIELDS) {
    const p = f.price && input?.[f.price.key];
    if (p !== undefined && p !== null && p !== false && String(p).trim() !== "") {
      const n = parseMoney(p);
      if (n !== null) out[f.price.key] = n;
    }
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
