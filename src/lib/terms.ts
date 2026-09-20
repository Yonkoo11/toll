// Read a Token-2022 mint and state, in plain words, what the issuer can do to a holder
// and what moving the token costs. Every field carries the chain evidence it came from.

import { isAddress } from './base58.js'
import type { Rpc } from './rpc.js'

export const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
export const TOKEN_LEGACY = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

/** Errors a person can act on, not stack traces. */
export class TermsError extends Error {
  constructor(message: string, readonly hint: string) {
    super(message)
    this.name = 'TermsError'
  }
}

export interface Power {
  id: 'seize' | 'pause' | 'freeze' | 'rescale' | 'fee' | 'mint' | 'hook' | 'whitelist'
  /** What it does to a holder, in the holder's words. */
  label: string
  held: boolean
  /** The address that holds it, when it is held. */
  authority: string | null
  /** The mint field this was read from — the evidence. */
  evidence: string
  detail: string
}

export interface Toll {
  /** Basis points in force right now. */
  bps: number
  /** The epoch from which the current rate applies. */
  activeEpoch: number
  /** The rate before this one, when the mint still carries it. */
  previousBps: number | null
  previousEpoch: number | null
  /** A rate already written but not yet in force (activeEpoch is in the future). */
  scheduled: { bps: number; epoch: number } | null
  /** u64::MAX means the fee is uncapped. */
  maximumFee: string
  uncapped: boolean
  authority: string | null
  /** Fees collected and held on the mint, in raw units. */
  withheld: string
}

export interface Multiplier {
  /** The multiplier in force right now. */
  value: number
  /** A multiplier written but not yet in force. */
  scheduled: { value: number; effective: number } | null
  authority: string | null
  /** True when the balance a wallet shows is not the raw on-chain number. */
  rescaled: boolean
}

export interface Terms {
  mint: string
  name: string | null
  symbol: string | null
  decimals: number
  /** Raw on-chain supply, before any multiplier. */
  rawSupply: string
  program: 'token-2022' | 'token'
  epoch: number
  toll: Toll | null
  multiplier: Multiplier | null
  powers: Power[]
  paused: boolean
  /** Distinct addresses that hold at least one power over this mint. */
  authorities: string[]
  /**
   * What a buy-then-sell round trip leaves of 1 unit, as a fraction.
   * `exact` is false when the mint caps the fee per transfer, in which case the
   * percentage only holds below that cap and the cap itself is the real answer.
   */
  roundTrip: { costFraction: number; keeps: number; exact: boolean; capPerTransfer: string | null } | null
  readAt: number
}

interface ExtensionState {
  extension: string
  state: Record<string, any>
}

interface MintAccount {
  data?: {
    parsed?: { type?: string; info?: Record<string, any> }
    program?: string
  }
  owner?: string
}

const U64_MAX = '18446744073709551615'

function extensionOf(exts: ExtensionState[], name: string): Record<string, any> | null {
  return exts.find((e) => e.extension === name)?.state ?? null
}

/**
 * Token-2022 keeps two fee schedules and switches between them by epoch.
 * The newer one only applies once the chain reaches its epoch.
 */
function readToll(state: Record<string, any>, epoch: number): Toll {
  const newer = state.newerTransferFee ?? {}
  const older = state.olderTransferFee ?? {}
  const newerLive = epoch >= Number(newer.epoch)

  const active = newerLive ? newer : older
  const previous = newerLive ? older : null
  const scheduled = newerLive ? null : { bps: Number(newer.transferFeeBasisPoints), epoch: Number(newer.epoch) }

  // JSON gives u64::MAX as a float that has already lost its last digits,
  // so compare against the bound rather than against the exact string.
  const rawMax = active.maximumFee ?? U64_MAX
  const uncapped = Number(rawMax) >= 1.8446744073709552e19
  const maximumFee = uncapped ? U64_MAX : String(rawMax)

  return {
    bps: Number(active.transferFeeBasisPoints ?? 0),
    activeEpoch: Number(active.epoch ?? 0),
    previousBps: previous && Number(previous.transferFeeBasisPoints) !== Number(active.transferFeeBasisPoints)
      ? Number(previous.transferFeeBasisPoints)
      : null,
    previousEpoch: previous ? Number(previous.epoch) : null,
    scheduled,
    maximumFee,
    uncapped,
    authority: state.transferFeeConfigAuthority ?? null,
    withheld: String(state.withheldAmount ?? '0'),
  }
}

/**
 * The scaled-UI extension holds a current and a future multiplier. Once the
 * effective timestamp passes, the new one is what every wallet displays.
 */
function readMultiplier(state: Record<string, any>, now: number): Multiplier {
  const current = Number(state.multiplier ?? 1)
  const next = Number(state.newMultiplier ?? current)
  const effective = Number(state.newMultiplierEffectiveTimestamp ?? 0)
  const live = effective > 0 && now >= effective ? next : current

  return {
    value: live,
    scheduled: effective > now ? { value: next, effective } : null,
    authority: state.authority ?? null,
    rescaled: live !== 1,
  }
}

function readPowers(info: Record<string, any>, exts: ExtensionState[]): Power[] {
  const permanentDelegate = extensionOf(exts, 'permanentDelegate')?.delegate ?? null
  const pausable = extensionOf(exts, 'pausableConfig')
  const scaled = extensionOf(exts, 'scaledUiAmountConfig')
  const fee = extensionOf(exts, 'transferFeeConfig')
  const hook = extensionOf(exts, 'transferHook')
  const defaultState = extensionOf(exts, 'defaultAccountState')

  return [
    {
      id: 'seize',
      label: 'Take your tokens',
      held: Boolean(permanentDelegate),
      authority: permanentDelegate,
      evidence: 'permanentDelegate.delegate',
      detail: permanentDelegate
        ? 'This address can move the token out of any wallet without that wallet signing.'
        : 'No address can move the token out of your wallet.',
    },
    {
      id: 'pause',
      label: 'Stop all transfers',
      held: Boolean(pausable?.authority),
      authority: pausable?.authority ?? null,
      evidence: 'pausableConfig.authority',
      detail: pausable?.authority
        ? 'This address can halt every transfer of this token at once, for everyone.'
        : 'Transfers of this token cannot be halted.',
    },
    {
      id: 'freeze',
      label: 'Freeze your account',
      held: Boolean(info.freezeAuthority),
      authority: info.freezeAuthority ?? null,
      evidence: 'freezeAuthority',
      detail: info.freezeAuthority
        ? 'This address can freeze one holder’s account, leaving the rest trading.'
        : 'Individual accounts cannot be frozen.',
    },
    {
      id: 'rescale',
      label: 'Rewrite your balance',
      held: Boolean(scaled?.authority),
      authority: scaled?.authority ?? null,
      evidence: 'scaledUiAmountConfig.authority',
      detail: scaled?.authority
        ? 'This address can multiply every balance at once. Splits use it; nothing limits it to splits.'
        : 'Balances cannot be rescaled.',
    },
    {
      id: 'fee',
      label: 'Change the toll',
      held: Boolean(fee?.transferFeeConfigAuthority),
      authority: fee?.transferFeeConfigAuthority ?? null,
      evidence: 'transferFeeConfig.transferFeeConfigAuthority',
      detail: fee?.transferFeeConfigAuthority
        ? 'This address sets what every transfer costs, and takes effect one epoch later.'
        : 'Transfers of this token carry no issuer fee.',
    },
    {
      id: 'mint',
      label: 'Create more tokens',
      held: Boolean(info.mintAuthority),
      authority: info.mintAuthority ?? null,
      evidence: 'mintAuthority',
      detail: info.mintAuthority
        ? 'This address can issue new supply at any time.'
        : 'The supply is fixed; no more can be created.',
    },
    {
      id: 'whitelist',
      label: 'Decide who may hold it',
      held: defaultState?.accountState === 'frozen',
      authority: info.freezeAuthority ?? null,
      evidence: 'defaultAccountState.accountState',
      detail:
        defaultState?.accountState === 'frozen'
          ? 'New accounts start frozen, so the issuer must approve each holder before they can trade.'
          : 'Anyone can hold this token without asking the issuer.',
    },
    {
      id: 'hook',
      label: 'Run its own code on every transfer',
      held: Boolean(hook?.programId),
      authority: hook?.authority ?? null,
      evidence: 'transferHook.programId',
      detail: hook?.programId
        ? `Every transfer calls the issuer’s program ${hook.programId}, which can block it.`
        : hook
          ? 'A transfer hook slot exists but no program is attached, so nothing runs today. The authority can attach one.'
          : 'No issuer code runs on transfers.',
    },
  ]
}

/** Read the terms of one mint. Throws TermsError with a usable hint on bad input. */
export async function readTerms(rpc: Rpc, address: string, epochHint?: number): Promise<Terms> {
  const mint = address.trim()
  if (!isAddress(mint)) {
    throw new TermsError(
      'That is not a Solana address.',
      'A mint address is 32 bytes written in base58, about 43 characters, no 0, O, I or l.',
    )
  }

  const [{ value: account }, epochInfo] = await Promise.all([
    rpc.getAccountInfo<MintAccount>(mint),
    epochHint !== undefined ? Promise.resolve({ epoch: epochHint }) : rpc.getEpoch(),
  ])

  if (!account) {
    throw new TermsError(
      'Nothing exists at that address on Solana mainnet.',
      'Check for a missing character, or whether the address belongs to another network.',
    )
  }

  const parsed = account.data?.parsed
  if (parsed?.type !== 'mint') {
    const what = parsed?.type ? `a ${parsed.type} account` : 'not a token at all'
    throw new TermsError(
      `That address is ${what}.`,
      'Toll reads mints. A wallet address or a market address will not answer here.',
    )
  }

  const owner = account.owner ?? ''
  const program = owner === TOKEN_2022 ? 'token-2022' : 'token'
  const info = parsed.info ?? {}
  const exts: ExtensionState[] = info.extensions ?? []
  const epoch = epochInfo.epoch
  const now = Math.floor(Date.now() / 1000)

  const feeState = extensionOf(exts, 'transferFeeConfig')
  const scaledState = extensionOf(exts, 'scaledUiAmountConfig')
  const metadata = extensionOf(exts, 'tokenMetadata')
  const pausable = extensionOf(exts, 'pausableConfig')

  const toll = feeState ? readToll(feeState, epoch) : null
  const multiplier = scaledState ? readMultiplier(scaledState, now) : null
  const powers = readPowers(info, exts)

  const authorities = [...new Set(powers.filter((p) => p.held && p.authority).map((p) => p.authority as string))]

  // A round trip pays the toll twice: once buying in, once selling out.
  const rate = toll ? toll.bps / 10_000 : 0
  const keeps = (1 - rate) * (1 - rate)

  return {
    mint,
    name: metadata?.name ?? null,
    symbol: metadata?.symbol ?? null,
    decimals: Number(info.decimals ?? 0),
    rawSupply: String(info.supply ?? '0'),
    program,
    epoch,
    toll,
    multiplier,
    powers,
    paused: pausable?.paused === true,
    authorities,
    roundTrip: toll
      ? {
          costFraction: 1 - keeps,
          keeps,
          exact: toll.uncapped,
          capPerTransfer: toll.uncapped ? null : toll.maximumFee,
        }
      : null,
    readAt: now,
  }
}
