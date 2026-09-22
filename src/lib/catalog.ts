/** The 265 tokenized stocks this project has read, and the Pyth feeds behind them. */

import catalogData from '../../data/catalog.json'
import feedsData from '../../data/feeds.json'
import type { Feeds } from './cost.js'

export interface CatalogEntry {
  symbol: string
  name: string
  mint: string
  issuer: string
  unlisted: boolean
}

export const catalog = catalogData as CatalogEntry[]
export const feeds = feedsData as Record<string, Feeds>

const byMint = new Map(catalog.map((t) => [t.mint, t]))
const bySymbol = new Map(catalog.map((t) => [t.symbol.toUpperCase(), t]))

export const entryFor = (mint: string) => byMint.get(mint) ?? null
export const feedFor = (mint: string) => feeds[mint] ?? null
export const unlistedCount = catalog.filter((t) => t.unlisted).length

/** Accepts a mint address or a symbol, so a reader can type what they know. */
export function resolve(input: string): string | null {
  const q = input.trim()
  if (!q) return null
  if (byMint.has(q)) return q
  return bySymbol.get(q.toUpperCase())?.mint ?? (q.length >= 32 ? q : null)
}

/** The token the front page opens on: a real one, with a real live answer. */
export const OPENING_MINT = 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB'
