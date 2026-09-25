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
  {#if f > 0}
    <div class="line">
      <span>Toll on the way in</span><span class="leader"></span>
      <span class="fig mid">−{money(100 * f)}</span>
    </div>
  {/if}
  {#if premium !== null}
    <div class="line">
      <span>Where it trades against the reference <span class="data muted">({signedPct(premium)})</span></span>
      <span class="leader"></span>
      <span class="fig mid">{signedAmount(afterIn * premium)}</span>
    </div>
  {/if}
  {#if f > 0}
    <div class="line">
      <span>Toll on the way out</span><span class="leader"></span>
      <span class="fig mid">−{money(beforeOut * f)}</span>
    </div>
  {:else}
    <div class="line">
      <span>Toll, both ways</span><span class="leader"></span>
      <span class="fig mid">none. This issuer charges no transfer fee</span>
    </div>
  {/if}
  <div class="line total">
    <span>What comes back</span><span class="leader"></span>
    <span class="fig" class:unmarked={f === 0}>{money(result)}</span>
  </div>
</div>
<!-- CT-11: the figure above is a real read, and this is the rule that turns it into
     the figure. A page that shows its arithmetic is checkable; one that only shows a
     result asks to be believed. -->
<p class="rule-line data">
  <span class="muted">back</span> = 100
  <span class="muted">&times;</span> (1 {premium !== null && premium < 0 ? '\u2212' : '+'}
  {Math.abs((premium ?? 0) * 100).toFixed(2)}%)
  <span class="muted">&times;</span> (1 &minus; {(f * 100).toFixed(2)}%)<sup>2</sup>
  <span class="muted">&nbsp;&nbsp;the toll is taken on the way in and again on the way out</span>
</p>

{#if premium === null}
  <p class="prose" style="margin-top:16px">
    Nothing independent prices the share behind this token, so the lines above are the toll
    alone and not a full round trip. Nothing here borrows another token's price.
  </p>
{/if}

<style>
  /* The one brand colour marks a toll that is actually charged. Nothing to
     charge means nothing to mark. */
  .ledger .total .fig.unmarked { color:var(--ink); }

  /* Set as the arithmetic it is, not as prose about the arithmetic. */
  .rule-line {
    margin-top:16px; padding-top:12px;
    border-top:var(--hairline) solid var(--rule);
    color:var(--ink); line-height:1.8;
  }
  .rule-line sup { font-size:.72em; }
</style>
