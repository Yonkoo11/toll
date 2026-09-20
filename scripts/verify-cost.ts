/**
 * The Phase 2 gate: the true cost, net of the toll, with every input traceable.
 * Prices move, so this asserts the arithmetic and the sourcing, never a frozen
 * number. Run it yourself:  npx tsx scripts/verify-cost.ts
 */
import { readFileSync } from 'node:fs'
import { Rpc } from '../src/lib/rpc.js'
import { readTerms } from '../src/lib/terms.js'
import { trueCost } from '../src/lib/cost.js'
import { rawUnitsPerToken } from '../src/lib/prices.js'
import type { Feeds } from '../src/lib/cost.js'

const ANDURIL = 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB'
const SPACEX = 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh'
const AAPLX = 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp'

const feeds: Record<string, Feeds> = JSON.parse(readFileSync('data/feeds.json', 'utf8'))
const rpc = new Rpc({ timeoutMs: 45_000, attempts: 8 })
let failures = 0

function check(name: string, actual: unknown, expected: unknown) {
  const show = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? `${x}n` : x))
  const ok = show(actual) === show(expected)
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n          expected ${show(expected)}\n          got      ${show(actual)}`}`)
}
const stamp = (t: number) => new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 19)

console.log('\nTOLL — Phase 2 gate: the true cost\n')

// -------------------------------------------------- the multiplier trap
console.log('(a) one token means one token, whatever the mint stores')
{
  const spacex = await readTerms(rpc, SPACEX)
  const anduril = await readTerms(rpc, ANDURIL)
  check('SPACEX balances are multiplied by 5', spacex.multiplier?.value, 5)
  check('so one SPACEX token is a fifth of a raw unit', rawUnitsPerToken(spacex), 200_000_000n)
  check('ANDURIL is not rescaled', anduril.multiplier?.value, 1)
  check('so one ANDURIL token is a whole raw unit', rawUnitsPerToken(anduril), 1_000_000_000n)
  console.log('      Quoting in raw units without this is off by the multiplier — 5x on SPACEX.')
}

// -------------------------------------------------- the premium that is a loss
console.log('\n(b) ANDURIL: a premium is not a profit once the toll is counted')
{
  const terms = await readTerms(rpc, ANDURIL)
  const cost = await trueCost(rpc, terms, feeds[ANDURIL] ?? null)

  check('the toll is 1%', cost.tollBps, 100)
  check('a round trip keeps 98.01%', Number(cost.keeps.toFixed(4)), 0.9801)
  check('a venue is quoting it', cost.market !== null, true)
  check('there is a reference price for the share', cost.reference !== null, true)
  check('a premium is computed', cost.premium !== null, true)
  check('every input names its source', cost.inputs.every((i) => i.source.length > 0), true)
  check('every input carries a time', cost.inputs.every((i) => i.at > 0), true)

  // The arithmetic that is the whole point, asserted rather than assumed.
  const expected = (1 + cost.premium!) * cost.keeps - 1
  check('after the round trip = (1 + premium) x what it keeps', Number(cost.afterRoundTrip!.toFixed(10)), Number(expected.toFixed(10)))
  check('the toll makes it worse than the raw premium', cost.afterRoundTrip! < cost.premium!, true)
  check(
    'a premium smaller than the round trip is a loss',
    cost.premium! < 0.0199 ? cost.afterRoundTrip! < 0 : true,
    true,
  )

  console.log(`\n      ${cost.verdict}`)
  for (const i of cost.inputs) console.log(`        ${i.value.toFixed(4)}  ${i.label} — ${i.source}, ${stamp(i.at)}`)
}

// -------------------------------------------------- the three Pyth feeds
console.log('\n(c) AAPLx: all three Pyth feeds, each with its publish time')
{
  const terms = await readTerms(rpc, AAPLX)
  const feed = feeds[AAPLX]
  check('Pyth publishes a feed for the share', Boolean(feed?.equity), true)
  check('Pyth publishes a feed for the token', Boolean(feed?.token), true)
  check('Pyth publishes a redemption-rate feed', Boolean(feed?.redemptionRate), true)

  const cost = await trueCost(rpc, terms, feed)
  check('the share price reads off Solana', cost.reference !== null, true)
  check("Pyth's token price reads off Solana", cost.tokenFeed !== null, true)
  check('the redemption rate reads off Solana', cost.redemptionRate !== null, true)
  check('all three carry a publish time', [cost.reference, cost.tokenFeed, cost.redemptionRate].every((q) => (q?.at ?? 0) > 0), true)
  check('all three say how old they are', [cost.reference, cost.tokenFeed, cost.redemptionRate].every((q) => Boolean(q?.note)), true)
  check('AAPLx charges no toll, so a round trip keeps everything', cost.keeps, 1)

  console.log(`\n      ${cost.verdict}`)
  for (const i of cost.inputs) console.log(`        ${i.value.toFixed(4)}  ${i.label}\n          ${i.source}, ${stamp(i.at)} — ${i.note ?? ''}`)
}

console.log(`\n${failures === 0 ? 'PHASE 2 GATE PASSED' : `PHASE 2 GATE FAILED — ${failures} check(s) failed`}\n`)
process.exit(failures === 0 ? 0 : 1)
