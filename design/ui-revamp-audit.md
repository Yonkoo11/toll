# Toll — UI revamp audit (Phase 1)

Run 2026-09-24, before the Stocklana submission. Direction on disk: "The Filing".
Automated audit: `node ~/.claude/skills/ui-revamp/scripts/audit.js src` → 4 major, 0 critical.
Three of the four are verified false positives (see §F5).

## Vibecode detector: 8 of 8 pass

No linear easing on any transition, no `scale(0)`, no `transition: all`, `button:active`
present, radius is a 5-token scale, input is 16px, `:focus-visible` defined three times.

## Visual inventory

- **Type:** 6 `clamp()` display/title sizes, then 17px body, 16px input, 15px prose, 12.5px
  data, 12px field label. Ratio 88/15 = 5.9x, above SR-2's 4.5x floor.
- **Radius:** `--r-xs/sm/md/lg/full`. Four are used. `--r-lg` (14px) is used nowhere.
- **Shadow:** one philosophy, `--lift-1/2/3`, plus two declared insets. No mixing.
- **Spacing:** the project's own ladder, 4/8/12/16/20/28/34/52/78/104.
- **States:** loading, empty, error and degraded all exist and are distinct.

## Findings, by severity

### F1 — CRITICAL. The accent marks the common case on three surfaces, not the exception

This was fixed on the powers list and left broken everywhere else. Looking at the two routes
I had never actually opened:

- **`/all`**: `unlisted` is set in `--mark` on 237 of 265 rows. The majority state is the
  marked one, so the colour carries no information. The exception is `listed`, and it is the
  thing a reader is looking for: a token nobody quotes cannot be sold without paying the toll.
- **`/record`**: every row's action is marked, including `Collected tolls taken`, which is the
  issuer doing its routine sweep. The change that matters is the one that alters your terms.
- **Verdict**: every figure in the lede is marked, so no single word carries the argument (CT-9).

Severity 4. This is the product's own stated rule, Socket's rule, broken on most of its surface
area. Frequency: every row of the two longest pages.

### F2 — CRITICAL. The limits are in small print (CT-12, ER-8)

Toll's entire argument is that it will not show a number it cannot stand behind. Its limits are
set in muted 12.5px mono on `/method`, a page most visitors will not open. The strongest thing
this project has to say about itself is the thing it says most quietly.

The limits are real and specific: the live rebuild of the record currently fails against the
free endpoint; three inputs are dated saved copies; 64 of 252 Pyth feeds have a price on Solana
at all; nobody has reviewed this. Severity 4.

### F3 — MAJOR. The signature motif exists at one scale (CT-1)

The toll bar is page furniture and nothing else. Panels use `--r-md`, a neutral token radius.
A motif used once is decoration. Toll's own noun is a slice taken from what passes, and that
shape appears nowhere but the bar. Severity 3.

### F4 — MAJOR. The page spine changes between routes

The verdict page puts section labels in a margin column. `/all`, `/record` and `/method` set
their titles at the page edge with prose beneath, so the structural idea that carries the
direction is present on one route in five. Severity 3.

### F5 — MINOR. Three audit violations are false positives, one comment lies

`audit.js` flags `.row:hover`, `tbody tr:hover` and the table hover as outside
`@media (hover:hover)`. All three are verified inside it; the check is line-based and cannot
see an enclosing block. Left unmodified.

Real defect in the same area: the comment above the reveal animation still says "linear" after
the easing was changed to `cubic-bezier(.23,1,.32,1)`. A comment that describes code that no
longer exists is the same class of error as a stale number on a page.

### F6 — MINOR. `--r-lg` is declared and never used

Dead token. Either the panel treatment should use it or it should go.
