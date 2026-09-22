/**
 * Pyth is a pull oracle: a price account has no derivable address, so finding one
 * means scanning the receiver program. That scan is too slow and too heavy for the
 * free endpoints a browser can reach (measured 2026-09-22: three of them in a row
 * never finished).
 *
 * This does the scan ONCE for every feed at the same time and writes the index the
 * page reads. The page still verifies the feed id inside each account it opens, so
 * a stale index is detected rather than believed, and falls back to the live scan.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { Rpc, DEFAULT_RPC } from '../src/lib/rpc.js'
import { base58Encode, base64Decode } from '../src/lib/base58.js'

const rpc = new Rpc({ endpoint: DEFAULT_RPC, timeoutMs: 120_000, attempts: 3 })
const PYTH_RECEIVER = 'rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ'

console.log('scanning the Pyth receiver for every PriceUpdateV2 account…')
const accounts = await rpc.call<{ pubkey: string; account: { data: [string, string] } }[]>(
  'getProgramAccounts',
  [PYTH_RECEIVER, { encoding: 'base64', filters: [{ dataSize: 134 }] }],
)
console.log(`${accounts.length} accounts`)

const index: Record<string, { pubkey: string; at: number }[]> = {}
for (const entry of accounts) {
  const data = base64Decode(entry.account.data[0])
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const feedId = [...data.slice(41, 73)].map((b) => b.toString(16).padStart(2, '0')).join('')
  ;(index[feedId] ??= []).push({ pubkey: entry.pubkey, at: Number(view.getBigInt64(93, true)) })
}
// Newest posting first. A feed can have a dozen accounts; only the freshest matter,
// and the free endpoints refuse a multi-account read of more than about five.
for (const list of Object.values(index)) list.sort((a, b) => b.at - a.at)

const wanted = new Set<string>()
const feeds = JSON.parse(readFileSync('data/feeds.json', 'utf8')) as Record<string, Record<string, string | null>>
for (const feed of Object.values(feeds))
  for (const key of ['equity', 'token', 'redemptionRate']) if (feed[key]) wanted.add(feed[key]!)

const kept: Record<string, string[]> = {}
for (const id of wanted) if (index[id]) kept[id] = index[id].slice(0, 4).map((a) => a.pubkey)

writeFileSync(
  'public/pyth-accounts.json',
  JSON.stringify({ builtAt: Math.floor(Date.now() / 1000), program: PYTH_RECEIVER, accounts: kept }, null, 1),
)
console.log(`${Object.keys(kept).length} of ${wanted.size} wanted feeds have a live account on Solana`)
void base58Encode
