# Contributing to Toll

Toll shows what a tokenized stock costs to hold, and every figure on the page is read from
Solana when you ask for it. That constraint is the product, so it shapes what can be merged.

## The three rules

1. **Every figure is a read, with its evidence beside it.** No scores, no heuristics, no
   maintained allowlist, no number that cannot be traced to an account on chain or a named
   public API. If you add a figure, add where it came from and when it was published.

2. **An incomplete read is an error, never a shorter answer.** A record missing rows because
   an endpoint was busy looks exactly like a record where nothing happened. `changesByAuthority`
   throws rather than return a short tape. Do not relax this to make a gate go green, the
   whole point of the project is that it will not show you a partial answer and call it whole.

3. **Say which state a claim is in.** Designed, built, tested and proven are four different
   things. "It compiles" is not "it works". If you have not run it against mainnet, say so in
   the pull request.

## Before you open a pull request

```bash
npm install
npm run verify          # reads mainnet; see the README on what currently passes and what does not
npx tsx scripts/verify-cost.ts
npx svelte-check --threshold error
npm run build
```

`npm run verify` reads live mainnet, so it is slow (two to five minutes) and it can fail for
reasons that are not your change, the free endpoint rate-limits. If it fails, read the message:
a `TapeError` naming how many of how many transactions were read is the endpoint refusing to
serve history, not a bug you introduced.

## Things that will not be merged

- A Tessera mint anywhere in the catalog, demo, tests or documentation. PreStocks' bounty rules
  make a project that integrates non-PreStocks pre-IPO tokens ineligible. This is a hard line.
- A key, an endpoint requiring an account, or anything that makes a reader sign in to check a
  number. Every read in this project is keyless.
- A number presented without its age. Pyth on Solana is a pull oracle: several of these feeds
  were last posted months ago, and showing that as a live price is the exact error Toll exists
  to catch.
- Averaging or blending two sources into one figure. Show both, say which is which.

## Reporting something wrong on the page

Open an issue with the mint address and what you expected. If you believe a figure is wrong,
include the account you read and the value you got, so the disagreement is about data rather
than opinion.
