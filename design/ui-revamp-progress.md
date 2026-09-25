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
- [ ] F3 motif at three scales — NOT DONE, see below

### Phase 4: Validate
- [x] Automated audit: 0 critical
- [x] Contrast gate: 8 of 8 pairs pass
- [x] Zero horizontal overflow on 4 routes x 3 widths, 0 page errors
- [x] Squint test: the accent now lands three times on the front page
- [ ] Blur test not run as a formal pass

## What F3 would have been, and why it is not here

CT-1 asks for one motif at three scales. Toll's noun is a slice taken from what passes, and
the toll bar is that shape at page scale. Carrying it to component and detail scale means
inventing a `clip-path` plate treatment and applying it to every panel and row.

That is a new asset, not a correction to an existing one, and nothing in the audit established
that the shape survives at row height or on a 390px column. Introducing it across every surface
without that evidence, hours before a submission, risks making the page worse in a way the
remaining time does not allow to be caught. Recorded as the next change rather than rushed.

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
