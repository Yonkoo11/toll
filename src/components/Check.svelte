<script lang="ts">
  import { resolve } from '../lib/catalog.js'
  import { go, link } from '../lib/router.svelte.js'

  /**
   * The front door. This used to sit at the bottom of the page, on screen 4.1 of a
   * 4.4-screen scroll, which meant somebody arriving to check their own token had to
   * read an essay about a token they did not pick before they could type anything.
   * The page is a tool first and the worked example comes after it.
   */
  let typed = $state('')
  let hint = $state<string | null>(null)

  const EXAMPLES = [
    { symbol: 'SPACEX', mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh', note: 'charges 1%' },
    { symbol: 'XAI', mint: 'PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx', note: 'missing from its own issuer’s list' },
    { symbol: 'AAPLx', mint: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp', note: 'charges nothing' },
  ]

  const found = $derived(resolve(typed))
  $effect(() => {
    if (found) hint = null
  })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    // Read the derived BEFORE clearing the input it derives from. Clearing first made
    // `found` re-evaluate to null inside the template literal below, and every submit
    // navigated to /t/null. The core action of the product, broken by one line order.
    const target = found
    if (target) {
      typed = ''
      hint = null
      go(`/t/${target}`)
    } else {
      hint = typed.trim()
        ? `Nothing here reads as “${typed.trim().slice(0, 24)}”. Paste a mint address, or try a symbol like SPACEX.`
        : 'Paste a mint address, or type a symbol like SPACEX.'
    }
  }
</script>

<section class="check-block">
  <h1 class="check-q">What does yours cost to hold?</h1>
  <form class="check" onsubmit={submit}>
    <input
      class="cut-control check-in"
      bind:value={typed}
      placeholder="Paste a mint address, or type a symbol"
      aria-label="Paste a mint address, or type a symbol"
      spellcheck="false"
      autocapitalize="off"
      autocorrect="off"
    />
    <button type="submit" class="cut-control">Read the mint</button>
  </form>
  <div class="check-row data">
    <span class="muted check-lead">Or try</span>
    {#each EXAMPLES as e}
      <a class="chip" href={`/t/${e.mint}`} use:link>
        <span class="chip-sym">{e.symbol}</span>
        <span class="chip-note">{e.note}</span>
      </a>
    {/each}
  </div>
  {#if hint}<p class="data check-hint">{hint}</p>{/if}
  <p class="data muted check-free">No wallet. No key. Nothing written to the chain.</p>
</section>
