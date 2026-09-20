const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const MAP = new Map<string, number>([...ALPHABET].map((c, i) => [c, i]))

/** Decode base58 to bytes, or null if the string is not valid base58. */
export function base58Decode(input: string): Uint8Array | null {
  if (input.length === 0) return null
  const bytes: number[] = [0]
  for (const char of input) {
    const value = MAP.get(char)
    if (value === undefined) return null
    let carry = value
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  for (let i = 0; i < input.length && input[i] === '1'; i++) bytes.push(0)
  return new Uint8Array(bytes.reverse())
}

/** A Solana address is exactly 32 bytes written in base58. */
export function isAddress(input: string): boolean {
  const decoded = base58Decode(input.trim())
  return decoded !== null && decoded.length === 32
}
