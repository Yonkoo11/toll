<script lang="ts">
  import { pct } from '../lib/fmt.js'

  /** keeps: what a round trip leaves, as a fraction of what went in. Live, from cost.ts. */
  let { keeps }: { keeps: number } = $props()

  const lost = $derived(Math.max(0, Math.min(1, 1 - keeps)))
  const keptPct = $derived(pct(1 - lost))
  const lostPct = $derived(pct(lost))
</script>

<div
  class="tollbar"
  role="img"
  aria-label="Of every 100 put in, {keptPct} comes back and the toll takes {lostPct}."
>
  <div class="kept"></div>
  <div class="lost" style="width:{lost * 100}%"></div>
</div>
<div class="tollmarks data">
  <span class="mid">{keptPct} comes back</span>
  <span class="held">{lostPct} is the toll</span>
</div>
