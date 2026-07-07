# Codex Subagent Reference (TOML)

`.codex/agents/<name>.toml` 저작 룰북. 파일을 쓰기 전에 읽고 따른다. 스펙 근거: `.agents/skills/vdl-skill-creator/references/codex-spec.md` §8.

## TOML 필드

```toml
name = "type-safety-reviewer"
description = "Reviews ... . Use PROACTIVELY after ... . MUST BE USED before ... ."
developer_instructions = """
You are a <specialist> for <scope>.
... (시스템 프롬프트 전체)
"""
model = "gpt-5.5-codex"      # 선택 - 생략 시 세션 모델 상속
sandbox_mode = "read-only"   # read-only | workspace-write | danger-full-access
```

확인된 핵심 필드: `name`, `description`, `developer_instructions`, `model`, `sandbox_mode`. 다른 필드가 필요하면 공식 문서를 먼저 확인한다(임의 추가 금지).

## description 작성 규칙

description은 메타데이터가 아니라 라우팅 함수다. Codex가 이 텍스트로 자동 위임 여부를 결정한다.

- 패턴: `<역할 명사 문장>. <트리거 조건>. <도메인 키워드>.`
- 가중치 표현은 영어 그대로: `Use PROACTIVELY ...`, `MUST BE USED when ...`, `Invoke immediately after ...`.
- 피할 것: 1인칭("I review..."), 헤징("can sometimes help"), 트리거 없는 능력 나열, 너무 일반적인 단어.
- 도메인 키워드 2개 이상(예: "MUI sx", "layoutTaxonomyData", "Storybook story", "design token").

## sandbox_mode 최소권한 매트릭스

Claude 도구 화이트리스트의 대응물. 이보다 넓히지 말 것.

| Agent 모양 | sandbox_mode | 비고 |
|------------|--------------|------|
| reviewer (리뷰·감사·분석, 읽기만) | `read-only` | 기본 |
| analyzer (디버그·근본원인, 읽기만) | `read-only` | shell 읽기·검색 허용 |
| mutator (리팩터·포맷·마이그레이션) | `workspace-write` | 작업 폴더 내 쓰기 |
| doc-writer (문서 생성) | `workspace-write` | |
| (전체 접근) | `danger-full-access` | 특별한 이유 없으면 금지 |

읽기 전용 역할은 반드시 `read-only`. 사용자가 더 넓은 권한을 요구하면 응하되 트레이드오프를 리포트에 명시.

## model 휴리스틱

- 확신이 없으면 `model` 을 **생략**한다 → 세션 모델 상속(대개 정답).
- 명확히 가벼운 정형 출력(린트·포맷 체크·단순 분류) → 낮은 티어.
- 다단계 디버그·아키텍처 분석 → 높은 티어.
- 특정 모델을 명시할 때는 이 Codex 환경에서 실제 사용 가능한 모델 ID인지 확인. 예시 ID는 환경에 따라 다르다.

## developer_instructions 스켈레톤 (필수 6섹션)

```
You are a <specialist> for <scope>.

## When invoked
- <조건 1>
- <조건 2>

## Procedure
1. <단계>
2. <단계>

## Checklist before finishing
- [ ] <기준>

## Do not
- <out-of-scope 동작>

## Output format
<응답 구조 명시>
```

- **Role line**: 역할 + 범위를 한 문장에.
- **When invoked**: description 트리거의 상세본.
- **Procedure**: 매번 따르는 표준 절차.
- **Checklist**: 완료 선언 전 확인 항목.
- **Do not**: 가장 강력한 가드레일. 최소 1개.
- **Output format**: 메인 세션이 받을 응답 구조(마크다운 헤더/JSON/표). 빠지면 후속 질문이 한 번 더 든다.

포트 모드에서는 원본 `.claude/agents/<name>.md` 본문을 이 스켈레톤에 매핑하고, 도구명·경로를 Codex로 재지정한다. 데이터(`src/data/*TaxonomyData.js`, `.claude/skills/*/resources`)는 복붙하지 말고 참조하게 한다.

## 컨텍스트 가정 주의

서브에이전트는 매번 fresh context로 시작한다. 메인 세션이 아는 정보가 자동 전달되지 않는다. 불변 맥락은 developer_instructions에 박고, 가변 맥락은 호출 시점에 전달되게 설계한다.

## Validation checklist

- [ ] `name` 소문자·하이픈·역할 명사 (포트 시 원본 유지)
- [ ] `description` 3인칭 + 명시적 트리거 표현 + 도메인 키워드 2개 이상
- [ ] `sandbox_mode` 최소권한 (읽기 전용 역할 = `read-only`)
- [ ] `developer_instructions` 6섹션 모두 존재
- [ ] "Do not" 최소 1개
- [ ] "Output format" 구체적
- [ ] `model` 생략 또는 실제 사용 가능 ID
- [ ] 원본 데이터 복붙 없음 (참조만)
- [ ] 단일 책임
- [ ] em dash(U+2014) 미사용
- [ ] 파일 경로 `.codex/agents/<name>.toml`
