import { writeFileSync, readFileSync } from 'node:fs'
import { Rpc } from '../src/lib/rpc.js'
import { readTerms } from '../src/lib/terms.js'
import { trueCost } from '../src/lib/cost.js'
import { changesForMint } from '../src/lib/tape.js'

const mint = process.argv[2]
const rpc = new Rpc({ timeoutMs: 45_000, attempts: 6 })
const feeds = JSON.parse(readFileSync('data/feeds.json', 'utf8'))
const terms = await readTerms(rpc, mint)
const cost = await trueCost(rpc, terms, feeds[mint] ?? null)
const tape = JSON.parse(readFileSync('public/tape.json', 'utf8'))
const rows = tape.changes.filter((c: any) => c.mint === mint).slice(0, 6)
writeFileSync('/private/tmp/claude-501/-Users-yonko/0b186fbc-1a5a-446a-8e8d-c706f5a9ae62/scratchpad/sample.json',
  JSON.stringify({ terms, cost, rows }, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2))
console.log(cost.verdict)
console.log('powers held:', terms.powers.filter((p) => p.held).map((p) => p.label).join(' | '))
console.log('toll bps', cost.tollBps, 'keeps', cost.keeps, 'premium', cost.premium, 'after', cost.afterRoundTrip)
console.log('tape rows', rows.length, rows.map((r:any)=>r.action).join(','))
