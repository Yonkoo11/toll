/**
 * Rebuild data/catalog.json.
 *
 * The two issuers publish lists of their own tokens. Neither list is the chain:
 * on 2026-09-20 the PreStocks API omitted xAI PreStocks, a live mint with real
 * supply whose toll had just been doubled. So the catalog starts from the
 * published lists and then adds every mint the issuer's own admin address has
 * actually touched. Nothing here is trusted as fact; it is only a list of
 * addresses to go and read.
 */
import { writeFileSync } from 'node:fs'
import { Rpc } from '../src/lib/rpc.js'
import { readTerms } from '../src/lib/terms.js'
import { changesByAuthority } from '../src/lib/tape.js'

const PRESTOCKS_ADMIN = 'WV9PJN7XTmTLVwbutCLFxp8TyePee6Xq5mRq6Fti5Wc'

export interface CatalogEntry {
  symbol: string
  name: string
  mint: string
  issuer: string
  /** True when the issuer's own public list does not mention this token. */
  unlisted: boolean
}

const rpc = new Rpc({ timeoutMs: 45_000, attempts: 8 })
const entries = new Map<string, CatalogEntry>()

const prestocks = (await (await fetch('https://prestocks.com/api/prestocks')).json()) as any[]
for (const t of prestocks) {
  entries.set(t.contract_address, {
    symbol: t.symbol,
    name: t.name ?? t.symbol,
    mint: t.contract_address,
    issuer: 'PreStocks',
    unlisted: false,
  })
}

const jup = (await (await fetch('https://lite-api.jup.ag/tokens/v2/search?query=xStock')).json()) as any[]
for (const t of jup) {
  if (!t.isVerified || !String(t.name ?? '').includes('xStock')) continue
  entries.set(t.id, { symbol: t.symbol, name: t.name, mint: t.id, issuer: 'Backed', unlisted: false })
}

const listed = new Set(entries.keys())

// Everything the PreStocks admin has touched that its public list leaves out.
const changes = await changesByAuthority(rpc, PRESTOCKS_ADMIN, { limit: 100, concurrency: 2 })
const touched = [...new Set(changes.map((c) => c.mint))].filter((m) => !listed.has(m))

for (const mint of touched) {
  try {
    const terms = await readTerms(rpc, mint)
    // A mint with no supply is scaffolding, not a token anyone holds.
    if (terms.rawSupply === '0' || !terms.symbol) continue
    entries.set(mint, {
      symbol: terms.symbol,
      name: terms.name ?? terms.symbol,
      mint,
      issuer: 'PreStocks',
      unlisted: true,
    })
    console.log(`  unlisted: ${terms.symbol} (${terms.name}) ${mint}`)
  } catch {
    // An address we cannot read does not go in the catalog.
  }
}

const out = [...entries.values()].sort(
  (a, b) => a.issuer.localeCompare(b.issuer) || a.symbol.localeCompare(b.symbol),
)
writeFileSync('data/catalog.json', JSON.stringify(out, null, 2) + '\n')
console.log(
  `catalog: ${out.length} tokens — ${out.filter((e) => e.issuer === 'PreStocks').length} PreStocks ` +
    `(${out.filter((e) => e.unlisted).length} not in the issuer's own list), ` +
    `${out.filter((e) => e.issuer === 'Backed').length} Backed`,
)
