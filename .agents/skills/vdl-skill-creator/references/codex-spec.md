# Codex Agent Skills & Subagents - Authoritative Spec

이 문서는 Codex 스킬/서브에이전트 저작의 단일 기준(SSOT)이다. 아래 사실은 공식 문서에서 확인한 것만 담는다. 새 사실을 넣기 전에 출처를 확인한다.

Sources:
- https://developers.openai.com/codex/skills (Agent Skills 공식)
- https://developers.openai.com/codex/cli (CLI)
- https://codex.danielvaughan.com/2026/04/12/codex-cli-customisation-stack-unified-system/ (5-layer 구성 + subagent TOML)
- https://github.com/openai/skills (공식 카탈로그)

---

## 1. 스킬 디렉토리 (탐색 우선순위)

Codex는 아래 순서로 스킬을 스캔한다. 세션 시작 시 로드된다.

| Scope | Path | 용도 |
|-------|------|------|
| REPO | `.agents/skills` (현재 디렉토리) | 폴더 한정 워크플로우 |
| REPO | `../.agents/skills` (상위) | 중첩 레포 공유 영역 |
| REPO | `$REPO_ROOT/.agents/skills` | 조직 전역 스킬 |
| USER | `$HOME/.agents/skills` | 개인 스킬 |
| ADMIN | `/etc/codex/skills` | 시스템 기본값 |
| SYSTEM | Codex 번들 | 내장 스킬 |

**이 레포의 프로젝트 스킬 경로는 `.agents/skills/`** 다. (`.codex/skills` 는 일부 구버전 블로그 표기이며 공식 우선순위 표가 아니다.)

## 2. 스킬 구조

```
<skill-name>/
├── SKILL.md              (필수)
├── scripts/              (선택 - 결정적/반복 작업 실행 코드)
├── references/           (선택 - 필요 시 로드하는 문서)
├── assets/               (선택 - 출력에 쓰는 템플릿/아이콘/폰트)
└── agents/openai.yaml    (선택 - Codex 전용 UI 메타/의존성)
```

## 3. SKILL.md 프론트매터

필수는 `name`, `description` 두 개뿐이다.

```yaml
---
name: skill-name
description: 정확히 언제 이 스킬이 발동해야 하고 하지 말아야 하는지 서술.
---
```

- Claude 스킬의 `when_to_use`, `user-invocable`, `disable-model-invocation`, `allowed-tools` 같은 필드는 **Codex 프론트매터에 없다.** description으로 접거나 `agents/openai.yaml`의 `policy`/`interface`로 옮긴다.

## 4. description 예산 (중요)

- 초기 스킬 목록에는 모델 컨텍스트의 **최대 2% 또는 8,000자**만 배정된다.
- description이 잘려도 매칭되도록 **핵심 use case와 트리거 단어를 앞쪽에 배치(front-load)** 한다.
- description은 "제목"이 아니라 **트리거 조건문**으로 쓴다.

## 5. 프로그레시브 디스클로저 (Claude와 동일)

1. 초기: `name` + `description` + 파일 경로만 로드
2. 발동 시: SKILL.md 본문 전체 로드
3. 필요 시: `scripts/` `references/` `assets/` 참조 (스크립트는 로드 없이 실행 가능)

→ **Claude 스킬의 SSOT 참조 방식이 그대로 유효하다.** SKILL.md에서 데이터 파일을 "필요할 때 Read"로 가리키는 패턴을 유지한다.

## 6. agents/openai.yaml 스키마 (Codex 전용)

```yaml
interface:
  display_name: "사용자에게 보이는 이름"
  short_description: "짧은 설명"
  icon_small: "./assets/small-logo.svg"      # 선택
  icon_large: "./assets/large-logo.png"      # 선택
  brand_color: "#3B82F6"                      # 선택
  default_prompt: "Use $skill-name to ..."   # 호출 예시 프롬프트

policy:
  allow_implicit_invocation: true            # false면 명시 호출($mention/ /skills)만

dependencies:
  tools:
    - type: "mcp"
      value: "serverName"
      description: "무엇에 쓰는지"
      transport: "streamable_http"
      url: "https://..."
```

- Claude의 `disable-model-invocation: true` → `policy.allow_implicit_invocation: false`
- Claude의 `user-invocable: true` (명시 호출 전용) → 동일하게 `allow_implicit_invocation: false` + `default_prompt`에 `$mention` 명시
- MCP 의존(supabase 등) → `dependencies.tools`에 선언

## 7. 호출 방식

- **명시**: CLI/IDE에서 `/skills` 또는 `$skill-name` 멘션
- **암묵**: task가 `description`과 매칭되면 Codex가 자동 선택 (`allow_implicit_invocation: true`일 때)

---

## 8. 서브에이전트 (Codex) - TOML

Codex 서브에이전트는 **프론트매터 마크다운이 아니라 TOML** 이다. `.codex/agents/<name>.toml`.

```toml
name = "security-reviewer"
description = "Reviews code changes for security vulnerabilities"
developer_instructions = """
You are a ... (시스템 프롬프트 전체를 여기 삼중따옴표로)
"""
model = "gpt-5.5-codex"      # 선택 - 생략 시 세션 모델 상속
sandbox_mode = "read-only"   # read-only | workspace-write | danger-full-access
```

확인된 핵심 필드: `name`, `description`, `developer_instructions`, `model`, `sandbox_mode`.

### sandbox_mode = Codex의 권한 축 (Claude `tools` 최소권한의 대응물)

| sandbox_mode | 의미 | 대응 Claude 에이전트 모양 |
|--------------|------|---------------------------|
| `read-only` | 파일 읽기/검색만, 쓰기·네트워크 불가 | reviewer, analyzer(읽기) |
| `workspace-write` | 작업 폴더 내 파일 수정 가능 | mutator, doc-writer |
| `danger-full-access` | 전체 접근 (원칙적으로 회피) | (특별한 이유 없으면 금지) |

- Claude는 도구 화이트리스트(`Read, Grep, Glob`)로 권한을 좁힌다. Codex 서브에이전트는 `sandbox_mode`로 좁힌다. **읽기 전용 역할은 반드시 `read-only`.**
- `model`은 확신이 없으면 생략(세션 모델 상속)한다. 특정 티어가 필요할 때만 명시. 예시의 모델 ID는 환경에 따라 다를 수 있으니 실제 사용 가능한 ID를 확인한다.

## 9. 5-layer 구성 모델 (역할 분담)

| Layer | 책임 | 발견 위치 |
|-------|------|-----------|
| AGENTS.md | 규칙·컨벤션·아키텍처 컨텍스트 (always-on) | 디렉토리 계층 |
| Skills | 반복 다단계 워크플로우 패키지 (on-demand) | `.agents/skills/` |
| MCP | 외부 도구·실시간 데이터 연결 | `config.toml` |
| Subagents | 경계가 명확한 작업을 집중 워커에 위임 | `.codex/agents/*.toml` |
| Plugins | skills+MCP+agents 묶음 배포 | 마켓플레이스/로컬 |

> "Skills package instructions for the agent, MCP provides tools the agent can call."
