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

Each line independently checkable.

1. No `#` hex literal outside `:root` in any `.svelte` or component file.
2. No `border-radius` px literal outside `:root`.
3. Every `:hover` block changes `transform` or `box-shadow`, not colour alone, and sits in
   `@media (hover:hover)`.
4. `:focus-visible` is defined for every link, button and input.
5. Exactly one shadow philosophy: every `box-shadow` is `--lift-1/2/3` or the toll bar's
   declared inset. No pixel-offset, no glow.
6. `clamp()` is used for display and title sizes.
7. No font size below 11px; 11px only on the uppercase mono field label; body ≥15px; input 16px.
8. At most 3 uppercase mono field labels per viewport.
9. `--mark` appears only on held powers, changed terms, stale prices, and focus/hover states.
10. The toll bar's widths derive from the live cost. Grep finds no hardcoded percentage.
11. Not one number on any page is written into markup; all come from the engine or the
    committed record.
12. `prefers-reduced-motion` renders a complete, readable page with no animation.
13. Desktop 1440 and mobile 390 both render with no horizontal scroll and no clipped text.
14. The column rules do not overlap or clip any content at any width.
15. Every page answers Krug's five: what site, what page, what sections, what can I do,
    where am I.
16. Not one word of copy, one colour, or one URL differs from this brief.
