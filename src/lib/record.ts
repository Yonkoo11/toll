/** The committed record: 612 dated changes, built by scripts/build-tape.ts. */

import { asset } from './base.js'

export interface RecordedChange {
  signature: string
  blockTime: number
  mint: string
  action: string
  label: string
  detail: string
  unmapped: boolean
  signer: string
  symbol: string | null
}

export interface Tape {
  builtAt: number
  endpoint: string
  tokens: number
  authorities: string[]
  changes: RecordedChange[]
}

let cached: Promise<Tape> | null = null

export function loadTape(): Promise<Tape> {
  cached ??= fetch(asset('tape.json')).then((r) => {
    if (!r.ok) throw new Error(`The record could not be loaded (${r.status}).`)
    return r.json() as Promise<Tape>
  })
  return cached
}
