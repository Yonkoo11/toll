/** A five-route history router. No dependency; the routes are known at build time. */

export const nav = $state({ path: normalise(location.pathname) })

function normalise(p: string): string {
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

export function go(path: string, replace = false): void {
  if (normalise(path) === nav.path) return
  history[replace ? 'replaceState' : 'pushState']({}, '', path)
  nav.path = normalise(path)
  scrollTo(0, 0)
}

/** Intercept in-app links so a click does not reload the whole page. */
export function link(node: HTMLAnchorElement) {
  const onClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const href = node.getAttribute('href')
    if (!href || !href.startsWith('/')) return
    e.preventDefault()
    go(href)
  }
  node.addEventListener('click', onClick)
  return { destroy: () => node.removeEventListener('click', onClick) }
}

addEventListener('popstate', () => {
  nav.path = normalise(location.pathname)
})
