// Minimal Solana JSON-RPC client. No key, no wallet, no writes.
// Runs unchanged in the browser and in Node 20+ (both have fetch).

export const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com'

export class RpcError extends Error {
  constructor(message: string, readonly kind: 'timeout' | 'network' | 'rpc') {
    super(message)
    this.name = 'RpcError'
  }
}

export interface RpcOptions {
  endpoint?: string
  /** Per-attempt timeout. The public endpoint is slow under load. */
  timeoutMs?: number
  /** Attempts per call. The public endpoint rate-limits with HTTP 429. */
  attempts?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class Rpc {
  readonly endpoint: string
  private readonly timeoutMs: number
  private readonly attempts: number
  private id = 0

  constructor(opts: RpcOptions = {}) {
    this.endpoint = opts.endpoint ?? DEFAULT_RPC
    this.timeoutMs = opts.timeoutMs ?? 20_000
    this.attempts = opts.attempts ?? 4
  }

  async call<T>(method: string, params: unknown[]): Promise<T> {
    let last: RpcError | null = null

    for (let attempt = 0; attempt < this.attempts; attempt++) {
      if (attempt > 0) await sleep(600 * 2 ** (attempt - 1))

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: ++this.id, method, params }),
          signal: controller.signal,
        })
        if (res.status === 429) {
          last = new RpcError('the public Solana endpoint is rate-limiting this request', 'network')
          continue
        }
        if (!res.ok) {
          last = new RpcError(`the Solana endpoint answered ${res.status}`, 'network')
          continue
        }
        const body = (await res.json()) as { result?: T; error?: { message: string } }
        if (body.error) throw new RpcError(body.error.message, 'rpc')
        return body.result as T
      } catch (err) {
        if (err instanceof RpcError) {
          if (err.kind === 'rpc') throw err // a real answer: retrying will not change it
          last = err
        } else if (err instanceof Error && err.name === 'AbortError') {
          last = new RpcError('the Solana endpoint did not answer in time', 'timeout')
        } else {
          last = new RpcError('could not reach the Solana endpoint', 'network')
        }
      } finally {
        clearTimeout(timer)
      }
    }
    throw last ?? new RpcError('could not reach the Solana endpoint', 'network')
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
