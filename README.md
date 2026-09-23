<div align="center">

# Toll

![tokens read](https://img.shields.io/badge/tokens%20read-265-3fb950)
![record](https://img.shields.io/badge/dated%20changes-612-121212)
![pyth](https://img.shields.io/badge/pyth%20feeds%20with%20a%20price%20on%20Solana-64%20of%20252-B4331A)
[![live](https://img.shields.io/badge/live-tollbar.xyz-3fb950)](https://tollbar.xyz)

### Every tokenized stock has a toll and an owner of the switches. Both are on chain.

**Toll reads a tokenized-stock mint on Solana and answers one question: what does this cost to
hold? It names the transfer fee, what a round trip actually leaves you, who can seize or pause
or rewrite your balance, and when any of it last changed. Nine PreStocks mints had their toll
doubled from 0.5% to 1% inside nineteen minutes on 19 September 2026, and Toll rebuilds that
from the chain rather than asserting it.**

**[ Live ↗ ](https://tollbar.xyz)** · **[ Verify it yourself ↗ ](#verify-it-yourself)** · **[ The record ↗ ](https://tollbar.xyz/record)** · **[ Method ↗ ](https://tollbar.xyz/method)**

Built for Stocklana (Solana Foundation). Entering the main track, PreStocks and Pyth.

</div>

---

## The problem

- **The fee is not the price.** A venue quotes you a number. Token-2022's `transferFeeConfig`
  takes its cut inside the transfer, so the quote and the settlement differ, and a round trip
  pays it twice. On a 1% toll that is 1.99% gone before the price moves at all.
- **The terms change without notice, and quietly.** The same nine PreStocks mints were set to
  0.5% on 8 September 2026 and to 1% eleven days later. Both are on chain. Neither was a headline.
- **The switches have owners.** `permanentDelegate` can move your tokens without your signature.
  `pausableConfig` can stop every transfer. `scaledUiAmountConfig` can multiply every balance.
  On the nine PreStocks mints, **one address holds all six of the powers that anybody holds.**
- **A rescaled token prices wrong the obvious way.** SPACEX has a UI multiplier of 5, so asking
  a venue for a quote without dividing it out returns five times too much. Our own first attempt
  did exactly that. It is now pinned by a check.

## What Toll is

A page that reads a mint and shows the answer, with the evidence next to every figure. The loop:

<div align="center">

**`READ THE MINT → PRICE IT BOTH SIDES → NAME THE POWERS → DATE EVERY CHANGE`**

</div>

1. **Read the mint.** One `getAccountInfo`, parsed for every Token-2022 extension. Two fee
   schedules live on a mint at once and switch by epoch, so Toll reads the one in force now.
2. **Price it both sides.** Jupiter for what a venue actually pays, Pyth's on-chain
   `PriceUpdateV2` account for what the share behind it is worth. Never blended.
3. **Name the powers.** Eight authorities, each rendered as what it can do to you, with the
   field it was read from printed underneath.
4. **Date every change.** The record is rebuilt from the issuers' own transaction history.

No wallet. No signing. Toll writes nothing to the chain.

## Verify it yourself

No key, no wallet, no account, no GPU. Every command below was run before it was written here,
on 23 September 2026, and the expected output is copied from that run.

```bash
git clone https://github.com/Yonkoo11/toll && cd toll
npm install

npx tsx scripts/verify-cost.ts   # → PHASE 2 GATE PASSED
npx svelte-check --threshold error   # → 0 ERRORS 0 WARNINGS
npm run build                        # → ✓ built

npm run verify                       # → 22 checks pass, then TapeError: Read 39 of 100
```

The first three pass. **The fourth does not, and that is the honest state of it today**, see
the next section, because the reason is the most interesting thing in this repository.

`verify-cost.ts` proves the cost engine against live mainnet. `npm run verify` proves the mint
reader the same way and then tries to rebuild the 19 September record from the chain. It does
not prove the browser front end; that was checked by rendering it and looking, not by a test.

## The thing that fails, and why it is left failing

```
(a) SPACEX, a PreStocks token that charges a toll      12 PASS
(b) AAPLx, a Backed token that charges no toll         10 PASS
(c) the change tape: PreStocks doubled the toll
    TapeError: Read 39 of 100 transactions for WV9PJN7XTmTLVwbutCLFxp8TyePee6Xq5mRq6Fti5Wc;
    the record would be incomplete.
```

`getSignaturesForAddress` still lists those transactions. `getTransaction` then answers `null`
for many of them, the free endpoint will not serve details it still indexes.

Until 22 September this check printed green. It was reading 100 signatures, silently discarding
every transaction the endpoint would not serve, and reporting what was left as the complete
record. A week in which the issuer changed nine mints looked identical to a week in which
nothing happened.

**That is the failure this project exists to prevent, and it was in the project.** A null is now
an incomplete read. Stragglers retry with backoff, and if any remain the read throws instead of
returning a shorter answer. The gate is red because the endpoint genuinely cannot serve the data,
which is the truth, and a green gate built on a third of the rows is worth less than a red one.

`public/tape.json`, 612 dated changes, was built when those transactions were reachable and is
unaffected. It is committed for exactly this reason.

## What is committed, and why

Four files ship as data rather than being read live, each because a browser cannot reach the
source. Every one is dated on the page and labelled as a saved copy.

| File | Rows | Why it is not read live |
|---|---|---|
| `public/tape.json` | 612 changes | Rebuilding it needs ~100 transaction reads; the free endpoint refuses most of them |
| `public/pyth-accounts.json` | 64 feeds | Pyth has no derivable address, so a live lookup meant scanning 11,398 accounts per feed |
| `public/marks.json` | 8 marks | `prestocks.com/api/prestocks` sends no CORS headers; a page cannot read it at all |
| `data/catalog.json` | 265 tokens | Built from what the admin addresses have touched, not from any issuer's published list |

## What a browser can actually reach

The engine ran against Node for two days. Three sources that answer Node refuse a page, and all
three were found by rendering the site and looking at it:

| Source | From Node | From a browser page |
|---|---|---|
| `api.mainnet-beta.solana.com` | works | **403 on every request** |
| `prestocks.com/api/prestocks` | works | **no CORS headers, unreadable** |
| `solana-rpc.publicnode.com`, 20 accounts at once | works | **403; 5 at once returns 200** |

Toll carries a keyless endpoint list, remembers which one answered, and prints its name on the
page. Six other public endpoints were tried and are unusable from a browser: ankr, helius demo,
getblock, blockeden, grove, leorpc.

## What's real, and what we deliberately did not claim

| Capability | Status |
|---|---|
| **Reads any Token-2022 mint and names its fee, powers and epoch schedule** | Real. 22 checks against live mainnet on two issuers with opposite behaviour. |
| **Round-trip cost net of the toll** | Real. `verify-cost.ts` passes against mainnet. |
| **265 tokens catalogued** | Measured, not asserted. Built from admin transaction history, which is why it includes XAI, a live mint the issuer's own published list omits. |
| **Only 64 of the 252 Pyth feeds these tokens name have a price account on Solana** | Measured. One scan of 11,398 accounts. |
| **Live rebuild of the change record** | **Currently failing.** The free endpoint serves 39 of 100 transactions. The committed record is complete; the live rebuild is not. |
| **The issuer's mark on pre-IPO names** | Degraded, and labelled as such on the page. A dated saved copy, because the API sends no CORS headers. |
| Price prediction, scoring, risk ratings | Not claimed, anywhere. Toll reports what is on chain and does not tell you what it means for the price. |
| Front-end test suite | Does not exist. The five pages were checked by rendering them at 1440 and 390 in Chromium and Firefox and looking at them. |
| Safari | Untested. No WebKit build here close enough for a result to mean anything. |
| Audited | No. Nothing here has been reviewed by anyone but its author. |

## Project layout

```
src/
  lib/rpc.ts        # keyless JSON-RPC, endpoint list, remembers which answered
  lib/terms.ts      # Token-2022 extension parsing; the epoch-gated fee schedule
  lib/tape.ts       # the change record; throws rather than return a short one
  lib/cost.ts       # round-trip cost, premium, the verdict sentence
  lib/prices.ts     # Jupiter quote, Pyth on-chain read, issuer mark
  lib/base.ts       # every asset and route path, so it works at any mount point
  routes/           # the five pages
  components/       # ledger, toll bar, powers, change rows
scripts/
  verify.ts         # the mint-reader gate, live mainnet
  verify-cost.ts    # the cost-engine gate, live mainnet
  build-tape.ts     # rebuilds public/tape.json
  build-pyth-accounts.ts  # the one-off 11,398-account scan
design/             # the chosen direction, the build brief, the social card
```

## Run it locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # writes dist/ plus 404.html for hosts with no history fallback
npm run tape      # rebuild the change record (needs an endpoint that serves history)
```

## Tech

**Language:** TypeScript · **Front end:** Svelte 5 + Vite, no router or UI dependency ·
**Chain:** Solana mainnet, Token-2022 · **Prices:** Pyth on-chain `PriceUpdateV2`, Jupiter ·
**Site:** [tollbar.xyz](https://tollbar.xyz) · **Keys required:** none, anywhere.

## Licence

MIT. See [LICENSE](LICENSE) and [CONTRIBUTING.md](CONTRIBUTING.md).

Toll stores nothing about you. There is no analytics script, no cookie and no back end: the page
reads public accounts from a public endpoint in your own browser.
