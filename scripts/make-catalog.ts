/**
 * Rebuild data/catalog.json.
 *
 * The issuers publish lists of their own tokens. Neither list is the chain. On
 * 2026-09-20 the PreStocks API omitted xAI PreStocks, a live mint with real
 * supply whose toll had just been doubled, and Jupiter's verified list showed
 * 20 xStocks while Backed had launched 100 more on 2026-09-18 that were already
 * holding supply. So the catalog starts from the published lists and then adds
 * every mint the issuers' own authority addresses have actually touched.
 *
 * Nothing here is trusted as a fact about a token. It is only a list of
 * addresses to go and read.
 *
 * Run `npm run tape` first: this reuses that record instead of walking the
 * same history twice.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { Rpc, pool } from '../src/lib/rpc.js'
import { readTerms } from '../src/lib/terms.js'
import { changesByAuthority } from '../src/lib/tape.js'

const PRESTOCKS_ADMIN = 'WV9PJN7XTmTLVwbutCLFxp8TyePee6Xq5mRq6Fti5Wc'

/**
 * A token belongs to the issuer that holds power over it, which the mint says
 * outright. Guessing from the symbol would be a heuristic, and this project
 * does not ship heuristics.
 */
const ISSUER_BY_AUTHORITY: Record<string, string> = {
  [PRESTOCKS_ADMIN]: 'PreStocks',
  '5aMNNLQJwAEeoemTEMkv5NVjqKwvvefRYCQ5Z67HFvEq': 'Backed',
  '7pt9tkctJPK7PPNQJ77GKg8ZffSF6QxoMiCFYHxrtaCj': 'Backed',
  'S7vYFFWH6BjJyEsdrPQpqpYTqLTrPRK6KW3VwsJuRaS': 'Backed',
  'JDq14BWvqCRFNu1krb12bcRpbGtJZ1FLEakMw6FdxJNs': 'Backed',
}

export interface CatalogEntry {
  symbol: string
  name: string
  mint: string
  issuer: string
  /** True when the issuer's own public list does not mention this token. */
  unlisted: boolean
}

const rpc = new Rpc({ timeoutMs: 45_000, attempts: 8 })
const listed = new Map<string, { symbol: string; name: string; issuer: string }>()

const prestocks = (await (await fetch('https://prestocks.com/api/prestocks')).json()) as any[]
for (const t of prestocks) {
  listed.set(t.contract_address, { symbol: t.symbol, name: t.name ?? t.symbol, issuer: 'PreStocks' })
}

const jup = (await (await fetch('https://lite-api.jup.ag/tokens/v2/search?query=xStock')).json()) as any[]
for (const t of jup) {
  if (!t.isVerified || !String(t.name ?? '').includes('xStock')) continue
  listed.set(t.id, { symbol: t.symbol, name: t.name, issuer: 'Backed' })
}
console.log(`published lists: ${listed.size} tokens`)

// Every mint the issuers' authorities have touched. Reuse the record if it exists.
const touched = new Set<string>(listed.keys())
if (existsSync('public/tape.json')) {
  const record = JSON.parse(readFileSync('public/tape.json', 'utf8'))
  for (const change of record.changes) touched.add(change.mint)
  console.log(`record adds ${touched.size - listed.size} more mints to look at`)
} else {
  const changes = await changesByAuthority(rpc, PRESTOCKS_ADMIN, { limit: 100, concurrency: 2 })
  for (const change of changes) touched.add(change.mint)
}

// Read every candidate. A mint with no supply is scaffolding, not a token
// anyone holds, and a mint with no symbol cannot be shown to a person.
const candidates = [...touched]
const entries: CatalogEntry[] = []
const unattributed: string[] = []
let skipped = 0

await pool(candidates, 3, async (mint) => {
  try {
    const terms = await readTerms(rpc, mint)
    if (terms.rawSupply === '0' || !terms.symbol) {
      skipped++
      return
    }
    const known = listed.get(mint)
    const issuers = [...new Set(terms.authorities.map((a) => ISSUER_BY_AUTHORITY[a]).filter(Boolean))]
    if (issuers.length === 0) {
      // Nobody we recognise controls it, so we cannot say whose token it is.
      unattributed.push(`${terms.symbol} ${mint}`)
      return
    }
    const issuer = issuers.length === 1 ? issuers[0] : issuers.join(' + ')
    entries.push({
      symbol: terms.symbol,
      name: terms.name ?? terms.symbol,
      mint,
      issuer,
      unlisted: !known,
    })
  } catch {
    skipped++
  }
})

entries.sort((a, b) => a.issuer.localeCompare(b.issuer) || a.symbol.localeCompare(b.symbol))
writeFileSync('data/catalog.json', JSON.stringify(entries, null, 2) + '\n')

const unlisted = entries.filter((e) => e.unlisted)
console.log(
  `\ncatalog: ${entries.length} tokens — ` +
    `${entries.filter((e) => e.issuer === 'PreStocks').length} PreStocks, ` +
    `${entries.filter((e) => e.issuer === 'Backed').length} Backed. ` +
    `${unlisted.length} are absent from their issuer's own published list. ` +
    `${skipped} address(es) skipped as empty or unreadable, ` +
    `${unattributed.length} left out because no known issuer controls them.`,
)
if (unattributed.length) console.log('  unattributed:', unattributed.slice(0, 10).join(', '))
