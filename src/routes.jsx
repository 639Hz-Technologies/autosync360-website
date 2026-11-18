// Shared by the browser (main.jsx) and the build-time pre-renderer (entry-server.jsx),
// so both pick the same page for a URL.
import React, { lazy, Suspense } from 'react'
import DesignA from './designs/DesignA.jsx'
import IndustryPage from './designs/IndustryPage.jsx'

// Private field tool: loaded on demand so it adds nothing to the public pages. Never pre-rendered.
const LeadsPage = lazy(() => import('./leads/LeadsPage.jsx'))

// `key` identifies what was rendered; main.jsx only hydrates when the pre-rendered key matches.
export function resolve(pathname) {
  if (/^\/leads\/?$/.test(pathname)) return { key: 'leads', Page: () => <Suspense fallback={null}><LeadsPage /></Suspense> }
  // Industry landing pages: /industries/<slug>
  const m = pathname.match(/^\/industries\/([a-z0-9-]+)\/?$/)
  if (m) return { key: `industry:${m[1]}`, Page: () => <IndustryPage slug={m[1]} /> }
  return { key: 'home', Page: DesignA }
}

export function Root({ route }) {
  const { Page } = route
  return (
    <React.StrictMode>
      <Page />
    </React.StrictMode>
  )
}
