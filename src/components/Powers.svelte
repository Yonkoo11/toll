<script lang="ts">
  import { explorerAccount } from '../lib/fmt.js'
  import type { Power } from '../lib/terms.js'

  /**
   * `common` is the address that holds most of these powers, named once above
   * this list. Repeating a 44-character key on every row buries the only thing
   * worth noticing, which is a row that does NOT match it.
   */
  let { powers, common = null }: { powers: Power[]; common?: string | null } = $props()
</script>

<div>
  {#each powers as power (power.id)}
    <div class="row">
      <div class="row-key">
        <div class:held={power.held}>{power.label}</div>
        <div class="data muted">{power.held ? 'held' : 'nobody holds this'}</div>
      </div>
      <div class="row-body">
        <div class="prose" style="color:var(--ink)">{power.detail}</div>
        {#if power.held && power.authority}
          <div class="data muted authority">
            {#if common && power.authority === common}
              <a href={explorerAccount(power.authority)} rel="noreferrer">the same address</a>
            {:else}
              <a href={explorerAccount(power.authority)} rel="noreferrer">{power.authority}</a>
              {#if common}<span class="held"> — a different one</span>{/if}
            {/if}
          </div>
        {/if}
        <div class="data muted authority">read from {power.evidence}</div>
      </div>
    </div>
  {/each}
</div>
