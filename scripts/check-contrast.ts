/**
 * Every text colour against every ground it can sit on, measured.
 *
 * This exists because --ink-3 shipped at 3.47:1 and looked fine to me. WCAG AA
 * wants 4.5:1 for body text; an eye cannot judge that and a script can.
 */
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8')
const token = (name: string): string => {
  const m = css.match(new RegExp(`--${name}: *(#[0-9A-Fa-f]{6})`))
  if (!m) throw new Error(`token --${name} not found in app.css`)
  return m[1]
}

const luminance = (hex: string): number => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const GROUNDS = ['paper', 'paper-2'] as const
// Text tokens that carry words a person has to read.
const INKS = ['ink', 'ink-2', 'ink-3', 'mark'] as const
const FLOOR = 4.5

let failures = 0
console.log('\ncontrast against each ground, WCAG AA floor 4.5:1 for body text\n')
for (const g of GROUNDS) {
  const ground = token(g)
  for (const i of INKS) {
    const r = ratio(token(i), ground)
    const ok = r >= FLOOR
    if (!ok) failures++
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  --${i.padEnd(7)} on --${g.padEnd(7)}  ${r.toFixed(2)}:1`)
  }
}
console.log(
  failures === 0
    ? '\nCONTRAST GATE PASSED\n'
    : `\nCONTRAST GATE FAILED — ${failures} pair(s) below ${FLOOR}:1\n`,
)
process.exit(failures === 0 ? 0 : 1)
