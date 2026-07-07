# AGENTS.md (Codex 진입점)

이 파일은 Codex CLI의 always-on 프로젝트 컨텍스트다. Claude Code의 `CLAUDE.md`에 대응한다. 규칙의 단일 원천(SSOT)은 `.claude/rules/*.md`이며, 이 문서는 그 규칙을 Codex 자산으로 라우팅한다.

## 규칙 (SSOT는 .claude/rules/)

다음 규칙은 항상 준수한다. 상세는 각 파일을 Read한다.

- **MUI Grid import (CRITICAL)**: `import Grid from '@mui/material/Grid';` 만 사용. `Grid2` 금지. Props: `<Grid container spacing={2}>`, `<Grid size={{ xs: 6, md: 8 }}>`. → `.claude/rules/mui-grid-usage.md`
- **디렉토리 구조**: 파일/컴포넌트는 정해진 구조에 배치. 컴포넌트는 `src/components/{카테고리}/`, 스토리는 같은 폴더. → `.claude/rules/directory-structure.md`
- **코드 컨벤션**: 2-space indent, single quotes, 세미콜론, camelCase 함수 / PascalCase 컴포넌트, props 구조분해 + 주석. → `.claude/rules/code-convention.md`
- **디자인 시스템**: 기존 컴포넌트 재활용 우선, 디자인 토큰(theme.palette/typography/spacing) 사용, 임의 색상·크기 금지, MUI sx 기반. → `.claude/rules/design-system.md`

룰을 수정하면 `pnpm generate-rules` 로 Storybook 시각화를 동기화한다.

## 워크플로우 → Codex 스킬

작업 유형별로 해당 스킬을 `$mention` 또는 `/skills` 로 호출한다. 스킬은 `.agents/skills/`에 있다.

| 작업 | Codex 스킬 |
|------|-----------|
| 컴포넌트 생성/수정/삭제, 스토리 작업 | `$vdl-component-work` (필수) |
| 외부 코드(TS/Tailwind/styled) 변환 | `$vdl-convert-external` |
| 기획 문서 작성 | `$vdl-project-planning` (명시 호출) |
| 레이아웃 설계 | `$vdl-stable-layout` |
| Supabase 백엔드/인증/RLS | `$vdl-supabase-integration` (명시 호출, MCP 의존) |
| 비주얼 생성 프롬프트 | `$vdl-visual-asset-prompt` |
| 룰 시각화 동기화 | `$vdl-rule-visualization` (명시 호출) |
| 새 Codex 스킬 저작/이식 | `$vdl-skill-creator` |
| Codex 서브에이전트(TOML) 저작 | `$vdl-sub-agent-generator` |

## 서브에이전트 (.codex/agents/)

경계가 명확한 검사/리팩터 작업은 서브에이전트에 위임한다.

- `ai-slop-fixer` - AI 슬롭 디자인 클리셰 탐지·교정
- `design-system-auditor` - 컴포넌트 토큰화·Grid import·스토리 감사/리팩터
- `stable-layout-auditor` - 레이아웃 안정성(overflow·CLS·스태킹) 감사
- `typography-auditor` - 타이포그래피(줄길이·행간·한글 조판·rem/clamp) 감사

## VDL 어댑터 규약 (중요)

Codex 스킬(`.agents/skills/vdl-*`)은 **얇은 어댑터**다. `.claude/skills/<name>/`와 `src/data/*TaxonomyData.js`를 canonical source(SSOT)로 **참조만** 하고 데이터를 복제하지 않는다. 따라서 원본이 바뀌면 Codex도 자동 추종한다. 새 스킬/에이전트를 만들 때 이 규약을 지킨다. 규칙 SSOT: `.agents/skills/vdl-skill-creator/references/{codex-spec.md,porting-rules.md}`.

## 금지

- em dash 문자(U+2014)를 생성 파일·프롬프트·주석·사용자 카피에 쓰지 않는다.
- 컴포넌트/스토리 파일을 스킬 없이 직접 수정하지 않는다. 먼저 `$vdl-component-work`.
