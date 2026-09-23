<script lang="ts">
  import { explorerAccount } from '../lib/fmt.js'
  import type { Power } from '../lib/terms.js'

  /**
   * `common` is the address that holds most of these powers, named once above this
   * list. Repeating a 44-character key on every row buries the only thing worth
   * noticing, which is a row that does NOT match it.
   */
  let { powers, common = null }: { powers: Power[]; common?: string | null } = $props()

  /**
   * Four of these can reach into a wallet that never signed anything. Three change
   * the terms or the supply. Colour is spent on the first group only: if every row
   * is marked then the one that can empty your account reads no louder than the one
   * that dilutes it.
   */
  const REACHES_YOUR_BALANCE = new Set(['seize', 'pause', 'freeze', 'rescale'])

  const rank = (p: Power) =>
    !p.held ? 'none' : REACHES_YOUR_BALANCE.has(p.id) ? 'act' : 'econ'

  const rankLabel = (r: string) =>
    r === 'act' ? 'can reach your balance' : r === 'econ' ? 'sets the terms' : 'nobody holds this'
</script>

<div>
  {#each powers as power (power.id)}
    {@const r = rank(power)}
    <div class="row">
      <div class="row-key">
        <div class="sev-{r}">{power.label}</div>
        <span class="sev-rank">{rankLabel(r)}</span>
      </div>
      <div class="row-body">
        <div class="prose" style="color:var(--ink)">{power.detail}</div>
        {#if power.held && power.authority}
          <div class="data muted authority">
            {#if common && power.authority === common}
              <a href={explorerAccount(power.authority)} rel="noreferrer">the same address</a>
            {:else}
              <a href={explorerAccount(power.authority)} rel="noreferrer">{power.authority}</a>
              {#if common}<span class="held">, a different one</span>{/if}
            {/if}
          </div>
        {/if}
        <div class="data muted authority">read from {power.evidence}</div>
      </div>
    </div>
  {/each}
</div>
