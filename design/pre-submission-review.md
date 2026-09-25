# Pre-submission review, 2026-09-25

Looked at the live site at tollbar.xyz, ran the gate, read the copy, measured the
geometry. Findings in severity order. Every one carries how it was found.

## 1. HIGH. The corner notch is wider than the toll segment it clips

The toll bar is the signature element and the thing the product is named after.
Its bottom-right corner is cut away by a 34px triangular notch (`--cut-lg`), and
the toll segment lives at `right:0`, directly under that cut.

Measured against the rendered bar (1500px wide at a 1440 viewport):

| toll | segment | notch | |
|---|---|---|---|
| 0.5% | 7.5px | 34px | notch 4.5x wider than the data |
| 1.0% | 15px | 34px | notch 2.3x wider |
| 1.99% | 30px | 34px | notch still wider |
| 5.0% | 75px | 34px | first rate that survives |

On a phone, read live off the page: bar 535px, toll segment **10.6px**, notch 20px.

No tokenized stock charges 5%. So at every rate this product will ever show, the
decoration is eating the measurement. The single most important number on the
page is the least legible mark on it.

Fix: the notch belongs on the outer plate, not on the data. Move the clip to a
wrapper so the bar's right edge stays square, and give the toll segment a floor
width so a real toll is never thinner than a few pixels.

## 2. MEDIUM. A capital letter mid-sentence on any unnamed mint

`src/lib/cost.ts` had one fallback name, `'This token'`, written for
sentence-initial use and then dropped mid-sentence in three places. Paste a mint
with no symbol and the page reads:

> Nothing independent prices the share behind **This token**.

Reproduced on the live site with wrapped SOL. Fixed in source: two forms now,
`name` for sentence start and `named` for inside a sentence. Not yet published.

## 3. MEDIUM. The gate is red, and the submission text quotes a stale number

`npm run verify` exits 1. Twenty-two checks pass, then the change-record rebuild
fails. Today it failed reading 12 of 100 transactions with a rate-limit hint; the
submission draft says 39 of 100, which was a different run. The failure is real
and disclosed on the site, but the figure quoted has to be the one from the run
being cited, or it is a number nobody can reproduce.

## 4. LOW. A third-party verification tag from another submission

`index.html` line 1 carries `<meta name="ory-verify">` for orynth.dev, above
`charset`. It belongs to a different platform and is the first thing in the head.

## 5. LOW. An unknown path shows the front page after a long wait

`/nosuchpage` sits on "Reading the mint on Solana…" for about thirteen seconds,
then renders ANDURIL. No 404. Not broken, but a mistyped link looks hung.

## Not verified

- True 390px phone width. `resize_window` set the outer window; the viewport
  reported 567px, so the narrowest layout tested today was 567, not 390.
- Safari. Nothing has been opened in it.
- The verdict sentence takes six to seven seconds to arrive. That is live chain
  reads, not payload: the JS is 157KB and everything except that one sentence
  renders immediately.
