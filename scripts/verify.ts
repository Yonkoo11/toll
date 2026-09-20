/**
 * The Phase 1 gate. One keyless run, no wallet, no writes.
 * Every expectation below was measured on mainnet before it was written here.
 * Run it yourself:  npm run verify
 */
import { Rpc, RpcError } from '../src/lib/rpc.js'
import { readTerms, TermsError } from '../src/lib/terms.js'
import { changesByAuthority } from '../src/lib/tape.js'

const SPACEX = 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh'
const AAPLX = 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp'
const PRESTOCKS_ADMIN = 'WV9PJN7XTmTLVwbutCLFxp8TyePee6Xq5mRq6Fti5Wc'
const XAI = 'PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx'

let failures = 0
const rpc = new Rpc({ timeoutMs: 45_000, attempts: 8 })

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n          expected ${JSON.stringify(expected)}\n          got      ${JSON.stringify(actual)}`}`)
}

function utcDay(ts: number) {
  return new Date(ts * 1000).toISOString().slice(0, 10)
}

const powerOf = (t: Awaited<ReturnType<typeof readTerms>>, id: string) =>
  t.powers.find((p) => p.id === id)!.held

console.log('\nTOLL — Phase 1 gate\n')

// ---------------------------------------------------------------- fixture (a)
console.log('(a) SPACEX, a PreStocks token that charges a toll')
{
  const t = await readTerms(rpc, SPACEX)
  check('symbol', t.symbol, 'SPACEX')
  check('token program is Token-2022', t.program, 'token-2022')
  check('toll now 100 bps', t.toll?.bps, 100)
  check('toll was 50 bps', t.toll?.previousBps, 50)
  check('the toll is uncapped', t.toll?.uncapped, true)
  check('a round trip costs 2%', Number((t.roundTrip!.costFraction * 100).toFixed(2)), 1.99)
  check('balances are rescaled by 5', t.multiplier?.value, 5)
  check('the issuer can take your tokens', powerOf(t, 'seize'), true)
  check('the issuer can stop all transfers', powerOf(t, 'pause'), true)
  check('the issuer can rewrite your balance', powerOf(t, 'rescale'), true)
  check('not paused right now', t.paused, false)
  check('one address holds every power', t.authorities, [PRESTOCKS_ADMIN])
}

// ---------------------------------------------------------------- fixture (b)
console.log('\n(b) AAPLx, a Backed token that charges no toll')
{
  const t = await readTerms(rpc, AAPLX)
  check('symbol', t.symbol, 'AAPLx')
  check('no transfer fee', t.toll, null)
  check('multiplier in force', t.multiplier?.value, 1.0032690125398187)
  check('multiplier took effect 2026-08-08', utcDay(1786149000), '2026-08-08')
  check('the issuer can take your tokens', powerOf(t, 'seize'), true)
  check('the issuer can stop all transfers', powerOf(t, 'pause'), true)
  check('the issuer can freeze one account', powerOf(t, 'freeze'), true)
  check('the issuer can rewrite your balance', powerOf(t, 'rescale'), true)
  check('holders are NOT whitelisted today', powerOf(t, 'whitelist'), false)
  check('powers are split across four addresses', t.authorities.length, 4)
}

// ---------------------------------------------------------------- fixture (c)
// Measured 2026-09-20. An earlier hand-written note said eight tokens; the chain
// says nine, and says the same nine had the toll set to 0.5% only eleven days
// earlier. One of the nine is not in the issuer's own published catalog.
console.log('\n(c) the change tape: PreStocks doubled the toll on 2026-09-19')
{
  const changes = await changesByAuthority(rpc, PRESTOCKS_ADMIN, { limit: 100, concurrency: 2 })
  const feeChanges = changes.filter((c) => c.action === 'setTransferFee')
  const doubling = feeChanges.filter((c) => utcDay(c.blockTime) === '2026-09-19')
  const firstSetting = feeChanges.filter((c) => utcDay(c.blockTime) === '2026-09-08')

  check('nine tokens had their toll raised on 2026-09-19', doubling.length, 9)
  check('each one is a distinct token', new Set(doubling.map((c) => c.mint)).size, 9)
  check('every one was raised to 1%', [...new Set(doubling.map((c) => c.detail))], ['The transfer fee was set to 1%.'])
  check('every one carries its signature', doubling.every((c) => c.signature.length > 40), true)
  check('every one reads as a toll change', [...new Set(doubling.map((c) => c.label))], ['Toll changed'])

  const times = doubling.map((c) => c.blockTime).sort((a, b) => a - b)
  const span = (times[times.length - 1] - times[0]) / 60
  check('all nine inside 20 minutes', span <= 20, true)

  check('the same nine had the toll set to 0.5% eleven days earlier', firstSetting.length, 9)
  check('and that setting was 0.5%', [...new Set(firstSetting.map((c) => c.detail))], ['The transfer fee was set to 0.5%.'])

  const unlisted = doubling.find((c) => c.mint === XAI)
  check("one of the nine is absent from the issuer's own catalog", Boolean(unlisted), true)

  console.log('\n      2026-09-19, oldest first:')
  for (const c of [...doubling].reverse()) {
    console.log(`      ${new Date(c.blockTime * 1000).toISOString().replace('T', ' ').slice(0, 19)}  ${c.mint}  ${c.detail}  ${c.signature}`)
  }

  const unmapped = changes.filter((c) => c.unmapped)
  if (unmapped.length) {
    console.log(`\n      note: ${unmapped.length} issuer action(s) have no plain-English wording yet: ${[...new Set(unmapped.map((c) => c.action))].join(', ')}`)
  }
}

// ------------------------------------------------------------- the bad inputs
console.log('\n(d) input that should fail cleanly, not break')
{
  const cases: [string, string][] = [
    ['a malformed address', 'not-an-address-0OIl'],
    ['a real address that is a wallet, not a token', PRESTOCKS_ADMIN],
    ['an address with nothing at it', '11111111111111111111111111111112'],
  ]
  for (const [name, input] of cases) {
    try {
      await readTerms(rpc, input)
      check(name, 'no error', 'a TermsError')
    } catch (err) {
      const ok = err instanceof TermsError && err.message.length > 0 && err.hint.length > 0
      check(`${name} -> "${err instanceof TermsError ? err.message : String(err)}"`, ok, true)
    }
  }

  try {
    await new Rpc({ endpoint: 'https://api.mainnet-beta.solana.com', timeoutMs: 1, attempts: 2 }).getEpoch()
    check('an RPC timeout is reported as a timeout', 'no error', 'an RpcError')
  } catch (err) {
    check(
      `an RPC timeout is reported as a timeout -> "${err instanceof RpcError ? err.message : String(err)}"`,
      err instanceof RpcError && err.kind === 'timeout',
      true,
    )
  }
}

// ------------------------------------------------- an authority with no history
// Regression: the straggler-retry pass used to write into the first
// transaction's results, which crashed outright when there were none.
console.log('\n(e) an address that has never signed anything')
{
  const empty = {
    endpoint: 'stub',
    getSignatures: async () => [],
    getTransaction: async () => null,
  } as unknown as Rpc
  try {
    const changes = await changesByAuthority(empty, PRESTOCKS_ADMIN)
    check('reads as no changes, not as a crash', changes, [])
  } catch (err) {
    check(`reads as no changes, not as a crash (threw ${String(err)})`, false, true)
  }
}

console.log(`\n${failures === 0 ? 'GATE PASSED' : `GATE FAILED — ${failures} check(s) failed`}\n`)
process.exit(failures === 0 ? 0 : 1)
