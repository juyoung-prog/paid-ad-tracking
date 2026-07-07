---
name: vdl-component-work
description: ALWAYS use in the Vibe Design Lab repo when files under src/components/ are created, modified, deleted, or refactored, or when any story file (.stories.jsx) is touched. Do not edit component or story files directly. Use this skill first. Also trigger when the user mentions making, editing, removing, or improving components or stories ("컴포넌트 만들어줘", "수정해줘", "삭제해줘", "스토리 작성", "argTypes 추가"). Manages component taxonomy, design tokens, and interactive patterns for the MUI-based design system. Start from the canonical Claude component-work source, reference its taxonomy and resources instead of duplicating them, keep design-token discipline, and hand off combination-unit outputs to the audit agents only after asking the user.
---

# VDL Component Work

Use this skill before any component or story work in this repo. The canonical source is `.claude/skills/component-work`; do not duplicate its taxonomy, resources, or component registry. This adapter points at the source and only re-points the few Codex-specific details.

The single source of truth is the same on both agents: `src/data/*TaxonomyData.js` for design criteria, and `.claude/skills/component-work/resources/*` for the workflow detail. If the source changes, this adapter follows it automatically.

## Required Reads

Read the source first, then load resources on demand by phase. Paths are the original `.claude/skills/component-work/...` (SSOT).

- Read `.claude/skills/component-work/SKILL.md` for the full source workflow (intent branching, conditional-load rules, handoff policy). This is the binding recipe.
- Read `.claude/skills/component-work/resources/taxonomy-index.md` first when creating a component, to surface the category and archetype candidates. Use `taxonomy-v0.4.md` only when you need the full category detail.
- Read `.claude/skills/component-work/resources/components.md` on create, modify, or delete to avoid duplicates, and update it (MUST) when a component changes.
- Read `.claude/skills/component-work/resources/storybook-writing.md` whenever you write or sync a `.stories.jsx` file.
- Read `.claude/skills/component-work/resources/interactive-principles.md` when the work uses an animation library (Framer Motion, GSAP), scroll-based interaction, taxonomy categories #11 to #15, or interaction beyond plain CSS animation.
- Read `.claude/skills/component-work/resources/typography-criteria.md` only when text is the primary content (article, longform, hero copy, form labels, table or numeric columns), or the user mentions readability, line length, leading, Korean setting, or font size.
- Read `.claude/skills/component-work/resources/mui-theme.md` when editing theme or styles, and `refactoring-guide.md` when refactoring, and `project-summary.md` for onboarding or context.
- Inspect `src/data/*TaxonomyData.js` (design, layout, typography, ai-slop, visual-asset) only for the specific design-criterion detail you need; this is the shared origin the audit agents also use.

If the Claude source folder is missing, stop and tell the user this Codex skill depends on that local source path (`.claude/skills/component-work/`).

## Workflow

Follow the source SKILL.md. Summary of the intent branches (read the source for the full steps):

- Create: clarify intent, reference the taxonomy index for category and archetype candidates, check `components.md` for reuse, load design criteria conditionally (typography criteria for text-heavy work; the `vdl-stable-layout` skill for combination or page or section or hero layouts; the ai-slop default-block nudge always on), then implement per the directory structure, write the story, and update `components.md`. Sync `src/data/ruleRelationships.js` when applicable.
- Modify: identify the target via `components.md`, confirm current behavior, implement while preserving existing behavior, sync the story, and update the `components.md` description on functional change.
- Delete: check dependents, remove the component and story files, and remove the entry from `components.md`.
- Story: read `storybook-writing.md`, then write or edit the story.

Taxonomy is context guidance, not an absolute rulebook: it frames "is this the context you mean?" rather than "pick one". Patterns not in the taxonomy still map to the nearest category.

Design-token discipline is always on: use this project's palette and accent tokens (`primary.main`, brand accent), the project font stack, theme spacing, and hierarchical rounding. Avoid the base-model clichés (purple-blue gradient surfaces, indigo default accent, centered auto-margin hero, single safe sans everywhere, uniform borderRadius).

### Codex re-pointing

- Where the source names the Claude `stable-layout` skill, use the Codex `vdl-stable-layout` skill (same origin: `src/data/layoutTaxonomyData.js`). If it is not yet ported, follow its procedure directly from `src/data/layoutTaxonomyData.js`.
- Where the source hands off to audit agents (`stable-layout-auditor`, `typography-auditor`, `ai-slop-fixer`), use the equivalent Codex subagents if present; otherwise report to the user which check is recommended.
- Tool phrasing from the source ("Read X", "run `node scripts/...`") maps directly to Codex shell and apply_patch. Keep the original script paths unchanged; the source scripts are the SSOT (for example `node scripts/extract-design-criteria.mjs` to regenerate the typography-criteria view).

## Output Format

Use the user's language unless they ask otherwise. Follow the source structure: state the intent branch, the taxonomy category or archetype considered, the reuse-versus-new decision with reference to `components.md`, the implementation location per the directory rules, and the story sync. Confirm that `components.md` was updated.

## Post-creation handoff

Only when the output is a combination unit (page, landing section, hero, text-heavy view, or a composition of several components), ask the user first whether to run an audit. Do not auto-invoke. Propose the agent that fits the output (layout audit for combination or page or hero, typography audit for text-heavy views, ai-slop check for new screens or landing including color, composition, and copy). Run them only on user agreement, in parallel when there are several, and merge the results. For atomic components, story edits, deletes, or simple prop changes, do not propose an audit.

## Guardrails

- Do not edit component or story files without going through this workflow first.
- Do not duplicate the source taxonomy, resources, or component registry into this skill; reference them.
- Keep design-token discipline; do not hardcode arbitrary color, font size, or spacing.
- Use `import Grid from '@mui/material/Grid'` (never `Grid2`), per the repo Grid rule.
- Do not use the em dash character U+2014 in generated files, code, comments, or user-facing copy.
