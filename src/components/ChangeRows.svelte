<script lang="ts">
  import { dateOf, explorerTx } from '../lib/fmt.js'
  import type { RecordedChange } from '../lib/record.js'
  import { link } from '../lib/router.svelte.js'

  let { changes, showToken = true }: { changes: RecordedChange[]; showToken?: boolean } = $props()
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
        <div class="held">{change.label}</div>
        <div class="prose" style="color:var(--ink)">{change.detail}</div>
      </div>
      <div class="data muted row-sig">
        <a href={explorerTx(change.signature)} rel="noreferrer">{change.signature.slice(0, 8)}…</a>
      </div>
    </div>
  {/each}
</div>
