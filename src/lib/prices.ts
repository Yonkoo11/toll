// What a token is worth, from sources that need no account, each one carrying
// the time it was published. Nothing here is averaged or blended: a person is
// shown which number came from where, and how old it is.

import { asset } from './base.js'
import { base58Encode, base64Decode } from './base58.js'
import type { Rpc } from './rpc.js'
import type { Terms } from './terms.js'

export const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const PYTH_RECEIVER = 'rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ'

export interface Quoted {
  /** What this number is, in the reader's words. */
  label: string
  /** US dollars for one whole token, counted the way a wallet counts them. */
  value: number
  source: string
  /** When the source published it. */
  at: number
  confidence?: number
  note?: string
}

/**
 * How many raw units make one token as a person counts it.
 *
 * A mint with a scaled-UI multiplier stores a different number than it shows:
 * SPACEX has a multiplier of 5, so one raw unit displays as five tokens.
 * Quoting APIs take raw units, so getting this wrong prices the trade five
 * times over — which is the error this whole project exists to catch.
 */
export function rawUnitsPerToken(terms: Terms): bigint {
  const multiplier = terms.multiplier?.value ?? 1
  const whole = 10 ** terms.decimals
  return BigInt(Math.round(whole / multiplier))
}

/**
 * What a venue would actually pay you for one token right now, after its route
 * and after the issuer's toll is taken out of the transfer. This is an
 * executable number, not an index.
 */
export async function venueQuote(terms: Terms): Promise<Quoted | null> {
  const amount = rawUnitsPerToken(terms)
  if (amount <= 0n) return null

  const url =
    `https://lite-api.jup.ag/swap/v1/quote?inputMint=${terms.mint}&outputMint=${USDC}` +
    `&amount=${amount}&slippageBps=50`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const quote = (await res.json()) as { outAmount?: string; priceImpactPct?: string }
    if (!quote.outAmount) return null

    const impact = Number(quote.priceImpactPct ?? 0)
    return {
      label: 'what a venue pays you for one token now',
      value: Number(quote.outAmount) / 1e6,
      source: 'Jupiter, routed across live pools',
      at: Math.floor(Date.now() / 1000),
      note:
        `includes ${(impact * 100).toFixed(2)}% price impact on this size` +
        (terms.toll ? ` and the issuer's ${terms.toll.bps / 100}% toll on the way out` : ''),
    }
  } catch {
    return null
  }
}

/**
 * The last Pyth price posted on Solana for a feed.
 *
 * Pyth on Solana is a pull oracle: a price only lands on chain when somebody
 * pays to put it there. So this is not a live tape, it is the most recent
 * posting, and its age is part of the answer — for several of these tokens the
 * most recent posting is months old.
 */
interface PythIndex {
  builtAt: number
  accounts: Record<string, string[]>
}

let pythIndex: Promise<PythIndex | null> | null = null

/** The committed address index. Absent in Node, where the live scan is fine. */
function loadPythIndex(): Promise<PythIndex | null> {
  pythIndex ??= fetch(asset('pyth-accounts.json'))
    .then((r) => (r.ok ? (r.json() as Promise<PythIndex>) : null))
    .catch(() => null)
  return pythIndex
}

/** Every PriceUpdateV2 account carrying this feed, cheaply if the index knows it. */
async function pythAccounts(rpc: Rpc, feedId: string): Promise<Uint8Array[]> {
  const known = (await loadPythIndex())?.accounts[feedId]
  if (known?.length) {
    // Measured 2026-09-22: solana-rpc.publicnode.com answers 403 to a
    // getMultipleAccounts of 20 addresses and 200 to one of 5. The index is
    // already sorted newest first, so the first few are the ones that matter.
    const res = await rpc.getMultipleAccounts<{ data: [string, string] }>(known.slice(0, 4))
    const found = (res.value ?? [])
      .filter(Boolean)
      .map((a) => base64Decode(a!.data[0]))
      // The index can go stale. An account that no longer carries this feed is
      // dropped rather than read, and the live scan below answers instead.
      .filter((d) => d.length === 134 && feedIdOf(d) === feedId)
    if (found.length) return found
  }

  const feedBytes = new Uint8Array(feedId.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const accounts = await rpc.call<{ account: { data: [string, string] } }[]>('getProgramAccounts', [
    PYTH_RECEIVER,
    {
      encoding: 'base64',
      filters: [{ dataSize: 134 }, { memcmp: { offset: 41, bytes: base58Encode(feedBytes) } }],
    },
  ])
  return (accounts ?? []).map((a) => base64Decode(a.account.data[0]))
}

const feedIdOf = (data: Uint8Array) =>
  [...data.slice(41, 73)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function pythOnChain(rpc: Rpc, feedId: string, label: string): Promise<Quoted | null> {
  const datas = await pythAccounts(rpc, feedId)
  if (!datas.length) return null

  let best: { price: number; conf: number; at: number } | null = null
  for (const data of datas) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    // PriceUpdateV2: 8 discriminator, 32 write authority, 1 verification level,
    // 32 feed id, then price i64, conf u64, expo i32, publish time i64.
    const price = Number(view.getBigInt64(73, true))
    const conf = Number(view.getBigUint64(81, true))
    const expo = view.getInt32(89, true)
    const at = Number(view.getBigInt64(93, true))
    const scale = 10 ** expo
    if (!best || at > best.at) best = { price: price * scale, conf: conf * scale, at }
  }
  if (!best) return null

  const ageDays = (Date.now() / 1000 - best.at) / 86_400
  return {
    label,
    value: best.price,
    confidence: best.conf,
    source: 'Pyth, read from its account on Solana',
    at: best.at,
    note:
      ageDays < 1
        ? 'posted today'
        : `last posted ${Math.floor(ageDays)} day${Math.floor(ageDays) === 1 ? '' : 's'} ago. Pyth only lands on Solana when somebody pays to post it`,
  }
}

/** The issuer's own published mark for a token with no public share behind it. */
export async function issuerMark(symbol: string): Promise<Quoted | null> {
  if (!symbol) return null
  const live = await liveMark(symbol)
  return live ?? (await snapshotMark(symbol))
}

function quotedMark(symbol: string, value: number, at: number, source: string): Quoted | null {
  if (!Number.isFinite(value) || value <= 0) return null
  return {
    label: `what the issuer says one ${symbol} share is worth`,
    value,
    source,
    at,
    note: "This is the issuer's own number, not an independent price.",
  }
}

async function liveMark(symbol: string): Promise<Quoted | null> {
  try {
    const res = await fetch('https://prestocks.com/api/prestocks')
    if (!res.ok) return null
    const list = (await res.json()) as { symbol: string; markPrice: number }[]
    const row = list.find((t) => t.symbol === symbol)
    if (!row) return null
    return quotedMark(symbol, Number(row.markPrice), Math.floor(Date.now() / 1000), "PreStocks' own published mark")
  } catch {
    // PreStocks sends no CORS headers, so this always throws in a browser.
    return null
  }
}

interface MarkSnapshot {
  fetchedAt: number
  source: string
  marks: Record<string, number>
}

let snapshot: Promise<MarkSnapshot | null> | null = null

/**
 * The declared fallback tier: a dated snapshot of the same published marks,
 * shown with the time it was taken so it is never read as a current price.
 */
async function snapshotMark(symbol: string): Promise<Quoted | null> {
  snapshot ??= fetch(asset('marks.json'))
    .then((r) => (r.ok ? (r.json() as Promise<MarkSnapshot>) : null))
    .catch(() => null)
  const snap = await snapshot
  const value = snap?.marks[symbol]
  if (!snap || value === undefined) return null
  return quotedMark(symbol, value, snap.fetchedAt, "PreStocks' own published mark, from a saved copy")
}
