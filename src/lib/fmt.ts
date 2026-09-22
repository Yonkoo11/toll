/** Display helpers. Every one of them formats a number it was handed; none invents one. */

/** A real minus sign, not a hyphen: these sit in a column of figures. */
const minus = (s: string) => s.replace('-', '\u2212')

export const pct = (x: number, places = 2) => `${(x * 100).toFixed(places)}%`
export const signedPct = (x: number, places = 2) =>
  minus(`${x >= 0 ? '+' : ''}${(x * 100).toFixed(places)}%`)
export const money = (x: number) => x.toFixed(2)

export function dateOf(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function timeOf(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function daysSince(unixSeconds: number): number {
  return Math.floor((Date.now() / 1000 - unixSeconds) / 86400)
}

/** A supply counted the way a wallet counts it. */
export function wholeSupply(raw: string, decimals: number, multiplier = 1): string {
  const whole = Number(BigInt(raw) / BigInt(10 ** decimals)) * multiplier
  return whole.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

export const explorerTx = (signature: string) => `https://solscan.io/tx/${signature}`
export const explorerAccount = (address: string) => `https://solscan.io/account/${address}`
