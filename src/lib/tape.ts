// The change tape: every time an issuer flipped one of its switches, with the
// transaction that did it. Terms changes are signed by the mint's authorities,
// so we read each authority's own history rather than the mint's — an authority
// signs a handful of times a year, a mint is touched thousands of times a day.

import { allInstructions, pool } from './rpc.js'
import { TOKEN_2022 } from './terms.js'
import type { ParsedInstruction, Rpc } from './rpc.js'

export interface Change {
  signature: string
  blockTime: number
  mint: string
  /** The Token-2022 instruction name, as the chain's own parser reports it. */
  action: string
  /** What it did, in the holder's words. */
  label: string
  detail: string
  /** True when we do not have a plain-English mapping for this action yet. */
  unmapped: boolean
  signer: string
}

/** Token-2022 instructions that change what a holder owns or what moving it costs. */
const TERMS_ACTIONS: Record<string, { label: string; detail: (info: Record<string, any>) => string }> = {
  setTransferFee: {
    label: 'Toll changed',
    detail: (i) => `The transfer fee was set to ${Number(i.transferFeeBasisPoints) / 100}%.`,
  },
  updateMultiplier: {
    label: 'Balances rescaled',
    detail: (i) =>
      `Every balance was multiplied by ${i.newMultiplier ?? i.multiplier}, effective ${
        i.newMultiplierEffectiveTimestamp
          ? new Date(Number(i.newMultiplierEffectiveTimestamp) * 1000).toISOString().slice(0, 10)
          : 'immediately'
      }.`,
  },
  updateMultiplierScaledUiAmount: {
    label: 'Balances rescaled',
    detail: (i) => `Every balance was multiplied by ${i.newMultiplier ?? i.multiplier}.`,
  },
  pause: { label: 'Transfers halted', detail: () => 'All transfers of this token were stopped.' },
  resume: { label: 'Transfers resumed', detail: () => 'Transfers of this token were allowed again.' },
  setAuthority: {
    label: 'Control handed over',
    detail: (i) => `The ${i.authorityType ?? 'authority'} was changed to ${i.newAuthority ?? 'nobody'}.`,
  },
  withdrawWithheldTokensFromMint: {
    label: 'Collected tolls taken',
    detail: () => 'The issuer swept the fees withheld on the mint into its own account.',
  },
  updateDefaultAccountState: {
    label: 'Holder rules changed',
    detail: (i) => `New accounts now start ${i.accountState ?? 'unknown'}.`,
  },
  updateTransferHook: {
    label: 'Transfer code changed',
    detail: (i) => `Transfers now call ${i.programId ?? 'no program'}.`,
  },
  initializeTransferFeeConfig: { label: 'Toll created', detail: (i) => `A transfer fee of ${Number(i.transferFeeBasisPoints) / 100}% was attached at launch.` },
  initializePermanentDelegate: { label: 'Seize power created', detail: (i) => `${i.delegate} was made permanent delegate at launch.` },
}

/** Instructions that are ordinary operation, not a change of terms. */
const IGNORED = new Set([
  'transfer', 'transferChecked', 'transferCheckedWithFee', 'mintTo', 'mintToChecked', 'burn',
  'burnChecked', 'closeAccount', 'initializeAccount', 'initializeAccount3', 'createAssociatedTokenAccount',
  'syncNative', 'approve', 'revoke', 'harvestWithheldTokensToMint', 'initializeImmutableOwner',
  'getAccountDataSize', 'initializeMint', 'initializeMint2', 'initializeMintCloseAuthority',
  'initializeMetadataPointer', 'initializeTokenMetadata', 'updateTokenMetadataField',
  'initializeConfidentialTransferMint', 'initializePausableConfig', 'initializeScaledUiAmountMint',
  'initializeDefaultAccountState', 'initializeTransferHook', 'initializeConfidentialTransferFeeConfig',
  'reallocate', 'thawAccount', 'freezeAccount',
])

function mintOf(info: Record<string, any>): string | null {
  return (info.mint as string) ?? (info.account as string) ?? null
}

/**
 * Read one authority's history and return every terms change it signed.
 * `limit` caps how many of its transactions we look at, newest first.
 */
export async function changesByAuthority(
  rpc: Rpc,
  authority: string,
  opts: { limit?: number; concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<Change[]> {
  const limit = opts.limit ?? 100
  const signatures = (await rpc.getSignatures(authority, limit)).filter((s) => !s.err)

  let done = 0
  const unreachable: string[] = []
  const perSignature = await pool(signatures, opts.concurrency ?? 6, async (row) => {
    const out: Change[] = []
    try {
      const tx = await rpc.getTransaction(row.signature)
      if (tx && !tx.meta?.err) {
        for (const ix of allInstructions(tx)) {
          const change = toChange(ix, row.signature, row.blockTime ?? 0, authority)
          if (change) out.push(change)
        }
      }
    } catch (err) {
      unreachable.push(row.signature)
    }
    opts.onProgress?.(++done, signatures.length)
    return out
  })

  // The public endpoint drops a request now and then under load. Give every
  // straggler its own unhurried second pass before calling the read a failure.
  if (unreachable.length > 0) {
    const stragglers = [...unreachable]
    unreachable.length = 0
    for (const signature of stragglers) {
      try {
        const tx = await rpc.getTransaction(signature)
        if (tx && !tx.meta?.err) {
          const row = signatures.find((s) => s.signature === signature)
          for (const ix of allInstructions(tx)) {
            const change = toChange(ix, signature, row?.blockTime ?? 0, authority)
            if (change) perSignature[0].push(change)
          }
        }
      } catch {
        unreachable.push(signature)
      }
    }
  }

  // A tape is a record of everything that happened. A tape missing rows because
  // the endpoint was busy looks identical to a tape where nothing happened, so
  // an incomplete read is an error, never a shorter answer.
  if (unreachable.length > 0) {
    throw new TapeError(
      `Read ${signatures.length - unreachable.length} of ${signatures.length} transactions for ${authority}; the record would be incomplete.`,
      'The public Solana endpoint is rate-limiting. Wait a moment and read again, or point Toll at your own endpoint.',
    )
  }
  return perSignature.flat().sort((a, b) => b.blockTime - a.blockTime)
}

export class TapeError extends Error {
  constructor(message: string, readonly hint: string) {
    super(message)
    this.name = 'TapeError'
  }
}

function toChange(
  ix: ParsedInstruction,
  signature: string,
  blockTime: number,
  signer: string,
): Change | null {
  if (ix.programId !== TOKEN_2022 || !ix.parsed?.type) return null
  const action = ix.parsed.type
  if (IGNORED.has(action)) return null

  const info = ix.parsed.info ?? {}
  const mint = mintOf(info)
  if (!mint) return null

  const known = TERMS_ACTIONS[action]
  return {
    signature,
    blockTime,
    mint,
    action,
    label: known?.label ?? 'Issuer action',
    detail: known?.detail(info) ?? `The issuer called ${action} on this token.`,
    unmapped: !known,
    signer,
  }
}

/** The tape for one mint: every change signed by any address that holds a power over it. */
export async function changesForMint(
  rpc: Rpc,
  mint: string,
  authorities: string[],
  opts: { limit?: number; concurrency?: number } = {},
): Promise<Change[]> {
  const perAuthority = await Promise.all(
    authorities.map((a) => changesByAuthority(rpc, a, opts)),
  )
  const seen = new Set<string>()
  return perAuthority
    .flat()
    .filter((c) => c.mint === mint)
    .filter((c) => {
      const key = `${c.signature}:${c.action}:${c.mint}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.blockTime - a.blockTime)
}
