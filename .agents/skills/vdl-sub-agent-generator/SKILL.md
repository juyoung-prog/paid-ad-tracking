---
name: vdl-sub-agent-generator
description: Use in the Vibe Design Lab repo to create a Codex subagent as a TOML file at .codex/agents/<name>.toml, or to port a Claude Code subagent (.claude/agents/<name>.md) into that TOML format. Trigger when the user says "codex 서브에이전트 만들어", "에이전트 codex용으로 이식", "port this agent to codex", "make a codex subagent", or wants to author anything under .codex/agents. Converts markdown+YAML agent definitions into Codex TOML with developer_instructions, model, and sandbox_mode, mapping Claude tool whitelists onto sandbox_mode least-privilege. Reads reference.md before writing.
---

# VDL Subagent Generator (Codex)

이 스킬은 Codex 서브에이전트를 `.codex/agents/<name>.toml` 로 만든다. Codex 서브에이전트는 프론트매터 마크다운이 아니라 **TOML** 이다. 두 모드:

- **포트 모드**: `.claude/agents/<name>.md` (MD+YAML) → `.codex/agents/<name>.toml`. (기본)
- **신규 모드**: 서브에이전트를 처음부터 저작.

## 반드시 먼저 읽기

파일을 쓰기 전에 이 스킬 폴더의 `reference.md` 를 Read한다. TOML 필드 스펙, sandbox_mode 최소권한 매트릭스, model 휴리스틱, `developer_instructions` 스켈레톤, 검증 체크리스트가 들어있다. 그 룰을 그대로 따른다.

TOML 필드 근거는 `.agents/skills/vdl-skill-creator/references/codex-spec.md` §8.

## 워크플로우

### 1단계: 의도 파악

다음을 확인한다: 주요 작업 / 트리거 조건 / 읽기 전용인가 쓰기 권한이 필요한가 / 모델 선호. 포트 모드면 원본 `.claude/agents/<name>.md` 의 frontmatter(name·description·tools·model)와 본문에서 추출한다. 빠진 항목만 최대 3개 질문, 그래도 모호하면 기본값으로 채우고 리포트에 명시.

기본값: 트리거=명시 호출만 / 권한=`read-only` / 위치=`.codex/agents/` / 모델=생략(세션 상속).

### 2단계: reference.md 정독

TOML 필드·sandbox_mode 매트릭스·model 휴리스틱·본문 스켈레톤 확인.

### 3단계: 템플릿 선택

`templates/` 에서 시작점을 고른다.

- `reviewer.toml`: 읽기 전용 검사(리뷰·감사·분석) → `sandbox_mode = "read-only"`
- `mutator.toml`: 코드/파일 수정(리팩터·포맷·마이그레이션) → `sandbox_mode = "workspace-write"`
- `analyzer.toml`: 다단계 추론(디버그·근본원인·아키텍처) → `sandbox_mode = "read-only"`

세 가지에 안 맞으면 reference.md 스켈레톤으로 처음부터 작성.

### 4단계: TOML 작성

- **name**: 소문자·하이픈·역할 명사. 포트 시 원본 name 유지.
- **description**: 3인칭·행위 중심·트리거 명시. 자동 위임을 원하면 `Use PROACTIVELY`/`MUST BE USED` 를 영어 그대로. 도메인 키워드 2개 이상.
- **developer_instructions**: 삼중따옴표(`"""..."""`) 안에 시스템 프롬프트 전체. 필수 6섹션(Role/When invoked/Procedure/Checklist/Do not/Output format). 포트 모드면 원본 본문을 이 안으로 옮기되 도구명·경로를 Codex로 재지정하고 데이터는 `src/data/*`·`.claude/skills/*` 원본을 참조.
- **sandbox_mode**: reference.md 매트릭스대로 최소권한. 읽기 전용 역할은 반드시 `read-only`.
- **model**: 확신 없으면 생략(세션 상속). 명확히 가벼우면 낮은 티어, 무거우면 높은 티어. 실제 사용 가능한 모델 ID를 확인 후 명시.

### 5단계: 검증 + 쓰기

reference.md 검증 체크리스트 실행. 통과하면 `.codex/agents/<name>.toml` 로 쓴다(개인용 요청 시에만 `~/.codex/agents/`). 같은 이름 파일이 있으면 덮어쓰지 말고 확인받는다.

### 6단계: 리포트

생성 경로 / description 요약 / 적용된 sandbox_mode + 이유 / 써보기 예시.

## 안티패턴 (거부)

- **다목적 에이전트**: 단일 책임으로 분리 제안.
- **모호한 description**: 트리거 다시 질문.
- **전권 부여**: 읽기 전용 역할에 `workspace-write`/`danger-full-access` 요청 → 좁힌다. `danger-full-access` 는 특별한 이유 없으면 금지.
- **1인칭 description**: 3인칭 행위 서술로.
- **서브에이전트끼리 호출**: 오케스트레이션은 메인 세션에서. 서브에이전트는 매번 fresh context.

## 가드레일

- 스킬(.agents/skills)을 만드는 요청이면 이 스킬 대신 `$vdl-skill-creator` 를 쓴다.
- 원본 데이터/taxonomy를 developer_instructions에 복붙하지 말고 `src/data/*`·resources 를 참조하게 한다.
- em dash 문자(U+2014)를 쓰지 않는다.
