# Typography 생성 기준 (자동 생성 뷰)

> 이 파일은 `scripts/extract-design-criteria.mjs` 가 `src/data/typographyTaxonomyData.js` 에서 추출한 파생 뷰입니다.
> 손으로 수정하지 마세요. 기준을 바꾸려면 데이터 파일을 고치고 스크립트를 다시 실행하세요.
> 점검 에이전트 `typography-auditor` 와 동일한 단일 원천을 공유합니다.

텍스트 비중이 큰 컴포넌트(본문·아티클·히어로 카피·폼 라벨·테이블)를 만들 때 아래 양화 패턴을 따릅니다.
구체 수치는 이 프로젝트 테마 토큰·`Typography` variant 로 변환해 적용합니다(원천 수치를 그대로 쓰지 않음).


## 타이포 기초 원리
도구·화면과 무관하게 적용되는 타입의 문법

### Type Scale (타입 스케일)
- **모듈러 스케일** (Modular Scale): 한 비율(1.2·1.25·1.333·1.5·1.618 등)을 곱해 만든 조화로운 크기열.
  - 적합: UI·대시보드는 1.2~1.25(minor·major third), 에디토리얼·마케팅은 1.333~1.618 · 피함: UI 에 1.618(golden) 은 과대비라 단계가 띈다 · CSS: CSS custom properties,--ratio,calc(),clamp()
- **수직 리듬** (Vertical Rhythm): 줄간격과 여백을 한 단위(예 8px)의 배수로 묶어 세로 흐름을 통일하는 원리.
  - 적합: 롱폼 본문, 다단 텍스트의 줄 정렬 · 피함: 이미지·blockquote 가 섞인 가변 콘텐츠에선 리듬이 깨진다 · CSS: CSS,line-height (정수배),margin (8px 배수),rlh
- **베이스라인 그리드** (Baseline Grid): 모든 줄의 밑선을 공통 가로 격자에 맞춰 세로 리듬을 통일하는 체계.
  - 적합: 인쇄 수준 타이포, 다단 본문의 줄 정렬 · 피함: 반응형 이미지·가변 높이 콘텐츠와 혼재 · CSS: CSS,line-height (8px 배수),rlh

### Hierarchy (위계)
- **시각 위계** (Visual Hierarchy): 크기·굵기·위치·공간의 조합으로 읽는 순서를 만드는 것.
  - 적합: 모든 텍스트 화면의 기본 골격 · 피함: 의미 태그(h1-h6) 를 시각 효과로만 쓰는 것(접근성·SEO 훼손) · CSS: semantic h1-h6,font-size,font-weight,margin
- **크기 대비** (Size Contrast): 큰 제목과 작은 본문의 크기 차로 위계를 만드는 가장 직접적인 수단.
  - 적합: 헤드라인 강조, 정보 우선순위 표현 · 피함: 중간 단계 없이 양극단만 두면 위계가 아니라 충돌로 읽힌다 · CSS: font-size,modular scale steps
- **굵기 대비** (Weight Contrast): 같은 크기에서 굵기 차이로 강조를 만드는 수단.
  - 적합: 미니멀 UI, 라벨·강조어, 색을 아끼는 화면 · 피함: bold 남발은 강조력을 소진시킨다 · CSS: font-weight,variable font wght axis

### Units & Measure (단위·측정)
- **rem 단위** (rem (root em)): 루트 폰트 크기에 상대적인 단위.
  - 적합: 모든 폰트 크기·spacing 의 기본 단위 · 피함: px 고정(사용자 기본폰트·줌 무시로 접근성 실패) · CSS: font-size: 1rem,rem 기반 토큰
- **ch 단위** (ch unit): '0' 글자의 advance 폭에 상대적인 단위.
  - 적합: 라틴 본문 줄길이 제한 · 피함: CJK·한글 본문(전각 폭을 0 글자폭이 못 예측해 부정확) · CSS: max-inline-size: 66ch,margin-inline: auto
- **줄당 글자 수** (CPL (Characters Per Line)): CJK·한글 본문 줄길이를 글자 수로 재는 단위.
  - 적합: 한글·CJK 본문 줄길이 기준 · CSS: max-inline-size (CPL 환산 폭)

### Type Anatomy (타입 해부학)
- **엑스하이트** (x-height): 소문자 본체 높이(어센더·디센더 제외).
  - 적합: 큰 x-height 서체는 소형 UI·모바일 본문에 유리 · 피함: 큰 x-height 서체를 과대 leading 과 결합하면 느슨해진다 · CSS: font-family 선택 기준
- **캡하이트** (Cap height): 베이스라인에서 대문자 상단까지의 높이.
  - 적합: all-caps 라벨·헤딩의 정렬 기준 · CSS: line-height 산정,letter-spacing
- **카운터·어퍼처** (Counter & Aperture): 글자 내부의 닫힌 공간(counter) 과 열린 정도(aperture).
  - 적합: 넓은 aperture 서체는 캡션·폼·모바일 본문 · 피함: 좁은 aperture 서체를 소형 본문에 · CSS: font-family 선택 기준
- **획 대비** (Stroke Contrast): 굵은 획과 가는 획의 차이.
  - 적합: 크기에 따른 서체 선택 분기 · 피함: 고대비 서체를 소형 본문에(헤어라인 소실) · CSS: font-family 선택,optical sizing(opsz)

## 서체 분류
이 서체는 어떤 종류인가.

### Latin Classification (Vox-ATypI) (라틴 서체 분류)
- **휴머니스트 세리프** (Humanist / Venetian Serif): 15세기 베네치아 기원, 낮은 획대비, 기울어진 축.
  - 적합: 장문 본문, 인문서, 따뜻한 에디토리얼 · 피함: 데이터 밀집 UI, 초소형 캡션 · CSS: font-family (Jenson 류)
- **개럴드 세리프** (Garalde Serif): Garamond·Caslon 류, 16~17세기, 우아하고 중간 대비.
  - 적합: 책, 롱폼 본문 · CSS: font-family (Garamond 류),font-variant-numeric: oldstyle-nums
- **트랜지셔널 세리프** (Transitional Serif): Baskerville 류, 수직축, 중간 대비.
  - 적합: 신문·잡지 본문, 제목 양용 · CSS: font-family (Baskerville 류)
- **디돈 세리프** (Didone Serif): Bodoni·Didot 류, 극단적 획대비, 가는 헤어라인 세리프.
  - 적합: 패션·럭셔리 헤드라인, 대형 디스플레이 · 피함: 본문, 저해상·소형(헤어라인 소실) · CSS: font-family (Bodoni 류),optical sizing
- **슬랩 세리프** (Slab Serif): 기하학적 두꺼운 세리프.
  - 적합: 강조 헤드라인, 포스터 · 피함: 섬세한 본문 · CSS: font-family,font-weight (bold)
- **그로테스크 산세리프** (Grotesque / Neo-Grotesque Sans): Helvetica·Inter·Geist 류.
  - 적합: UI, 본문, 헤드라인 전방위 · 피함: 모든 텍스트에 Inter 일색은 브랜드 목소리를 지운다(ai-slop "Inter 도배") · CSS: font-family (Inter·Geist)
- **휴머니스트 산세리프** (Humanist Sans): 손글씨 비례를 품은 산세리프(FF Meta·Myriad 류).
  - 적합: 본문, 긴 글, 한글 고딕과 페어링 · CSS: font-family (Myriad·FF Meta)
- **지오메트릭 산세리프** (Geometric Sans): 원·사각의 기하 형태 기반 산세리프(Futura·Poppins 류).
  - 적합: 브랜딩, 헤드라인 · 피함: 장문 본문(균질 형태로 가독성 저하) · CSS: font-family (Futura·Poppins)

### Hangul Classification (한글 서체 분류)
- **명조 (바탕)** (Myeongjo (Batang)): 붓글씨 기원의 부리(serif) 계열 국문 서체.
  - 적합: 장문 본문, 인쇄·출판, 차분한 톤 · 피함: 저해상 소형 UI · CSS: font-family (본명조·바탕)
- **고딕 (돋움)** (Gothic (Dotum)): 맺음 없는 민부리(sans) 계열 국문 서체.
  - 적합: UI, 본문, 화면 전방위 · CSS: font-family (Pretendard·돋움)
- **손글씨** (Handwriting): 손으로 쓴 듯한 국문 서체.
  - 적합: 브랜딩, 감성 카피, 짧은 문구 · 피함: 본문·UI(가독성·중립성 저하) · CSS: font-family (손글씨)
- **제목용 국문** (Display Hangul): 큰 크기에서 개성을 드러내는 제목 전용 국문 서체.
  - 적합: 제목, 히어로, 포스터 · 피함: 본문·소형 텍스트 · CSS: font-family (제목용)
- **비례폭·고정폭 한글** (Proportional vs Fixed-width Hangul): KLREQ §4.1.1 의 한글 폭 구분.
  - 적합: 고정폭은 표·코드·숫자 정렬, 비례폭은 일반 본문 · CSS: font-family,font-variant-numeric: tabular-nums

## 역할·위계 시스템
이 텍스트의 역할은 무엇인가.

### Role Tiers (역할 티어)
- **디스플레이** (Display): 화면에서 가장 큰 텍스트.
  - 적합: 히어로, 브랜드 메시지, 텍스트-온리 랜딩 · 피함: 정보 밀도 높은 화면 · CSS: font-size: clamp(),text-wrap: balance
- **헤드라인** (Headline): 섹션·페이지 제목.
  - 적합: 섹션 제목, 페이지 헤딩 · CSS: semantic h1-h2,font-size: clamp(),text-wrap: balance
- **타이틀** (Title): 카드·블록 단위의 작은 제목.
  - 적합: 카드 제목, 리스트 헤더, 폼 섹션 · CSS: semantic h3-h4,font-weight
- **본문** (Body): 읽기 위한 본문 텍스트.
  - 적합: 문단, 설명, 읽기 콘텐츠 · CSS: font-size: 1.0625rem(17px),line-height: 1.5,max-inline-size
- **라벨** (Label): 버튼·태그·캡션 등 UI 요소의 짧은 텍스트.
  - 적합: 버튼, 태그, 캡션, 폼 라벨 · 피함: text.disabled 토큰을 본문 보조 텍스트에 쓰는 것(저대비) · CSS: font-size,font-weight (medium)

## 조판 규칙
텍스트를 어떻게 짜는가.

### Measure & Leading (줄길이·행간)
- **줄길이 (measure)** (Line Length (Measure)): 한 줄의 글자 수.
  - 적합: 본문 블록 · 피함: 풀폭 텍스트, 대시보드 · CSS: max-inline-size: 66ch (라틴),CPL 환산 폭 (한글),margin-inline: auto
- **행간 (leading)** (Leading (line-height)): 베이스라인 간 거리.
  - 적합: 본문 1.5 안팎, 헤드라인은 더 타이트 · 피함: "타입+2pt"·"1.5" 를 못박힌 상수로 적용(Bringhurst 도 가변으로 다룸) · CSS: line-height: 1.5 (unitless)
- **양끝맞춤 하한** (Justified Minimum): 양끝맞춤(justify) 시 줄당 38~40자 미만이면 단어 사이 흰 구멍("white acne") 이 생긴다는 Bringhurst 하한.
  - 적합: 양끝맞춤 본문은 줄당 38자 이상 확보 · 피함: 좁은 컬럼에서 justify(흰 구멍) · CSS: text-align: justify (38ch+ 일 때만)
- **하이프네이션** (Hyphenation): 긴 단어를 줄 끝에서 나누는 규칙.
  - 적합: 양끝맞춤 본문, 좁은 컬럼 라틴 텍스트 · 피함: 한글(음절 단위라 하이프네이션 불필요) · CSS: hyphens: auto,lang 속성

### Tracking & Hangul Setting (자간·한글 조판)
- **자간 (tracking)** (Tracking (letter-spacing)): KLREQ §7.3.1: 한글·한자·가나 본문 자간 기본값은 0.
  - 적합: 본문 0(기본), 디스플레이는 tight, 양끝맞춤은 loose · 피함: 본문에 음수 자간 남용(표준은 0) · CSS: letter-spacing: normal (본문)
- **장평** (Jangpyeong (width scaling)): 글자의 가로 폭 비율 조절.
  - 적합: 제목 인상 조절, 폭 맞춤 · 피함: 본문 장평 변형(가독성 저하) · CSS: font-stretch,variable font wdth axis,transform: scaleX (지양)
- **줄바꿈 (keep-all)** (word-break: keep-all): KLREQ §7.1: 한글 본문은 단어 단위로 줄바꿈(keep-all).
  - 적합: 한국어 헤딩·짧은 텍스트 · 피함: 좁은 폭의 긴 단어(오버플로 가능, 소형 화면 해제 고려) · CSS: :lang(ko) { word-break: keep-all },@media 로 좁은 폭 해제
- **들여짜기** (Paragraph Indent): KLREQ §7.2.3: 단락 첫줄 들여짜기(전각 1자 관습) 또는 내어짜기.
  - 적합: 인쇄·출판형 본문의 단락 구분 · 피함: 단락 간 여백(margin) 과 들여짜기 중복 적용 · CSS: text-indent: 1em

### Micro-typography (OpenType) (미시 타이포)
- **고정폭 숫자** (Tabular Numbers): 모든 숫자 폭을 같게 맞추는 OpenType 기능(tnum).
  - 적합: 표, 가격, 대시보드 수치, 카운터 · 피함: 본문 인라인 숫자(올드스타일이 더 자연스러움) · CSS: font-variant-numeric: tabular-nums
- **올드스타일 숫자** (Oldstyle Numbers): 어센더·디센더를 가진 본문용 숫자(onum).
  - 적합: 본문 인라인 숫자, 에디토리얼 · 피함: 표·정렬이 필요한 수치 · CSS: font-variant-numeric: oldstyle-nums
- **슬래시 제로** (Slashed Zero): 0 과 O 를 구분하는 빗금 친 0(zero).
  - 적합: 코드, 일련번호, 데이터 · CSS: font-variant-numeric: slashed-zero
- **폰트 피처 설정** (font-feature-settings): 리거처·스몰캡스·스타일 세트 등 저수준 OpenType 기능 제어.
  - 적합: 서체 고유 기능(리거처·스몰캡스) 활성화 · 피함: 표준 font-variant-* 로 되는 것을 저수준으로 처리 · CSS: font-feature-settings,font-variant-* (우선)

### Line Wrapping (줄바꿈 품질)
- **균형 줄바꿈** (text-wrap: balance): 헤딩 줄들을 균등 폭으로 분배.
  - 적합: 헤딩, 카드 타이틀, CTA, 짧은 텍스트 · 피함: 긴 본문(성능), 카드처럼 경계 있는 컨테이너(우측 여백 불균형) · CSS: text-wrap: balance,@supports 가드
- **고아단어 방지** (text-wrap: pretty): 본문 마지막 몇 줄을 조정해 고아 단어(orphan) 를 막는다.
  - 적합: 블로그 본문, 아티클, 긴 텍스트 · 피함: 전체 줄 재균형을 기대하는 경우 · CSS: text-wrap: pretty,@supports 가드

## 반응·유동 거동
뷰포트·컨테이너에 따라 타입이 어떻게 변하는가

### Fluid & Variable (유동·가변)
- **유동 타이포 (clamp)** (Fluid Typography (clamp)): clamp(min, vw+rem, max) 로 브레이크포인트 없이 크기를 연속 조절.
  - 적합: Display·Headline 등 큰 텍스트 · 피함: 본문(범위 작음), 순수 vw(줌 불응) · CSS: font-size: clamp(1rem, calc(0.8rem + 1vw), 1.5rem)
- **가변 폰트** (Variable Fonts): 한 파일에 weight·width·opsz 등 축을 담은 폰트.
  - 적합: 여러 굵기 사용, 반응형, 키네틱, 파일 절감 · 피함: 단일 굵기만 필요할 때(과투자) · CSS: font-variation-settings,font-weight (가능하면 표준 속성),font-optical-sizing
- **광학 사이징 (opsz)** (Optical Sizing (opsz)): 크기에 맞춰 글자꼴을 보정하는 가변 축.
  - 적합: 본문~디스플레이를 한 서체로 폭넓게 쓸 때 · CSS: font-optical-sizing: auto,font-variation-settings: "opsz"

### Container Responsive (컨테이너 반응형)
- **컨테이너 쿼리 단위** (Container Query Units (cqi)): 컨테이너 inline 크기의 1%(cqi).
  - 적합: 카드·사이드바 등 컴포넌트 단위 반응형 · 피함: 컨테이너가 자기 자신을 쿼리하는 경우 · CSS: container-type: inline-size,font-size: clamp(1rem, 5cqi, 2rem)

### Font Loading & CLS (폰트 로딩)
- **폰트 디스플레이** (font-display): 폰트 로딩 중 렌더 전략.
  - 적합: swap=본문, optional=성능 우선, block=아이콘 폰트 · 피함: block 을 본문에(LCP 악화) · CSS: @font-face { font-display: swap }
- **폰트 깜빡임** (FOUT / FOIT): 무스타일 텍스트 깜빡임(FOUT, swap) / 비가시 텍스트 깜빡임(FOIT, block).
  - 적합: 로딩 전략 선택 시 트레이드오프 이해 · CSS: font-display 선택의 결과
- **폴백 메트릭 정합** (Fallback Metrics (CLS)): size-adjust·ascent-override 로 폴백 폰트 메트릭을 웹폰트에 맞춰 레이아웃 시프트(CLS) 를 제거한다.
  - 적합: 웹폰트 교체 시 CLS 제거 · CSS: @font-face { size-adjust; ascent-override }

## 페어링·조합
서체를 무엇과 짝짓는가.

### Korean-Latin Pairing (한영 페어링)
- **한영 섞어짜기** (Hangul-Latin Mixed Setting): 한글 본문에 라틴·숫자를 섞을 때 크기·기준선·굵기를 시각 보정하는 조판.
  - 적합: 한글 본문에 영문·숫자가 섞이는 모든 화면 · CSS: per-span 래핑,font-family 분리
- **라틴 크기 보정** (Latin Scale Adjustment): 같은 pt 에서 라틴이 한글보다 작아 보이는 문제 보정.
  - 적합: 한영 혼용 본문의 라틴 크기 맞춤 · CSS: 라틴 span font-size 조정
- **기준선 보정** (Baseline Shift (pairing)): 한글은 활자틀 시각중심, 라틴은 baseline 기준이라 라틴이 처져 보인다.
  - 적합: 한영 혼용 시 라틴·숫자의 세로 정렬 · CSS: position: relative; top: -0.05em,letter-spacing: -0.02em
- **획 굵기 맞춤** (Stroke Weight Match): 라틴이 한글보다 약간 두꺼운 경우가 많아 인위적으로 굵기를 맞춰 판면 질감을 균일화한다.
  - 적합: 한영 혼용 판면의 질감 통일 · 피함: 단일 정량값 기대(폰트마다 다름) · CSS: 라틴 span font-weight 조정

### Style Pairing (서체 짝짓기)
- **세리프·산스 페어링** (Serif + Sans Pairing): 세리프 제목과 산세리프 본문(또는 반대) 의 양식 대비.
  - 적합: 에디토리얼, 위계가 분명한 콘텐츠 · CSS: 2개 font-family 토큰
- **네오세리프·모노 페어링** (Neo-serif + Monospace Pairing): 우아한 세리프 헤딩에 데이터·메타용 모노스페이스를 더하는 조합.
  - 적합: 테크·데이터 제품의 에디토리얼 톤 · 피함: 본문 가독성이 최우선인 장문 · CSS: 2개 font-family,font-variant-numeric: tabular-nums
- **양식 매칭** (Style Match): 페어링할 두 서체의 양식·시대·획 특성을 맞추는 원칙.
  - 적합: 서체 페어링의 일관성 확보 · CSS: font-family 선택 원칙

## 표현·실험 타이포
어떤 태도를 입히는가.

### Expressive Type (표현 타이포)
- **키네틱 타이포그래피** (Kinetic Typography): 움직이는 텍스트.
  - 적합: 히어로, 인터랙티브 브랜딩, 스크롤 스토리텔링 · 피함: 전정장애·모션 민감 사용자, 본문 가독성 영역 · CSS: @media (prefers-reduced-motion: reduce) 리셋,matchMedia,@keyframes | Web Animations API | GSAP
- **오버사이즈 디스플레이** (Oversized Display): 48~120px+ 대형 헤드라인.
  - 적합: 히어로, 브랜드 스테이트먼트, 텍스트-온리 랜딩 · 피함: 본문, 정보 밀도 화면 · CSS: font-size: clamp(),text-wrap: balance,optical sizing
- **브루탈리스트 타이포** (Brutalist Typography): 날것의 거친 타입, 시스템 폰트, 고대비, 0px 기하.
  - 적합: 아트디렉션 강한 랜딩, 캠페인, 차별화 · 피함: 본문·폼·내비게이션, 접근성 필수 페이지 · CSS: system-ui font,border-radius: 0,font-weight 대비
- **안티디자인 타이포** (Anti-design Typography): 의도적 미숙함·불완전성을 연출하는 타입.
  - 적합: 인디 브랜드, 패션, 카운터컬처 톤 · 피함: 신뢰·명료성이 중요한 제품, 본문 · CSS: 불규칙 letter-spacing,transform: rotate,의도적 misalign

### Deconstruction (해체)
- **해체 타이포** (Deconstructed / Experimental Type): 위계·정렬·가독성을 의도적으로 파괴.
  - 적합: 아트디렉션 강한 랜딩, 전시, 포스터, 단발 캠페인 · 피함: 본문·UI·접근성 필수 페이지, 다국어 · CSS: position: absolute,음수 letter-spacing/margin,transform: rotate,z-index 레이어
- **중첩 레이어 타이포** (Overlapping / Layered Type): 텍스트와 이미지·텍스트를 겹쳐 깊이를 만든다.
  - 적합: 히어로, 표지, 아트워크 · 피함: 대비비(WCAG 1.4.3) 확보가 어려운 경우 · CSS: mix-blend-mode,z-index,position
- **역방향·비선형 읽기** (Reverse / Disrupted Reading): 읽기 순서를 역방향·비선형으로 흩뜨린다.
  - 적합: 인쇄·정적 아트워크 · 피함: 스크린리더 논리 순서가 필요한 모든 화면 · CSS: 시각 순서 != DOM 순서 (위험)

---
_생성: scripts/extract-design-criteria.mjs · 원천: src/data/typographyTaxonomyData.js_
