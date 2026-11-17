import ReactDOM from 'react-dom/client'
import { resolve, Root } from './routes.jsx'

const route = resolve(window.location.pathname)
const el = document.getElementById('root')
const tree = <Root route={route} />

// Pages built by scripts/prerender.mjs already contain HTML: reuse it when it's the same page.
// Otherwise (dev server, or a URL that fell back to the "/" file) render from scratch.
if (el.dataset.route === route.key) {
  ReactDOM.hydrateRoot(el, tree)
} else {
  el.textContent = ''
  ReactDOM.createRoot(el).render(tree)
}
