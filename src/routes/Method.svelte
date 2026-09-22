<script lang="ts">
  import { link } from '../lib/router.svelte.js'
  import { catalog } from '../lib/catalog.js'
  import { TOKEN_2022 } from '../lib/terms.js'

  const steps = [
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
      body: `Pyth's price accounts are read directly off Solana rather than through its HTTP
        service, which now requires an account. Each price carries the time it was published, and
        that age is shown next to it. A price older than a week is marked. Where no feed exists,
        the page says so and falls back to the issuer's own published mark, labelled as the
        issuer's number and never as an independent price.`,
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
  ]
</script>

<section class="stack" style="padding-top:20px">
  <h1 class="title">How each number is read</h1>
  <p class="prose">
    Nothing on this site is stored as an answer. Every figure on a token's page is read from
    Solana when you open it, from the public endpoint, with no key. The only committed file is
    the record, because a dated history has to be built once and then not change.
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
</section>
