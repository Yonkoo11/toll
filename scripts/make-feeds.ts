/**
 * Map each token in the catalog to its Pyth price feeds.
 *
 * Pyth publishes three things about an xStock and they answer three different
 * questions, so all three are load-bearing:
 *   Equity.US.<T>/USD        what one real share is worth
 *   Crypto.<T>X/USD          what the token is trading at
 *   Crypto.<T>X/<T>.RR       the redemption rate: whether the token is still
 *                            tracking the share at all
 *
 * Feed ids are read from Pyth's own published list, never written by hand.
 * Tokens with no feed are recorded as having none — the private-company
 * tokens have no public equity to price against, and saying so is the answer.
 */
import { writeFileSync, readFileSync } from 'node:fs'

interface CatalogEntry { symbol: string; name: string; mint: string; issuer: string; unlisted: boolean }
interface Feed { id: string; attributes?: { symbol?: string; asset_type?: string } }

const catalog: CatalogEntry[] = JSON.parse(readFileSync('data/catalog.json', 'utf8'))
const feeds = (await (await fetch('https://hermes.pyth.network/v2/price_feeds')).json()) as Feed[]

const bySymbol = new Map<string, string>()
for (const feed of feeds) {
  const symbol = feed.attributes?.symbol
  if (symbol) bySymbol.set(symbol, feed.id)
}
console.log(`Pyth publishes ${feeds.length} feeds`)

const out: Record<string, { ticker: string; equity: string | null; token: string | null; redemptionRate: string | null }> = {}
let complete = 0

for (const entry of catalog) {
  // An xStock ticker is the share's ticker with an x on the end.
  const ticker = entry.symbol.endsWith('x') ? entry.symbol.slice(0, -1) : entry.symbol
  const upper = ticker.toUpperCase()
  const found = {
    ticker: upper,
    equity: bySymbol.get(`Equity.US.${upper}/USD`) ?? null,
    token: bySymbol.get(`Crypto.${upper}X/USD`) ?? null,
    redemptionRate: bySymbol.get(`Crypto.${upper}X/${upper}.RR`) ?? null,
  }
  out[entry.mint] = found
  if (found.equity && found.token && found.redemptionRate) complete++
}

writeFileSync('data/feeds.json', JSON.stringify(out, null, 1) + '\n')

const any = Object.values(out).filter((f) => f.equity || f.token || f.redemptionRate).length
console.log(
  `feeds: ${complete} of ${catalog.length} tokens have all three, ${any} have at least one. ` +
    `${catalog.length - any} have none — the private-company tokens have no public share to price against.`,
)
