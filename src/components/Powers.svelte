<script lang="ts">
  import { explorerAccount } from '../lib/fmt.js'
  import type { Power } from '../lib/terms.js'

  let { powers }: { powers: Power[] } = $props()
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
          <div class="data muted" style="word-break:break-all; margin-top:8px">
            <a href={explorerAccount(power.authority)} rel="noreferrer">{power.authority}</a>
          </div>
        {/if}
        <div class="data muted" style="word-break:break-all">read from {power.evidence}</div>
      </div>
    </div>
  {/each}
</div>
