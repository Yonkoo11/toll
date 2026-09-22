/** A five-route history router. No dependency; the routes are known at build time. */

import { href, toRoute } from './base.js'

export const nav = $state({ path: toRoute(location.pathname) })

export function go(path: string, replace = false): void {
  if (path === nav.path) return
  history[replace ? 'replaceState' : 'pushState']({}, '', href(path))
  nav.path = path
  scrollTo(0, 0)
}

/**
 * Intercept in-app links so a click does not reload the whole page.
 *
 * Markup writes site paths (`/method`). This also rewrites the rendered href to
 * the real one for this mount, so opening in a new tab or middle-clicking lands
 * in the same place a plain click does.
 */
export function link(node: HTMLAnchorElement) {
  const route = node.getAttribute('href')
  if (route?.startsWith('/')) node.setAttribute('href', href(route))

  const onClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    if (!route?.startsWith('/')) return
    e.preventDefault()
    go(route)
  }
  node.addEventListener('click', onClick)
  return { destroy: () => node.removeEventListener('click', onClick) }
}

addEventListener('popstate', () => {
  nav.path = toRoute(location.pathname)
})
