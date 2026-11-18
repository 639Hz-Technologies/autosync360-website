// "What did you see?" chips on /leads, and how each one reads inside the email.
// Shared by the /leads page and the leads-api function. Add or reword options here.
export const ISSUES = {
  wheels: { label: "Dirty wheels / brake dust", phrase: "brake dust caked on the wheels" },
  wheel_wells: { label: "Mud in wheel wells", phrase: "mud packed in the wheel wells" },
  dust: { label: "Dust / pollen on paint", phrase: "dust and pollen sitting on hoods and roofs" },
  water_spots: { label: "Water spots", phrase: "water spots on the glass and paint" },
  decals: { label: "Other dealer / auction decals", phrase: "decals and stickers from other dealers and the auction still on the vehicles" },
  grease_pencil: { label: "Grease pencil on glass", phrase: "old grease-pencil markings on the windshields" },
  tires: { label: "Tires not dressed", phrase: "tires that haven't been dressed" },
  glass: { label: "Dirty glass", phrase: "streaky, dirty glass" },
  bird: { label: "Bird droppings / sap", phrase: "bird droppings and tree sap on a few units" },
  bugs: { label: "Bugs on bumpers", phrase: "bug splatter on the front bumpers and mirrors" },
  road_grime: { label: "Road grime / tar", phrase: "road grime and tar on the lower panels" },
  headlights: { label: "Hazy headlights", phrase: "hazy, oxidized headlights" },
  swirls: { label: "Swirls / light scratches", phrase: "swirl marks and light scratches in the paint" },
  cowl_debris: { label: "Leaves / debris in cowls", phrase: "leaves and debris collected in the cowls" },
  door_jambs: { label: "Dirty door jambs", phrase: "dirty door jambs" },
  interior: { label: "Interiors", phrase: "interiors that need a wipe-down" },
  trash: { label: "Trash left inside", phrase: "trash left inside a few vehicles" },
};

// Free text typed into "Other" → phrases to add to the list (comma or line separated).
export function otherPhrases(text) {
  return String(text || "")
    .split(/[,\n;]+/)
    .map(t => t.trim().replace(/[.!]+$/, ""))
    .filter(Boolean)
    .slice(0, 5)
    // lowercase the first letter so it reads mid-sentence, unless it's an acronym like "VIN"
    .map(t => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t));
}

export function issuesSentence(keys, other) {
  const p = [...(keys || []).map(k => ISSUES[k]?.phrase).filter(Boolean), ...otherPhrases(other)];
  if (!p.length) return "A good number of units on the line could use some attention.";
  const list = p.length === 1 ? p[0] : p.length === 2 ? `${p[0]} and ${p[1]}` : `${p.slice(0, -1).join(", ")}, and ${p.at(-1)}`;
  return `A few things stood out: ${list}.`;
}
