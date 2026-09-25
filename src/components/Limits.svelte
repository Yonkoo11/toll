<script lang="ts">
  import { asset } from '../lib/base.js'
  import { feeds as feedTable } from '../lib/catalog.js'
  import { link } from '../lib/router.svelte.js'

  /**
   * The limits, set in the same typography as everything else on the page.
   *
   * Toll's whole argument is that it will not show a figure it cannot stand behind.
   * Until now that argument lived in muted 12.5px mono on a page most people never
   * open. A page that names its own ceiling earns the numbers above it; a page with
   * no stated limits reads as marketing and every figure on it gets discounted.
   *
   * The counts are read from the same files the rest of the page reads, so this
   * section cannot drift from what is true the way a hand-written disclaimer does.
   */
  let feeds = $state<number | null>(null)
  let indexed = $state<number | null>(null)

  fetch(asset('pyth-accounts.json'))
    .then((r) => r.json())
    .then((idx: { accounts: Record<string, string[]> }) => {
      indexed = Object.keys(idx.accounts).length
    })
    .catch(() => {})

  // Distinct feed ids named across the catalogue. A constant, so it is counted once.
  const named = new Set<string>()
  for (const f of Object.values(feedTable)) {
    for (const v of Object.values(f)) {
      if (typeof v === 'string' && v.length === 64) named.add(v)
    }
  }
  feeds = named.size
</script>

<div>
  <div class="row">
    <div class="row-key"><div>The record is a saved copy</div></div>
    <div class="row-body">
      <div class="prose" style="color:var(--ink)">
        Rebuilding it live from the chain currently fails. The free public endpoint lists
        transactions it will not then serve, and Toll refuses to return a record it knows is
        short. The committed copy is complete and carries the date it was built.
      </div>
    </div>
  </div>

  <div class="row">
    <div class="row-key"><div>The issuer's mark is the issuer's number</div></div>
    <div class="row-body">
      <div class="prose" style="color:var(--ink)">
        For a token with no public share behind it, the only reference is the price its own
        issuer publishes. That is not an independent valuation, and every figure drawn from it
        says so and shows when it was taken.
      </div>
    </div>
  </div>

  <div class="row">
    <div class="row-key">
      <div>Most price feeds are not on Solana</div>
    </div>
    <div class="row-body">
      <div class="prose" style="color:var(--ink)">
        {#if indexed !== null && feeds !== null}
          Of the {feeds} feeds these tokens name, {indexed} have a price account on Solana at
          all.
        {:else}
          Most of the feeds these tokens name have no price account on Solana at all.
        {/if}
        Pyth is a pull oracle: a price lands only when somebody pays to post it. A feed with no
        account is shown as absent, never as zero.
      </div>
    </div>
  </div>

  <div class="row">
    <div class="row-key"><div>Nobody has reviewed this</div></div>
    <div class="row-body">
      <div class="prose" style="color:var(--ink)">
        One author, no audit, no second pair of eyes. Every number on this page can be checked
        against the chain yourself, which is the only assurance offered.
        <a href="/method" use:link>How each one is read</a>.
      </div>
    </div>
  </div>
</div>
