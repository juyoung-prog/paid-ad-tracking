/**
 * 프로젝트 룰 관계 데이터 (자동 생성)
 *
 * 이 파일은 scripts/generate-rules.js 에 의해 자동 생성됩니다.
 * 직접 수정하지 마세요. 수정이 필요하면 스크립트를 수정하세요.
 *
 * 생성: pnpm generate-rules
 * 생성일: 2026-08-07
 */

export const priorityMeta = {
  root: { color: '#000000', label: 'Root', order: 0 },
  CRITICAL: { color: '#D32F2F', label: '절대 위반 불가', order: 1 },
  MUST: { color: '#ED6C02', label: '반드시 준수', order: 2 },
  SHOULD: { color: '#0288D1', label: '관련 작업 시 준수', order: 3 },
  Skill: { color: '#7B1FA2', label: 'Skill (의도 기반 활성화)', order: 4 },
  'Skill Resource': { color: '#9E9E9E', label: 'Skill Resource (on-demand)', order: 5 },
  'Codex Skill': { color: '#00897B', label: 'Codex Skill (.agents/skills)', order: 6 },
  'Codex Agent': { color: '#5E35B1', label: 'Codex Subagent (.codex/agents)', order: 7 },
};

export const ruleNodes = [
  {
    "id": "claude-md",
    "name": "CLAUDE.md",
    "priority": "root",
    "path": "CLAUDE.md",
    "description": "프로젝트 규칙 진입점 (라우터 역할)"
  },
  {
    "id": "code-convention",
    "name": "code-convention.md",
    "priority": "MUST",
    "path": ".claude/rules/code-convention.md",
    "description": "JavaScript + React.js 코드 작성 규칙"
  },
  {
    "id": "design-system",
    "name": "design-system.md",
    "priority": "MUST",
    "path": ".claude/rules/design-system.md",
    "description": "새로운 컴포넌트를 만들기 전에 반드시 기존 컴포넌트로 대체 가능한지 확인하고, 가능하면 최대한 재활용해라. 불필요한 중복 컴포넌트 생성을 피해야 함."
  },
  {
    "id": "directory-structure",
    "name": "directory-structure.md",
    "priority": "MUST",
    "path": ".claude/rules/directory-structure.md",
    "description": "파일/컴포넌트 생성 시 반드시 아래 구조를 따른다."
  },
  {
    "id": "mui-grid-usage",
    "name": "mui-grid-usage.md",
    "priority": "CRITICAL",
    "path": ".claude/rules/mui-grid-usage.md",
    "description": "```jsx"
  },
  {
    "id": "component-work",
    "name": "component-work (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/component-work/SKILL.md",
    "description": "ALWAYS invoke this skill when files under src/components/ are created, modified, or deleted. Do not edit component files directly. Use this skill first. Also trigger for any story file (.stories.jsx) work. Manages component taxonomy, design tokens, and interactive patterns for MUI-based design system."
  },
  {
    "id": "component-work--components",
    "name": "components.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/components.md",
    "description": "Vibe Dictionary 텍소노미 v0.4 기반 분류. 번호는 텍소노미 카테고리 번호."
  },
  {
    "id": "component-work--interactive-principles",
    "name": "interactive-principles.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/interactive-principles.md",
    "description": "> 기존 디자인 시스템 위에서 인터랙티브 컴포넌트 설계 시 따라야 할 원칙"
  },
  {
    "id": "component-work--mui-theme",
    "name": "mui-theme.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/mui-theme.md",
    "description": "MUI 커스텀 테마 설정 규칙"
  },
  {
    "id": "component-work--project-summary",
    "name": "project-summary.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/project-summary.md",
    "description": "**Starter Kit Basic**은 React + MUI + Storybook 환경을 디자이너에게 마치 디자인 툴처럼 사용할 수 있도록 도와주는 개발 환경입니다."
  },
  {
    "id": "component-work--refactoring-guide",
    "name": "refactoring-guide.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/refactoring-guide.md",
    "description": "> 리팩토링 작업 시 준수해야 할 가이드."
  },
  {
    "id": "component-work--storybook-writing",
    "name": "storybook-writing.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/storybook-writing.md",
    "description": "Storybook 스토리 작성 시 준수해야 할 규칙"
  },
  {
    "id": "component-work--taxonomy-index",
    "name": "taxonomy-index.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/taxonomy-index.md",
    "description": "> 전체 분류체계 빠른 참조용 인덱스"
  },
  {
    "id": "component-work--taxonomy-v0-4",
    "name": "taxonomy-v0.4.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/taxonomy-v0.4.md",
    "description": "---"
  },
  {
    "id": "component-work--typography-criteria",
    "name": "typography-criteria.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/component-work/resources/typography-criteria.md",
    "description": "> 이 파일은 `scripts/extract-design-criteria.mjs` 가 `src/data/typographyTaxonomyData.js` 에서 추출한 파생 뷰입니다."
  },
  {
    "id": "convert-external",
    "name": "convert-external (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/convert-external/SKILL.md",
    "description": "Converts external code (TypeScript, Tailwind, styled-components) into project-compliant MUI sx-based JSX components. Handles type removal, style migration, and taxonomy classification."
  },
  {
    "id": "convert-external--conversion-checklist",
    "name": "conversion-checklist.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/convert-external/resources/conversion-checklist.md",
    "description": "> 외부 코드 분석 시 감지해야 할 항목과 변환 규칙"
  },
  {
    "id": "project-planning",
    "name": "project-planning (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/project-planning/SKILL.md",
    "description": "Creates structured planning documents (project-summary, ux-flow, visual-direction) in docs/ for new feature or project initiatives."
  },
  {
    "id": "project-planning--doc-templates",
    "name": "doc-templates.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/project-planning/resources/doc-templates.md",
    "description": "> 각 Phase에서 문서 작성 시 이 템플릿의 구조를 따른다."
  },
  {
    "id": "project-planning--sql-reserved-words",
    "name": "sql-reserved-words.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/project-planning/resources/sql-reserved-words.md",
    "description": "`supabase-integration` 스킬의 Phase 0에서 참조하는 SSOT. ux-flow의 Entity ID Dictionary에서 뽑은 \"예상 테이블명/컬럼명\"이 아래 목록과 충돌하면 **차단**하고 사용자에게 ux-flow 갱신(이름 변경)을 요청한다."
  },
  {
    "id": "rule-visualization",
    "name": "rule-visualization (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/rule-visualization/SKILL.md",
    "description": "Syncs ruleRelationships.js data with actual .claude/ file structure and updates Storybook rule visualization. Run pnpm generate-rules instead for automated sync."
  },
  {
    "id": "skill-creator",
    "name": "skill-creator (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/skill-creator/SKILL.md",
    "description": "Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy."
  },
  {
    "id": "stable-layout",
    "name": "stable-layout (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/stable-layout/SKILL.md",
    "description": "안정된 레이아웃을 설계하는 스킬. 페이지·섹션·대시보드·폼·컴포넌트의 레이아웃 골격을 잡을 때, 레이아웃 택소노미(src/data/layoutTaxonomyData.js)를 지식 베이스로 삼아 공간 모델(유동/고정/혼합) 결정 → 아키타입 선택 → 영역 정책 → 공간 포화 → reflow → 컴포넌트 매핑 → 안정성 체크 순서로 진행하고, 넘침(overflow)·레이아웃 시프트(CLS)·유휴 구멍·불균형 같은 불안정을 차단한다. 사용자가 \"레이아웃 잡아줘\", \"이 화면 레이아웃 설계\", \"안정적인 레이아웃\", \"레이아웃이 깨진다/넘친다\", \"반응형 레이아웃 구성\", \"/layout\" 이라고 하거나 새 화면·섹션의 골격을 짤 때 반드시 사용한다."
  },
  {
    "id": "sub-agent-generator",
    "name": "sub-agent-generator (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/sub-agent-generator/SKILL.md",
    "description": "사용자의 의도와 조건을 받아 Claude Code subagent 파일(.claude/agents/<name>.md)을 자동 생성한다. \"subagent를 만들어줘\", \"에이전트 하나 만들자\", \"이 작업을 자동 위임하고 싶다\"는 요청이 나오면 PROACTIVELY 사용한다. .claude/agents/에 직접 파일을 쓰기 전에 MUST BE USED."
  },
  {
    "id": "supabase-integration",
    "name": "supabase-integration (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/supabase-integration/SKILL.md",
    "description": "Reads ux-flow's Entity ID Dictionary as the single input and produces data-bridge (main) plus appendix-* (db-schema / auth-design / rls-policies / api-integration / edge-functions). Read-only on ux-flow. Implementation constraints are reported back to the user, who must update ux-flow via /project-planning."
  },
  {
    "id": "supabase-integration--auth-flows",
    "name": "auth-flows.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/auth-flows.md",
    "description": "Phase 2, 4에서 참조. Email+Password 표준 플로우 + OAuth 확장 가이드."
  },
  {
    "id": "supabase-integration--client-templates",
    "name": "client-templates.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/client-templates.md",
    "description": "Phase 4에서 참조. 이 템플릿을 그대로 복사해 프로젝트에 맞게 엔티티명만 바꾼다."
  },
  {
    "id": "supabase-integration--doc-templates",
    "name": "doc-templates.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/doc-templates.md",
    "description": "Phase 0.5 ~ 6 에서 산출할 문서 템플릿. 본문 1종 (`04-data-bridge.md`) + 부록 5종 (`appendix-*.md`)."
  },
  {
    "id": "supabase-integration--edge-functions",
    "name": "edge-functions.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/edge-functions.md",
    "description": "> **핵심 원칙**: 외부 API(OpenAI, Stripe, 카카오, 결제, SMS 등)는 **로컬에서 기능을 먼저 검증**한 뒤, 검증이 끝나면 **Edge Function으로 반드시 옮긴다**. 프론트 번들에 비밀 키가 남으면 안 된다."
  },
  {
    "id": "supabase-integration--error-catalog",
    "name": "error-catalog.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/error-catalog.md",
    "description": "Phase 4에서 `src/utils/errorMessages.js` 생성 시 사용. Supabase 에러 코드/메시지를 한국어로 매핑."
  },
  {
    "id": "supabase-integration--mcp-cli-playbook",
    "name": "mcp-cli-playbook.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/mcp-cli-playbook.md",
    "description": "전 Phase에서 참조. Supabase MCP 서버와 Supabase CLI의 역할 분담 규칙."
  },
  {
    "id": "supabase-integration--rls-patterns",
    "name": "rls-patterns.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/rls-patterns.md",
    "description": "Phase 3에서 참조. 사용자 답변을 아래 패턴 중 하나에 매핑한다."
  },
  {
    "id": "supabase-integration--schema-patterns",
    "name": "schema-patterns.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/schema-patterns.md",
    "description": "Phase 1에서 반드시 참조. 모든 테이블에 공통 적용할 규칙과, 자주 쓰이는 엔티티 스키마 템플릿."
  },
  {
    "id": "supabase-integration--storybook-mock",
    "name": "storybook-mock.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/storybook-mock.md",
    "description": "Phase 4에서 참조. 데이터 훅이 Supabase 서버를 실제로 호출하지 않도록 mock 주입."
  },
  {
    "id": "supabase-integration--trigger-patterns",
    "name": "trigger-patterns.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/trigger-patterns.md",
    "description": "Phase 1, 2에서 참조. 반드시 생성해야 하는 트리거 템플릿."
  },
  {
    "id": "supabase-integration--verification-checklist",
    "name": "verification-checklist.md",
    "priority": "Skill Resource",
    "path": ".claude/skills/supabase-integration/resources/verification-checklist.md",
    "description": "Phase 3(RLS 검증), Phase 5(최종 검증), Phase 6(Edge Functions)에서 실행."
  },
  {
    "id": "visual-asset-prompt",
    "name": "visual-asset-prompt (Skill)",
    "priority": "Skill",
    "path": ".claude/skills/visual-asset-prompt/SKILL.md",
    "description": "막연한 비주얼 의도를 생성용 프롬프트로 재구성한다. 핵심은 Asset Template, 즉 FORMAT(비율·구도·배경·오브젝트 크기·프레임·여백)을 패턴으로 먼저 고정하고, 그 안에서 LOOK(매체·선·톤·색)을 잡은 뒤, SUBJECT만 가변으로 둔다. 시리즈는 FORMAT+LOOK 을 동결하고 마스터 이미지를 레퍼런스로 고정한 채 SUBJECT 만 순회한다. 먼저 호출 환경을 조사해 가용 생성기(Nano Banana / GPT)에 맞춰 최적화한다. 사용자가 명시한 제약(배경·색·매체·비율)은 잠그고 덮어쓰지 않는다. \"이런 느낌 이미지/일러스트/히어로/썸네일/다이어그램/3D/배경 만들어줘\", \"비주얼 프롬프트 짜줘\", \"메뉴 일러스트 시리즈\", \"/visual-asset\" 류 요청에 사용. 이미지를 직접 생성하지는 않고 spec 까지 만든 뒤 적합한 생성 스킬로 인계한다."
  },
  {
    "id": "agents-md",
    "name": "AGENTS.md",
    "priority": "root",
    "path": "AGENTS.md",
    "description": "Codex 규칙 진입점 (.agents/skills · .codex/agents 라우터)"
  },
  {
    "id": "codex-skill--vdl-component-work",
    "name": "vdl-component-work (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-component-work/SKILL.md",
    "description": "ALWAYS use in the Vibe Design Lab repo when files under src/components/ are created, modified, deleted, or refactored, or when any story file (.stories.jsx) is touched. Do not edit component or story files directly. Use this skill first. Also trigger when the user mentions making, editing, removing, or improving components or stories (\"컴포넌트 만들어줘\", \"수정해줘\", \"삭제해줘\", \"스토리 작성\", \"argTypes 추가\"). Manages component taxonomy, design tokens, and interactive patterns for the MUI-based design system. Start from the canonical Claude component-work source, reference its taxonomy and resources instead of duplicating them, keep design-token discipline, and hand off combination-unit outputs to the audit agents only after asking the user."
  },
  {
    "id": "codex-skill--vdl-convert-external",
    "name": "vdl-convert-external (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-convert-external/SKILL.md",
    "description": "Use in the Vibe Design Lab repo when the user pastes external component code, references src/externalComponents/, or asks to convert, adapt, or migrate outside code to match project conventions. Converts external code (TypeScript, Tailwind, styled-components, default exports) into project-compliant MUI sx-based JSX components, removing types, migrating styles to the sx prop, externalizing outside imports into props or theme tokens, classifying the component into the taxonomy, writing a Storybook story with the Placeholder system, and registering it. Korean triggers include 이거 변환해줘, 외부 컴포넌트 적용해줘, 프로젝트에 맞게 바꿔줘. Requires user approval of the conversion plan before writing code, and user confirmation before installing new dependencies or deleting the original source."
  },
  {
    "id": "codex-skill--vdl-project-planning",
    "name": "vdl-project-planning (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-project-planning/SKILL.md",
    "description": "Use in the Vibe Design Lab repo ONLY on explicit invocation ($vdl-project-planning or /skills) to author sequential planning documents for a new feature or project initiative. Triggers include \"기획 문서 작성해줘\", \"프로젝트 계획\", \"새 기능 기획\", \"project-summary 작성\", \"ux-flow 만들어줘\", \"visual-direction\", and \"다음 단계 진행해줘\". Produces project-summary, then ux-flow, then visual-direction under docs/{project-name}/, each behind an approval gate. Do NOT auto-activate; wait for direct user invocation. Starts from the canonical Claude project-planning source and does not duplicate its templates or workflow data."
  },
  {
    "id": "codex-skill--vdl-rule-visualization",
    "name": "vdl-rule-visualization (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-rule-visualization/SKILL.md",
    "description": "Explicit-invocation-only. Use in the Vibe Design Lab repo when a rule or skill or subagent is added, modified, or deleted and the rule relationship graph must be resynced. Triggers on \"$vdl-rule-visualization\", \"ruleRelationships sync\", \"룰 시각화 업데이트\", \"룰/규칙 추가·수정·삭제\", \"새 스킬 만들어줘/스킬 수정\", \"룰 관계 동기화\", \"rule graph resync\", or after editing files under .claude/rules, .claude/skills, .agents/skills, or .codex/agents. Syncs src/data/ruleRelationships.js with the actual on-disk rule and skill and subagent structure and refreshes the Storybook Overview/Rule Relationships visualization. In Codex the scan surface is re-pointed to span both the .claude/ tree and the Codex .agents/ plus .codex/ tree. Do not invoke implicitly; run pnpm generate-rules for the automated sync path."
  },
  {
    "id": "codex-skill--vdl-skill-creator",
    "name": "vdl-skill-creator (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-skill-creator/SKILL.md",
    "description": "Use in the Vibe Design Lab repo to create a new Codex skill or port a Claude Code skill into a Codex skill. Trigger when the user says \"codex 스킬 만들어\", \"스킬 codex용으로 이식\", \"port this skill to codex\", \"새 codex 스킬\", \"convert .claude/skills to .agents/skills\", or wants to author/edit anything under .agents/skills. Follows the VDL thin-adapter pattern, referencing the canonical .claude source as SSOT instead of duplicating data, and writes SKILL.md plus agents/openai.yaml to the Codex standard path .agents/skills/vdl-<name>/. Reads references/porting-rules.md and references/codex-spec.md before writing."
  },
  {
    "id": "codex-skill--vdl-stable-layout",
    "name": "vdl-stable-layout (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-stable-layout/SKILL.md",
    "description": "Use in the Vibe Design Lab repo when framing a stable layout skeleton for a page, section, dashboard, form, or component so that overflow, layout shift (CLS), idle gaps, and imbalance are prevented. Triggers on \"레이아웃 잡아줘\", \"이 화면 레이아웃 설계\", \"안정적인 레이아웃\", \"레이아웃이 깨진다/넘친다\", \"overflow\", \"CLS\", \"반응형 레이아웃 구성\", \"/layout\", or whenever a new screen or section skeleton is being framed. Consumes the layout taxonomy knowledge base (src/data/layoutTaxonomyData.js) and works in order: space model (fluid/fixed/hybrid) -> archetype -> region policy -> saturation -> reflow -> component mapping -> stability check. Pick patterns by bestFor and reject by avoidFor; never improvise. This skill consumes the taxonomy only; it does not extend it."
  },
  {
    "id": "codex-skill--vdl-sub-agent-generator",
    "name": "vdl-sub-agent-generator (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-sub-agent-generator/SKILL.md",
    "description": "Use in the Vibe Design Lab repo to create a Codex subagent as a TOML file at .codex/agents/<name>.toml, or to port a Claude Code subagent (.claude/agents/<name>.md) into that TOML format. Trigger when the user says \"codex 서브에이전트 만들어\", \"에이전트 codex용으로 이식\", \"port this agent to codex\", \"make a codex subagent\", or wants to author anything under .codex/agents. Converts markdown+YAML agent definitions into Codex TOML with developer_instructions, model, and sandbox_mode, mapping Claude tool whitelists onto sandbox_mode least-privilege. Reads reference.md before writing."
  },
  {
    "id": "codex-skill--vdl-supabase-integration",
    "name": "vdl-supabase-integration (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-supabase-integration/SKILL.md",
    "description": "Use in the Vibe Design Lab repo ONLY when explicitly invoked ($vdl-supabase-integration or /skills) to connect supabase, add a backend, set up auth, create a DB schema, design RLS, hide an API key, move an API call to the server, or add an edge function. Reads ux-flow's Entity ID Dictionary as the single input and produces 04-data-bridge.md plus appendix-* docs (db-schema / auth-design / rls-policies / api-integration / edge-functions), supabase migrations, and JS data hooks. Read-only on ux-flow; report implementation constraints back to the user, who updates ux-flow via project-planning. Depends on the supabase MCP server for exploration and verification, and on the Supabase CLI for state changes. Do not auto-activate."
  },
  {
    "id": "codex-skill--vdl-visual-asset-prompt",
    "name": "vdl-visual-asset-prompt (Codex Skill)",
    "priority": "Codex Skill",
    "path": ".agents/skills/vdl-visual-asset-prompt/SKILL.md",
    "description": "Use in the Vibe Design Lab repo when turning vague visual intent into a restrained generation-ready prompt spec for images, illustrations, heroes, thumbnails, diagrams, 3D objects, abstract backgrounds, icons, menu illustration series, or \"/visual-asset\" style requests. Start from the canonical Claude visual-asset-prompt source, lock an Asset Template first, FORMAT as ratio, composition, background, object scale, crop, margins, and asset type, then choose 1 to 2 LOOK keywords, and keep SUBJECT as the only variable for series. Target the Codex built-in image model (gpt-image 2.0 / latest), preserve user constraints, run independent steps in parallel, run the deterministic derive engine for negatives, and route to the appropriate VDL generation or implementation skill. Do not directly generate images mid-spec from this skill."
  },
  {
    "id": "codex-agent--ai-slop-fixer",
    "name": "ai-slop-fixer.toml",
    "priority": "Codex Agent",
    "path": ".codex/agents/ai-slop-fixer.toml",
    "description": "Detects AI-slop design cliches in Next.js + MUI code (purple-blue gradients, indigo-500 accents, Inter-everywhere typography, centered heros, icon-top 3-card rows, glassmorphism, gradient text, uniform rounding, AI buzzword copy, em-dash overuse) and prescribes concrete replacements by following each taxonomy entry's escape into the design, layout, and visual dictionaries. Reports by default; applies fixes only when explicitly asked. Use PROACTIVELY immediately after generating a new page, landing section, or component, and MUST BE USED when the user says \\\"AI 티 난다\\\", \\\"슬롭 점검\\\", \\\"디자인이 뻔하다/평범하다\\\", \\\"다른 AI 사이트랑 똑같다\\\", \\\"보라색/그라디언트 빼줘\\\", \\\"클리셰 잡아줘\\\", or \\\"이 화면 슬롭 고쳐\\\". Keywords: MUI sx, aiSlopTaxonomyData, design cliche, gradient, design token. Delegates standalone long-form Korean prose humanizing to humanize-korean, and general design-token QA to design-qa.\nsandbox_mode ="
  },
  {
    "id": "codex-agent--design-system-auditor",
    "name": "design-system-auditor.toml",
    "priority": "Codex Agent",
    "path": ".codex/agents/design-system-auditor.toml",
    "description": "Audits and refactors components in src/components/** against the /component-work skill standards: replaces hard-coded colors/typography/spacing with theme tokens, fixes wrong MUI Grid imports, flags duplicate components, and syncs Storybook stories. Use PROACTIVELY when the user asks to audit, lint, normalize, or refactor the design system, components, design tokens, or stories. MUST BE USED before merging large component batches or when the user mentions \\\"디자인 시스템 점검\\\", \\\"토큰화\\\", \\\"컴포넌트 정리\\\". Domain keywords: theme token, MUI Grid, Storybook story."
  },
  {
    "id": "codex-agent--stable-layout-auditor",
    "name": "stable-layout-auditor.toml",
    "priority": "Codex Agent",
    "path": ".codex/agents/stable-layout-auditor.toml",
    "description": "Audits implemented layout code (src/components/**, app/**) against the stable-layout skill's principles and stability checklist: space model (fluid/fixed/hybrid) consistency, overflow containment (min-width:0), intrinsic sizing, CLS prevention (aspect-ratio), stacking discipline, space saturation and balance, and reflow. Reports a prioritized fix list by default and applies the approved fixes only when the invocation explicitly authorizes apply mode. Use PROACTIVELY immediately after building or editing a page, section, or component layout. MUST BE USED when the user says 레이아웃 안정성 점검, stable-layout 기준으로 검사, 레이아웃 감사, 이 화면 안정적인지 봐줘, or /layout-audit."
  },
  {
    "id": "codex-agent--typography-auditor",
    "name": "typography-auditor.toml",
    "priority": "Codex Agent",
    "path": ".codex/agents/typography-auditor.toml",
    "description": "Audits typography in Next.js 16 + MUI 7 code against the verified positive patterns in the typography taxonomy (role tiers, measure/line-length, leading, Korean setting via KLREQ, rem/clamp responsive sizing, optical sizing, OpenType numerics, text-wrap, font-loading/CLS, kinetic-motion a11y) and prescribes the concrete fix from each entry's build/bestFor/avoidFor. Reports by default and applies fixes only when the invocation authorizes it. Use PROACTIVELY immediately after building a text-heavy page, hero, article, or component. MUST BE USED when the user says 타이포 점검, 타이포그래피 점검, 글자 점검, 본문 가독성, 줄길이/행간 점검, 한글 조판 점검, or /typo-audit. Delegates AI-cliché typography tells (Inter-everywhere, gradient text, all-caps eyebrow) to ai-slop-fixer, layout stability to stable-layout-auditor, bundle/perf to frontend-perf-auditor, general token/spacing QA to design-qa, and long-form Korean prose humanizing to humanize-korean."
  }
];

export const edgeTypes = {
  loads: { label: '자동 로드', style: 'solid' },
  references: { label: '텍스트 참조', style: 'dashed' },
  conditional: { label: '조건부 참조', style: 'dotted' },
  activates: { label: '의도 기반 활성화', style: 'solid' },
  resources: { label: 'on-demand Read', style: 'dashed' },
};

export const ruleEdges = [
  {
    "from": "claude-md",
    "to": "code-convention",
    "type": "loads"
  },
  {
    "from": "claude-md",
    "to": "design-system",
    "type": "loads"
  },
  {
    "from": "claude-md",
    "to": "directory-structure",
    "type": "loads"
  },
  {
    "from": "claude-md",
    "to": "mui-grid-usage",
    "type": "loads"
  },
  {
    "from": "claude-md",
    "to": "component-work",
    "type": "activates",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--components",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--interactive-principles",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--mui-theme",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--project-summary",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--refactoring-guide",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--storybook-writing",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--taxonomy-index",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--taxonomy-v0-4",
    "type": "resources",
    "note": ""
  },
  {
    "from": "component-work",
    "to": "component-work--typography-criteria",
    "type": "resources",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "convert-external",
    "type": "activates",
    "note": ""
  },
  {
    "from": "convert-external",
    "to": "convert-external--conversion-checklist",
    "type": "resources",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "project-planning",
    "type": "activates",
    "note": ""
  },
  {
    "from": "project-planning",
    "to": "project-planning--doc-templates",
    "type": "resources",
    "note": ""
  },
  {
    "from": "project-planning",
    "to": "project-planning--sql-reserved-words",
    "type": "resources",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "rule-visualization",
    "type": "activates",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "skill-creator",
    "type": "activates",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "stable-layout",
    "type": "activates",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "sub-agent-generator",
    "type": "activates",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "supabase-integration",
    "type": "activates",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--auth-flows",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--client-templates",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--doc-templates",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--edge-functions",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--error-catalog",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--mcp-cli-playbook",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--rls-patterns",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--schema-patterns",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--storybook-mock",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--trigger-patterns",
    "type": "resources",
    "note": ""
  },
  {
    "from": "supabase-integration",
    "to": "supabase-integration--verification-checklist",
    "type": "resources",
    "note": ""
  },
  {
    "from": "claude-md",
    "to": "visual-asset-prompt",
    "type": "activates",
    "note": ""
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-component-work",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-component-work",
    "to": "component-work",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-convert-external",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-convert-external",
    "to": "convert-external",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-project-planning",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-project-planning",
    "to": "project-planning",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-rule-visualization",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-rule-visualization",
    "to": "rule-visualization",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-skill-creator",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-skill-creator",
    "to": "skill-creator",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-stable-layout",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-stable-layout",
    "to": "stable-layout",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-sub-agent-generator",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-sub-agent-generator",
    "to": "sub-agent-generator",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-supabase-integration",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-supabase-integration",
    "to": "supabase-integration",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-skill--vdl-visual-asset-prompt",
    "type": "activates",
    "note": ""
  },
  {
    "from": "codex-skill--vdl-visual-asset-prompt",
    "to": "visual-asset-prompt",
    "type": "references",
    "note": "canonical SSOT"
  },
  {
    "from": "agents-md",
    "to": "codex-agent--ai-slop-fixer",
    "type": "activates",
    "note": ""
  },
  {
    "from": "agents-md",
    "to": "codex-agent--design-system-auditor",
    "type": "activates",
    "note": ""
  },
  {
    "from": "agents-md",
    "to": "codex-agent--stable-layout-auditor",
    "type": "activates",
    "note": ""
  },
  {
    "from": "agents-md",
    "to": "codex-agent--typography-auditor",
    "type": "activates",
    "note": ""
  }
];

export const conditionMatrix = [
  {
    "task": "컴포넌트 생성",
    "rules": [
      "code-convention",
      "design-system"
    ],
    "skill": "component-work",
    "skillResources": [
      "component-work--taxonomy-index",
      "component-work--storybook-writing"
    ]
  },
  {
    "task": "컴포넌트 수정",
    "rules": [
      "code-convention",
      "design-system"
    ],
    "skill": "component-work",
    "skillResources": [
      "component-work--storybook-writing"
    ]
  },
  {
    "task": "컴포넌트 삭제",
    "rules": [],
    "skill": "component-work"
  },
  {
    "task": "인터랙티브 컴포넌트",
    "rules": [
      "code-convention",
      "design-system"
    ],
    "skill": "component-work",
    "skillResources": [
      "component-work--taxonomy-index",
      "component-work--interactive-principles",
      "component-work--storybook-writing"
    ]
  },
  {
    "task": "스토리 작성/수정",
    "rules": [],
    "skill": "component-work",
    "skillResources": [
      "component-work--storybook-writing"
    ]
  },
  {
    "task": "외부 코드 변환",
    "rules": [
      "code-convention",
      "design-system"
    ],
    "skill": "convert-external",
    "skillResources": [
      "convert-external--conversion-checklist"
    ]
  },
  {
    "task": "리팩토링",
    "rules": [
      "code-convention"
    ],
    "skill": "component-work",
    "skillResources": [
      "component-work--refactoring-guide"
    ]
  },
  {
    "task": "테마/스타일 수정",
    "rules": [
      "design-system"
    ],
    "skillResources": [
      "component-work--mui-theme"
    ]
  },
  {
    "task": "Grid 사용",
    "rules": [
      "mui-grid-usage"
    ]
  }
];
