---
name: vdl-project-planning
description: Use in the Vibe Design Lab repo ONLY on explicit invocation ($vdl-project-planning or /skills) to author sequential planning documents for a new feature or project initiative. Triggers include "기획 문서 작성해줘", "프로젝트 계획", "새 기능 기획", "project-summary 작성", "ux-flow 만들어줘", "visual-direction", and "다음 단계 진행해줘". Produces project-summary, then ux-flow, then visual-direction under docs/{project-name}/, each behind an approval gate. Do NOT auto-activate; wait for direct user invocation. Starts from the canonical Claude project-planning source and does not duplicate its templates or workflow data.
---

# VDL Project Planning

Use this skill to write structured planning documents (project-summary, ux-flow, visual-direction) in a sequential, approval-gated workflow. The canonical source is `.claude/skills/project-planning`; do not duplicate its templates, workflow, or the cross-referenced component-work resources.

## Activation

This skill is EXPLICIT-INVOCATION-ONLY. It activates only when the user explicitly invokes it (`$vdl-project-planning` or `/skills`). Do not auto-activate and do not select it implicitly from task matching, even when a request sounds planning related. Wait for direct user invocation.

## Required Reads

Read these from the canonical Claude source when the workflow reaches each point. Paths are the SSOT; do not copy their content into this skill.

- Read `.claude/skills/project-planning/SKILL.md` first for the full source workflow, phase gates, and core principles.
- Read `.claude/skills/project-planning/resources/doc-templates.md` at the start of each phase for the matching document template (project-summary, ux-flow, visual-direction).
- Read `.claude/skills/component-work/resources/components.md` in Phase 2 to check existing components for reuse.
- Read `.claude/skills/component-work/resources/taxonomy-index.md` in Phase 2 to map new needs onto categories.
- Read `.claude/skills/component-work/resources/mui-theme.md` in Phase 3 to confirm current design tokens.

If the Claude source folder is missing, stop and tell the user this Codex skill depends on that local source path.

## Workflow

Follow the source SKILL.md. Summary of the three phases, each ending in an approval gate:

1. Phase 1 - project-summary: ask the user for project purpose and scope, read the template, then write `docs/{project-name}/01-project-summary.md` (name, purpose, key features, target users, constraints). Present for approval.
2. Phase 2 - ux-flow (only after Phase 1 approval): read the approved summary, the template, and the component-work reuse and taxonomy references, then write `docs/{project-name}/02-ux-flow.md` (user scenarios, Mermaid flow diagram, information architecture, data model, reuse-vs-new component list). Present for approval.
3. Phase 3 - visual-direction (only after Phase 2 approval; can also run right after Phase 1 if the user asks): read the approved summary, the template, and the mui-theme reference, then write `docs/{project-name}/03-visual-direction.md` (design token direction, changes vs current theme, user-provided reference images or sites, tone-and-manner keywords). Present for approval.

Individual documents: if the user asks for only one phase, confirm the prerequisite document exists (for example, ux-flow needs an existing project-summary). If it is missing, guide the user to start from Phase 1.

Core principles from the source: never advance a phase without approval; prefer structured lists and tables over prose; check existing components for reuse before proposing new ones; use Mermaid for flows and IA; never invent reference image URLs (the user supplies them).

All planning documents are written under `docs/{project-name}/`.

## Output Format

Use the user's language unless they ask otherwise. Follow the templates in `doc-templates.md` exactly. Each phase ends by presenting the written document for the user to revise or approve before the next phase begins.

## Fallback

If `.claude/skills/project-planning/` (or a required cross-referenced `.claude/skills/component-work/resources/*.md`) is missing, stop and tell the user this Codex skill is a thin adapter that depends on those local Claude source paths.

Do not use the em dash character U+2014 in generated files or user-facing copy.
