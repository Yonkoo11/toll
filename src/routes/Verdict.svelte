<script lang="ts">
  import { Rpc } from '../lib/rpc.js'
  import { readTerms } from '../lib/terms.js'
  import type { Terms } from '../lib/terms.js'
  import { trueCost } from '../lib/cost.js'
  import type { TrueCost } from '../lib/cost.js'
  import { entryFor, feedFor, resolve } from '../lib/catalog.js'
  import { loadTape } from '../lib/record.js'
  import type { RecordedChange } from '../lib/record.js'
  import { daysSince, timeOf, wholeSupply, explorerAccount } from '../lib/fmt.js'
  import { go, link } from '../lib/router.svelte.js'
  import TollBar from '../components/TollBar.svelte'
  import Ledger from '../components/Ledger.svelte'
  import Powers from '../components/Powers.svelte'
  import ChangeRows from '../components/ChangeRows.svelte'

  let { mint }: { mint: string } = $props()

  const rpc = new Rpc({ timeoutMs: 30_000, attempts: 4 })

  let terms = $state<Terms | null>(null)
  let cost = $state<TrueCost | null>(null)
  let changes = $state<RecordedChange[]>([])
  let failure = $state<string | null>(null)
  let priceFailure = $state<string | null>(null)
  let typed = $state('')
  let servedBy = $state<string | null>(null)

  const entry = $derived(entryFor(mint))
  const heldPowers = $derived(terms ? terms.powers.filter((p) => p.held) : [])
  const heldAuthorities = $derived([...new Set(heldPowers.map((p) => p.authority).filter(Boolean))] as string[])
  const oneAddress = $derived(heldPowers.length > 1 && heldAuthorities.length === 1 ? heldAuthorities[0] : null)
  const reference = $derived(cost?.reference ?? null)
  const referenceAge = $derived(reference ? daysSince(reference.at) : null)

  $effect(() => {
    const target = mint
    terms = null; cost = null; changes = []; failure = null; priceFailure = null

    readTerms(rpc, target)
      .then((t) => {
        if (target !== mint) return
        terms = t
        servedBy = rpc.endpoint
        // A price that will not come back is reported as missing. It must never
        // take the terms down with it: the powers are the more important half.
        return trueCost(rpc, t, feedFor(target))
          .then((c) => { if (target === mint) cost = c })
          .catch((e: unknown) => {
            if (target === mint) priceFailure = e instanceof Error ? e.message : String(e)
          })
      })
      .catch((e: unknown) => { if (target === mint) failure = e instanceof Error ? e.message : String(e) })

    loadTape()
      .then((tape) => { if (target === mint) changes = tape.changes.filter((c) => c.mint === target) })
      .catch(() => {})
  })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    const found = resolve(typed)
    if (found) { typed = ''; go(`/t/${found}`) }
  }
</script>

{#if failure}
  <section class="stack" style="padding-top:52px">
    <h1 class="title">That mint did not read back.</h1>
    <p class="prose">{failure}</p>
    <p class="prose">
      <a href="/all" use:link>The 265 tokens this project has read</a>
    </p>
  </section>
{:else if !terms}
  <section class="stack" style="padding-top:52px">
    <p class="data muted">Reading the mint on Solana…</p>
  </section>
{:else}
  <section class="stack" style="padding-top:20px">
    <div class="split">
      <div>
        <h1 class="display">{terms.symbol ?? 'Unnamed mint'}</h1>
        <p class="sub" style="margin-top:12px">{entry?.name ?? terms.name ?? 'No name on the mint'}{entry ? `, issued by ${entry.issuer}` : ''}</p>
        <div style="margin-top:28px; max-width:46ch">
          <span class="field">Mint address</span>
          <div class="data" style="word-break:break-all; margin-top:8px">
            <a href={explorerAccount(terms.mint)} rel="noreferrer">{terms.mint}</a>
          </div>
        </div>
      </div>
      <div class="meta data muted">
        <div><span class="mid">{terms.program === 'token-2022' ? 'Token-2022' : 'Token'}</span> mint</div>
        <div>epoch {terms.epoch}</div>
        <div>{wholeSupply(terms.rawSupply, terms.decimals, terms.multiplier?.value ?? 1)} in supply</div>
        {#if terms.multiplier && terms.multiplier.value !== 1}
          <div>one unit displays as {terms.multiplier.value.toPrecision(8).replace(/0+$/, '')}</div>
        {/if}
        {#if entry}<div>{entry.unlisted ? 'not listed on any venue we found' : 'listed'}</div>{/if}
        {#if servedBy}<div>read from {new URL(servedBy).host}</div>{/if}
        <div class="status meta-status">
          <span class="beat" aria-hidden="true"></span>
          <span>read {timeOf(terms.readAt)}</span>
        </div>
      </div>
    </div>

    {#if cost}
      <p class="lede">{@html markPercents(cost.verdict)}</p>
      <TollBar keeps={cost.keeps} />
    {:else if priceFailure}
      <p class="prose" style="max-width:62ch">
        The round trip could not be priced: {priceFailure}. The terms below were read and are
        shown as they came back.
      </p>
    {:else}
      <p class="data muted">Pricing the round trip…</p>
    {/if}
  </section>

  {#if cost}
    <section class="section">
      <span class="field">What 100 comes back as</span>
      <div style="margin-top:20px">
        <Ledger {cost} />
      </div>
      {#if reference}
        <p class="data muted footnote">
          Reference: {reference.label} — {reference.source}{#if referenceAge !== null && referenceAge >= 1},
            <span class:held={referenceAge > 7}>posted {referenceAge} days ago</span>{/if}.
          {#if reference.note}{reference.note}{/if}
        </p>
      {/if}
    </section>
  {/if}

  {#if oneAddress}
    <section class="section">
      <span class="field">All {spell(heldPowers.length)} sit at one address</span>
      <div class="panel panel-mark" style="margin-top:20px; max-width:62ch">
        <p class="prose" style="margin:0; color:var(--ink)">
          <code class="data" style="word-break:break-all">{oneAddress}</code> holds every one of
          the {spell(heldPowers.length)} powers that anybody holds over this token. There is no
          second signer between it and your balance.
        </p>
      </div>
    </section>
  {/if}

  <section class="section">
    <span class="field">Who can do what to it</span>
    <div style="margin-top:20px">
      <Powers powers={terms.powers} common={oneAddress} />
    </div>
  </section>

  <section class="section">
    <span class="field">What has changed</span>
    {#if changes.length}
      <div style="margin-top:20px">
        <ChangeRows {changes} showToken={false} />
      </div>
      <p class="data muted" style="margin-top:20px">
        <a href="/record" use:link>All 612 changes across every token</a>
      </p>
    {:else}
      <p class="prose" style="margin-top:20px">
        Nothing in the committed record touches this mint. The record covers every change made
        by the five authorities behind these tokens.
        <a href="/record" use:link>See it</a>.
      </p>
    {/if}
  </section>

  <section class="section">
    <span class="field">Check another token</span>
    <form class="check" onsubmit={submit}>
      <input
        bind:value={typed}
        placeholder="Paste a token address"
        aria-label="Paste a token address"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
      />
      <button type="submit" disabled={!resolve(typed)}>Read the mint</button>
    </form>
  </section>
{/if}

<script lang="ts" module>
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  /** The count is live; the wording is fixed. */
  function spell(n: number): string {
    return WORDS[n] ?? String(n)
  }

  /** Puts the one brand colour on the figures inside the engine's own sentence. */
  function markPercents(sentence: string): string {
    const escaped = sentence.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
    return escaped.replace(/[-+]?\d+(\.\d+)?%/g, (m) => `<em>${m}</em>`)
  }
</script>

<style>
  .check { display:flex; gap:12px; margin-top:20px; max-width:62ch; }
  .check input { flex:1 1 auto; }
  @media (max-width:780px) {
    .check { flex-direction:column; }
    .check button { width:100%; }
  }
</style>
