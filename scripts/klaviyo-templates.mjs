// Uploads the /leads email templates in klaviyo/*.html to your Klaviyo account as code templates,
// named "AS360 Lot Visit 1 – …" etc. Pick them in the flow (see klaviyo/README.md).
// Run again after editing the HTML: it creates fresh copies (Klaviyo keeps the old ones until you delete them).
//
//   KLAVIYO_PRIVATE_KEY=pk_... node scripts/klaviyo-templates.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const key = process.env.KLAVIYO_PRIVATE_KEY;
if (!key) { console.error("Set KLAVIYO_PRIVATE_KEY first."); process.exit(1); }

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../klaviyo");
const files = fs.readdirSync(dir).filter(f => /^\d-.*\.html$/.test(f)).sort();

for (const file of files) {
  const n = file[0];
  const name = `AS360 Lot Visit ${n} – ${file.slice(2, -5).replace(/-/g, " ")}`;
  const res = await fetch("https://a.klaviyo.com/api/templates", {
    method: "POST",
    headers: {
      authorization: `Klaviyo-API-Key ${key}`,
      revision: "2024-10-15",
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
    },
    body: JSON.stringify({ data: { type: "template", attributes: { name, editor_type: "CODE", html: fs.readFileSync(path.join(dir, file), "utf8") } } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`✗ ${name}: ${res.status} ${JSON.stringify(body.errors || body)}`); process.exitCode = 1; continue; }
  console.log(`✓ ${name} (id ${body.data.id})`);
}
