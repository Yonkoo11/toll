# Access needed before building

Fill this in FIRST, before discovery, idea lock, or any planning document. Every line is
something that lives outside this machine and that only a human can obtain.

Two rules, both enforced by `access-preflight.sh`:

1. An unchecked box means the project is **stopped**, not in progress.
2. **Every line needs a `fallback:`** — what the project does when that thing never arrives.
   A dependency with no fallback is a single point of failure with a human signup queue in
   front of it. That is what killed all 16 previous projects here.

A good fallback is a tier, not an excuse. It runs, it demos, and it says out loud that it is
degraded. Examples that pass:

- `fallback: cached fixture corpus from 2026-09-01, runs offline, UI banner reads "offline corpus"`
- `fallback: deterministic local ranker instead of the LLM, and every output records which one ran`
- `fallback: testnet deployment instead of mainnet, with the mainnet address left unset`

Examples that fail: `fallback: none`, `fallback: skip that feature`, `fallback: ask the user`.

## Accounts and keys

- [x] Solana mainnet RPC — needed for: every verdict (reads the mint account) — how: https://api.mainnet-beta.solana.com — cost: free — eta: none, measured working 2026-09-20 — fallback: the public RPC IS the fallback; a Helius key (already held, used by ~/Projects/redline) is the upgrade for rate limits, and the page states which endpoint answered
- [x] Pyth price data — needed for: the real share price next to the token price — how: https://hermes.pyth.network (keyless HTTP) — cost: free — eta: none — fallback: cached price snapshot committed to the repo, banner reads "prices as of <timestamp>, live feed unreachable"
- [x] PreStocks public API — needed for: mark price vs token price on pre-IPO names — how: https://prestocks.com/api/prestocks — cost: free, no key — eta: none, measured 200 OK / 5802 bytes on 2026-09-20 — fallback: committed snapshot of the same JSON, banner reads "offline catalog"
- [x] hackathons.solana.com account — needed for: filing the entry — how: already registered as alexmustapha11 — cost: free — eta: none — fallback: none needed, account exists

(Pyth Pro is a bounty prize, not a dependency. Nothing in the build needs it.)

## Credits and funding

- [x] None. Every read in this product is keyless and free. No gas is spent: the product writes nothing on chain. — fallback: not applicable, there is nothing to run out of

## Installs and local tooling

- [x] python3 + urllib — present, used for the probes on 2026-09-20 — fallback: none needed
- [x] Node/npm for the site build — present — fallback: the verdict logic is plain Python and runs without a site

## Submission requirements

- [x] Public GitHub repo — how: github.com/Yonkoo11 — cost: free — eta: none — fallback: none needed
- [ ] Live demo URL on day one — how: GitHub Pages under the existing account (same route used by ~/Projects/redline at useredline.xyz) — cost: free — eta: minutes — fallback: the repo link alone satisfies the "at least one link" rule
- [ ] Username set on hackathons.solana.com — the header still reads "Pick a username so teammates can invite you" — how: the Set field on the event page — cost: free — eta: seconds — fallback: none, this is a click

## Eligibility traps

- **PreStocks bounty is exclusive.** "Projects that integrate any non-PreStocks pre-IPO tokens will
  be ineligible for this bounty." Tessera's T-OpenAI / T-Kalshi / T-SpaceX are non-PreStocks pre-IPO
  tokens. Supporting them forfeits $10,000 to win at most $6,000. **Decision: PreStocks only. No
  Tessera mint may appear in the shipped catalog, the demo, the README or the tests.**
  xStocks (AAPLx, NVDAx...) are public equities, not pre-IPO, and are safe.
- One submission per team. Original work. Open-source components fine if disclosed.
- Deadline is 4:00pm ET on 25 September 2026, not midnight.
- Judging runs to 2 October; the site is how winners are contacted, so the account must stay valid.
