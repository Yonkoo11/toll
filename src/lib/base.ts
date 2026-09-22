/**
 * Where this copy of the site is served from.
 *
 * Vite gives us `/` in development and whatever `--base` was set to in a build.
 * Every data file and every route has to go through here: on a host that serves
 * the site from a subfolder, an absolute `/tape.json` is a 404, and the page
 * that 404s does not look broken — it looks like a token with no history.
 */
// `import.meta.env` exists under Vite and not under plain Node, where the
// verification scripts import this file through prices.ts. Default to the root.
const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')

/** A URL for a file in `public/`, correct wherever the site is mounted. */
export const asset = (file: string) => `${BASE}/${file.replace(/^\//, '')}`

/** A site path (`/method`) as a real href for this mount. */
export const href = (path: string) => `${BASE}${path}` || '/'

/** The reverse: a real pathname back to the site path the router matches on. */
export function toRoute(pathname: string): string {
  const p = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
  const trimmed = p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
  return trimmed || '/'
}
