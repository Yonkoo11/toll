# Build brief — Toll

Every number here is a decision, not a suggestion. Where a value is given, use it exactly.
Where copy is given, use it verbatim. Read the whole brief before writing a line.

Direction: `design/directions.md` — "The Filing", with the two grafts from Direction 2.
Research it answers to: `ai/design-research.md`. Surfaces it must cover: `ai/surface-map.md`.

---

## 0. Named deviations from the method and from the direction

- **BB-2 artboard units are NOT used.** Artboard units reproduce one fixed composition at any
  viewport. Toll's pages carry lists of unknown length (265 rows, 612 rows), so there is no
  artboard to reproduce. Deviation: a fluid content column plus a `clamp()` type scale.
  BB-4 (hairline floor), BB-10 (reveal to `--o`), BB-11 (timing table), BB-12 (named motion
  tokens) and BB-13 (reduced motion as a real branch) are all kept.
- **The mockup's texture covered the viewport. It is constrained to the content column and
  lowered from 0.05 to 0.035.** At full-bleed it read as wallpaper in the render.
- **The mockup's hero right half was empty with the address clipped into the corner.** The
  address moves to a labelled field under the name; the right axis carries a metadata stack.
- **Checklist line 3 is not met for row hover, and deliberately.** `.row:hover` and
  `tbody tr:hover` change background only. Line 3 asks for `transform` or `box-shadow`, but
  line 5 allows exactly three shadows and none of them is a row marker, and a 612-row table
  that lifts under the pointer is worse, not better. Colour-alone hover is accepted here and
  nowhere else. Link hover changes both colour and border colour, as §9 specifies.
- **Field labels are 12px, not the 11px this brief first specified.** The design QA gate
  sets a 12px floor for any type, uppercase-with-tracking included, and 11px was below it.
  Changed in `app.css` and in §3 above on 2026-09-22.
- **`--ink-3` moved from `#8A8271` to `#756E5D`.** Measured at 3.47:1 against `--paper`,
  the old value failed WCAG AA for body text; the new one is 4.61:1. It is the lightest
  value on this hue that clears 4.5:1, so the label greys are as quiet as they can legally be.
- **The spacing ladder is this project's own, not the skill's default.** `4/8/12/16/20/28/34/
  52/78/104` is a ~1.45 ratio and carries the filing's denser rhythm; the skill's
  `4/8/12/16/24/32/48/64/96/128` produced section gaps too wide for a record. Every value in
  the stylesheet sits on this ladder, plus the two row paddings §4 names.
- **The design QA script's liveness check (check 4) fails and is overridden, deliberately.**
  `~/System/scripts/design-qa.sh` counts layered gradients, `box-shadow`-with-`rgba` lines and
  the words `noise|grain|feTurbulence`. It is calibrated for a dark theme. This page's shadows
  are all `box-shadow:var(--lift-N)`, so the rgba sits in the token definition and the grep
  misses it; its texture is an SVG cross-hatch tile at 0.035 on `.texture`, above the skill's
  own 0.03 floor, but it is not called "noise". Against the skill's own eight-item dead-page
  checklist at most two items are true (flat base colour outside the column; no background
  gradient), and the gate fires at three. The accent focus ring is `--mark-32` (0.32, floor
  0.08), three shadow tiers are in use, the beat dot animates and every figure on the page is
  live. The script is left unmodified.
- **Sections are a two-column grid, label in the margin, not a label stacked above a
  block.** The first build stacked them, which is the default shape of any web page and
  read as generic however good the tokens were. "The Filing" has a margin; a document of
  record puts its labels in it. Folds back to a stack below 980px, which is the only width
  where a stack is correct.
- **Powers are ranked in three tiers, and only one of them gets the brand colour.** Seize,
  pause, freeze and rescale can reach a balance whose owner never signed anything; fee and
  mint set the terms; the rest are held by nobody. Marking all eight made the one that can
  empty a wallet read no louder than the one that dilutes it, which is the opposite of
  Socket's rule.
- **The ledger total was one type step above the verdict sentence.** The working was
  louder than the answer. The total is now a step below it.
- **A load reveal was added, and deliberately excludes every figure read from the chain.**
  A number fading in on a timer implies the read finished when it had not. Structure
  reveals; data lands when it lands.
- **The craft audit reports three hover violations that are false positives.**
  `~/.claude/skills/ui-revamp/scripts/audit.js` checks line by line and cannot see an
  enclosing block, so `@media (hover:hover) { .row:hover {...} }` reads to it as a bare
  hover. All three are verified wrapped. The script is left unmodified and the code is
  not changed to satisfy it.
- **`~/Downloads/landing-brief.md` was read in full and deliberately not applied.**
  Reasons recorded in §0.1 below.

### §0.1 Why the cinematic landing brief was rejected

It specifies a dark single-screen hero with a shared background video, glass metric cards,
Geist and Inter, LED dot type, and a marquee reading "Trusted by wealth advisors at"
followed by the Intel, Google, Sony, Amazon and Adobe logos.

1. **It would put fabricated social proof on a page entered in a judged competition.**
   Toll has no users. Naming five companies as customers is a false claim, and no amount
   of craft makes it acceptable.
2. **Its copy is another product's.** "Intelligent Connections / Cross-Source Context"
   is not this product, and the brief says to use it verbatim.
3. **Dark was already built, judged and lost here.** Direction 3 was the candidate dark
   had to win as, on the record in `directions.md`. `style.config.md` requires a dark
   winner to beat the best non-dark candidate; it did not.
4. **One screen that never scrolls cannot hold this product.** `/record` is 612 rows and
   `/all` is 265. The architecture is incompatible, not merely different.
5. **It hotlinks another account's CDN assets**, which can vanish without notice.

Taken from it and kept: the load reveal (opacity only, staggered, with a failsafe that
clears the hidden state rather than risking a page stranded at zero). Considered and not
taken: artboard units. They are the better system, and re-porting every length hours
before a deadline is a regression risk with no visible gain over the existing clamp scale.

- **`/record` and `/all` each carry a filter the brief did not specify.** 612 rows and 265
  rows are not readable without one. Copy: `Filter by token, change or mint` and
  `Filter by symbol, name or issuer`.
- **Three files are committed that the brief assumed would be read live**, each because a
  browser cannot reach the source. Measured 2026-09-22, all three from a real page:
  `api.mainnet-beta.solana.com` answers 403 to a browser; `prestocks.com/api/prestocks` sends
  no CORS headers at all; `solana-rpc.publicnode.com` refuses a `getMultipleAccounts` above
  about five addresses. The page names the endpoint that answered and dates every saved figure.
- **Direction 2's receipt is reframed.** It is labelled "What a round trip does to 100" and
  never "You get back" — the figure is an estimate of a trip the reader has not made.

## 1. Stack and output contract

- Svelte 5 + Vite 5 + TypeScript, the stack already in this repo. No CSS framework, no UI kit.
- One global stylesheet `src/app.css` holding every token and primitive. Components carry
  layout only; **zero hardcoded hex values and zero ad-hoc `border-radius` literals in
  components** (CF-1, CF-7).
- Do NOT add: a component library, an icon library, Tailwind, a font loader, an animation
  library, or any emoji.
- Routes to build, in this order: `/`, `/t/:mint`, `/record`, `/all`, `/method`.

## 2. Tokens — `:root` in `src/app.css`, verbatim

```css
--paper:#F6F4EF;      /* ground. never #ffffff (ER-1) */
--paper-2:#FBFAF7;    /* elevation level 2 */
--rule:#DED8CC;       /* structural hairline */
--rule-soft:#E8E3D9;  /* row hairline */
--ink:#16140F; --ink-2:#514B3E; --ink-3:#8A8271;
--mark:#B4331A;       /* THE one brand colour */
--mark-55:rgba(180,51,26,.55); --mark-32:rgba(180,51,26,.32);
--mark-12:rgba(180,51,26,.12); --mark-06:rgba(180,51,26,.06);
--r-xs:2px; --r-sm:4px; --r-md:8px; --r-lg:14px; --r-full:999px;
--lift-1:0 1px 2px rgba(22,20,15,.06), 0 0 0 1px rgba(22,20,15,.04);
--lift-2:0 2px 4px rgba(22,20,15,.05), 0 8px 24px -8px rgba(22,20,15,.14), 0 0 0 1px rgba(22,20,15,.05);
--lift-3:0 4px 8px rgba(22,20,15,.06), 0 18px 48px -14px rgba(22,20,15,.20), 0 0 0 1px rgba(22,20,15,.06);
--hairline:max(1px, .06rem);
--col:1180px; --gutter:28px; --gutter-sm:16px;
--serif:"Iowan Old Style",Baskerville,"Palatino Linotype",Palatino,Georgia,serif;
--sans:ui-sans-serif,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
```

**Shadow philosophy (CF-5), declared once:** soft-elevation ladder, light world.
`--lift-1` buttons and quiet panels · `--lift-2` the input and the toll bar ·
`--lift-3` focus-within only. No other shadow anywhere. No pixel-offset, no glow.

**Colour rule (Socket's, enforced):** `--mark` appears only where a power is actually held,
where a term actually changed, or on a focus/hover affordance. It never decorates.

## 3. Type scale — tokens, not per-element sizes (CF-6)

| Token | Value | Use |
|---|---|---|
| `--t-display` | `clamp(46px,6.6vw,88px)` / lh `.94` / ls `-.035em` / weight 400 / serif | the token symbol, once per page |
| `--t-title` | `clamp(28px,3.4vw,40px)` / lh `1.06` / ls `-.028em` / weight 400 / serif | page titles on `/record`, `/all`, `/method` |
| `--t-lede` | `clamp(21px,2.5vw,31px)` / lh `1.32` / ls `-.017em` / serif | the verdict sentence. `max-width:28ch` |
| `--t-sub` | `clamp(20px,2vw,27px)` / lh `1.18` / ls `-.015em` / serif italic | the issuer line under the symbol |
| `--t-body` | `17px` / lh `1.55` / ls `-.011em` / sans | power names, record actions |
| `--t-prose` | `15px` / lh `1.5` / sans | the explanatory column, `max-width:62ch` |
| `--t-data` | `12.5px` / lh `1.7` / mono | addresses, signatures, dates |
| `--t-field` | `12px` / lh `1` / ls `.09em` / uppercase / mono | field labels only |

Global: `-webkit-font-smoothing:antialiased`, `text-rendering:optimizeLegibility`,
`font-variant-numeric:tabular-nums` on `body`. Inputs are 16px minimum.
No size below 11px, and 11px only for the uppercase mono field label.

**BR-a, hard cap: at most 3 uppercase mono field labels per viewport, and each names a data
field. Never an eyebrow above a heading.**

## 4. Spacing scale

`4 / 8 / 12 / 16 / 20 / 28 / 34 / 52 / 78 / 104px`. No value off this scale.
(This is not the design skill's default `4/8/12/16/24/32/48/64/96/128` ladder — see the
deviation recorded in §0.)
Section spacing 52px between blocks within a page, 78px between major sections.
Row padding 17px vertical on power rows, 15px on record rows. Panel padding 20px 22px.

## 5. Layout spine

- Content column `min(var(--col), 100% - 2*var(--gutter))`, centred.
- **Two hairline vertical rules, positioned on the column edges, `position:fixed`, full
  height, `--rule-soft`.** Content is inset 0 from the rules but the rules sit at the column
  boundary, not inside it — the mockup clipped its own content and that must not recur.
- **Texture:** the plus-grid SVG data-URI tile at 72×72, `opacity:.035`, `position:fixed`,
  `pointer-events:none`, **clipped to the content column** (not the viewport).
- **Mobile (≤780px):** gutter `--gutter-sm`, column rules hidden, power and record rows
  collapse to a two-line stack (label line, then detail and evidence beneath), the input
  stacks vertically with a full-width 48px button.

## 6. The signature element — the toll bar

A 54px-tall track, `--r-sm`, `--paper-2`, `--lift-2`, `overflow:hidden`. Inside: a kept
segment inset from the right by the real cost percentage and filled
`linear-gradient(180deg,rgba(22,20,15,.90),rgba(22,20,15,.80))`, and a lost segment pinned
right at exactly that width filled `--mark` with `inset 1px 0 0 rgba(255,255,255,.22)`.
Marks beneath in mono at 12.5px: what is kept on the left, what the toll takes on the right
in `--mark`.

**Every width comes from the live number. Nothing in this element is hardcoded.** It carries
`role="img"` and an `aria-label` stating both figures. It appears in the first viewport of
`/` and `/t/:mint`, and nowhere else.

## 7. Copy — verbatim

Field labels, exactly:
- `WHAT 100 COMES BACK AS`
- `WHO CAN DO WHAT TO IT`
- `ALL SIX SIT AT ONE ADDRESS` (the count is live; the wording is fixed)
- `WHAT HAS CHANGED`
- `CHECK ANOTHER TOKEN`

Fixed strings:
- Input placeholder: `Paste a token address`
- Button: `Read the mint`
- The one-address panel body: `<code>{address}</code> holds every power listed above. There
  is no second signer between it and your balance.`
- Footer: `Every figure above was read from Solana on request.`
- Price footnote, when the reference is the issuer's own: `This is the issuer's own number,
  not an independent price.`
- A price older than a day renders as `posted {n} days ago`, in `--mark` past 7 days.
  **Staleness is information; never render a stale price as a current one.**

The verdict sentence is **generated by `cost.ts`, not written here.** The page renders
`cost.verdict` and marks its percentages with `<em>` in `--mark`. No headline or tagline is
written by the build. If a marketing tagline is ever wanted, it is `[TAGLINE — from Dami]`.

## 8. The itemised ledger (graft from Direction 2)

Under the toll bar, labelled `WHAT 100 COMES BACK AS`, rows of
`label · dotted leader · figure`, right-aligned mono figures, `1px dotted var(--rule)`
between rows, a `2px solid var(--ink)` rule above the total, total figure at `--t-title`
in `--mark`. Every line computed: amount in, toll in, toll out, premium, result.
The label for the last row is `What comes back`, never `You get back`.

## 9. Motion — the table (BB-11, BB-12)

```css
--t-fast:110ms cubic-bezier(.23,1,.32,1);   /* hover, colour, border */
--t-mid:190ms cubic-bezier(.23,1,.32,1);    /* shadow, focus-within */
--t-press:80ms cubic-bezier(.23,1,.32,1);   /* :active */
```
- Hover on rows: background to `--mark-06`, 110ms. Nav links: colour plus a `--mark-55`
  bottom border, 110ms. **Every hover is inside `@media (hover:hover)`.**
- Buttons: hover `translateY(-1px)` + shadow + background to `--mark`; `:active scale(.97)`
  at 80ms. **Colour alone is never the whole hover** (CF-4).
- `:focus-visible` everywhere: `box-shadow:0 0 0 3px var(--mark-32)`. Never `outline:none`
  without it.
- One ambient element on the page, and only one: the live dot in the status line, keyframes
  named `beat`, 2.6s. **Keyframe names describe the data state, never the motion.**
- No entrance animations on lists. 612 rows must not fade in.
- `@media (prefers-reduced-motion:reduce)`: all animation off, transitions to 1ms, page
  fully readable. Tested, not assumed (BB-13).

## 10. Honesty requirements that are design requirements

- Every power row shows the mint field it was read from. That string is the evidence.
- Every record row links its transaction signature to an explorer.
- Every price shows its source and its age.
- The read time and the epoch are shown, because the answer is only true as of a moment.
- A token with no Pyth feed shows what is missing. It never borrows another token's price.

## 11. Acceptance checklist

Done means every box below is ticked. Each line is independently checkable, and §12 gives the
command for the ones a script can decide.

- [ ] No `#` hex literal outside `:root` in any `.svelte` or component file.
- [ ] No `border-radius` px literal outside `:root`.
- [ ] Every `:hover` block changes `transform` or `box-shadow`, not colour alone, and sits in
      `@media (hover:hover)`. One deliberate exception, recorded in §0: row hover.
- [ ] `:focus-visible` is defined for every link, button and input, and no later rule at equal
      specificity cancels it.
- [ ] Exactly one shadow philosophy: every `box-shadow` is `--lift-1/2/3` or the toll bar's
      declared inset. No pixel-offset, no glow.
- [ ] `clamp()` is used for display and title sizes.
- [ ] No font size below 12px anywhere; 12px only on the uppercase mono field label; body ≥15px;
      input 16px so iOS does not zoom.
- [ ] Every text colour clears WCAG AA against the ground it sits on: 4.5:1 for body, 3:1 for
      large text.
- [ ] At most 3 uppercase mono field labels per viewport.
- [ ] `--mark` appears only on powers that can reach a balance, changed terms, stale prices, and
      focus/hover states.
- [ ] The toll bar's widths derive from the live cost. Grep finds no hardcoded percentage.
- [ ] Not one number on any page is written into markup; all come from the engine or the
      committed record.
- [ ] `prefers-reduced-motion` renders a complete, readable page with no animation.
- [ ] Desktop 1440 and mobile 390 both render with no horizontal scroll and no clipped text.
- [ ] The column rules do not overlap or clip any content at any width.
- [ ] Every page answers Krug's five: what site, what page, what sections, what can I do,
      where am I.
- [ ] The signature motif appears at three scales: the toll bar, the plates, the controls.
      No component carries a `--cut` literal.
- [ ] Any element carrying `clip-path` carries `drop-shadow`, never `box-shadow`, which a clip
      silently eats.
- [ ] The ledger prints the rule that produces its own total, with the live figures in it.
- [ ] Two easing curves, assigned by job, and nothing hand-copies their values.
- [ ] The limits are set in the typography of the features, not in a muted footnote (CT-12, ER-8).
- [ ] One accent per headline, on the word carrying the argument (CT-9).
- [ ] Not one word of copy, one colour, or one URL differs from this brief.

## 12. Verify it yourself

Run these before calling the build done. Each line gives the command and the output it must
produce; anything else is a failure, not a variation.

```bash
# No hex outside the token block. Expected: 0
# The word boundary matters: without it this matches Svelte's own {#each} as the
# three-digit hex #eac and reports six failures that are not there.
grep -rEo '#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b' src/components src/routes | wc -l

# No radius literals outside :root. Expected: 0
grep -rEo 'border-radius: *[0-9]+(px|rem)' src/components src/routes | wc -l

# Focus ring defined, and not cancelled later. Expected: at least 2 matches
grep -c 'focus-visible' src/app.css

# Every shadow is a token or one of the two declared insets. Expected: 0 stray
grep -oE 'box-shadow: *[^v)]' src/app.css | grep -v inset | wc -l

# The toll bar is drawn from data, never a literal. Expected: 0
grep -rEo 'width: *[0-9]+%' src/components/TollBar.svelte | wc -l

# Type check and build. Expected: 0 ERRORS, then a dist/ write
npx svelte-check --threshold error
npm run build

# Craft floor. Expected: 0 critical
node ~/.claude/skills/ui-revamp/scripts/audit.js src

# Contrast, both grounds. Expected: every ratio >= 4.5
npx tsx scripts/check-contrast.ts
```

Render at 1440 and at 390 and look at both. A script cannot tell you the page is composed; it
can only tell you nothing is broken.

## 13. What people get wrong here

Every one of these was actually done on this project and had to be undone.

- **Implementing the tokens and skipping the structure.** The first build had the paper, the
  serif and the hairlines, and stacked a small label above a full-width block eleven times.
  That is the default shape of any web page. "The Filing" is a document of record and a document
  of record has a margin. Correct tokens on a default skeleton still reads as default.
- **Marking every figure.** If all eight powers are in `--mark`, the one that can empty a wallet
  reads no louder than the one that dilutes it. Colour means problem; when everything is a
  problem, nothing is.
- **Trusting a gate that is calibrated for a different world.** `design-qa.sh` reports this page
  as dead because it counts background gradients and the word "noise". Read the skill's own
  eight-item checklist and count; then record the override in §0 rather than editing the script.
- **Believing a local pass.** `svelte-check` reported 0 errors here and 14 in CI, because
  `@types/node` resolved from outside the project. A check that only passes on the machine that
  wrote it is not a check.
- **Letting the narration lead the footage.** Figures move between takes. Write to the picture.

## 14. Setup

Nothing to fetch. No key, no account, no env var, no signup, for the build or for the site at
runtime. `npm install` then `npm run dev`, about two minutes on a cold cache.

The two live gates (`npm run verify`, `scripts/verify-cost.ts`) read Solana mainnet through a
free public endpoint and take two to five minutes. They can fail for reasons that are not your
change: a `TapeError` naming how many of how many transactions were read is the endpoint
refusing to serve history it still lists, which is a documented condition, not a regression.

## 15. Corrections after the live page was looked at

- **The toll bar is 88px, not 54px** (68px below 780). It is the element the product is
  named after and it was occupying six percent of the first viewport.
- **The motif has three sizes, not one.** `--cut-lg:34px` on the bar, `--cut:16px` on plates,
  `--cut-sm:7px` on controls, and all three step down again below 780px. A single 15px value
  used in three places is one scale used three times, which is not what CT-1 asks for: on a
  950px bar it is 1.3 percent of the width and invisible.
- **The cut on the bar stops short of destroying the figure.** The toll segment keeps its full
  height across its top edge, so its width still reads as the number it encodes. The bar was
  made taller rather than the cut made smaller, because the bar needed the presence anyway.
- **On a phone the metadata now comes after the verdict.** It sat between the token's name and
  its answer, so six lines of supporting detail pushed the answer below the fold.
