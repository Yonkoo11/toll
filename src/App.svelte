<script lang="ts">
  import { nav, link } from './lib/router.svelte.js'
  import Verdict from './routes/Verdict.svelte'
  import Record from './routes/Record.svelte'
  import All from './routes/All.svelte'
  import Method from './routes/Method.svelte'
  import { OPENING_MINT } from './lib/catalog.js'

  const mintInPath = $derived(nav.path.startsWith('/t/') ? nav.path.slice(3) : null)
</script>

<div class="rules" aria-hidden="true"><i class="l"></i><i class="r"></i></div>
<div class="texture" aria-hidden="true"></div>

<header class="column masthead">
  <div>
    <a class="wordmark" href="/" use:link data-reveal style="--rv-delay:60ms">Toll</a>
    <span class="data muted" style="margin-left:12px" data-reveal>What a tokenized stock costs to hold, read from the chain.</span>
  </div>
  <nav data-reveal style="--rv-delay:140ms">
    <a href="/all" use:link>All tokens</a>
    <a href="/record" use:link>The record</a>
    <a href="/method" use:link>Method</a>
  </nav>
</header>

<main class="column">
  {#if mintInPath}
    <Verdict mint={mintInPath} />
  {:else if nav.path === '/record'}
    <Record />
  {:else if nav.path === '/all'}
    <All />
  {:else if nav.path === '/method'}
    <Method />
  {:else}
    <Verdict mint={OPENING_MINT} />
  {/if}
</main>

<footer class="column pagefoot">
  <p class="data muted" style="margin:0">Every figure above was read from Solana on request.</p>
  <p class="data muted" style="margin:8px 0 0">
    <a href="/method" use:link>How each number is read</a>
  </p>
</footer>
