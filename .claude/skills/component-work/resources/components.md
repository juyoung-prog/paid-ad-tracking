# Components

Vibe Dictionary 텍소노미 v0.4 기반 분류. 번호는 텍소노미 카테고리 번호.

## 참조 문서

- 전체 텍소노미: `.claude/skills/component-work/resources/taxonomy-v0.4.md`
- 빠른 인덱스: `.claude/skills/component-work/resources/taxonomy-index.md`

새 컴포넌트 생성 시 위 문서에서 해당 카테고리 번호와 컴포넌트 원형을 확인한 후 구현할 것.

---

## 1. Typography — 텍스트 표현과 장식

- FitText: 컨테이너에 맞춤 텍스트 (`components/typography/FitText.jsx`)
- HighlightedTypography: 하이라이트 타이포그래피 (`components/typography/HighlightedTypography.jsx`)
- InlineTypography: 인라인 타이포그래피 (`components/typography/InlineTypography.jsx`)
- StretchedHeadline: 스트레치 헤드라인 (`components/typography/StretchedHeadline.jsx`)
- StyledParagraph: 스타일드 문단 (`components/typography/StyledParagraph.jsx`)
- Title: 타이틀 컴포넌트 (`components/typography/Title.jsx`)
- QuotedContainer: 인용 컨테이너 (`components/typography/QuotedContainer.jsx`)

## 2. Container — 시각적 경계와 그룹핑

- SectionContainer: 페이지 섹션 컨테이너. MUI Container 기반 (`components/container/SectionContainer.jsx`)
- CarouselContainer: 캐로셀 컨테이너 (`components/container/CarouselContainer.jsx`)
- RatioContainer: 비율 기반 컨테이너 (`components/container/RatioContainer.jsx`)
- PhaseTimelineChart: Event(캠페인 그룹)를 구성하는 phase를 실제 기간에 맞춰 가로 막대로 배치하는 타임라인(Gantt). 새 차트 라이브러리 없이 순수 % 위치 계산만으로 그린다(PacingIndicator·Budget by Platform 막대와 같은 접근). **Reports의 Plan 탭과 Performance 탭이 같은 컴포넌트를 공유한다** — 예전엔 Performance만 별도의 "지표별 비교 막대"(이름|막대|값)를 그려서 같은 Event를 골라도 탭을 옮기면 완전히 다른 그림이 나왔다(실사용 피드백). 시간 축 하나로 통일하고 탭별로 다른 정보는 `barSuffix(phase)`로 막대 안 문자열 뒤에 덧붙인다(Performance는 지출 — 예전엔 Spend·Impressions·Follows·Hook Rate 중 고르게 했는데, 예산 옆에 놓을 수 있는 건 같은 단위인 지출뿐이고 나머지는 아래 goal별 표가 이미 캠페인 단위로 보여줘서 선택기를 없앴다). **위계를 두 단으로 나눈다**: 이름은 막대 **밖 위**(body2/600), 숫자는 막대 **안**(caption, `기간 · $일일예산/day · $총예산 · Spend $X`) — 이름을 막대 안에 두면 좁은 막대에서 잘려 "무슨 단계인지"를 잃었다("Instagram post: CO…"). 이름 줄 안에서 다시 굵기를 나눠 콜론 앞 타입 접두사만 굵게 쓴다(`**Instagram post** · 캡션 조각 · Meta`) — Meta가 게시물 부스팅을 캠페인으로 만들며 캡션을 잘라 이름에 넣기 때문인데, 이걸 데이터에서 빼는 안은 부스팅이 전체 지출의 24%라 폐기했다(빼면 차트 합계가 헤더 KPI와 어긋난다). 접두사는 하드코딩하지 않고 콜론 + 24자 상한으로 찾는다. 막대가 덮는 플랫폼(`Meta + TikTok`)을 이름 뒤에 적어, 합쳐진 막대의 숫자가 합계라는 것과 단일 플랫폼 막대가 어느 쪽인지를 한 표기로 답한다. 마일스톤은 각 phase 시작일에 **수직 점선만** 긋고 날짜는 축 눈금이 말한다 — 예전엔 점선 위에 이름 라벨을 띄웠는데 바로 아래 막대가 같은 이름을 반복해 정보량이 0이었고 Chip처럼 보이는 거짓 어포던스였다. 축은 양 끝 + 마일스톤 날짜를 절대위치로 찍되 라벨이 겹칠 만큼 가까운 눈금은 버리고 양 끝은 예외 없이 남기며, 타임라인 원점과 겹치는 점선은 y축처럼 읽혀서 긋지 않는다. 시각 전용 구성이라 블록 전체가 aria-hidden — 같은 데이터는 아래 표(Plan의 Budget Breakdown, Performance의 goal별 표)가 접근 가능한 형태로 갖는다 (`pages/paidAdsDashboard/PhaseTimelineChart.jsx`)
- ScrollArea: 가로로 넘치는 내용을 스크롤시키되 **더 볼 게 남았다는 사실 자체를 보이게** 하는 컨테이너. 브라우저 기본 overflow는 스크롤바가 뜨기 전까지 아무 신호도 주지 않고(특히 macOS 오버레이 스크롤바), 조금만 넘칠수록 오히려 표가 딱 맞게 끝난 것처럼 보여서 발견이 안 된다(Reports 성과표에서 마지막 컬럼이 통째로 안 보이는데 아무 표시가 없던 실사용 문제로 신규 생성). 남은 방향에만 검정 알파 그라디언트 그림자를 띄우고 끝에 닿으면 사라진다 — 상태로 두는 건 "그림자 켤지 말지" 불리언 둘뿐이고(스크롤 좌표를 상태로 올리면 프레임마다 리렌더) 전환도 opacity만 쓴다. 초기 판정은 ResizeObserver의 최초 콜백에 맡겨 effect 본문 동기 setState를 피하고, 뷰포트와 내용 양쪽을 관찰해 컬럼 구성이 바뀌어도 판정이 낡지 않는다. `startOffset`은 좌측 그림자를 안쪽으로 미는 값 — 표의 sticky 고정 열이 앞을 덮고 있으면 그림자가 그 열의 오른쪽 경계에 붙어야 "여기서부터 움직인다"로 읽힌다. `maxHeight`를 주면 세로 스크롤도 이 영역이 받는다 — 안에 든 표 헤더를 sticky로 고정하려면 필수다(가로 overflow가 생기는 순간 이 컴포넌트가 가장 가까운 스크롤 컨테이너가 되어, 페이지 기준으로 붙이려던 헤더가 그냥 같이 밀려 올라간다). `label`을 주면 role="region" + 키보드 포커스가 붙는다(WCAG 2.1.1 — 스크롤 영역은 키보드로도 조작 가능해야 함). Reports 성과표가 TableContainer 대신 이걸 쓴다 (`components/container/ScrollArea.jsx`)

## 3. Card — 독립적 정보 단위

- CardContainer: 카드 기본 컨테이너. variant, padding, elevation. onClick이 있으면 role="button"/tabIndex/Enter·Space 키보드 조작 자동 부여 (`components/card/CardContainer.jsx`)
- CustomCard: 미디어+콘텐츠 카드. vertical/horizontal/overlay 레이아웃 (`components/card/CustomCard.jsx`)
- ImageCard: 이미지 카드 (`components/card/ImageCard.jsx`)
- MoodboardCard: 무드보드 컬렉션 카드. 2x2 썸네일 그리드 (`components/card/MoodboardCard.jsx`)
- CampaignCard: 캠페인 요약 카드. CustomCard 위에 구성, 상태/플랫폼/매장 칩 + 기간·예산(spend 있으면 집행액도 표시), 고긴급 알림 뱃지 조건부 표시 + 저긴급(overlap) 칩(overlapNote 있으면 Tooltip으로 구체적 충돌 캠페인명 노출) + onClick이 있으면 항상 보이는 클릭 안내(chevron, hover 의존 안 함) — status가 planned면 "Edit campaign details", 그 외엔 "Update performance"(성과 보고할 게 없는 캠페인에 거짓 CTA를 보여주지 않기 위함). Dashboard는 현재 CampaignTable(아바타 없는 2줄 리스트)을 쓰므로 이 컴포넌트는 어느 페이지에도 연결돼 있지 않음 — 재사용 후보로 남겨둠 (`components/card/CampaignCard.jsx`)
- Card: MUI Card 컴포넌트 [MUI]

## 4. Media — 이미지, 비디오 표시

- AspectMedia: 비율 기반 미디어 컨테이너 (`components/media/AspectMedia.jsx`)
- ImageCarousel: 이미지 캐로셀 (`components/media/ImageCarousel.jsx`)
- ImageTransition: 이미지 트랜지션 효과 (`components/media/ImageTransition.jsx`)
- CarouselIndicator: 캐로셀 인디케이터 (`components/media/CarouselIndicator.jsx`)
- CampaignThumbnail: 캠페인 소재 미리보기 썸네일. thumbnailUrl prop이 이미지로 로드되면 실제 이미지, 없거나 로드 실패하면 중립 배경(surface.muted + divider 테두리) + 캠페인명 이니셜로 자동 대체 — 한때 플랫폼 원색(Meta=primary #0000FF, TikTok=secondary)으로 채웠는데 두 가지 이유로 중립화했다(실사용 피드백 "Meta 썸네일이 왜 아직 쨍한 파란색인가"): 이미지가 없을 때 뜨는 자리표시자에 채도 100% 파랑이 깔리면 목록에서 가장 강한 요소가 되고("컨트롤이 목록보다 강하면 안 된다"는 테마 원칙은 자리표시자에도 적용), 플랫폼은 바로 옆 Platform 컬럼이 글자로 이미 말한다. platform prop은 색이 아니라 접근성 이름에 쓴다(스크린리더는 옆 컬럼을 함께 읽어주지 않는다) — 광고 목록은 시각적 식별이 중요하다는 피드백으로 추가, 항상 뭔가 보이는 게 핵심이라 대체 표시는 선택이 아니라 보장된 fallback. 프레임은 **정사각형**이다 — 한때 9:16 세로형이었는데("소재는 대부분 Reels/Stories"라는 추정), 동기화가 실제로 가져오는 Meta 소재 썸네일이 정사각형(320x320)이라 세로 프레임에서 좌우가 44% 잘렸고 높이 40일 때 폭이 22px라 "소재를 알아본다"는 목적 자체가 성립하지 않았다(실사용 신고 "썸네일이 더 커도 될 것 같다"). size prop은 한 변의 길이. 호출부는 모두 campaign.thumbnailUrl(업로드 전용 이미지)을 이 prop에 넘긴다 — campaign.creativeUrl("View Ad" 외부 링크, 사람이 타이핑)과는 별개 값이다(한때 하나로 합쳤다가, 실제 링크를 입력할 방법이 없어지는 문제로 다시 분리함). CampaignTable 행(기본값 48 — 옆 텍스트 블록이 이름 24px + 메타 20px라 행 높이가 안 늘어나는 구간)·Drawer 헤더(size 56)·CampaignForm 미리보기에서 재사용. 썸네일 자체는 sync-campaigns가 Meta 광고 소재에서 채운다(계정당 /ads 한 번 페이지네이션, `creative.thumbnail_width(320).thumbnail_height(320){thumbnail_url}` — 최상위 쿼리 파라미터로는 크기가 안 먹어 64px가 온다). 사용자가 올린 썸네일은 base64 data URI라 동기화가 덮지 않고, 우리가 채운 CDN 링크는 만료(oe=)가 있어 매 동기화마다 갱신한다 (`components/media/CampaignThumbnail.jsx`)

## 5. Data Display — 구조화된 데이터 시각화

- PacingIndicator: 예산 소진 속도(pacing) 시각화. 기간 경과 대비 예산 소진 비율을 막대로 비교, 임계값 초과 시 라벨 강조. campaign.budgetDaily가 있으면 Daily Avg 막대가 추가되고 상단 라벨도 "일평균 소진액 vs 일일 예산" 기준으로 바뀜(경과일/전체기간 비율보다 직접적인 신호라 우선, generateAlerts()와 동일 기준). "Budget Pacing" 라벨은 fontWeight 700 + color text.primary(진하게) — Drawer 안 정보 위계 정리 작업으로, 같은 레벨의 "Campaign Details"/"Performance" 라벨과 무게를 맞추고 그 아래 레벨의 하위 섹션 라벨(Core Metrics 등, 가볍게 유지)과 구분함. 막대(LinearProgress, 높이 6px)는 `radius.inlay`(3px) 라운딩 — 절반 값이라 풀 필이 되고, Reports의 Budget by Platform 막대와 동일 값(각진 0은 라운딩 체계에서 혼자 남은 예외였다) (`components/data-display/PacingIndicator.jsx`)
- KpiBar: KPI 숫자 요약 바. label/value 배열을 받는 범용 컴포넌트, tabular-nums. value는 숫자뿐 아니라 "$8,200" 같은 포맷된 문자열도 가능(Dashboard의 Active Budget/Active Spend가 이 방식). sub로 값 아래 부가 설명 추가 가능("across reported campaigns" 등) — sub 줄은 **이 바에 sub를 쓰는 항목이 하나라도 있을 때만** 자리를 예약한다(visibility:hidden 빈 줄) — 처음엔 무조건 예약했다가, sub가 전혀 없는 Dashboard 툴바에도 22px 빈 줄이 영구히 붙고 separator 구분선이 그만큼 커진 박스 기준으로 중앙 정렬돼 숫자열과 어긋나는 문제로 조건부로 바꿨다: Reports의 Plan↔Performance 탭 전환처럼 sub 있는 항목이 생겼다 사라질 때 sticky 툴바 높이가 널뛰며 본문이 밀리는 레이아웃 시프트가 있었다(실사용 피드백으로 발견). 항목별 onClick 선택적 지원(실제 필터로 이어지는 항목에만 부여) — 호출부는 값이 0인 카운트에 onClick을 주지 않는 게 규칙(DashboardPage countKpi 헬퍼): "Starting Soon 0"을 눌렀는데 다른 그룹이 보이면 0에서 뭔가 나온 것처럼 읽힌다(실사용 피드백). 라벨은 숫자 위에 쌓이고(세로 배치), 항목 간 간격은 gap:4(32px) — 실제 Influencer Tracking Dashboard(live, `/beautymaster`)를 Playwright로 열어 getComputedStyle/getBoundingClientRect로 실측한 값. separator:true인 항목 앞에는 1px 세로 구분선을 별도 요소로 삽입(mx:1, 앞뒤 40px 간격도 실측치와 일치) — 일반 항목끼리는 선 없이 간격으로만 구분. Dashboard 헤더 툴바와 /reports 요약 통계가 둘 다 이 컴포넌트를 쓴다 — 예전엔 서로 다른 컴포넌트(CampaignSummaryGrid)를 썼는데 같은 개념이 화면마다 다르게 보이는 문제가 있어 통일함 (`components/data-display/KpiBar.jsx`)
- AlertBanner: 고긴급 알림(ending_soon/budget_pacing/missing_performance)만 한 줄씩 나열. 저긴급(overlap_target)은 자동 필터링. 색+아이콘으로 심각도 표시(schema.js ALERT_SEVERITY 하나만 참조 — budget_pacing이 error로 제일 급함: 활성 캠페인이 실시간으로 예산을 초과 집행 중이라는 게 실무상 제일 급하다는 피드백). missing_performance(성과 미보고)는 한 번 삭제됐다가 재도입 — 예전엔 reportedAt 필드가 트리거라 그 필드가 사라지며 유형째 지웠는데(남겨두면 영원히 미보고로 고정되는 고장), 지금은 schema.js generateAlerts()가 "종료(ended/ended_early) + 성과 레코드 부재 + 종료 후 30일 이내(MISSING_PERFORMANCE_WINDOW_DAYS)"라는 필드 없는 근거로 생성한다 — 레코드가 저장되면 자연 해제되고, 30일 창 덕에 도구 도입 이전의 오래된 종료 캠페인이 쏟아지지 않는다. Visual Direction 원래 분류대로 error(보고 자체가 막히는 상태). 포커스 스타일은 앱 공통 문법(1px accent 테두리 + accent.ring inset 번짐, 테마 MuiOutlinedInput과 동일)으로 통일 — 예전의 2px primary 아웃라인은 같은 앱에 포커스 시각 언어가 두 개인 상태였다. 클릭 가능한 행을 가진 컴포넌트 전체에 같은 문법을 쓴다: AlertBanner·CampaignTable·KpiBar·StoreTable·PerformanceReportTable·StoreBreakdown. 링은 바깥이 아니라 **inset**으로 그린다 — KpiBar 루트가 overflowX:auto라 바깥으로 그리면 상하좌우가 잘리고 포커스할 때마다 스크롤이 튄다. onAlertClick 있으면 우측 chevron으로 클릭 가능함 표시. onDismiss가 있으면 알림 줄과 분리된 자체 줄에 닫기 버튼 노출(예전엔 첫 알림과 겹쳐 보여 오해 소지 있었음). 알림 벨 Popover가 유일한 사용처 — 예전엔 대시보드 상단에 collapsed 모드("N alerts need attention" 한 줄) 배너로도 노출했는데, 벨 배지와 정확히 같은 개수를 동시에 보여주는 순수 중복이라(전문가+실무자 리뷰로 확인) collapsed 모드 자체를 없앴다 (`components/data-display/AlertBanner.jsx`)
- StoreBreakdown: 매장별 캠페인 목록 (예산 분배 없음). rows는 schema.js의 getStoreBreakdown()으로 미리 조인. onRowClick 있으면 행이 tabIndex+Enter/Space로 키보드 활성화됨(CampaignTable과 동일 패턴). selectedStoreId를 넘기면 일치하는 행을 강조 표시(action.selected 배경) — 없으면 매장을 클릭해 필터링해도 지금 뭐가 선택된 상태인지, 같은 행을 다시 눌러 해제할 수 있다는 것 자체를 알 방법이 없었다(실제로 원상태로 못 돌아간다는 버그 리포트로 추가). onRowClick 있으면 행 끝에 CampaignTable·StoreTable과 동일한 › 시그니파이어 노출(Donald Norman 리뷰: "› = 클릭 가능" 규칙이 이 목록에서만 깨져 있었음) — Table에 `tableLayout: 'fixed'` + 각 열 고정폭(코드 36px·개수 28px·› 20px, 매장명은 나머지 전부)을 줘야 좁은 컬럼에서 4번째 열이 컨테이너 밖으로 밀려 안 보이는 문제가 없다 (`components/data-display/StoreBreakdown.jsx`). 한때 DashboardPage 좌측 사이드바(By Store 블록, All/Georgia/Florida 지역 세그먼트 포함)에서 이 컴포넌트로 매장별 캠페인 수를 훑어봤는데, 사이드바 전체를 없애면서(FilterBar 항목 참고 — Platform/Event/기간/Status가 두 구역으로 쪼개져 보이는 문제) Store도 평범한 드롭다운으로 격하돼 지금은 실제로 쓰이는 화면이 없다 — 재사용 후보로 컴포넌트·스토리는 유지(CampaignCard와 같은 상태).
- CampaignTable: Dashboard 캠페인 목록. Influencer Tracking Dashboard 실제 레퍼런스 기준 — 맨 좌측 CampaignThumbnail(소재 썸네일) + 이름+플랫폼(계정 라벨은 표시 안 함 — 옆 Store 칩이 이미 구체적인 매장명을 보여줘서 "· Georgia" 같은 지역 계정명이 중복이라는 피드백으로 뺌)+타겟 칩(+creativeUrl 있으면 "View Ad" 외부 링크 아이콘, 행 클릭과 stopPropagation으로 분리)+같은 플랫폼 안의 형제 캠페인(schema.js campaignGroupKey 동일) 있으면 "{campaignGroup} (+N)" 관계 칩 — allCampaigns prop으로 탭/필터 무관하게 판단(기본값은 rows). 플랫폼이 다른 형제를 위한 "Also on {플랫폼}" 칩은 한때 따로 있었는데 삭제함(실사용 피드백 — 크로스플랫폼 관계까지는 안 보여줘도 된다는 판단). 내부적으로는 여전히 크로스플랫폼 형제를 같은 플랫폼 카운트에서 제외하는 계산(crossPlatformSiblings)만 남아있다 — "{campaignGroup} (+N)"의 N이 같은 플랫폼 형제 수만 정확히 세도록. 이 칩은 그룹명을 라벨에 직접 보여준다 — 처음엔 "+N more in group"만 쓰고 그룹명은 Tooltip 안에만 뒀는데, "Also on {플랫폼}" 칩은 정보(플랫폼명)가 바로 보이는데 이것만 hover해야 알 수 있어 일관성이 깨지고 발견도 안 된다는 피드백으로 라벨 자체에 노출시킴 — Tooltip은 형제 캠페인 이름 목록 같은 보조 정보로만 남김. row.campaignGroup을 명시적으로 입력했으면 짝(형제)이 아직 하나도 없어도 그룹명 칩만 단독으로 보여준다("Raffle" 등) — 처음엔 형제가 있을 때만 칩을 보여줬는데, "이 캠페인은 Raffle 이벤트용이다"처럼 목적을 태그해둔 게 짝이 생기기 전까지 리스트·필터 어디에도 안 보이는 문제가 있었다(실사용 피드백으로 발견 — DashboardPage의 campaignGroupOptions도 짝 2개 이상일 때만 필터 옵션으로 보여주던 걸 "명시적으로 입력한 campaignGroup은 1개여도 옵션으로 보여줌"으로 같이 고침). +(있으면) 저긴급 중복 타겟팅, 우측 상태 2줄: 고긴급 알림 있으면 알림 텍스트, 없으면 캠페인 상태 칩+기간·예산(budgetDaily 있으면 "$X ($Y/day)"로 같이 표시 — 단 budgetPlanned가 0이면 예산 부분 자체를 생략한다: 동기화 캠페인은 계획 예산 개념이 없어 0으로 저장되는데 "$0 · $N spent"로 찍으면 "예산 0으로 계획했는데 초과 집행"으로 읽힌다(실데이터 스크린샷 리뷰로 발견). 계획 예산 없이 일일 예산만 있으면 "$Y/day"만, 예산·spend 다 없으면 기간만 — SyncedWithoutBudget 스토리가 이 분기 커버). **메타 줄은 칩이 아니라 평문 + 가운뎃점(·)이다** — 예전엔 Store·그룹·중복타겟이 전부 outlined Chip이라 한 행에 테두리가 5~6개씩 생겨 정작 주인공인 캠페인명보다 테두리가 먼저 눈에 들어왔다(레퍼런스 influencer tracking dashboard의 목록도 이 자리를 평문 컬럼 "Instagram · T2 · General"로 둔다). 칩은 "상태"에만 남긴다 — 우측 상태 칩은 StoreTable 등 앱 나머지와 같은 기준이라 유지한다. 중복 타겟팅만 평문이되 warning 색을 남긴다(테두리를 떼면서 회색 평문으로 내리면 다른 메타와 구분이 안 돼 신호 자체가 사라지기 때문). Tooltip(형제 캠페인 목록, 중복 사유)은 평문에 그대로 붙어 있다. 한때 CampaignCard 그리드 대신 8컬럼 dense table로 바꿨었는데(Enterprise UX 리뷰 근거), 실제 레퍼런스 이미지 확인 후 "같은 회사 툴군처럼 보이기"가 이 프로젝트 1순위 목표라 되돌림. 고긴급 알림은 alertBadges 배열(캠페인 하나에 2개 이상 동시 발생 가능, Tooltip에 전체 나열). 저긴급 중복 타겟팅은 좌측 Tooltip 칩으로만. onRowClick 있으면 행이 tabIndex+Enter/Space로 키보드 활성화됨. 정렬은 이 컴포넌트가 아니라 호출부(DashboardPage) 책임 — rows에 정렬 없이 데이터 저장 순서 그대로 넘기던 시절엔 "Action Required"가 화면 위에 보이는 게 순전히 우연(먼저 등록된 캠페인이라 앞자리)이었다(실사용 리뷰로 발견). DashboardPage는 filteredCampaigns를 알림 severity(error → warning → 없음, alertBadgesFor와 동일 기준 재사용) → 동순위면 종료일 오름차순으로 정렬해서 넘긴다 (`components/data-display/CampaignTable.jsx`)
- CampaignSummaryGrid: 요약 스탯 카드 그리드(테두리 박스). label/value/sub/accent 배열을 받는 범용 컴포넌트 — /reports가 KpiBar로 옮겨가면서 현재 어느 페이지에도 연결돼 있지 않음(재사용 후보로 남겨둠) (`components/data-display/CampaignSummaryGrid.jsx`)
- StoreTable: 매장 마스터 목록 테이블 (코드/이름/지역/상태). campaignCounts(storeId별 캠페인 수, getStoreBreakdown()로 계산)를 넘기면 Campaigns 컬럼 추가 노출. store.shortCode(사내 다른 시스템이 쓰는 매장 약어 코드)가 하나라도 있으면 Legacy Code 컬럼 자동 노출, 없는 행은 "—". StoreBreakdown과 관심사가 다름(원래는 캠페인 수 아니었으나 /stores 페이지 정보 공백을 메우기 위해 선택적으로 재사용). onRowClick 있으면 행이 tabIndex+Enter/Space로 키보드 활성화되고 chevron 노출(CampaignTable과 동일 패턴) — StoreListSection이 매장 수정 진입점으로 사용. **접근성**: 클릭 가능한 행에 한때 `role="button"`을 얹었는데, 여긴 CampaignTable(순수 `<div>`)과 달리 실제 `<TableRow>`(`<tr>`)라서 role을 덮어쓰면 테이블이 원래 갖던 row 역할이 사라져 스크린리더의 테이블 탐색(행/열 안내)이 깨졌다(접근성 리뷰로 발견) — role은 주지 않고 tabIndex+onKeyDown만으로 키보드 조작을 유지한다. Playwright `getByRole('row')`로 행이 여전히 테이블 구조로 인식되는지 실측 확인 (`components/data-display/StoreTable.jsx`)
- PlatformMetricList: 플랫폼 API가 수집한 성과 지표(Video Plays/Hook Rate/Hold Rate/Held Views/Avg Watch/Likes/Comments/Shares/Follows/Profile Visits)를 읽기 전용 라벨/값 목록으로 표시. Hook/Hold Rate는 저장값이 아니라 schema.js의 calcHookRate/calcHoldRate로 계산하는 파생 지표이고(FIELDS의 derive), Hook Rate 기준이 플랫폼마다 달라(TikTok 2초 시청 / Meta 25% 시청) 그 사실을 캡션으로 함께 표시한다 — 숨기면 같은 이름의 숫자를 그대로 비교하게 되고 그 비교는 틀린다. PerformanceForm(사람이 넣는 값)과 짝을 이루는 반대편이라 입력 필드가 아니라 dl 목록으로 그린다. 값이 없는 항목은 '—'로 채우지 않고 숨기고, 하나도 없으면 null을 반환해 아무것도 그리지 않는다 — 수기 등록 캠페인이나 Meta(캠페인 레벨에 팔로우/프로필 방문 없음)에서 빈 줄만 8개 늘어서면 "아직 안 왔다"인지 "원래 없다"인지 구분이 안 되기 때문. KpiBar(가로 배치)·CampaignSummaryGrid(h3 스탯 카드 + 뷰포트 기준 4컬럼)를 먼저 검토했으나 좁은 Drawer에서 뭉개져 세로 2단 목록으로 신규 생성. DashboardPage 캠페인 Drawer의 Performance 섹션 하단에서 사용 (`components/data-display/PlatformMetricList.jsx`)
- PerformanceReportTable: 캠페인별 성과 지표 표(goal 무관 고정 컬럼: Spend/Impressions/Clicks/CPM/CTR/CPC + 소재·상호작용 8개 Video Plays/Held Views/Avg Watch/Likes/Comments/Shares/Follows/Profile Visits — 뒤 8개는 계산값이 아니라 플랫폼 원본이라 수기 입력 레코드에서는 '—'로 나온다). rows는 schema.js의 getCampaignMetricsRow()로 미리 계산. onRowClick(campaignId) 선택적 지원. Reports 페이지(ReportSummarySection)의 Performance 탭이 goal별로 다른 컬럼을 보여주는 표(schema.js getGoalMetricsRow() 기반, Awareness/Traffic/Engagement/Conversion/Store Visit마다 실제 의미 있는 지표만 표시)로 바뀌면서 지금은 실제로 쓰이는 화면이 없다 — "모든 goal에 CPM/CTR/CPC만 고정으로 보여주면 목적별 판단 근거가 안 보인다"는 피드백으로 대체됨. 재사용 후보로 컴포넌트·스토리는 유지(StoreBreakdown·CampaignCard와 같은 상태) (`components/data-display/PerformanceReportTable.jsx`)
- ReportSummarySection: FilterBar에 Store 필터가 없다 — 한때 있었는데 뺐다(Event·Platform·기간만 남음, Event가 1급 필터라 맨 앞 — Dashboard와 동일 순서). 이 페이지의 핵심 질문은 "어떤 Event에 어떤 캠페인이 있나"라서 Event가 1급 필터고, Event를 이미 골랐으면(대개 이벤트=매장 하나에 귀속) Store로 또 좁힐 일이 실질적으로 없었다 — 오히려 Event+Store를 동시에 걸면 서로 안 맞는 조합에서 왜 0건이 뜨는지 이유가 안 보이는 함정만 있었다(Donald Norman 리뷰: Event 선택 후에도 옆에 계속 떠 있는 미사용 Store 드롭다운이 "이거 지금 뭘 하는 컨트롤이지"라는 의문을 줌 — 실사용 피드백으로 발견해 제거). `stores` prop 자체를 없앴다(ReportsPage도 더 이상 안 넘김).
- ReportSummarySection의 Plan 탭 — Event를 선택하면 표+막대 대신 Gantt형 타임라인이 뜬다: 같은 이름의 캠페인을 플랫폼별로 합쳐 phase 하나로 취급하고(`buildPhaseTimeline()`), 기간에 맞춰 가로 막대로 배치 + 각 phase 시작일에 마일스톤(수직 점선+라벨) 자동 표시 + 막대 아래 "Budget Breakdown" 표(phase당 한 행, Meta/TikTok Daily·Budget을 나란히). 새 차트 라이브러리 없이 순수 % 위치 계산(timelinePct)만으로 그린다. **CSS 함정 기록**: absolute 자식의 `left: X%`는 가장 가까운 `position:relative` 조상의 padding 포함 박스 기준으로 계산되므로, 그 조상에 직접 padding을 줘도 %계산엔 반영 안 됨 — 바깥(padding 전용) Box와 안쪽(position:relative, padding 없음) Box로 반드시 두 겹으로 나눠야 여백이 실제로 동작한다. 또한 형제 요소 사이 간격을 줄 때 `margin-top`을 쓰면 그 요소가 부모의 첫 in-flow 자식일 경우 마진이 부모와 겹쳐(margin collapsing) 여백이 안쪽이 아니라 부모 전체를 그대로 밀어버림(앞선 absolute 형제도 같이 밀려서 간격이 그대로 유지되는 버그) — `padding-top`을 쓰면 겹치지 않아 안전하다. 둘 다 실제로 스크린샷/좌표 실측으로 발견한 버그다. **접근성**: 이 Gantt 블록 전체(마일스톤+막대)는 `<table>`/`<list>` 같은 의미 구조가 없는 순수 시각 배치라 억지로 구조를 씌우는 대신, 바로 아래 Budget Breakdown 표가 같은 데이터(캠페인·기간·예산)를 이미 접근 가능한 형태로 담고 있으므로 Gantt 컨테이너에 `aria-hidden="true"`를 줘서 스크린리더가 바로 표로 가게 한다(접근성 리뷰로 발견).
- Table: MUI Table 컴포넌트 [MUI]

## 6. In-page Navigation — 페이지 내 탐색

- CategoryTab: 카테고리 탭 (`components/in-page-navigation/CategoryTab.jsx`)
- Tabs: MUI Tabs 컴포넌트 [MUI]

## 7. Input & Control — 사용자 입력

- FileDropzone: 파일 드래그&드롭 영역 (`components/input/FileDropzone.jsx`)
- SearchBar: 검색 입력 바 (`components/input/SearchBar.jsx`)
- TagInput: 태그 입력 필드. CampaignForm에서 쓰다가 죽은 필드(Tags)라 뗐음 — 현재 어느 화면에도 연결 안 됨, 재사용 후보로 보존 (`components/input/TagInput.jsx`)
- StoreMultiSelect: 단일/복수/전체 매장 타겟 선택기. 전체 선택 시 목록 숨김. `label` prop으로 보여주는 캡션(Typography)은 시각적일 뿐이라 ToggleButtonGroup·Select와 프로그램적으로 연결되지 않는다 — `aria-label={`${label} scope`}`(ToggleButtonGroup)·`slotProps={{input:{'aria-label':`${label} selection`}}}`(Select)를 각각 줘서 스크린리더가 이름을 읽게 함(접근성 리뷰로 발견 — CampaignForm의 FieldLabel 패턴과 같은 문제) (`components/input/StoreMultiSelect.jsx`)
- LocalizedDateField: 항상 MM/DD/YYYY로 표시되는 날짜 입력. 네이티브 type="date"는 OS/브라우저 로케일을 그대로 노출해서 대체 — 마스킹 텍스트 입력, 새 의존성 없음 (`components/input/LocalizedDateField.jsx`)
- DateRangeField: 시작/종료일을 한 번에 고르는 캘린더 팝오버. LocalizedDateField 2개 + "~"로 따로 타이핑하던 걸 대체(값은 여전히 `{ start, end }` ISO 8601 문자열) — 새 날짜 피커 라이브러리 없이 직접 구현(LocalizedDateField와 같은 이유, 이 프로젝트의 로케일 무관 MM/DD/YYYY 요구사항). 6주 고정 그리드라 달이 바뀌어도 팝오버 높이가 안 흔들림, 호버 중엔 시작일부터 커서까지 범위 미리보기. CampaignForm의 Campaign Dates와 FilterBar의 기간 필터가 둘 다 이 컴포넌트를 쓴다(같은 `{ start, end }` 모양이라 그대로 전달 가능). 입력창 끝에 캘린더 아이콘(endAdornment) — 겉보기엔 일반 텍스트 인풋 같은데 실제로는 클릭하면 팝오버가 열리는 버튼이라, 아이콘 없이는 타이핑해야 하는 줄 오해할 수 있다는 지적(Donald Norman 리뷰: 시그니파이어 부재)으로 추가. value.start가 있을 때만 캘린더 아이콘 왼쪽에 × 지우기 버튼도 노출 — 한 번 범위를 고르면 캘린더를 다시 열어도 날짜 클릭으로 새 범위를 잡는 것만 가능하고 빈 상태로 되돌릴 방법이 없었다(실무자 리뷰로 발견한 실제 막다른 길, gulf of execution). `label` prop(선택)을 주면 `slotProps={{htmlInput:{'aria-label':label}}}`로 내부 TextField의 네이티브 `<input>`에 직접 이름을 준다 — 호출부(CampaignForm 등)가 이 필드 위에 별도 캡션만 시각적으로 얹는 경우가 많아서, 그 캡션과 입력창이 프로그램적으로 연결 안 돼 스크린리더가 이름 없이 읽던 문제를 고침(접근성 리뷰로 발견) (`components/input/DateRangeField.jsx`)
- Button: MUI Button 컴포넌트 [MUI]
- Checkbox: MUI Checkbox 컴포넌트 [MUI]
- Select: MUI Select 컴포넌트 [MUI]
- Switch: MUI Switch 컴포넌트 [MUI]
- TextField: MUI TextField 컴포넌트 [MUI]

## 8. Layout — 공간 배치와 구조

- PhiSplit: 황금비 분할 레이아웃 (`components/layout/PhiSplit.jsx`)
- SplitScreen: 좌우 분할 레이아웃. ratio, stackAt, stackOrder 지원 (`components/layout/SplitScreen.jsx`)
- BentoGrid: 벤토 그리드 레이아웃 (`components/layout/BentoGrid.jsx`)
- LineGrid: 그리드 아이템 사이 1px 라인 자동 삽입 (`components/layout/LineGrid.jsx`)
- FullPageContainer: 전체 페이지 컨테이너 (`components/layout/FullPageContainer.jsx`)
- PageContainer: 반응형 페이지 컨테이너. PC maxWidth 고정, 모바일 100% (`components/layout/PageContainer.jsx`)
- AppShell: 반응형 앱 셸. GNB + 메인 콘텐츠 영역 (`components/layout/AppShell.jsx`)
- StickyAsideCenterLayout: 대칭 3열 그리드. sticky aside + 페이지 정중앙 콘텐츠 + 빈 대칭 칼럼 (`components/layout/StickyAsideCenterLayout.jsx`)
- LastUpdatedBar: 최근 수정 시각 표시. 실시간 동기화 없이 타임스탬프만 표시 (`components/layout/LastUpdatedBar.jsx`)
- Grid: MUI Grid 컴포넌트 [MUI]
- Masonry: MUI Masonry 컴포넌트 [MUI]

## 9. Overlay & Feedback — 맥락적 정보 표시

- Dialog: MUI Dialog 컴포넌트 [MUI]

## 10. Navigation (Global) — 페이지 간 이동

- GNB: 반응형 글로벌 네비게이션 바. 데스크탑 메뉴 / 모바일 Drawer (`components/navigation/GNB.jsx`)
- NavMenu: 네비게이션 메뉴 (`components/navigation/NavMenu.jsx`)
- SlidingHighlightMenu: 슬라이딩 하이라이트 메뉴. hover 시 layoutId 기반 인디케이터 이동, background/underline, horizontal/vertical (`components/navigation/SlidingHighlightMenu.jsx`)

## 11. KineticTypography (Interactive) — 텍스트 애니메이션 효과

- RandomRevealText: 랜덤 순서 blur 리빌 타이포그래피. Fisher-Yates 셔플 기반 (`components/kinetic-typography/RandomRevealText.jsx`)
- ScrambleText: 텍스트 스크램블 전환 효과. requestAnimationFrame 기반 (`components/kinetic-typography/ScrambleText.jsx`)
- ScrollRevealText: 스크롤 진행에 따른 텍스트 순차 리빌 (`components/kinetic-typography/ScrollRevealText.jsx`)

## 13. ContentTransition (Interactive) — 섹션 간 전환

- HorizontalScrollContainer: 세로 스크롤→가로 이동 변환 컨테이너. 픽셀 기반 DOM 측정, Framer Motion (`components/content-transition/HorizontalScrollContainer.jsx`)

## 12. Scroll (Interactive) — 스크롤 기반 효과

- VideoScrubbing: 스크롤 기반 비디오 스크러빙 (`components/scroll/VideoScrubbing.jsx`)
- ScrollScaleContainer: 뷰포트 노출 비율 연동 스케일 컨테이너. Framer Motion useScroll + useTransform (`components/scroll/ScrollScaleContainer.jsx`)

## 14. Motion (Interactive) — 스토리텔링 모션

- FadeTransition: 기본 opacity 전환 애니메이션. 등장/퇴장 페이드 + 방향 슬라이드, IntersectionObserver 자동 트리거 (`components/motion/FadeTransition.jsx`)
- PerspectiveTransition: 3D 원근 회전 전환. 뒤로 누워있다가 세워지는 효과, CSS perspective + rotateX, IntersectionObserver 자동 트리거 (`components/motion/PerspectiveTransition.jsx`)
- MarqueeContainer: 무한 루프 수평 흐름 컨테이너. CSS keyframes 기반 (`components/motion/MarqueeContainer.jsx`)

## 15. DynamicColor (Interactive) — 동적 색상 변화

- GradientOverlay: Three.js WebGL 스크롤 반응형 그라데이션 배경. Simplex Noise + 필름 그레인 (`components/dynamic-color/GradientOverlay.jsx`)
- GradientOverlayDynamic: Next.js 동적 import 래퍼 (ssr: false). 페이지에서 사용 시 이것을 import (`components/dynamic-color/GradientOverlayDynamic.jsx`)

---

## Common (유틸리티)

- Indicator: 범용 인디케이터 (`common/ui/Indicator.jsx`)
- Placeholder: 스토리 예제용 FPO 플레이스홀더 시스템. Box/Image/Media/Text/Line/Paragraph/Card 서브컴포넌트 (`common/ui/Placeholder.jsx`)
- FilterBar: 필터 바. 검색/태그/정렬/뷰모드(기존, showSearch=false로 검색바 숨김 가능) + filterGroups·dateRange(범용 필터/기간 필터, 도메인 하드코딩 없이 호출부에서 정의). 기간 필터는 DateRangeField 캘린더 팝오버 하나로 표시(예전엔 LocalizedDateField 2개 + "~"). DateRangeField 내부 TextField는 fullWidth라 컨테이너 폭을 그대로 채우는데, FilterBar가 minWidth만 주면 flex row의 남은 폭을 다 먹어서 다른 필터들과 안 나란히 붙고 혼자 다음 줄 전체를 가로지르는 버그가 있었다(실사용 피드백으로 발견) — 고정 `width: 220`으로 다른 필터들과 같은 "짧은 컨트롤 하나" 크기로 맞춰서 고침. DashboardPage는 이제 Platform(segmented)·Event(campaignGroup)·Store 3개를 이 한 FilterBar에 전부 넣는다 — 한때 Store는 좌측 사이드바의 By Store 리스트(StoreBreakdown, 이름·캠페인 수·지역 세그먼트·선택 강조를 보여주는 "상위 버전")로만 다루고 여기 드롭다운은 중복이라 뺐었는데, Platform/Event/기간(사이드바에 있었음)과 Status 탭(상단, 별도 구역)이 같은 리스트를 필터링하면서도 화면상 두 구역으로 나뉘어 있어 "분리된 두 필터 시스템"처럼 보인다는 피드백으로 사이드바 자체를 없앴다 — By Store 리스트가 없어진 대신 Store도 다른 필터와 동급인 평범한 드롭다운(ReportSummarySection과 동일 패턴: `{key:'store', label:'Store', options: stores.map(s=>({value:s.id,label:s.id}))}`)으로 격하했다(매장별 훑어보기는 부차적 정보라는 판단, Event/campaignGroup 쪽이 더 중요하다는 피드백으로 그건 그대로 1급 필터 유지). filterGroups 항목에 `variant: 'segmented'`를 주면 드롭다운 대신 All+옵션 전부를 ToggleButtonGroup(세그먼트 버튼)으로 보여준다 — Platform(Meta/TikTok 2개뿐)처럼 옵션이 2~4개로 고정된 배타적 선택지에 적합, 옵션 개수가 늘어날 수 있는 필터(Event/Store)는 기본값(select) 유지. DashboardPage·ReportSummarySection의 Platform 필터 둘 다 이 variant를 씀. **접근성**: filterGroups의 `label`(예: "Platform"/"Event"/"Store")은 세그먼트 버튼 자체엔 안 보이고 Select는 비어있을 때만 placeholder로 보여서, 값이 선택된 뒤엔 스크린리더가 "이 컨트롤이 뭘 필터링하는지" 알 방법이 없었다(접근성 리뷰로 발견) — ToggleButtonGroup엔 `aria-label={group.label}`, Select엔 `slotProps={{input:{'aria-label':group.label}}}`를 준다. 뷰모드(grid/list) 전환 IconButton 2개도 아이콘만 있고 이름이 아예 없어 "이름 없는 버튼"으로 읽혔다 — `aria-label`("Grid view"/"List view")과 현재 선택 상태를 알리는 `aria-pressed`를 추가. 라운딩·색 토큰 정리: 뷰 토글 컨테이너·확장 필터 패널의 하드코딩 '4px' → `radius.control` 토큰 참조, 뷰 토글 선택 색 primary.main(#0000FF) → accent.main(파랑 단일화), 태그 칩의 `primary.lighter`는 팔레트에 없는 죽은 키라(무효 CSS로 투명 배경) `accent.tint`/`accent.main`으로 교체 (`components/templates/FilterBar.jsx`)
- CampaignForm: 캠페인 등록/수정 폼. 관련 필드 2열 그룹핑, StoreMultiSelect 재사용, 검증 로직 없음(errors prop으로 주입). Related Event(eventTag)·Tags·Notes 필드는 셋 다 목록·필터·검색 등 어떤 기능과도 연결 안 된 채 저장만 되는 죽은 입력이라 삭제함(TagInput 컴포넌트 자체는 재사용 후보로 유지, `components/input/TagInput.jsx`). Notes는 뒤늦게 추가됐다가 같은 이유로 다시 삭제됨 — 폼을 길게 만들 만큼의 가치가 있으려면 어딘가(리스트·Tooltip 등)에 표시되거나 검색·필터에 연결돼야 하는데 그런 소비처가 하나도 없었다. Campaign Name 옆에 **Event**(campaignGroup, 필수) 필드 — 라벨은 "Campaign Group"이 아니라 "Event"("이 캠페인이 속한 상위 이벤트"라는 뜻이 더 잘 전달된다는 피드백으로 변경), 모든 캠페인이 이벤트에 태깅되어야 한다는 운영 방침이라 optional이 아니라 isCampaignFormValid()의 필수 항목(DashboardPage.jsx)이고 FilterBar의 이 필드 필터 라벨도 "Event"로 통일함(DashboardPage·ReportSummarySection 둘 다). 캠페인 1개=플랫폼 1개라 "메타+틱톡 동시 진행"이나 "그랜드 오프닝 4단계(Coming Soon/Now Open/Grand Opening/1 Month Deals)"처럼 하나의 이니셔티브가 여러 캠페인으로 쪼개질 때, schema.js의 campaignGroupKey()가 이 값(없으면 name)을 그룹 키로 써서 CampaignTable 형제 칩·FilterBar Event 드롭다운·그룹 합계 요약·overlap_target 억제를 전부 판단한다. 단순히 플랫폼만 다른 2-way 케이스는 이 필드 없이 이름만 똑같이 지어도 여전히 동작(Platform 칩만으로 형제가 구분되므로) — 하지만 같은 플랫폼 안에서 단계만 다른 경우는 각 단계가 리스트에서 구분되는 이름이 필요해서 이름만으로는 그룹이 안 되니 이 필드로 명시적으로 묶는다. 한때 이 필드(당시 groupName)를 만들었다가 "이름 통일로 완전히 대체된다"며 없앤 적이 있는데, 그건 형제가 Platform 칩만으로 구분되는 단순 케이스에서만 맞는 얘기였고, 구분해줄 다른 필드가 없는 케이스가 실제로 있어서(실사용 시나리오 검토로 발견) 다시 만듦(한 다이얼로그에서 메타·틱톡을 동시에 입력받는 방식도 시도했다가 모든 필드가 두 벌이 되어 복잡해져서 되돌린 적 있음 — 그건 여전히 과함). Planned Budget(총액, 필수) 옆에 Daily Budget(budgetDaily, 선택) 필드 — 있으면 calcBudgetPacing()이 경과일/전체기간 비율 대신 "일평균 소진액 vs 이 값"으로 pacing을 계산하고, CampaignTable 리스트·PacingIndicator·budget_pacing 알림에도 이 기준이 그대로 반영됨(직접적인 신호라 우선 적용, 두 기준이 동시에 알림을 띄우지 않도록 배타적으로 검사). Daily Budget+기간이 있으면 Planned Budget은 schema.js의 calcAutoBudgetPlanned()로 자동 계산(disabled 필드) — 이 공식을 DashboardPage.openCampaignDrawer도 그대로 써서 Drawer를 열 때 스냅샷 자체를 미리 정규화한다(둘이 각자 계산하면, 이 기능 도입 전에 다르게 저장해둔 캠페인을 열자마자 CampaignForm이 조용히 값을 덮어써서 아무것도 안 건드렸는데 "미저장 변경"으로 오탐되는 버그가 있었음 — 실제로 발견/수정함). **Ad Link**(creativeUrl)와 **Thumbnail**(thumbnailUrl)은 별개 필드 — 한때 하나로 합쳤다가("View Ad" 링크와 썸네일이 URL 하나를 공유), 텍스트 입력을 없애고 업로드 전용으로 만들고 나니 실제 영상/게시물 링크를 입력할 방법이 사라져 "View Ad"가 실제 링크로 안 가는 문제가 생겨 다시 분리함. Ad Link는 사람이 타이핑하는 순수 텍스트 필드(View Ad 외부 링크 전용). Thumbnail은 업로드 버튼을 누르면 뜨는 팝오버(dropzone)에서 파일 선택과 붙여넣기(Cmd+V) 중 아무거나로만 채우는 업로드 전용 필드(목록/헤더 미리보기 전용, "Uploaded"/"Not uploaded" 상태 텍스트 표시, Remove 버튼으로 해제) — Remove도 Duplicate/Delete와 같은 이유(기본 variant="text"가 옆의 outlined Upload 버튼과 무게가 안 맞아 날것의 링크처럼 보임)로 outlined+아이콘으로 통일함(error 색은 안 씀 — 재업로드로 바로 되돌릴 수 있는 가벼운 동작) — 팝오버는 열리자마자 자동 포커스돼 클릭 없이 바로 붙여넣기 가능. UI 텍스트는 전부 영문(라벨/버튼/상태 문구) — 코드 주석만 한글. FieldLabel은 한때 `minHeight: '2.5rem'`(2줄 분량) 고정을 줬었다 — Campaign Group(optional) 라벨이 좁은 컬럼에서 2줄로 줄바꿈되면서 옆의 1줄짜리 Campaign Name과 입력창 시작 위치가 어긋나 보였기 때문(실사용 피드백으로 발견). 그 필드가 "Event"로 바뀌며 항상 1줄이 됐고 이 폼의 다른 라벨 쌍도 전부 1줄이라, 안 쓰는 2줄 예약이 라벨-입력창 사이에 불필요하게 넓은 빈 공간만 남겨서(실사용 피드백으로 재발견) 없앰 — 라벨 줄 수가 실제로 갈리는 쌍이 생기면(PerformanceForm의 Recorded/Reported Date처럼) 그때 다시 필요한 만큼만 준다. **접근성**: FieldLabel은 `<label htmlFor>`도 TextField/Select의 label prop도 아닌 순수 시각적 캡션이라 입력창과 프로그램적으로 연결 안 됨 — 시각적으로는 완벽해 보이지만 스크린리더는 이름 없는 입력창으로 읽던 문제(접근성 리뷰로 발견). 이 폼의 모든 TextField에 `slotProps={{htmlInput:{'aria-label':...}}}`, Select에 `slotProps={{input:{'aria-label':...}}}`, DateRangeField·StoreMultiSelect에는 각각 `label`/`aria-label` prop을 넘겨서 전부 고침(Playwright `getByRole(role,{name})`로 각 필드 accessible name 실측 확인 — number input은 role이 textbox가 아니라 spinbutton이라는 점 주의) (`components/templates/CampaignForm.jsx`)
- StoreForm: 매장 추가/수정 폼 (코드/이름/지역/상태). 검증 로직 없음(errors prop으로 주입). **접근성**: CampaignForm/PerformanceForm과 같은 FieldLabel(순전히 시각적 캡션, `<label htmlFor>` 아님) 패턴을 쓰면서도 그 두 파일을 고칠 때 이 파일만 빠뜨려서 Store Code/Name/Region/Status 전부 스크린리더에 이름 없이 읽혔다(접근성 리뷰로 발견) — TextField엔 `slotProps={{htmlInput:{'aria-label':...}}}`, Select엔 `slotProps={{input:{'aria-label':...}}}`로 동일하게 고침 (`components/templates/StoreForm.jsx`)
- PerformanceForm: 성과 지표 입력 폼. goal에 따라 Tier 3(engagement)/Tier 4(conversion·store_visit) 조건부 노출. FieldLabel은 minHeight 없이 라벨 높이 그대로 쓴다(한때 모든 라벨에 `minHeight: '2.5rem'`을 일괄로 줬었는데, 실제로 2줄로 갈리는 라벨 쌍이 없어져서 — 아래 참고 — Core/Video Metrics의 1줄짜리 라벨들에는 그냥 불필요한 빈 공간이었다, 실사용 피드백으로 발견해 없앰). Reporting Info 섹션은 Report/Screenshot URL(optional) 하나만 남았다 — Recorded Date/Reported Date 두 필드를 삭제함(실사용 피드백: "언제 입력했나"/"공식 보고가 됐나"라는 개념 자체가 필요 없다는 판단). Reported Date는 schema.js generateAlerts()의 missing_performance 알림(성과 미보고) 트리거였는데, 입력 경로가 사라지면 그 알림이 영원히 해제 불가능해지므로 alert 유형과 관련 KPI·필터를 같이 삭제했었다 — 이후 missing_performance는 reportedAt 없이 "종료 + 성과 레코드 부재 + 30일 창" 기준으로 재도입됨(AlertBanner 항목 참고, 이 폼과는 더 이상 무관). **접근성**: NumberField(Impressions/Reach/Clicks/Spend/Hook Views/Held Views/Engagements/Conversions 전부 이걸 씀)의 TextField에 `slotProps={{htmlInput:{'aria-label':label}}}`를 줘서 CampaignForm과 같은 이유로 스크린리더에 이름이 안 읽히던 문제를 고침 — 이 헬퍼 하나만 고치면 8개 필드가 한 번에 해결됨 (`components/templates/PerformanceForm.jsx`)
