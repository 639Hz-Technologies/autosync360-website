// autosync360.com/lot-media/<path>: serves /leads photos and videos from the private Supabase bucket.
// Going through our domain lets every file carry "X-Robots-Tag: noindex" so search engines never index
// them, and keeps the bucket private (no public Supabase URLs). Supports Range requests so videos play
// and seek; open-ended ranges are answered in chunks to stay under Netlify's response size limit.
import { MEDIA_PATH, BUCKET } from "../lib/leads.mjs";

export const config = { path: "/lot-media/*" };

const CHUNK = 4 * 1024 * 1024; // bytes per video range response
const NOINDEX = "noindex, nofollow, noarchive, noimageindex";

export default async (req) => {
  const path = decodeURIComponent(new URL(req.url).pathname.replace(/^\/lot-media\//, ""));
  if (!MEDIA_PATH.test(path)) return new Response("Not found", { status: 404, headers: { "x-robots-tag": NOINDEX } });

  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const headers = { apikey: key, authorization: `Bearer ${key}` };

  // Pass Range through, capping open-ended or huge ranges to one chunk.
  const range = req.headers.get("range");
  const m = range && /^bytes=(\d+)-(\d*)$/.exec(range.trim());
  if (m) {
    const start = Number(m[1]);
    const end = m[2] ? Math.min(Number(m[2]), start + CHUNK - 1) : start + CHUNK - 1;
    headers.range = `bytes=${start}-${end}`;
  }

  const upstream = await fetch(`${base}/storage/v1/object/authenticated/${BUCKET}/${path}`, { headers });
  if (upstream.status === 416) return new Response(null, { status: 416, headers: { "content-range": upstream.headers.get("content-range") || "", "x-robots-tag": NOINDEX } });
  if (!upstream.ok) return new Response("Not found", { status: 404, headers: { "x-robots-tag": NOINDEX } });

  const out = new Headers({
    "x-robots-tag": NOINDEX,
    "accept-ranges": "bytes",
    // Files never change (unique paths). Partial responses aren't cached at the CDN.
    "cache-control": upstream.status === 206 ? "private, max-age=3600" : "public, max-age=31536000, immutable",
  });
  for (const h of ["content-type", "content-length", "content-range", "etag", "last-modified"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
};
