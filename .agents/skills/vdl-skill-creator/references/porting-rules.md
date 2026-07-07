# Claude → Codex 이식 규칙 (VDL 어댑터 패턴)

이 문서는 `.claude/skills/<name>` 를 Codex 스킬 `.agents/skills/vdl-<name>` 로 옮기는 단일 기준이다. 병렬 이식 워커는 이 규칙을 그대로 따른다. 스펙 근거는 `codex-spec.md`.

## 핵심 철학: 얇은 어댑터, 데이터 무복제

**Codex 스킬은 Claude 원본을 canonical source(SSOT)로 참조한다. taxonomy·compatibility 데이터·negative 로직·resources 를 복제하지 않는다.**

레퍼런스 구현: `.agents/skills/vdl-visual-asset-prompt/`. 이 스킬은 `.claude/skills/visual-asset-prompt/` 의 SKILL.md·references·ssot·scripts 를 "필요할 때 Read/실행"으로 가리키고, Codex 특화(모델·호출)만 재지정한다. 모든 이식은 이 형태를 따른다.

이 철학 덕분에 **SSOT(`src/data/*TaxonomyData.js`, `resources/*`, `ssot/*.json`)가 양쪽 에이전트에서 동일**하다. 원본이 바뀌면 Codex 어댑터도 자동으로 최신 기준을 따른다.

## 산출물 (스킬당)

```
.agents/skills/vdl-<name>/
├── SKILL.md            (어댑터 본문 - 원본을 참조, 데이터 무복제)
└── agents/openai.yaml  (Codex UI 메타 + policy)
```

net-new 리소스(원본에 없는 Codex 전용 스크립트/참조)가 꼭 필요할 때만 `scripts/`·`references/` 를 추가한다. 기본은 SKILL.md + openai.yaml 두 파일이다.

## 6단계 이식 레시피

1. **원본 정독**: `.claude/skills/<name>/SKILL.md` + frontmatter + 참조하는 resources 목록 파악.
2. **name**: `vdl-<original-name>`. 소문자·하이픈.
3. **description 작성** (`codex-spec.md` §4 예산 준수):
   - 트리거 use case를 **맨 앞에 front-load**. "Use in the Vibe Design Lab repo when ..." 형태.
   - Claude의 `when_to_use` 문장을 description에 흡수.
   - 원본 트리거 키워드(한글 발화 포함)를 담되 8,000자/2% 안에서 간결히.
4. **SKILL.md 본문 = 어댑터**:
   - 첫 줄에 canonical source 명시: "The canonical source is `.claude/skills/<name>`; do not duplicate its data/taxonomy/resources."
   - **Required Reads** 섹션: 원본의 SKILL.md·references·데이터 파일을 "언제 Read하는지"와 함께 나열. 경로는 `.claude/skills/<name>/...` 원본 그대로 (SSOT).
   - **Workflow**: 원본 워크플로우를 요약하되, 원본을 Read해서 따르라고 지시. Codex 특화 재지정만 본문에 적는다 (아래 §변환 매핑).
   - **Fallback**: "If the Claude source folder is missing, stop and tell the user this Codex skill depends on that local source path."
   - **Output Format**: 원본과 동일 구조 유지. 사용자 언어로 응답.
5. **agents/openai.yaml 작성** (§아래 템플릿).
6. **검증**: §검증 체크리스트.

## 변환 매핑 (Claude → Codex)

| 항목 | Claude | Codex |
|------|--------|-------|
| 스킬 경로 | `.claude/skills/<name>/` | `.agents/skills/vdl-<name>/` |
| 에이전트 경로 | `.claude/agents/<name>.md` | `.codex/agents/<name>.toml` |
| frontmatter | name/description/when_to_use/user-invocable/disable-model-invocation | name/description (+ openai.yaml) |
| 명시 호출 전용 | `disable-model-invocation: true` | openai.yaml `policy.allow_implicit_invocation: false` |
| 스킬 호출 구문 | `/skill` 또는 Skill 툴 | `$vdl-skill` 또는 `/skills` |
| 도구명 | Read / Edit / Grep / Glob / Bash | 자연어 지시로 유지 (Codex는 shell + apply_patch). "Read X"·"run `node …`"는 그대로 통함 |
| cross-skill 참조 | `component-work/resources/…` | canonical: `.claude/skills/component-work/resources/…` (원본 유지) |
| 하드코딩 스크립트 경로 | `node .claude/skills/<name>/scripts/x.mjs` | **원본 경로 그대로 유지** (원본 스크립트가 SSOT) |
| MCP 의존 | 본문 언급 | openai.yaml `dependencies.tools` 선언 |
| 서브에이전트 포맷 | MD + YAML frontmatter | TOML (`developer_instructions`/`model`/`sandbox_mode`) |

## agents/openai.yaml 템플릿

```yaml
interface:
  display_name: "VDL <Human Name>"
  short_description: "<한 줄 요약>"
  default_prompt: "Use $vdl-<name> to <핵심 작업>."
```

명시 호출 전용 스킬(project-planning, supabase-integration, rule-visualization 처럼 원본이 `disable-model-invocation`/`user-invocable`)은 아래를 추가:

```yaml
policy:
  allow_implicit_invocation: false
```

MCP 의존 스킬(supabase-integration)은 `dependencies.tools` 로 supabase MCP 선언.

## 스킬별 이식 주의 (SSOT 더블체크 결과)

- **stable-layout**: SSOT `src/data/layoutTaxonomyData.js` 그대로. 순수 지식베이스 → 어댑터가 원본 SKILL.md + 데이터 파일 참조. 재지정 거의 없음.
- **component-work**: SSOT `src/data/*TaxonomyData.js` + 자체 `resources/*`. 어댑터는 원본 resources 를 Read로 참조. `disable-model-invocation` 아님(ALWAYS 발동형) → implicit 허용.
- **convert-external**: cross-skill 로 component-work resources 참조 → canonical 경로 유지.
- **project-planning**: `user-invocable: true` + `disable-model-invocation: true` → openai.yaml `allow_implicit_invocation: false`. `docs/` 출력.
- **supabase-integration**: 명시 호출 전용 + **MCP(supabase) 의존** → openai.yaml policy + dependencies.tools. "탐색=MCP, 상태변경=CLI 마이그레이션" 규칙 원본 참조.
- **visual-asset-prompt**: 이미 `vdl-visual-asset-prompt` 로 이식 완료됨(레퍼런스). 새로 만들지 말 것 - 존재 확인만.
- **rule-visualization**: ⚠️ SSOT가 `.claude/` 디렉토리 트리 자체 → `ruleRelationships.js`. Codex에서는 `.agents/skills/` + `.codex/agents/` 구조를 반영하도록 **재지정**. 어댑터 본문에 "Codex 구조(.agents/.codex)도 스캔 대상"임을 명시. Storybook 시각화는 원본 파이프라인(`pnpm generate-rules`) 참조.
- **skill-creator / sub-agent-generator**: 이 둘은 Phase 0에서 Codex-네이티브로 재작성됨(어댑터 아님). 원본의 eval/benchmark 하니스는 경량 정책상 제외.

## 검증 체크리스트

- [ ] name이 `vdl-<original>`, 소문자·하이픈
- [ ] description이 트리거 front-load, 8,000자/2% 예산 내
- [ ] SKILL.md 첫머리에 canonical source + "데이터 무복제" 명시
- [ ] Required Reads가 원본 `.claude/skills/<name>/...` 경로를 SSOT로 가리킴
- [ ] Codex 특화 재지정만 본문에 있음 (원본 데이터/taxonomy 복붙 금지)
- [ ] Fallback(원본 폴더 없을 때) 문구 존재
- [ ] agents/openai.yaml 존재, default_prompt에 `$vdl-<name>`
- [ ] 명시 호출 전용이면 `allow_implicit_invocation: false`
- [ ] MCP 의존이면 dependencies.tools 선언
- [ ] em dash(U+2014) 미사용
