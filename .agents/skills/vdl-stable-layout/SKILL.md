---
name: vdl-stable-layout
description: Use in the Vibe Design Lab repo when framing a stable layout skeleton for a page, section, dashboard, form, or component so that overflow, layout shift (CLS), idle gaps, and imbalance are prevented. Triggers on "레이아웃 잡아줘", "이 화면 레이아웃 설계", "안정적인 레이아웃", "레이아웃이 깨진다/넘친다", "overflow", "CLS", "반응형 레이아웃 구성", "/layout", or whenever a new screen or section skeleton is being framed. Consumes the layout taxonomy knowledge base (src/data/layoutTaxonomyData.js) and works in order: space model (fluid/fixed/hybrid) -> archetype -> region policy -> saturation -> reflow -> component mapping -> stability check. Pick patterns by bestFor and reject by avoidFor; never improvise. This skill consumes the taxonomy only; it does not extend it.
---

# VDL Stable Layout

Use this skill to frame a layout skeleton that stays stable (no overflow, no shift, no gaps, no imbalance). The canonical source is `.claude/skills/stable-layout`; do not duplicate its taxonomy, stability principles, or checklist. This is a pure knowledge-base adapter over the layout taxonomy.

## Canonical source

- SKILL body (SSOT): `.claude/skills/stable-layout/SKILL.md`. Read it in full when this skill activates; follow its decision procedure and stability checklist exactly.
- Data (SSOT): `src/data/layoutTaxonomyData.js` (6 Parts, 23 Categories, 139 patterns). This is the knowledge base. Do not restate its patterns here; parse the file when you need pattern details.

If the Claude source folder `.claude/skills/stable-layout/` or `src/data/layoutTaxonomyData.js` is missing, stop and tell the user this Codex skill depends on those local source paths.

## Required Reads

- Read `.claude/skills/stable-layout/SKILL.md` first, for the full decision procedure, the stability checklist, and the usage notes.
- Read `src/data/layoutTaxonomyData.js` to match intent and pull concrete fields. For each pattern (item) the load-bearing fields are: `id`, `name`/`koName`/`aliases` (intent matching), `sizing` (space model: fluid/fixed/hybrid), `reflow` (narrow-screen behavior: Stack/Reorder/Reflow-Heavy), `bestFor` (fit intent), `avoidFor` (misfit context, prevents wrong picks), `build` (concrete CSS tokens), `relatedComponents` (components to pair), `goodWith`/`avoidWith` (combination guide), `previewSpec` (structure sketch).
- The stability principles live in Part 1 category `Space Model & Stability` (ids: fluid-layout, fixed-layout, hybrid-layout, space-saturation, region-sizing-policy, balanced-fill, overflow-containment, intrinsic-sizing, cls-prevention, stacking-discipline). This is the definition of "stable"; read these ids when validating.

Since Codex runs on shell plus apply_patch, "Read X" means open and read that file; there is no separate taxonomy download step needed. When you want an agent-readable dump of the taxonomy, parse `src/data/layoutTaxonomyData.js` directly.

## Workflow summary

Follow the source order. Do not choose a structure (bento, holy grail) first; decide the space model first.

1. Space model: fluid / fixed / hybrid. Is content variable and must fill (fluid), controlled for readability and alignment (fixed), or different per region (hybrid). Most real cases are hybrid. See `fluid-layout` / `fixed-layout` / `hybrid-layout`.
2. Archetype selection: match intent by `bestFor`, filter out by `avoidFor`; narrow candidates by the same `sizing`. (Part 3 page, Part 4 section.)
3. Region policy (region-sizing-policy): decide which regions are fixed (nav, sidebar in px) and which are fluid (body in 1fr) by content policy. Do not lay everything in fr or nail everything in px.
4. Saturation (space-saturation + balanced-fill): make regions fill the frame to remove idle gaps and empty bottoms; avoid one-sided imbalance. Intended negative space is the exception.
5. Reflow behavior: on narrow screens follow the pattern's `reflow` (Stack / Reorder / Reflow-Heavy). (Part 5.)
6. Component mapping: connect real components via `relatedComponents` and write CSS from the `build` tokens.
7. Stability check: pass the source checklist (below) before calling it done.

### Stability checklist (from the source, must pass)

- Overflow containment: `min-width: 0` (or `min-height: 0`) on flex/grid children; long text/URL/image must not push a column and create horizontal scroll; add `overflow` / `text-overflow: ellipsis` / `overflow-wrap` as needed. Missing `min-width: 0` is the number one cause of instability.
- Intrinsic sizing: use `minmax()` / `fit-content` / `min-content` / `max-content` instead of fixed px so regions adapt safely to content.
- CLS prevention: reserve space for images, embeds, and dynamic content with `aspect-ratio` or width/height / min-height so late loads do not shift the layout.
- Stacking discipline: manage z-index on a scale (not improvised 999999) and use `isolation` for overlaps.
- Saturation and balance: no idle gaps, no weight skewed to one side.
- Space-model consistency: fixed and fluid regions assigned per intent; large-screen whitespace is intentional.
- Reflow verification: narrow screens collapse per the pattern's reflow (watch DOM order and accessibility).

## Output Format

Respond in the user's language. Lay out the decision as:

```markdown
## Space Model
fluid / fixed / hybrid, with the reason.

## Archetype
Chosen pattern id and name, matched by bestFor and cleared against avoidFor.

## Region Policy
Which regions are fixed (px) vs fluid (1fr), per content policy.

## Saturation & Balance
How regions fill the frame; note any intended negative space.

## Reflow
Narrow-screen behavior (Stack / Reorder / Reflow-Heavy) per the pattern.

## Component Mapping
relatedComponents to use and the build tokens for CSS.

## Stability Check
The checklist, each item confirmed.
```

## Usage notes

- If intent is vague, find candidates by `bestFor` / `aliases` first and ask the user 1 to 2 questions.
- When combining, check `avoidWith` for conflicts (for example, avoid Bento + Brutalism).
- This skill sets the layout skeleton and policy only. Visual style and tokens follow the design-system rules; component creation follows the `vdl-component-work` skill.
- This skill consumes the taxonomy; it does not add to or extend it.

## Fallback

If `.claude/skills/stable-layout/` or `src/data/layoutTaxonomyData.js` is not present locally, stop and tell the user this Codex skill depends on those source paths and cannot proceed without them.

Do not use the em dash character U+2014 in generated files, code, comments, or user-facing copy.
