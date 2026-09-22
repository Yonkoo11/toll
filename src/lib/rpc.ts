// Minimal Solana JSON-RPC client. No key, no wallet, no writes.
// Runs unchanged in the browser and in Node 20+ (both have fetch).

export const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com'

/**
 * Measured 2026-09-22: api.mainnet-beta.solana.com answers 403 to a request made
 * from a browser page, while serving the same call fine from Node. The fallback
 * below is keyless, sends CORS headers and answered the same getAccountInfo.
 * Whichever endpoint actually served the answer is named on the page.
 */
export const FALLBACK_RPCS = [
  'https://solana-rpc.publicnode.com',
  'https://solana.api.onfinality.io/public',
]

export class RpcError extends Error {
  constructor(message: string, readonly kind: 'timeout' | 'network' | 'rpc') {
    super(message)
    this.name = 'RpcError'
  }
}

export interface RpcOptions {
  /** Tried in order; the one that answers is remembered and tried first next time. */
  endpoint?: string | string[]
  /** Per-attempt timeout. The public endpoint is slow under load. */
  timeoutMs?: number
  /** Attempts per call. The public endpoint rate-limits with HTTP 429. */
  attempts?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * A courtesy gap between requests to the free endpoints, enforced here rather than
 * left to every caller. It is not a measured limit: the refusals seen on 2026-09-22
 * turned out to be a cap on how many accounts one read may ask for, not a rate.
 */
const MIN_GAP_MS = 250

export class Rpc {
  readonly endpoints: string[]
  /** The endpoint that last served an answer. Null until one has. */
  answered: string | null = null
  private readonly timeoutMs: number
  private readonly attempts: number
  private id = 0
  /** One shared queue, so parallel callers still leave a gap between requests. */
  private queue: Promise<unknown> = Promise.resolve()

  private paced<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn)
    this.queue = run.then(() => sleep(MIN_GAP_MS), () => sleep(MIN_GAP_MS))
    return run
  }

  constructor(opts: RpcOptions = {}) {
    const given = opts.endpoint ?? [DEFAULT_RPC, ...FALLBACK_RPCS]
    this.endpoints = typeof given === 'string' ? [given] : given
    this.timeoutMs = opts.timeoutMs ?? 20_000
    this.attempts = opts.attempts ?? 5
  }

  /** What to name as the source of an answer. */
  get endpoint(): string {
    return this.answered ?? this.endpoints[0]
  }

  async call<T>(method: string, params: unknown[]): Promise<T> {
    let last: RpcError | null = null

    for (let round = 0; round < this.attempts; round++) {
      if (round > 0) await sleep(600 * 2 ** (round - 1))

      // Start from whatever answered last, so a refused endpoint is paid for once.
      const order = this.answered
        ? [this.answered, ...this.endpoints.filter((e) => e !== this.answered)]
        : this.endpoints

      for (const endpoint of order) {
        try {
          const result = await this.paced(() => this.callOne<T>(endpoint, method, params))
          this.answered = endpoint
          return result
        } catch (err) {
          const error = err instanceof RpcError ? err : new RpcError(String(err), 'network')
          if (error.kind === 'rpc') throw error // a real answer: another endpoint will say the same
          last = error
        }
      }
    }
    throw last ?? new RpcError('could not reach the Solana endpoint', 'network')
  }

  private async callOne<T>(endpoint: string, method: string, params: unknown[]): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: ++this.id, method, params }),
        signal: controller.signal,
      })
      // 403 and 429 both mean "not now" on the free endpoints: rotate, then retry.
      if (!res.ok) throw new RpcError(`${endpoint} answered ${res.status}`, 'network')
      const body = (await res.json()) as { result?: T; error?: { message: string } }
      if (body.error) throw new RpcError(body.error.message, 'rpc')
      return body.result as T
    } catch (err) {
      if (err instanceof RpcError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new RpcError('the Solana endpoint did not answer in time', 'timeout')
      }
      throw new RpcError('could not reach the Solana endpoint', 'network')
    } finally {
      clearTimeout(timer)
    }
  }

  getAccountInfo<T>(address: string): Promise<{ value: T | null }> {
    return this.call('getAccountInfo', [address, { encoding: 'jsonParsed' }])
  }

  getMultipleAccounts<T>(addresses: string[]): Promise<{ value: (T | null)[] }> {
    return this.call('getMultipleAccounts', [addresses, { encoding: 'jsonParsed' }])
  }

  getEpoch(): Promise<{ epoch: number; absoluteSlot: number }> {
    return this.call('getEpochInfo', [])
  }

  getTokenSupply(mint: string): Promise<{ value: { amount: string; decimals: number; uiAmountString: string } }> {
    return this.call('getTokenSupply', [mint])
  }

  getSignatures(address: string, limit = 100, before?: string): Promise<SignatureRow[]> {
    const cfg: Record<string, unknown> = { limit }
    if (before) cfg.before = before
    return this.call('getSignaturesForAddress', [address, cfg])
  }

  getTransaction(signature: string): Promise<ParsedTransaction | null> {
    return this.call('getTransaction', [
      signature,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
    ])
  }
}

export interface SignatureRow {
  signature: string
  blockTime: number | null
  err: unknown | null
}

export interface ParsedInstruction {
  programId?: string
  parsed?: { type?: string; info?: Record<string, unknown> }
}

export interface ParsedTransaction {
  blockTime: number | null
  slot: number
  transaction: { message: { instructions: ParsedInstruction[] } }
  meta: { err: unknown | null; innerInstructions?: { instructions: ParsedInstruction[] }[] } | null
}

/** Every instruction in a transaction, outer and inner, in one flat list. */
export function allInstructions(tx: ParsedTransaction): ParsedInstruction[] {
  const out = [...tx.transaction.message.instructions]
  for (const inner of tx.meta?.innerInstructions ?? []) out.push(...inner.instructions)
  return out
}

/** Run jobs with a small concurrency cap so the public endpoint does not throttle us. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}
