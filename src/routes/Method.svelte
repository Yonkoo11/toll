<script lang="ts">
  import { asset } from '../lib/base.js'
  import { link } from '../lib/router.svelte.js'
  import { catalog, feeds } from '../lib/catalog.js'
  import { TOKEN_2022 } from '../lib/terms.js'

  let feedCount = $state<number | null>(null)
  let indexedCount = $state<number | null>(null)

  // Stated from the committed index itself, so the sentence cannot drift from it.
  Promise.all([
    fetch(asset('pyth-accounts.json')).then((r) => r.json()),
    Promise.resolve(feeds),
  ])
    .then(([index, feedMap]) => {
      const wanted = new Set<string>()
      for (const feed of Object.values(feedMap))
        for (const key of ['equity', 'token', 'redemptionRate'] as const) {
          const id = feed[key]
          if (id) wanted.add(id)
        }
      feedCount = wanted.size
      indexedCount = [...wanted].filter((id) => index.accounts[id]).length
    })
    .catch(() => {})

  const committed = [
    {
      path: 'public/tape.json',
      why: 'The dated record of every change. A history has to be built once and then not change, and rebuilding it live would mean thousands of transaction reads per visit.',
    },
    {
      path: 'public/pyth-accounts.json',
      why: 'Where each Pyth price account sits. Pyth accounts have no derivable address, so finding one means scanning 11,398 accounts. That scan is done once here; the page still checks the feed id inside every account it opens, and scans live if the index is wrong.',
    },
    {
      path: 'public/marks.json',
      why: "A dated copy of the issuer's own published marks. Their API sends no CORS headers, so a browser cannot read it at all. Every figure taken from this copy is shown with the time it was taken.",
    },
    {
      path: 'data/catalog.json',
      why: 'The list of tokens and the Pyth feeds behind them, built from what the issuing addresses have actually touched on chain rather than from any published list.',
    },
  ]

  const steps = $derived.by(() => [
    {
      label: 'The terms',
      body: `The mint account is fetched with getAccountInfo, jsonParsed, and every Token-2022
        extension on it is read: the transfer fee config, the scaled-UI multiplier, the permanent
        delegate, the pause authority, the default account state, the transfer hook, the freeze
        and mint authorities. Each power on the page names the exact field it came from, so the
        claim can be checked against the same account.`,
      evidence: `program ${TOKEN_2022}`,
    },
    {
      label: 'The toll',
      body: `A transfer fee config carries two rates and the epochs they belong to. The page uses
        the one that is active in the current epoch, not whichever is listed first, and shows a
        scheduled change separately when one is queued. Where the fee has a per-transfer cap, the
        round trip is measured against the cap rather than the rate.`,
      evidence: 'transferFeeConfig.olderTransferFee / newerTransferFee',
    },
    {
      label: 'What a venue pays',
      body: `A live quote is taken for exactly one token, counted the way a wallet counts it. A
        mint with a scaled-UI multiplier stores a different number than it displays, so the amount
        sent to the quote is divided by that multiplier first. Getting this wrong prices the trade
        several times over, which is the error this project exists to catch.`,
      evidence: 'https://lite-api.jup.ag/swap/v1/quote',
    },
    {
      label: 'What the share is worth',
      body: `Pyth's price accounts are read off Solana rather than through its HTTP service,
        which now requires an account. Pyth is a pull oracle, so a price exists on Solana only
        where somebody has paid to post it: of the ${feedCount ?? '\u2026'} feeds these tokens
        name, ${indexedCount ?? '\u2026'} have an account on Solana at all. Every price carries
        the time it was published and that age is shown beside it. Where there is no feed, the
        page says so and falls back to the issuer's own published mark, labelled as the issuer's
        number, never as an independent price.`,
      evidence: 'program rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ',
    },
    {
      label: 'The record',
      body: `Every signature belonging to the authorities behind these tokens is fetched and
        parsed, and each instruction that changed a term is kept with its date, its signer and its
        transaction. Changes made inside a multisig execution are read out of the inner
        instructions, because that is where they actually sit.`,
      evidence: 'scripts/build-tape.ts, committed as public/tape.json',
    },
  ])
</script>

<section class="stack" style="padding-top:20px">
  <h1 class="title">How each number is read</h1>
  <div class="page-body">
  <p class="prose">
    No verdict on this site is stored. The terms, the toll and the powers are read from Solana
    when you open a token's page, from a keyless endpoint, and the page names the one that
    answered. Four files are committed rather than read live, each for a reason given below.
  </p>

  <div>
    {#each steps as step (step.label)}
      <div class="row">
        <div class="row-key">{step.label}</div>
        <div class="row-body">
          <div class="prose" style="color:var(--ink)">{step.body}</div>
          <div class="data muted" style="word-break:break-all; margin-top:8px">{step.evidence}</div>
        </div>
      </div>
    {/each}
  </div>

  <div>
    <span class="field">What is committed, and why</span>
    <div style="margin-top:20px">
      {#each committed as file (file.path)}
        <div class="row">
          <div class="row-key data">{file.path}</div>
          <div class="row-body prose" style="color:var(--ink)">{file.why}</div>
        </div>
      {/each}
    </div>
  </div>

  <div>
    <span class="field">What this does not do</span>
    <div class="prose" style="margin-top:20px">
      <p>
        It does not price a trade you are about to make. The round trip is a worked example on
        100 units at the current quote, not a route you can execute.
      </p>
      <p>
        It does not rate anything. There is no score and no grade. A held power is reported as
        held; whether that is acceptable is yours to decide.
      </p>
      <p>
        It does not cover every tokenized stock in existence, only the {catalog.length} this
        project has read. <a href="/all" use:link>The list is here</a>, including which ones had
        no venue quoting them.
      </p>
    </div>
  </div>
  </div>
</section>
