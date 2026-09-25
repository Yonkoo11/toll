## UI Revamp Progress

### Phase 1: Audit
- [x] Run automated audit script (4 major, 0 critical; 3 verified false positives)
- [x] Heuristic evaluation
- [x] Visual inventory (type, radius, shadow, spacing, states)
- [x] Document findings, F1..F6, in design/ui-revamp-audit.md

### Phase 2: Plan
- [x] Findings presented
- [x] Order proposed, then reordered after challenge: F3 is an invention, not a fix, so it
      was moved behind the two severity-4 findings and treated as a prototype to verify
      before adopting rather than a scheduled change hours before a deadline.
- [x] Approval: the operator's instruction to work on the design before submission.

### Phase 3: Implement
- [x] F1 accent rationed on all three surfaces
- [x] F2 limits section, in the typography of the features, before the call to action
- [x] F4 every route on the margin spine
- [x] F5 stale comment corrected
- [x] F6 dead token removed
- [x] F3 motif at three scales — DONE, prototyped and verified before adoption

### Phase 4: Validate
- [x] Automated audit: 0 critical
- [x] Contrast gate: 8 of 8 pairs pass
- [x] Zero horizontal overflow on 4 routes x 3 widths, 0 page errors
- [x] Squint test: the accent now lands three times on the front page
- [x] Blur test run at sigma 7 on the full-page render. Hierarchy survives: display name,
      verdict sentence, the bar with its red tip, the ledger answer, then four distinct
      power names. It also caught something full resolution did not: every marked power row
      had two red elements, the name and its rank label, so four rows put eight red items in
      one block and read as a single mass. The rank is muted now. Nine marked elements on the
      whole page, down from thirteen.

## F3, done: the motif at three scales

CT-1 asks for one geometric motif derived from the product's own noun, appearing at page,
component and detail scale. Toll's noun is a slice taken from what passes.

- **Page:** the toll bar. The cut lands on the red segment, so the slice is taken out of the
  toll itself. The shape is the sentence.
- **Component:** `.plate` on the one-address panel.
- **Control:** `.cut-control` on the address field and its button, the two things a person
  actually operates.

`--cut:15px` and `--cut-sm:7px` are tokens; no component carries a literal.

**The technical problem and what it cost.** `clip-path` clips `box-shadow`, so a cut plate
cannot carry the `--lift` ladder. It carries `filter: drop-shadow()` instead, which follows
the path: same offsets, same direction, same philosophy. The one thing lost is the hairline
ring inside `--lift-1`, which a drop-shadow cannot express. The cut edge against the textured
ground does that work instead, which is ER-6 rather than a workaround.

**Verified before adopting, which is why it was deferred rather than skipped:** the clip
resolves on all four elements at 1440 and at 390, with zero horizontal overflow and no page
errors. An earlier attempt had the motif block above the primitives, so `.panel`'s own
`box-shadow` won the cascade and was being clipped invisibly; caught by reading the computed
style back rather than by looking.

## Also closed in this pass

- **CT-11.** The ledger now prints the rule that produces its own total:
  `back = 100 × (1 + premium) × (1 − fee)²`, with the live figures in it. Checked: at a 4.09%
  premium and a 1% fee that is 102.02, which is the total shown. A page that shows its
  arithmetic can be checked; one that shows only a result asks to be believed.
- **CT-5.** Two easing curves, chosen by job. `--ease-out` for anything under the pointer now,
  where overshoot reads as lag. `--ease-enter` for things arriving on their own. Previously one
  curve did both jobs, and the reveal carried a hand-written copy of it rather than the token.

## Audited and found already compliant

CT-3 (three families with assigned jobs), CT-7 (reduced motion), CT-8 (palette size), CT-10
(tracking ladder). CT-2 (scroll-snap scenes) is genre-bound and carries its own "when not to
use it"; a document of record is that case.

## What moved

| | before | after |
|---|---|---|
| Accent on `/all` | 237 of 265 rows marked | 0; the majority state is muted, the prose carries the count |
| Accent on `/record` | all 612 rows marked | 20 marked, the ones where the terms changed |
| Accent in the verdict | every figure | one, the figure the sentence is built to deliver |
| Limits | 12.5px muted mono on /method | a section in the typography of the features, before the CTA |
| Margin spine | 1 route of 5 | 5 of 5 |
| Horizontal overflow at 390 | /all 18px, /record 23px | 0 everywhere |
| Breakpoints | one, at 780px, with a comment claiming 980 | 980 folds the margin, 780 stacks the rows |
