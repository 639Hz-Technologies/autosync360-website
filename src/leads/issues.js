// "What did you see?" chips on /leads, and how each one reads inside the Klaviyo email.
// Shared by the /leads page and the leads-api function (which builds `issues_text` for Klaviyo).
export const ISSUES = {
  wheels: { label: "Dirty wheels / brake dust", phrase: "brake dust caked on the wheels" },
  dust: { label: "Dust / pollen on paint", phrase: "dust and pollen sitting on hoods and roofs" },
  water_spots: { label: "Water spots", phrase: "water spots on the glass and paint" },
  tires: { label: "Tires not dressed", phrase: "tires that haven't been dressed" },
  glass: { label: "Dirty glass", phrase: "streaky, dirty glass" },
  bird: { label: "Bird droppings / sap", phrase: "bird droppings and tree sap on a few units" },
  interior: { label: "Interiors", phrase: "interiors that need a wipe-down" },
};

export function issuesSentence(keys) {
  const p = (keys || []).map(k => ISSUES[k]?.phrase).filter(Boolean);
  if (!p.length) return "A good number of units on the line could use some attention.";
  const list = p.length === 1 ? p[0] : p.length === 2 ? `${p[0]} and ${p[1]}` : `${p.slice(0, -1).join(", ")}, and ${p.at(-1)}`;
  return `A few things stood out: ${list}.`;
}
