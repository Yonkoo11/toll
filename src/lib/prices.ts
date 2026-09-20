// What a token is worth, from sources that need no account, each one carrying
// the time it was published. Nothing here is averaged or blended: a person is
// shown which number came from where, and how old it is.

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
export async function pythOnChain(rpc: Rpc, feedId: string, label: string): Promise<Quoted | null> {
  const feedBytes = new Uint8Array(feedId.match(/.{2}/g)!.map((b) => parseInt(b, 16)))

  const accounts = await rpc.call<{ account: { data: [string, string] } }[]>('getProgramAccounts', [
    PYTH_RECEIVER,
    {
      encoding: 'base64',
      filters: [{ dataSize: 134 }, { memcmp: { offset: 41, bytes: base58Encode(feedBytes) } }],
    },
  ])
  if (!accounts?.length) return null

  let best: { price: number; conf: number; at: number } | null = null
  for (const entry of accounts) {
    const data = base64Decode(entry.account.data[0])
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
        : `last posted ${Math.floor(ageDays)} day${Math.floor(ageDays) === 1 ? '' : 's'} ago — Pyth only lands on Solana when somebody pays to post it`,
  }
}

/** The issuer's own published mark for a token with no public share behind it. */
export async function issuerMark(symbol: string): Promise<Quoted | null> {
  try {
    const res = await fetch('https://prestocks.com/api/prestocks')
    if (!res.ok) return null
    const list = (await res.json()) as { symbol: string; markPrice: number }[]
    const row = list.find((t) => t.symbol === symbol)
    if (!row) return null
    return {
      label: 'what the issuer says one share is worth',
      value: Number(row.markPrice),
      source: "PreStocks' own published mark",
      at: Math.floor(Date.now() / 1000),
      note: 'this is the issuer’s own number, not an independent price',
    }
  } catch {
    return null
  }
}
