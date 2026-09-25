<script lang="ts">
  import { catalog, unlistedCount } from '../lib/catalog.js'
  import { link } from '../lib/router.svelte.js'

  let query = $state('')

  const matched = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.issuer.toLowerCase().includes(q) ||
        t.mint.toLowerCase().includes(q),
    )
  })
</script>

<section class="stack" style="padding-top:20px">
  <h1 class="title">All {catalog.length} tokens</h1>
  <div class="page-body">
  <p class="prose">
    Every tokenized stock this project has read on Solana. {unlistedCount} of them had no venue
    quoting a price when the catalogue was built, which is why a toll on them costs more than
    it looks: there is nowhere to sell without paying it.
  </p>

  <div>
    <input
      bind:value={query}
      placeholder="Filter by symbol, name or issuer"
      aria-label="Filter by symbol, name or issuer"
      spellcheck="false"
      style="max-width:46ch"
    />
    <p class="data muted" style="margin:12px 0 0">{matched.length} of {catalog.length} shown</p>
  </div>

  <table>
    <colgroup>
      <col class="c-symbol" /><col class="c-name" /><col class="c-issuer" /><col class="c-venue" /><col />
    </colgroup>
    <thead>
      <tr><th>Symbol</th><th>Name</th><th>Issuer</th><th>Venue</th><th>Mint</th></tr>
    </thead>
    <tbody>
      {#each matched as token (token.mint)}
        <tr>
          <td><a href="/t/{token.mint}" use:link>{token.symbol}</a></td>
          <td class="mid">{token.name}</td>
          <td class="data muted">{token.issuer}</td>
          <td class="data" class:muted={token.unlisted}>{token.unlisted ? 'unlisted' : 'listed'}</td>
          <td class="data muted" style="word-break:break-all">{token.mint}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  </div>
</section>
