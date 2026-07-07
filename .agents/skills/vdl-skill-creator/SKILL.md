---
name: vdl-skill-creator
description: Use in the Vibe Design Lab repo to create a new Codex skill or port a Claude Code skill into a Codex skill. Trigger when the user says "codex 스킬 만들어", "스킬 codex용으로 이식", "port this skill to codex", "새 codex 스킬", "convert .claude/skills to .agents/skills", or wants to author/edit anything under .agents/skills. Follows the VDL thin-adapter pattern, referencing the canonical .claude source as SSOT instead of duplicating data, and writes SKILL.md plus agents/openai.yaml to the Codex standard path .agents/skills/vdl-<name>/. Reads references/porting-rules.md and references/codex-spec.md before writing.
---

# VDL Skill Creator (Codex)

이 스킬은 Codex 스킬을 이 레포에 만든다. 두 가지 모드:

- **포트 모드**: 기존 `.claude/skills/<name>` → `.agents/skills/vdl-<name>` 이식. (기본)
- **신규 모드**: Codex 스킬을 처음부터 저작.

두 모드 모두 Codex 표준을 따르고, 데이터는 복제하지 않는다.

## 반드시 먼저 읽기

파일을 쓰기 전에 이 스킬 폴더의 참조 문서를 Read한다.

- `references/codex-spec.md` - Codex 스킬/서브에이전트 공식 스펙(경로·frontmatter·openai.yaml·description 예산·프로그레시브 디스클로저·TOML). 단일 기준.
- `references/porting-rules.md` - Claude → Codex 어댑터 이식 규칙, 변환 매핑, 스킬별 주의, 검증 체크리스트. 포트 모드의 핵심 SSOT.

레퍼런스 구현체: `.agents/skills/vdl-visual-asset-prompt/`. 실제 어댑터가 어떻게 원본을 참조하는지 이 폴더를 열어 형태를 확인한다.

## 핵심 원칙 (경량 · 어댑터)

1. **얇은 어댑터**: Codex 스킬은 `.claude/skills/<name>/` 를 canonical source(SSOT)로 참조한다. taxonomy·compatibility·resources·데이터를 복붙하지 않는다. 원본이 바뀌면 어댑터가 자동으로 최신 기준을 따른다.
2. **표준 경로**: 산출은 항상 `.agents/skills/vdl-<name>/`. (`.codex/skills` 아님 - `codex-spec.md` §1.)
3. **frontmatter는 name + description 둘뿐**. Claude 전용 필드(`when_to_use`/`user-invocable`/`disable-model-invocation`)는 description으로 접거나 `agents/openai.yaml` 로 옮긴다.
4. **description은 트리거 조건문**: 핵심 use case를 앞에 front-load, 8,000자/2% 예산 준수(`codex-spec.md` §4).
5. **프로그레시브 디스클로저 유지**: SKILL.md 본문은 짧게, 데이터는 "필요할 때 Read"로 원본을 가리킨다.

## 포트 모드 워크플로우

`porting-rules.md` 의 6단계 레시피를 그대로 따른다:

1. 원본 `.claude/skills/<name>/` 정독 (frontmatter + 참조 resources 파악)
2. `name = vdl-<original>`
3. description 작성 (트리거 front-load, when_to_use 흡수)
4. SKILL.md 본문 = 어댑터 (canonical source 명시 · Required Reads · Codex 재지정만 · Fallback · Output Format)
5. `agents/openai.yaml` 작성 (interface + 필요 시 policy/dependencies)
6. `porting-rules.md` 검증 체크리스트 실행

## 신규 모드 워크플로우

원본이 없으면 처음부터 저작한다.

1. **의도 파악**: 무엇을 하는 스킬인가 / 언제 트리거되나(사용자 발화·맥락) / 출력 형식은. 빠진 것만 최대 3개 질문.
2. **구조 결정** (`codex-spec.md` §2): SKILL.md 만으로 되는가, `scripts/`(결정적 반복 작업)·`references/`(필요 시 로드 문서)·`assets/`(출력물 템플릿)가 필요한가.
3. **SKILL.md 작성**: 명령형 문체. "왜 중요한지"를 설명(무거운 MUST 남발 금지). 500줄 넘으면 계층을 추가하고 참조로 분리.
4. **description 최적화**: 트리거 front-load. 언더트리거 방지를 위해 약간 "pushy"하게 - 관련 맥락을 명시적으로 나열.
5. `agents/openai.yaml` 작성.

## agents/openai.yaml

최소 형태:

```yaml
interface:
  display_name: "VDL <Human Name>"
  short_description: "<한 줄 요약>"
  default_prompt: "Use $vdl-<name> to <핵심 작업>."
```

- 명시 호출 전용(원본이 `disable-model-invocation`/`user-invocable`)이면 `policy.allow_implicit_invocation: false` 추가.
- MCP 의존이면 `dependencies.tools` 선언. (스키마: `codex-spec.md` §6.)

## 검증

`porting-rules.md` 의 검증 체크리스트를 돌린다. 한 항목이라도 실패하면 파일을 쓰지 않고 고친다. 신규 모드는 그중 name/description/openai.yaml/em-dash 항목을 적용한다.

## 리포트

마지막에 출력한다:

- 생성 파일 경로 목록
- description 한 줄 요약
- canonical source 경로(포트 모드) 또는 "net-new"(신규 모드)
- 써보기 예시: `Use $vdl-<name> to <example task>`

## 가드레일

- 원본 데이터/taxonomy를 SKILL.md에 복붙하지 않는다. 참조만 한다.
- 원본 폴더가 없으면 어댑터 SKILL.md에 Fallback 문구를 넣는다.
- 서브에이전트(.codex/agents/*.toml)를 만드는 요청이면 이 스킬 대신 `$vdl-sub-agent-generator` 를 쓴다.
- em dash 문자(U+2014)를 생성 파일·프롬프트·주석·사용자 카피에 쓰지 않는다.
