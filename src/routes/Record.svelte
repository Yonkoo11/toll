<script lang="ts">
  import { loadTape } from '../lib/record.js'
  import type { Tape } from '../lib/record.js'
  import ChangeRows from '../components/ChangeRows.svelte'
  import { dateOf, timeOf, explorerAccount } from '../lib/fmt.js'

  let tape = $state<Tape | null>(null)
  let failure = $state<string | null>(null)
  let query = $state('')
  let shown = $state(120)

  loadTape().then((t) => (tape = t)).catch((e) => (failure = e.message))

  const matched = $derived.by(() => {
    if (!tape) return []
    const q = query.trim().toLowerCase()
    if (!q) return tape.changes
    return tape.changes.filter(
      (c) =>
        (c.symbol ?? '').toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.action.toLowerCase().includes(q) ||
        c.mint.toLowerCase().includes(q),
    )
  })
  const oldest = $derived(tape ? Math.min(...tape.changes.map((c) => c.blockTime)) : 0)
  const newest = $derived(tape ? Math.max(...tape.changes.map((c) => c.blockTime)) : 0)
</script>

<section class="stack" style="padding-top:20px">
  <h1 class="title">The record</h1>
  <div class="page-body">
  {#if failure}
    <p class="prose">{failure}</p>
  {:else if !tape}
    <p class="data muted">Loading the record…</p>
  {:else}
    <p class="prose">
      Every change these {tape.authorities.length} authorities made to the terms of
      {tape.tokens} tokens, in order, with the transaction that made it. Read from
      {tape.endpoint} and committed on {dateOf(tape.builtAt)}; the oldest is
      {dateOf(oldest)}, the newest {dateOf(newest)}.
    </p>

    <div>
      <input
        bind:value={query}
        placeholder="Filter by token, change or mint"
        aria-label="Filter by token, change or mint"
        spellcheck="false"
        style="max-width:46ch"
      />
      <p class="data muted" style="margin:12px 0 0">
        {matched.length} of {tape.changes.length} changes{query.trim() ? ` matching “${query.trim()}”` : ''}
      </p>
    </div>

    <ChangeRows changes={matched.slice(0, shown)} />

    {#if matched.length > shown}
      <button onclick={() => (shown += 240)}>Show more of the record</button>
    {/if}

    <div>
      <span class="field">The authorities behind it</span>
      <div class="data muted" style="margin-top:12px">
        {#each tape.authorities as authority (authority)}
          <div style="word-break:break-all; margin-bottom:8px">
            <a href={explorerAccount(authority)} rel="noreferrer">{authority}</a>
          </div>
        {/each}
      </div>
      <p class="data muted" style="margin-top:20px">Record built {timeOf(tape.builtAt)}.</p>
    </div>
  {/if}
  </div>
</section>
