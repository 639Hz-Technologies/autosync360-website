// Runs after `vite build` + the SSR build (see package.json "build").
// Writes a finished HTML file per page into dist/, plus sitemap.xml and robots.txt.
// Set SITE_URL to change the domain used in canonical links and the sitemap.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SITE = (process.env.SITE_URL || 'https://autosync360.com').replace(/\/$/, '')
const dist = path.resolve('dist')
const ssrDir = path.resolve('dist-ssr')
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const { render, pages } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href)

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const defaultTitle = template.match(/<title>([\s\S]*?)<\/title>/)[1]
const defaultDesc = (template.match(/<meta name="description" content="([^"]*)"/) || [])[1]
const cleanTemplate = template.replace(/\s*<meta name="description"[^>]*>/, '')

for (const p of pages) {
  const { key, html } = render(p.path)
  const url = SITE + p.path
  const title = p.title || defaultTitle
  const description = p.description || defaultDesc
  const head = [
    `<title>${esc(title)}</title>`,
    description && `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="AutoSync 360" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    description && `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE}/autosync360-logo.png" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].filter(Boolean).join('\n    ')

  const out = cleanTemplate
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace('<div id="root"></div>', `<div id="root" data-route="${esc(key)}">${html}</div>`)

  // "/" → dist/index.html; "/industries/x" → dist/industries/x.html (Netlify serves it at /industries/x)
  const file = p.path === '/' ? path.join(dist, 'index.html') : path.join(dist, `${p.path.slice(1)}.html`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, out)
  console.log(`prerendered ${p.path} → ${path.relative(dist, file)} (${(out.length / 1024).toFixed(1)} kB)`)
}

const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(p => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`wrote sitemap.xml (${pages.length} URLs) and robots.txt for ${SITE}`)

fs.rmSync(ssrDir, { recursive: true, force: true })
