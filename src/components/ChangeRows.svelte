<script lang="ts">
  import { dateOf, explorerTx } from '../lib/fmt.js'
  import type { RecordedChange } from '../lib/record.js'
  import { link } from '../lib/router.svelte.js'

  let { changes, showToken = true }: { changes: RecordedChange[]; showToken?: boolean } = $props()

  /**
   * Of 612 changes, 20 altered what holding the token costs. Marking all 612 spent
   * the accent on the issuer's routine housekeeping and left the two that matter
   * looking identical to it.
   *
   * Tier 1, marked: the terms you pay changed.
   * Tier 2, plain ink: who can do what to the token changed.
   * Tier 3, muted: the issuer collecting fees it had already charged.
   */
  const COSTS_YOU = new Set(['setTransferFee', 'updateMultiplier'])
  const HOUSEKEEPING = new Set(['withdrawWithheldTokensFromMint'])

  const tone = (action: string) =>
    COSTS_YOU.has(action) ? 'held' : HOUSEKEEPING.has(action) ? 'muted' : 'mid'
</script>

<div>
  {#each changes as change (change.signature + change.action + change.mint)}
    <div class="row row-dotted">
      <div class="data muted row-when">{dateOf(change.blockTime)}</div>
      {#if showToken}
        <div class="row-token">
          <a href="/t/{change.mint}" use:link>{change.symbol ?? 'unnamed mint'}</a>
        </div>
      {/if}
      <div class="row-body">
        <div class={tone(change.action)}>{change.label}</div>
        <div class="prose" style="color:var(--ink)">{change.detail}</div>
      </div>
      <div class="data muted row-sig">
        <a href={explorerTx(change.signature)} rel="noreferrer">{change.signature.slice(0, 8)}…</a>
      </div>
    </div>
  {/each}
</div>
