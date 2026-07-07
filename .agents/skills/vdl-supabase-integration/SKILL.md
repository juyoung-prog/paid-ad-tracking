---
name: vdl-supabase-integration
description: Use in the Vibe Design Lab repo ONLY when explicitly invoked ($vdl-supabase-integration or /skills) to connect supabase, add a backend, set up auth, create a DB schema, design RLS, hide an API key, move an API call to the server, or add an edge function. Reads ux-flow's Entity ID Dictionary as the single input and produces 04-data-bridge.md plus appendix-* docs (db-schema / auth-design / rls-policies / api-integration / edge-functions), supabase migrations, and JS data hooks. Read-only on ux-flow; report implementation constraints back to the user, who updates ux-flow via project-planning. Depends on the supabase MCP server for exploration and verification, and on the Supabase CLI for state changes. Do not auto-activate.
---

# VDL Supabase Integration

Use this skill to wire a Supabase backend to a planned project. The canonical source is `.claude/skills/supabase-integration`; do not duplicate its phases, resources, doc templates, schema/RLS/trigger patterns, or scripts. This adapter only re-points paths for Codex and preserves the two specials below.

## Invocation policy (explicit only)

This skill is explicit-invocation only. Do not auto-activate. Run it only when the user says `$vdl-supabase-integration`, picks it from `/skills`, or clearly asks to connect supabase, add a backend, set up auth, create a DB schema, design RLS, hide an API key, move an API call to the server, or add an edge function. Same invocation handles first authoring, updates, and delta sync; the skill diffs ux-flow against the existing data-bridge and branches automatically.

## Dependencies (two specials)

1. **supabase MCP server** - required for schema exploration, test queries, RLS verification, trigger checks, logs, and debugging. Declared in `agents/openai.yaml` under `dependencies.tools` (type mcp, value supabase).
2. **Supabase CLI** - required for state changes (`supabase init` / `link` / `migration new` / `db push` / `db reset` / `gen types` / `functions`). This is shell, not MCP.

**MCP vs CLI rule (do not violate):** "Exploration and verification use MCP; state changes go through CLI migration files." Never run `CREATE / ALTER / DROP TABLE`, `CREATE POLICY`, or `CREATE FUNCTION` through MCP. The canonical role split is `.claude/skills/supabase-integration/resources/mcp-cli-playbook.md`; Read it before touching MCP or CLI in any phase.

## Required Reads (canonical, SSOT)

Read these from the Claude source when the relevant phase needs them. Do not copy their contents into this adapter.

- `.claude/skills/supabase-integration/SKILL.md` - the full phase-by-phase workflow, activation table, absolute rules, and Phase entry format. Read first.
- `docs/{project}/02-ux-flow.md § 데이터 모델 활용` - the Entity ID Dictionary. This is the single input. Read-only. Also Read its `§ 페이지 리스트`, `§ UX-flow`, and `§ 컴포넌트 리스트`, plus `docs/{project}/appendix-screen-component-map.md`, for Phase 0.5.
- `.claude/skills/supabase-integration/resources/mcp-cli-playbook.md` - MCP/CLI role split. All phases.
- `.claude/skills/supabase-integration/resources/doc-templates.md` - data-bridge + 5 appendix templates. Each doc-authoring step.
- `.claude/skills/supabase-integration/resources/schema-patterns.md` and `trigger-patterns.md` - Phase 1 (and triggers for Phase 2).
- `.claude/skills/supabase-integration/resources/auth-flows.md` - Phase 2.
- `.claude/skills/supabase-integration/resources/rls-patterns.md` - Phase 3.
- `.claude/skills/supabase-integration/resources/client-templates.md`, `error-catalog.md`, `storybook-mock.md` - Phase 4.
- `.claude/skills/supabase-integration/resources/verification-checklist.md` - Phase 3 and 5.
- `.claude/skills/supabase-integration/resources/edge-functions.md` - Phase 6 (conditional).
- `.claude/skills/project-planning/resources/sql-reserved-words.md` - Phase 0, to block reserved-word table names in the dictionary.
- `.claude/skills/supabase-integration/scripts/ts-to-jsdoc.mjs` - run in Phase 4 to convert generated TS types to JSDoc: `node .claude/skills/supabase-integration/scripts/ts-to-jsdoc.mjs`. This is the SSOT script; keep the source path.

If the Claude source folder is missing, stop and tell the user this Codex skill depends on that local source path.

## Workflow summary

Follow the phases in the source SKILL.md exactly; this is only a map. Each phase must lead with the source's "설명 → 질문 → 실행" entry format, and each phase is its own approval gate.

- **Phase 0 - Prereq Check** (auto): input doc + 2-component completeness, dictionary "예상 테이블명" filled, SQL reserved-word collision check, env / CLI / directory / MCP connectivity.
- **Phase 0.5 - Data Bridge** (main body, designer gate): produce `docs/{project}/04-data-bridge.md` mapping dictionary data names to tables in plain language. No SQL/columns/constraints. Auto-mirror to `src/stories/overview/{project}-planning/*.mdx`.
- **Phase 1 - Schema** → `appendix-db-schema.md` + `supabase migration new init_schema`.
- **Phase 2 - Auth** → `appendix-auth-design.md` + `appendix-auth-ui-spec.md`. Delegate auth UI to component-work (Codex: `$vdl-component-work`); this skill only makes hooks and the UI spec.
- **Phase 3 - RLS** → `appendix-rls-policies.md`. Minimum-privilege default; every table `ENABLE ROW LEVEL SECURITY`.
- **Phase 4/5 - Client + Verify** → `appendix-api-integration.md`, hooks in `src/hooks/data/`, `src/lib/supabase.js`, JSDoc types in `src/types/database.js`, migration apply + smoke test.
- **Phase 6 - Edge Functions** (conditional) → `appendix-edge-functions.md`, `supabase/functions/*/index.ts`, secrets via CLI only.

Run genuinely independent steps in parallel (for example, batch the Phase 0.5 input Reads in one turn). Keep ordered steps serial: explore with MCP before writing a migration, and verify with MCP after `db reset`.

## Absolute rules (do not violate)

Follow all rules in the source SKILL.md § 핵심 원칙. The load-bearing ones for Codex:

- ux-flow is read-only. On a conflict, report and pause with the source's `⚠️ ux-flow 갱신 필요` format, then ask the user to run project-planning (Codex: `$vdl-project-planning`) and re-invoke this skill.
- State changes only via migration files. Never `CREATE/ALTER/DROP` through MCP.
- `service_role` key never in the frontend. `.env.local` holds only `VITE_SUPABASE_ANON_KEY`. Never put external API keys in `VITE_*` - Vite inlines env into the bundle as plaintext.
- Do not hardcode or expose secrets. Read keys from environment variables and Supabase secrets only; never echo a set secret.
- JS project convention: JSDoc typedef, not TS. Storybook compatibility: every data hook accepts an injectable `{ client }`.

## Output Format

Respond in the user's language. Produce the same artifacts as the source: `04-data-bridge.md` (main body) plus the appendix docs, migration files under `supabase/migrations/`, JS hooks/lib/types, and (conditionally) edge functions, with the source's per-phase entry format and approval gates. Use the source's Phase 2 completion message verbatim when handing auth UI to component-work.

## Fallback

If the Claude source folder `.claude/skills/supabase-integration/` is missing, stop and tell the user this Codex skill is a thin adapter that depends on that local source path. If the supabase MCP server is not connected, stop before any exploration step and tell the user this skill depends on the supabase MCP server (declared in `agents/openai.yaml`).

## Guardrails

- Explicit invocation only; never auto-activate.
- Exploration and verification use MCP; state changes use CLI migration files.
- Never write to ux-flow; report constraints and pause.
- Do not duplicate the source's data, taxonomy, resources, or scripts here.
- Do not use the em dash character U+2014 in generated files, code, comments, or user-facing copy.
