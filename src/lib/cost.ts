// The true cost of holding a tokenized stock: what the token fetches, what the
// share behind it is worth, and what is left after the issuer's toll is paid
// both ways. Every number carries where it came from and when.

import { issuerMark, pythOnChain, venueQuote } from './prices.js'
import type { Quoted } from './prices.js'
import type { Rpc } from './rpc.js'
import type { Terms } from './terms.js'

export interface Feeds {
  ticker: string
  equity: string | null
  token: string | null
  redemptionRate: string | null
}

export interface TrueCost {
  mint: string
  symbol: string | null
  /** What one share of the underlying is worth. */
  reference: Quoted | null
  /** What a venue will actually pay for one token now. */
  market: Quoted | null
  /** Pyth's own view of the token's price, where it publishes one. */
  tokenFeed: Quoted | null
  /** Whether the token is still tracking its share. */
  redemptionRate: Quoted | null
  tollBps: number
  /** What a buy-then-sell leaves, as a fraction of what went in. */
  keeps: number
  /** How far the token trades above or below the share, before any toll. */
  premium: number | null
  /**
   * What the same round trip leaves once the toll is paid both ways.
   * Negative means buying and selling back loses money even if nothing moves.
   */
  afterRoundTrip: number | null
  /** One sentence a person can act on. */
  verdict: string
  inputs: Quoted[]
}

const pct = (x: number) => `${(x * 100).toFixed(2)}%`
const signed = (x: number) => `${x >= 0 ? '+' : '\u2212'}${(Math.abs(x) * 100).toFixed(2)}%`

export async function trueCost(rpc: Rpc, terms: Terms, feeds: Feeds | null): Promise<TrueCost> {
  // Read every source in parallel; a source that fails is reported as absent,
  // never quietly replaced by another one.
  // The Pyth reads scan the receiver program, which the free endpoints rate-limit
  // hard when three of them arrive at once. They go one at a time; the HTTP
  // quotes, which hit different hosts, still run alongside them.
  const [market, mark] = await Promise.all([
    venueQuote(terms),
    feeds?.equity ? null : issuerMark(terms.symbol ?? ''),
  ])
  const equity = feeds?.equity
    ? await pythOnChain(rpc, feeds.equity, `what one real ${feeds.ticker} share is worth`)
    : null
  const tokenFeed = feeds?.token
    ? await pythOnChain(rpc, feeds.token, "Pyth's price for the token itself")
    : null
  const redemptionRate = feeds?.redemptionRate
    ? await pythOnChain(rpc, feeds.redemptionRate, 'how many shares one token redeems for')
    : null

  const reference = equity ?? mark
  const tollBps = terms.toll?.bps ?? 0
  const keeps = terms.roundTrip?.keeps ?? 1

  const premium = reference && market && reference.value > 0 ? market.value / reference.value - 1 : null
  const afterRoundTrip = premium === null ? null : (1 + premium) * keeps - 1

  const inputs = [market, reference, tokenFeed, redemptionRate].filter(Boolean) as Quoted[]

  return {
    mint: terms.mint,
    symbol: terms.symbol,
    reference,
    market,
    tokenFeed,
    redemptionRate,
    tollBps,
    keeps,
    premium,
    afterRoundTrip,
    verdict: verdictFor(terms, reference, market, premium, afterRoundTrip, keeps, reference === mark),
    inputs,
  }
}

function verdictFor(
  terms: Terms,
  reference: Quoted | null,
  market: Quoted | null,
  premium: number | null,
  afterRoundTrip: number | null,
  keeps: number,
  referenceIsIssuersOwn: boolean,
): string {
  const name = terms.symbol ?? 'This token'
  const roundTripCost = 1 - keeps
  // Say which number the comparison is against. An issuer's own mark is not an
  // independent share price and must never be described as one.
  const against = referenceIsIssuersOwn ? "the issuer's own mark" : 'the share'

  if (!market) return `No venue is quoting ${name} right now, so there is no price to check the toll against.`
  if (!reference || premium === null) {
    return roundTripCost > 0
      ? `Nothing independent prices the share behind ${name}, so the only certain number is the toll: buying and selling back costs ${pct(roundTripCost)}.`
      : `Nothing independent prices the share behind ${name}. Moving it costs nothing beyond the venue's own spread.`
  }

  if (roundTripCost === 0) {
    return `${name} trades ${signed(premium)} against ${against}. The issuer charges no toll, so that gap is the whole cost.`
  }

  const direction = premium >= 0 ? 'above' : 'below'
  if (afterRoundTrip !== null && afterRoundTrip < 0 && premium >= 0) {
    return `${name} trades ${pct(Math.abs(premium))} ${direction} ${against}, but a round trip costs ${pct(roundTripCost)}. Buying and selling back leaves you ${pct(Math.abs(afterRoundTrip))} down even if the price never moves.`
  }
  return `${name} trades ${pct(Math.abs(premium))} ${direction} ${against}. After the ${terms.toll!.bps / 100}% toll both ways, a round trip leaves you ${signed(afterRoundTrip ?? 0)}.`
}
