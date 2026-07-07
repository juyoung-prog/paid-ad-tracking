---
name: vdl-convert-external
description: Use in the Vibe Design Lab repo when the user pastes external component code, references src/externalComponents/, or asks to convert, adapt, or migrate outside code to match project conventions. Converts external code (TypeScript, Tailwind, styled-components, default exports) into project-compliant MUI sx-based JSX components, removing types, migrating styles to the sx prop, externalizing outside imports into props or theme tokens, classifying the component into the taxonomy, writing a Storybook story with the Placeholder system, and registering it. Korean triggers include 이거 변환해줘, 외부 컴포넌트 적용해줘, 프로젝트에 맞게 바꿔줘. Requires user approval of the conversion plan before writing code, and user confirmation before installing new dependencies or deleting the original source.
---

# VDL Convert External

Use this skill to convert external code dropped into `src/externalComponents/` into project-compliant MUI JSX. The canonical source is `.claude/skills/convert-external`; do not duplicate its checklist, conversion rules, or the cross-referenced component-work resources. Read them at the step noted below.

## Required Reads

- Read `.claude/skills/convert-external/SKILL.md` for the full source workflow, activation table, and core principles.
- Read `.claude/skills/convert-external/resources/conversion-checklist.md` in step 1 (always) to detect conversion items.
- Read `.claude/skills/component-work/resources/taxonomy-index.md` in step 2 to propose category candidates. This is the SSOT canonical path, not the vdl copy.
- Read `.claude/skills/component-work/resources/storybook-writing.md` in step 4 before writing the story.
- Read `.claude/skills/component-work/resources/interactive-principles.md` in step 4 only when the component is interactive (Framer Motion, GSAP, Three.js, scroll-based interaction, taxonomy #11 to #15, or interaction beyond CSS animation).
- Consult `components.md` (loaded via project rules) to check for duplicate or similar existing components, and to register the new component in step 5.

If the Claude source folder is missing, stop and tell the user this Codex skill depends on that local source path.

## Workflow

Follow the 5-stage workflow in the source SKILL.md. Read it and follow it; the summary below is orientation only.

1. Analyze: Read the target file in `src/externalComponents/`, read the conversion checklist, and report detected items (language, styles, external deps, external imports, difficulty).
2. Classify: propose taxonomy category candidates from `taxonomy-index.md`, check `components.md` for overlap, and confirm the category with the user.
3. Conversion plan (approval required): present the concrete per-item conversion method (TS to JSX with JSDoc, Tailwind to sx, external imports to props or theme tokens, dependency installs, export style). Do not write code without user approval.
4. Implement: convert the file to `.jsx` following `code-convention.md` and the directory rules, place it in the taxonomy category directory, write a Storybook story using the Placeholder system, and read `interactive-principles.md` when interactive.
5. Register: update `components.md`, then delete the `src/externalComponents/` original only after user confirmation.

Codex specifics: run tool actions as natural-language file operations (read files, apply patches). Respond in the user's language. Follow every CRITICAL and MUST rule in CLAUDE.md and the project rules during conversion, especially the MUI Grid import rule (`import Grid from '@mui/material/Grid'`). Do not hardcode or expose API keys. Do not use the em dash character U+2014 in generated files, comments, or user-facing copy.

## Output Format

Mirror the source structure. Use the user's language.

- Analysis report: file, language, styles, external dependencies, external imports, conversion difficulty.
- Classification candidates: category number and name with a similarity note, ending in a category question.
- Conversion plan: numbered per-item conversion methods, presented for approval before any code is written.
- Implementation summary: converted file path, story path, and any dependency the user must confirm.
- Registration: the `components.md` line added, and the original-deletion confirmation prompt.

## Fallback

- No approval, no code. Stop at the conversion plan until the user approves.
- New dependencies require user confirmation before install.
- Preserve the original in `src/externalComponents/` until the user confirms deletion in step 5.
- Project CRITICAL and MUST rules are never violated during conversion.
