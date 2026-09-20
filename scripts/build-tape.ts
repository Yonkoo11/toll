/**
 * Build the change record: every switch the issuers have flipped, with the
 * transaction that did it.
 *
 * A browser cannot make hundreds of archive calls against a public endpoint,
 * so the record is built here and served as a file. Every row carries its own
 * signature, so no one has to take this file's word for anything — the point
 * of `verify` is that you can rebuild it yourself.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { Rpc } from '../src/lib/rpc.js'
import { readTerms } from '../src/lib/terms.js'
import { changesByAuthority } from '../src/lib/tape.js'
import type { Change } from '../src/lib/tape.js'

interface CatalogEntry { symbol: string; name: string; mint: string; issuer: string; unlisted: boolean }

const catalog: CatalogEntry[] = JSON.parse(readFileSync('data/catalog.json', 'utf8'))
const rpc = new Rpc({ timeoutMs: 45_000, attempts: 8 })

// Read each token once to learn who holds power over it. Those addresses are
// where terms changes are signed.
const bySymbol = new Map<string, CatalogEntry>(catalog.map((c) => [c.mint, c]))
const authorities = new Map<string, string[]>()

for (const entry of catalog) {
  try {
    const terms = await readTerms(rpc, entry.mint)
    for (const authority of terms.authorities) {
      authorities.set(authority, [...(authorities.get(authority) ?? []), entry.mint])
    }
  } catch (err) {
    console.error(`  could not read ${entry.symbol}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

console.log(`${catalog.length} tokens are controlled by ${authorities.size} addresses`)

const changes: Change[] = []
for (const authority of authorities.keys()) {
  try {
    const found = await changesByAuthority(rpc, authority, { limit: 100, concurrency: 2 })
    changes.push(...found)
    console.log(`  ${authority}  ${found.length} change(s)`)
  } catch (err) {
    console.error(`  ${authority}  FAILED: ${err instanceof Error ? err.message : String(err)}`)
    process.exitCode = 1
  }
}

const seen = new Set<string>()
const rows = changes
  .filter((c) => {
    const key = `${c.signature}:${c.action}:${c.mint}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  .map((c) => ({ ...c, symbol: bySymbol.get(c.mint)?.symbol ?? null }))
  .sort((a, b) => b.blockTime - a.blockTime)

const record = {
  builtAt: Math.floor(Date.now() / 1000),
  endpoint: rpc.endpoint,
  tokens: catalog.length,
  authorities: [...authorities.keys()],
  changes: rows,
}

writeFileSync('public/tape.json', JSON.stringify(record, null, 1) + '\n')
console.log(
  `\nrecord: ${rows.length} changes across ${new Set(rows.map((r) => r.mint)).size} tokens, ` +
    `oldest ${new Date((rows.at(-1)?.blockTime ?? 0) * 1000).toISOString().slice(0, 10)}`,
)
if (process.exitCode === 1) console.error('one or more authorities could not be read; the record is incomplete')
