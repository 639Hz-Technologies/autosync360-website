// Build-time only: renders each public page to HTML so search engines get real content.
// Used by scripts/prerender.mjs after `vite build`.
import { renderToString } from 'react-dom/server'
import { resolve, Root } from './routes.jsx'
import { industries } from './designs/industries.js'

// Pages to pre-render. `title`/`description` go into <head>; null keeps index.html's own.
export const pages = [
  { path: '/', title: null, description: null },  // homepage head lives in index.html
  ...industries.map(i => ({ path: `/industries/${i.slug}`, title: i.seoTitle, description: i.metaDesc })),
]

export function render(path) {
  const route = resolve(path)
  return { key: route.key, html: renderToString(<Root route={route} />) }
}
