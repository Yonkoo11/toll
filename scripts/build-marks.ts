/**
 * PreStocks' API sends no CORS headers, so a browser cannot read it (measured
 * 2026-09-22: TypeError, request blocked before any response). This takes a dated
 * snapshot the page can fall back to. The snapshot carries the time it was taken,
 * and the page shows that age rather than presenting it as a live number.
 */
import { writeFileSync } from 'node:fs'

const res = await fetch('https://prestocks.com/api/prestocks')
if (!res.ok) throw new Error(`PreStocks answered ${res.status}`)
const list = (await res.json()) as { symbol: string; markPrice: number }[]

const marks: Record<string, number> = {}
for (const row of list) if (row.symbol && Number.isFinite(Number(row.markPrice))) marks[row.symbol] = Number(row.markPrice)

const fetchedAt = Math.floor(Date.now() / 1000)
writeFileSync('public/marks.json', JSON.stringify({ fetchedAt, source: 'https://prestocks.com/api/prestocks', marks }, null, 1))
console.log(`${Object.keys(marks).length} marks, fetched at ${new Date(fetchedAt * 1000).toISOString()}`)
