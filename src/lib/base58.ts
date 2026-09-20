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

const ENCODE_ALPHABET = ALPHABET

/** Encode bytes as base58. Needed to ask an RPC to match raw bytes in an account. */
export function base58Encode(bytes: Uint8Array): string {
  const digits: number[] = [0]
  for (const byte of bytes) {
    let carry = byte
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8
      digits[i] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let out = ''
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += '1'
  for (let i = digits.length - 1; i >= 0; i--) out += ENCODE_ALPHABET[digits[i]]
  return out
}

/** Decode base64 to bytes in both Node and the browser. */
export function base64Decode(input: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(input, 'base64'))
  const binary = atob(input)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}
