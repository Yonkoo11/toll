<script lang="ts">
  import { money, signedPct } from '../lib/fmt.js'

  const signedAmount = (x: number) => (x >= 0 ? '+' : '\u2212') + money(Math.abs(x))
  import type { TrueCost } from '../lib/cost.js'

  let { cost }: { cost: TrueCost } = $props()

  /* Derived from the engine's own keeps, so the lines always sum to its result.
     A per-transfer cap can make keeps differ from (1 - bps)^2; this reverses
     whatever the engine actually measured rather than assuming the simple case. */
  const f = $derived(1 - Math.sqrt(Math.max(0, cost.keeps)))
  const afterIn = $derived(100 * (1 - f))
  const premium = $derived(cost.premium)
  const beforeOut = $derived(afterIn * (1 + (premium ?? 0)))
  const result = $derived(beforeOut * (1 - f))
</script>

<div class="ledger">
  <div class="line">
    <span>Put in</span><span class="leader"></span><span class="fig mid">{money(100)}</span>
  </div>
  <div class="line">
    <span>Toll on the way in</span><span class="leader"></span>
    <span class="fig mid">−{money(100 * f)}</span>
  </div>
  {#if premium !== null}
    <div class="line">
      <span>Where it trades against the reference <span class="data muted">({signedPct(premium)})</span></span>
      <span class="leader"></span>
      <span class="fig mid">{signedAmount(afterIn * premium)}</span>
    </div>
  {/if}
  <div class="line">
    <span>Toll on the way out</span><span class="leader"></span>
    <span class="fig mid">−{money(beforeOut * f)}</span>
  </div>
  <div class="line total">
    <span>What comes back</span><span class="leader"></span>
    <span class="fig">{money(result)}</span>
  </div>
</div>
{#if premium === null}
  <p class="prose" style="margin-top:16px">
    Nothing independent prices the share behind this token, so the lines above are the toll
    alone and not a full round trip. Nothing here borrows another token's price.
  </p>
{/if}
