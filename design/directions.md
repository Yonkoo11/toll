# Chosen direction — Toll

Decided 2026-09-22 after building all three as real HTML with identical live ANDURIL data,
rendering each at 1440×1000 in headless Chromium, and looking at the renders.

## WINNER: Direction 1, "The Filing" — with two grafts from Direction 2

`proposals/proposal-1.html`, plus the itemised ledger and the dotted-rule row density from
`proposals/proposal-2.html`.

### Why

- **It is the only one that looks like a record.** The product's object is a dated history
  of who changed what. A warm off-white ground with hairline column rules and a system
  serif at light weight reads as a filing; the other two read as a receipt and a terminal.
- **Nothing in the field looks like this.** rugcheck.xyz is #0a0a0a with a mascot and casino
  rails, haveibeenpwned.com is #030304, linear.app is #08090a. A judge scrolling forty
  submissions sees a different object.
- **It extends to all five surfaces.** The hairline grid and hairline rows carry a 265-row
  token table and a 612-row record without redesign. Direction 2's 760px receipt cannot.
- **Its signature element is honest.** The toll bar is drawn to scale from the real number.

### Why the other two lost, specifically

**Direction 2, "The Tape"** — the most distinctive of the three, and the itemised ledger is
the clearest explanation of the cost anywhere in this set, which is why it is being grafted
in. It loses as a whole because (a) the receipt metaphor asserts a completed transaction
when the figure is an estimate of one you have not made, (b) its green accent reads as
reassurance on a product whose job is to warn — Socket's rule is that colour means problem,
and (c) a 760px mono column cannot hold the 265-token table or the 612-row record.

**Direction 3, "The Control Room"** — this is the candidate dark had to win as, and it did
not. It carries two accent hues (green and coral) against the one-brand-colour rule, its
gauge panel renders a large dead void between the figure and the bar, and it is
indistinguishable on sight from every other entrant in this hackathon. `style.config.md`
requires a dark winner to beat the best non-dark candidate on record. It lost. Recorded so
no later pass re-opens it.

### What gets grafted from Direction 2

1. **The itemised ledger with dot leaders**, reframed honestly. Not a receipt of a purchase;
   a worked example labelled "What a round trip does to 100", showing every line that moves
   the number: 100.00 in, −1.00 toll in, −0.99 toll out, +0.53 premium, = 98.53 back.
2. **Dotted hairlines** (`1px dotted`) on the record rows, solid on section boundaries, so
   the record reads denser than the powers list without adding a single box.

### Defects found in the render of Direction 1, to fix in the build

1. The SVG texture tile covers the whole viewport including the outer margins, so it reads
   as wallpaper. Constrain it to the content column and drop it to 0.035.
2. The right-hand column rule sits on top of the content: the mint address and the longest
   evidence strings (`scaledUiAmountConfig.authority`) are clipped by it. The rules must be
   positioned off the column edge, not off the viewport, with the content inset from them.
3. The mint address is hard-broken mid-string in the top right and reads as damage. Give it
   its own labelled field, left-aligned under the name, breaking on its own line.
4. The hero's right half is empty with a clipped address jammed into the corner, so the
   void reads as broken rather than composed. Put the live epoch/supply facts on that axis
   as a right-aligned metadata stack (SR-3), giving the row a real second vertical edge.

## Locked decisions

- **Colour mode:** light only. Dark was built, judged and lost on the record.
- **One brand colour:** `#B4331A`. All variety from opacity derivatives at 55/32/12/6%.
  It appears only where a power is actually held or a term actually changed (Socket's rule).
- **Shadow philosophy (CF-5):** soft-elevation ladder, light world. One philosophy, no mixing.
- **Signature element:** the toll bar — a to-scale rule showing what 100 comes back as,
  in the first viewport, drawn from the live number, never decorative.
- **Type:** system serif stack (`Iowan Old Style, Baskerville, Palatino, Georgia`) for
  display at weight 400 with leading 0.94 and tracking −0.035em; system sans for prose;
  mono for every address, signature and mint field. No webfont, no network request.
