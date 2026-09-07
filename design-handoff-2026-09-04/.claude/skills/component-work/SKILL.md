---
name: component-work
description: ALWAYS invoke this skill when files under src/components/ are created, modified, or deleted. Do not edit component files directly. Use this skill first. Also trigger for any story file (.stories.jsx) work. Manages component taxonomy, design tokens, and interactive patterns for MUI-based design system.
when_to_use: ALWAYS invoke this skill when files under src/components/ are created, modified, deleted, or refactored. Do not edit component or story files directly. Use this skill first. Also trigger when user mentions making, editing, removing components or stories.
---

# Component Work Skill

> 컴포넌트 생성, 수정, 삭제, 스토리 작업 시 활성화되는 워크플로우

## 활성화 조건

| 의도 | 트리거 예시 |
|------|-----------|
| 생성 | "만들어줘", "새로 필요해", "추가하고 싶어" |
| 수정 | "수정해줘", "추가해줘", "개선해줘", "변경해줘" |
| 삭제 | "삭제해줘", "제거해줘" |
| 스토리 | "스토리 수정", "argTypes 추가", "스토리 작성" |

---

## 워크플로우

### 의도 분기

```
├── 생성 → 생성 워크플로우
├── 수정 → 수정 워크플로우
├── 삭제 → 삭제 워크플로우
└── 스토리 → 스토리 워크플로우
```

### 생성 워크플로우

1. **의도 구체화**: 사용자가 원하는 컴포넌트 유형 파악
2. **텍소노미 참조**: `resources/taxonomy-index.md` Read → 해당 카테고리와 원형 후보 제시
   - "이 카테고리에 이런 원형들이 있습니다: ..."
   - 텍소노미는 절대 기준이 아닌 맥락 안내 도구
3. **기존 컴포넌트 확인**: `resources/components.md` Read
   - 기존 것으로 커버 가능하면 재활용, 아니면 신규 생성
4. **설계 기준 참조 (성격에 따라 조건부)**: 아래 "설계 기준 조건부 로드 규칙" 참조
   - 텍스트 비중 큰 컴포넌트 → `resources/typography-criteria.md` Read
   - 조합·페이지·섹션·히어로 레이아웃 → `stable-layout` 스킬 절차 적용
   - 상시(원자 컴포넌트 포함): ai-slop 기본값 차단 넛지 적용
5. **구현**:
   - `project-directory.md`에 따라 위치 결정
   - `resources/storybook-writing.md` Read → 스토리 작성
   - 인터랙티브 감지 시 → `resources/interactive-principles.md` Read
   - `resources/components.md` 업데이트 (MUST)
   - `src/data/ruleRelationships.js` 동기화 (해당 시)
6. **점검 핸드오프 (조합 단위일 때만)**: 아래 "생성 후 점검 핸드오프" 참조

### 수정 워크플로우

1. 대상 컴포넌트 파악 (`resources/components.md` Read)
2. 현재 동작/코드 확인
3. 수정 구현 (기존 동작 유지)
4. `resources/storybook-writing.md` Read → 스토리 동기화
5. `resources/components.md` 설명 업데이트 (기능 변경 시)

### 삭제 워크플로우

1. 의존성 확인 (해당 컴포넌트를 사용하는 곳)
2. 컴포넌트 파일 + 스토리 파일 삭제
3. `resources/components.md`에서 항목 제거

### 스토리 워크플로우

1. `resources/storybook-writing.md` Read → 규칙 확인
2. 스토리 수정/작성

---

## Resources

| 파일 | 용도 | 언제 Read |
|------|------|----------|
| `components.md` | 기존 컴포넌트 목록 | 생성/수정/삭제 시 (중복 방지) |
| `mui-theme.md` | MUI 테마 설정 | 테마/스타일 수정 시 |
| `refactoring-guide.md` | 리팩토링 가이드 | 리팩토링 시 |
| `project-summary.md` | 프로젝트 개요/맥락 | 온보딩/맥락 파악 시 |
| `taxonomy-v0.4.md` | 전체 분류체계 상세 | 카테고리 상세 정보 필요 시 |
| `taxonomy-index.md` | 빠른 인덱스 | 생성 시 카테고리 후보 파악 (우선) |
| `storybook-writing.md` | 스토리 작성 규칙 | 스토리 작성/수정 시 |
| `interactive-principles.md` | 인터랙티브 원칙 | 아래 감지 조건 해당 시 |
| `typography-criteria.md` | 타이포 생성 기준 (자동 생성 뷰) | 텍스트 비중 큰 컴포넌트 생성 시 |

---

## 텍소노미 활용 원칙

- 텍소노미는 100% 절대 기준이 아님
- "골라라"가 아니라 **"만들려는 게 이런 맥락이 맞나요?"**
- 사용자의 불확실한 목적을 체계적으로 구체화
- 텍소노미에 없는 패턴도 가장 가까운 카테고리에 배치 가능

## 인터랙티브 감지 조건

아래 중 하나라도 해당하면 `resources/interactive-principles.md` Read 필수:
- Framer Motion, GSAP 등 애니메이션 라이브러리 사용
- 스크롤 기반 인터랙션 구현
- 텍소노미 #11~#15 카테고리 작업
- CSS 애니메이션을 넘어서는 인터랙션

## 설계 기준 조건부 로드 규칙

생성 시점에 따를 설계 기준은 점검 에이전트와 **같은 단일 원천**(`src/data/*TaxonomyData.js`)에서 나온다.
**기본: 추가 로드하지 않는다.** 만들 컴포넌트의 성격에 따라 아래만 적용한다.

### 타이포 기준 → `resources/typography-criteria.md` Read

아래 중 하나라도 해당하면 Read:
- 본문·아티클·롱폼 등 읽기용 텍스트가 주 콘텐츠일 때
- 히어로/마케팅 카피, 제목 위계가 중요한 컴포넌트
- 폼 라벨·헬프텍스트, 테이블·숫자 컬럼(자릿수 정렬) 작업
- "가독성", "줄길이", "행간", "한글 조판", "폰트 크기" 키워드 언급

원자 버튼·아이콘, 색·prop 단순 수정 등 텍스트가 부수적인 작업에서는 Read 하지 않는다.
이 파일은 자동 생성 뷰다. 기준이 바뀌면 `node scripts/extract-design-criteria.mjs` 로 재생성한다.

### 레이아웃 기준 → `stable-layout` 스킬 적용

페이지·섹션·대시보드·폼·히어로 등 **조합(레이아웃 골격) 단위**를 짤 때는
별도 뷰를 읽지 말고 `stable-layout` 스킬의 절차(공간 모델 → 아키타입 → 영역 정책 → 포화 → reflow → 안정성)를 따른다.
이 스킬도 같은 원천(`src/data/layoutTaxonomyData.js`)을 가리키므로 기준이 일치한다.
단일 컴포넌트 내부 배치 정도는 스킬을 불러올 필요 없다.

### ai-slop 기준 → 기본값 차단 넛지 (상시, 추가 로드 없음)

생성하는 모든 화면에 상시 적용한다. 전체 ai-slop 택소노미는 로드하지 않는다(생성 시 병목·과교정·양화 가이드와 중복).
베이스 모델이 기본으로 뱉는 최빈 클리셰만 피하고 이 프로젝트 테마 토큰을 쓴다:
- 보라-파랑 그라디언트로 표면 덮기 → 프로젝트 팔레트/액센트 토큰
- indigo 계열 기본 액센트 → 이 프로젝트의 `accent.main`(#0000B2). `primary.main`은 브랜드 값으로만 남기고 화면에 직접 쓰지 않는다
- 중앙정렬 히어로(중앙 텍스트 + auto margin + 버튼 2개) → 의도된 비대칭/그리드 구성
- 단일 안전 산세(Inter/Geist) 전역 도배 → 프로젝트 폰트 스택
- 모든 표면 동일 borderRadius 균일 라운딩 → 위계 있는 라운딩

전체 슬롭 탐지(묶임 승격·카피·이미지·심각도)는 생성이 아니라 `ai-slop-fixer` 에이전트가 사후에 전담한다.

## 생성 후 점검 핸드오프

산출물이 **조합 단위**(페이지·랜딩 섹션·히어로·텍스트 많은 뷰·여러 컴포넌트 조합)일 때만,
완료 후 점검 에이전트 실행 여부를 **사용자에게 먼저 묻는다**. 자동 호출하지 않는다.

- 산출물 성격에 맞는 에이전트(아래 표)를 후보로 제시하고, 점검할지 물어본다.
- 사용자가 동의하면 해당 에이전트를 호출한다. 여러 개면 한 메시지에서 **병렬 호출**하고 결과를 합쳐 보고한다.
- 사용자가 원치 않으면 호출하지 않고 마무리한다.

| 산출물 | 제안할 에이전트 |
|--------|----------------|
| 조합/페이지/히어로 레이아웃 | `stable-layout-auditor` |
| 텍스트 많은 뷰 | `typography-auditor` |
| 새 화면·랜딩(색·구성·카피 포함) | `ai-slop-fixer` |

원자 컴포넌트·스토리 수정·삭제·단순 prop 변경에서는 점검을 제안하지 않는다(생성 시점 기준으로 충분).
에이전트는 기본 리포트 모드다. 수정까지 원하면 사용자 승인 후 fix 모드로 재호출한다.
