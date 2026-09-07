/**
 * 컴포넌트별 토큰 사용 매핑 데이터
 *
 * BeautyMaster 대시보드가 **실제로 화면에 그리는** MUI 컴포넌트만 담는다.
 * 각 항목의 token/role은 소스(src/components/templates/beautymaster/**)에서
 * 확인한 값이며, MUI 일반론이 아니다.
 *
 * 토큰 카테고리:
 * - palette: 색상 (accent, surface, text, 상태색)
 * - typography: 글자 크기·굵기 (대시보드는 variant 대신 sx의 px를 쓴다)
 * - spacing: 여백 (8px 단위)
 * - shape: 모서리·높이 등 형태
 *
 * themeOverride: src/styles/themes/default.js의 components에서 이미 잡아둔 규칙.
 * 여기 적힌 건 화면 코드에서 다시 쓰지 않아도 된다.
 */

const componentTokenMap = {
  // ============================================================
  // 1. Typography
  // ============================================================
  Typography: {
    name: 'Typography',
    description: '화면의 거의 모든 글자. variant보다 sx의 fontSize(px)로 크기를 정한다.',
    where: '전 화면',
    themeOverride: null,
    tokens: {
      palette: {
        items: [
          { token: 'text.primary', role: '이름·수치 등 주 텍스트' },
          { token: 'text.secondary', role: '라벨·메타·표 헤더 — 가장 많이 쓰는 색' },
          { token: 'accent.main', role: '활성 상태의 라벨' },
          { token: 'warning.main / success.main / error.main', role: '상태를 나타내는 글자' },
        ],
        affects: '글자색',
        howToUse: "color prop 대신 sx={{ color: 'text.secondary' }}로 토큰 경로를 쓴다",
      },
      typography: {
        items: [
          { token: 'fontSize 10~14', role: '본문 스케일 — 11px(메타·표 헤더), 12px(행 본문), 13px(내비·버튼), 14px(섹션 제목)' },
          { token: 'fontSize 18 · 22', role: '수치 — Workflow 단계 카운트, KPI' },
          { token: 'fontWeight 500 / 600', role: '보조 강조 / 제목·활성' },
          { token: 'fontVariantNumeric: tabular-nums', role: '자릿수가 바뀌어도 폭이 흔들리지 않게' },
        ],
        affects: '글자 크기·굵기',
        howToUse: "제목은 component='h2'로 시맨틱만 잡고 크기는 sx로 준다",
      },
      spacing: {
        items: [
          { token: 'mb 0.5 ~ 4', role: '라벨-값 사이(0.5), 섹션 사이(4)' },
        ],
        affects: '글자 블록 사이 간격',
        howToUse: 'sx={{ mb: 1.5 }}',
      },
    },
  },

  // ============================================================
  // 2. Button
  // ============================================================
  Button: {
    name: 'Button',
    description: '개수가 적다 — 필터 초기화, Alert의 Retry, 시트 설정 진입 정도.',
    where: 'SaasOperationsView, SheetSetupScreen',
    themeOverride: 'MuiButton: borderRadius 0, textTransform none',
    tokens: {
      palette: {
        items: [
          { token: 'color="inherit"', role: 'Alert 안 Retry — 배너 색을 물려받는다' },
          { token: 'primary', role: 'SheetSetupScreen의 contained 버튼' },
        ],
        affects: '배경·글자색',
        howToUse: '목록 화면에서는 버튼에 색을 주지 않는다. 강조는 accent가 맡는다',
      },
      typography: {
        items: [
          { token: 'fontSize 12 · 13', role: '버튼 라벨 — 기본 14px보다 낮춘다' },
          { token: 'fontWeight 500', role: '텍스트 버튼' },
        ],
        affects: '라벨 크기',
        howToUse: "sx={{ fontSize: 13, fontWeight: 500 }}",
      },
      shape: {
        items: [
          { token: 'disableElevation', role: '그림자 없이 — 이 화면에 elevation은 없다' },
          { token: 'borderRadius 0 (테마)', role: '표면은 각지게' },
        ],
        affects: '모서리·그림자',
        howToUse: '테마가 이미 잡아둬서 따로 줄 필요 없다',
      },
    },
  },

  // ============================================================
  // 3. ToggleButtonGroup / ToggleButton
  // ============================================================
  ToggleButton: {
    name: 'ToggleButton',
    description: '보기 전환(Bars/Table)과 기간 프리셋. 하나만 켜지는 배타 선택.',
    where: 'SaasAnalyticsView, SaasDateRangeSelect',
    themeOverride: null,
    tokens: {
      palette: {
        items: [
          { token: 'accent.tint', role: '켜진 버튼 배경' },
          { token: 'accent.main', role: '켜진 버튼 글자' },
          { token: 'divider', role: '꺼진 상태 테두리' },
        ],
        affects: '선택 상태 표시',
        howToUse: '선택은 채우지 않고 틴트로 깐다',
      },
      typography: {
        items: [{ token: 'fontSize 11', role: '버튼 라벨' }],
        affects: '라벨 크기',
        howToUse: 'sx={{ fontSize: 11 }}',
      },
      spacing: {
        items: [
          { token: 'px 1.25 (10px)', role: '가로 여백' },
          { token: 'py 0.25 (2px)', role: '세로 여백' },
        ],
        affects: '버튼 크기',
        howToUse: '높이를 36px로 고정해 옆 컨트롤과 밑선을 맞춘다',
      },
      shape: {
        items: [{ token: 'height 36', role: '기간 프리셋 — Select·검색창과 같은 높이' }],
        affects: '컨트롤 줄 정렬',
        howToUse: '한 줄에 놓이는 컨트롤은 높이를 같게 맞춘다',
      },
    },
  },

  // ============================================================
  // 4. Chip
  // ============================================================
  Chip: {
    name: 'Chip',
    description: '목적·플랫폼·티어 필터. 누르면 켜지고 다시 누르면 꺼진다.',
    where: 'SaasOperationsView 필터 줄',
    themeOverride: 'MuiChip: borderRadius 4, sizeSmall height 20 / fontSize 11',
    tokens: {
      palette: {
        items: [
          { token: 'accent.tint', role: '켜진 칩 배경' },
          { token: 'accent.main', role: '켜진 칩 글자·테두리' },
          { token: 'accent.ring', role: '키보드 포커스 링 (3px)' },
          { token: 'divider', role: '꺼진 칩 테두리' },
        ],
        affects: '선택·포커스 상태',
        howToUse: "variant={isOn ? 'filled' : 'outlined'} + sx로 색 지정",
      },
      typography: {
        items: [
          { token: 'fontSize 12', role: '칩 라벨' },
          { token: 'fontWeight 500', role: '라벨 굵기' },
        ],
        affects: '라벨',
        howToUse: 'sx={{ fontSize: 12, fontWeight: 500 }}',
      },
      spacing: {
        items: [{ token: 'px 1 (8px)', role: '칩 안쪽 가로 여백' }],
        affects: '칩 폭',
        howToUse: 'sx={{ px: 1 }}',
      },
      shape: {
        items: [
          { token: 'height 32', role: '필터 줄 높이' },
          { token: "borderRadius '6px'", role: '필터 칩은 6px — 테마 기본 4px보다 한 단 둥글다' },
        ],
        affects: '칩 형태',
        howToUse: '같은 줄의 컨트롤과 높이를 맞춘다',
      },
    },
  },

  // ============================================================
  // 5. TextField
  // ============================================================
  TextField: {
    name: 'TextField',
    description: '이름 검색창 하나. 아이콘을 startAdornment로 붙인다.',
    where: 'SaasOperationsView 검색',
    themeOverride: 'MuiOutlinedInput: borderRadius 4, 포커스 시 테두리 1px + accent.ring 3px',
    tokens: {
      palette: {
        items: [
          { token: 'accent.main', role: '포커스 테두리' },
          { token: 'accent.ring', role: '포커스 링' },
          { token: 'text.secondary', role: '검색 아이콘' },
          { token: 'divider', role: '기본 테두리' },
        ],
        affects: '테두리·아이콘 색',
        howToUse: '포커스는 테마가 잡는다. 기본 테두리만 divider로 낮춘다',
      },
      typography: {
        items: [{ token: 'fontSize 12', role: '입력 글자·placeholder' }],
        affects: '입력 글자',
        howToUse: 'size="small" + sx fontSize',
      },
      shape: {
        items: [
          { token: 'borderRadius 4 (테마)', role: '폼 컨트롤은 각진 표면과 구분되게 살짝 둥글다' },
          { token: '테두리 두께 1px 고정', role: '포커스에서 두께를 바꾸면 레이아웃이 1px 흔들린다' },
        ],
        affects: '입력창 형태',
        howToUse: '포커스 두께를 건드리지 않는다',
      },
    },
  },

  // ============================================================
  // 6. Select / MenuItem
  // ============================================================
  Select: {
    name: 'Select',
    description: '매장 선택. 드롭다운 항목도 같은 액센트 규칙을 따른다.',
    where: 'SaasStoreSelect',
    themeOverride: 'MuiMenuItem: Mui-selected 배경을 accent.tint로 (MUI 기본 파랑 틴트 제거)',
    tokens: {
      palette: {
        items: [
          { token: 'accent.main', role: '열렸을 때 테두리' },
          { token: 'accent.ring', role: '포커스 링' },
          { token: 'accent.tint', role: '선택된 MenuItem 배경' },
          { token: 'background.paper', role: 'Select 표면' },
          { token: 'divider', role: '기본 테두리, 첫 매장 항목 위 구분선' },
        ],
        affects: '컨트롤·드롭다운 색',
        howToUse: "'& .MuiOutlinedInput-notchedOutline' 등 슬롯 선택자로 지정",
      },
      typography: {
        items: [{ token: 'fontSize 12', role: 'Select 값과 MenuItem' }],
        affects: '글자 크기',
        howToUse: 'Select와 MenuItem에 같은 값을 준다',
      },
      shape: {
        items: [
          { token: 'height 36', role: '컨트롤 줄 높이' },
          { token: 'minWidth 120', role: '매장 이름 길이에 따라 옆 칩이 밀리지 않게' },
          { token: "borderRadius '6px'", role: '드롭다운 표면과 같은 값' },
        ],
        affects: '폭·높이 안정',
        howToUse: '값 길이에 따라 폭이 변하는 컨트롤은 minWidth를 잡는다',
      },
    },
  },

  // ============================================================
  // 7. Table
  // ============================================================
  Table: {
    name: 'Table',
    description: '리포트의 집계 표. size="small"로 밀도를 올려 쓴다.',
    where: 'SaasAnalyticsView',
    themeOverride: 'MuiTableRow: hover 배경 rgba(0,0,0,0.03)',
    tokens: {
      palette: {
        items: [
          { token: 'surface.sunken', role: '헤더 배경 — 한 단 낮은 면' },
          { token: 'text.secondary', role: '헤더 글자' },
          { token: 'warning.main', role: '최하위 행 — 글자색 + alpha 0.06 배경' },
          { token: 'divider', role: '행 경계' },
        ],
        affects: '표 색',
        howToUse: "'& th' 선택자로 헤더를 한 번에 지정",
      },
      typography: {
        items: [
          { token: 'fontSize 11', role: '헤더' },
          { token: 'fontSize 12', role: '셀 본문' },
          { token: 'fontVariantNumeric: tabular-nums', role: '숫자 열 정렬' },
        ],
        affects: '표 글자',
        howToUse: '숫자 열은 align="right" + tabular-nums',
      },
      spacing: {
        items: [{ token: 'py 0.75 (6px)', role: '헤더 세로 여백' }],
        affects: '행 높이',
        howToUse: 'size="small"에 더해 py로 한 번 더 조인다',
      },
    },
  },

  // ============================================================
  // 8. Alert
  // ============================================================
  Alert: {
    name: 'Alert',
    description: '시트를 못 읽었을 때 상단에 붙는 오류 배너. 하나뿐이다.',
    where: 'SaasOperationsView',
    themeOverride: null,
    tokens: {
      palette: {
        items: [
          { token: 'severity="error"', role: 'error 팔레트를 그대로 쓴다' },
          { token: 'divider', role: '본문과 나누는 아래 경계선' },
        ],
        affects: '배너 색',
        howToUse: 'severity만 주고 색은 건드리지 않는다',
      },
      typography: {
        items: [{ token: 'fontSize 13', role: '배너 문구' }],
        affects: '글자 크기',
        howToUse: 'sx={{ fontSize: 13 }}',
      },
      spacing: {
        items: [{ token: 'py 0.5 (4px)', role: '배너 높이를 낮게' }],
        affects: '배너 높이',
        howToUse: '상단 고정 요소는 얇게 유지한다',
      },
      shape: {
        items: [{ token: 'square', role: '화면 폭을 꽉 채우므로 모서리를 없앤다' }],
        affects: '모서리',
        howToUse: '<Alert square />',
      },
    },
  },

  // ============================================================
  // 9. Accordion
  // ============================================================
  Accordion: {
    name: 'Accordion',
    description: 'Workflow 단계 카드. 펼침 상태를 스스로 관리한다.',
    where: 'SaasWorkflowView',
    themeOverride: null,
    tokens: {
      palette: {
        items: [
          { token: 'divider', role: '카드 테두리' },
          { token: 'text.primary', role: '단계 제목' },
        ],
        affects: '카드 경계',
        howToUse: "border: '1px solid' + borderColor: 'divider'",
      },
      typography: {
        items: [
          { token: 'fontSize 14 / fontWeight 600', role: '단계 제목' },
          { token: 'fontSize 18', role: '단계 카운트 (tabular-nums)' },
        ],
        affects: '제목·수치',
        howToUse: 'AccordionSummary 안에서 sx로 지정',
      },
      spacing: {
        items: [
          { token: 'mb 1 (8px)', role: '카드 사이 — 펼쳐도 같은 값 유지' },
          { token: 'gap 1.5 (12px)', role: 'Summary 안 요소 간격' },
        ],
        affects: '카드 리듬',
        howToUse: "'&.Mui-expanded': { mb: 1 }로 펼침 시 간격 점프를 막는다",
      },
      shape: {
        items: [
          { token: "borderRadius '6px'", role: '참조용 카드형 컨테이너' },
          { token: "boxShadow 'none'", role: 'MUI 기본 elevation 제거' },
          { token: "'&:before': display none", role: 'MUI 기본 위쪽 선 제거' },
        ],
        affects: '카드 형태',
        howToUse: '테마가 아니라 화면에서 직접 끈다',
      },
    },
  },

  // ============================================================
  // 10. Popover
  // ============================================================
  Popover: {
    name: 'Popover',
    description: '기간 선택 달력을 띄우는 표면.',
    where: 'SaasDateRangeSelect',
    themeOverride: 'MuiPaper: customShadows 기반 elevation (offset 없이 blur만)',
    tokens: {
      palette: {
        items: [{ token: 'divider', role: '표면 테두리' }],
        affects: '표면 경계',
        howToUse: 'slotProps.paper.sx로 지정',
      },
      spacing: {
        items: [{ token: 'mt 0.5 (4px)', role: '앵커와 띄우는 간격' }],
        affects: '표면 위치',
        howToUse: 'anchorOrigin/transformOrigin으로 오른쪽 정렬',
      },
      shape: {
        items: [
          { token: "borderRadius '6px'", role: 'Select 드롭다운과 같은 표면 값' },
          { token: 'elevation 2', role: 'blur만 있는 옅은 그림자' },
        ],
        affects: '떠 있는 표면',
        howToUse: '테마 Paper는 각지므로 여기서 6px로 맞춘다',
      },
    },
  },

  // ============================================================
  // 11. Skeleton
  // ============================================================
  Skeleton: {
    name: 'Skeleton',
    description: '시트를 읽는 동안 목록 자리를 잡아둔다 — 로딩 중 레이아웃이 밀리지 않게.',
    where: 'SaasOperationsView 목록',
    themeOverride: null,
    tokens: {
      shape: {
        items: [
          { token: 'variant="text"', role: '이름·수치 자리' },
          { token: 'variant="circular"', role: '아바타 자리 (28×28)' },
          { token: 'width / height 고정', role: '실제 콘텐츠와 같은 크기 — CLS 방지' },
        ],
        affects: '로딩 중 자리',
        howToUse: '실제 요소와 같은 폭·높이를 준다',
      },
    },
  },

  // ============================================================
  // 12. Link
  // ============================================================
  Link: {
    name: 'Link',
    description: '인플루언서 프로필·시트·메일로 나가는 링크. 외부로 나가는 표시를 아이콘으로 붙인다.',
    where: 'SaasOperationsView, SaasAnalyticsView, SaasWorkflowView',
    themeOverride: null,
    tokens: {
      palette: {
        items: [
          { token: 'accent.main', role: '링크 글자' },
          { token: 'primary.dark', role: 'Workflow 안내문 링크' },
        ],
        affects: '링크 색',
        howToUse: '순수 #0000FF는 흰 배경에서 가장자리가 떨려 한 단 낮춘 값을 쓴다',
      },
      typography: {
        items: [
          { token: 'fontSize 11 · 12', role: '링크 글자 — 주변 글자와 같은 급' },
          { token: 'textDecoration: none → hover에서 underline', role: '평소엔 밑줄 없이, 가리키면 밑줄' },
        ],
        affects: '링크 표시',
        howToUse: "'&:hover': { textDecoration: 'underline' }",
      },
      spacing: {
        items: [{ token: 'gap 0.5 (4px)', role: '글자와 외부 이동 아이콘 사이' }],
        affects: '아이콘 간격',
        howToUse: "display: 'inline-flex' + gap",
      },
    },
  },
  // ============================================================
  // 13. Drawer
  // ============================================================
  Drawer: {
    name: 'Drawer',
    description: '인플루언서 상세. 목록·리포트 어느 쪽에서 행을 눌러도 같은 이 패널이 열린다.',
    where: 'InfluencerDrawer (BeautymasterDashboard가 연다)',
    themeOverride: 'MuiDrawer: paper width 400 (성과 지표 6개 + Note 수용 최소 너비)',
    tokens: {
      palette: {
        items: [
          { token: 'text.secondary', role: '라벨·메타 — 이 패널 글자의 대부분' },
          { token: 'primary.dark', role: '프로필·시트로 나가는 링크' },
          { token: 'divider', role: '구역 경계' },
        ],
        affects: '패널 색',
        howToUse: '목록과 같은 토큰을 쓴다 — 상세라고 색을 더 쓰지 않는다',
      },
      typography: {
        items: [
          { token: 'fontSize 11 · 13 · 14', role: '라벨 / 본문 / 값' },
          { token: 'fontSize 16', role: '이름' },
          { token: 'fontFamily 재지정', role: '포털로 <body> 아래 렌더돼 SaasShell의 폰트 규칙이 닿지 않는다' },
        ],
        affects: '패널 글자',
        howToUse: 'slotProps.paper.sx에서 폰트를 다시 지정한다',
      },
      shape: {
        items: [
          { token: "anchor='right'", role: '목록 옆에서 밀고 들어온다' },
          { token: 'width 400 (테마)', role: '폭 고정 — 내용에 따라 흔들리지 않게' },
        ],
        affects: '패널 위치·폭',
        howToUse: '폭은 테마에서 한 번만 정한다',
      },
    },
  },

  // ============================================================
  // 14. Dialog
  // ============================================================
  Dialog: {
    name: 'Dialog',
    description: '시트 연결 설정. 시트를 더하고 지우고 연결 상태를 확인한다.',
    where: 'SheetSettingsModal',
    themeOverride: 'MuiPaper: customShadows 기반 elevation',
    tokens: {
      palette: {
        items: [
          { token: 'success.main', role: '연결 성공 아이콘' },
          { token: 'error.main', role: '연결 실패 아이콘 · FormHelperText' },
          { token: 'text.secondary', role: '설명 문구, 닫기·삭제 아이콘' },
          { token: 'divider', role: '시트 항목 사이 경계' },
        ],
        affects: '상태 표시',
        howToUse: '성공/실패는 색과 아이콘 두 갈래로 함께 알린다',
      },
      typography: {
        items: [
          { token: 'fontSize 12 · 13', role: '입력값 / 설명' },
        ],
        affects: '모달 글자',
        howToUse: '본문 스케일을 그대로 따른다',
      },
      shape: {
        items: [
          { token: 'IconButton fontSize="small"', role: '닫기·삭제 — 20px' },
          { token: 'CircularProgress', role: '연결 확인 중 표시' },
        ],
        affects: '컨트롤 크기',
        howToUse: '모달 안 아이콘 버튼은 small로 고정',
      },
    },
  },
  // ============================================================
  // 15. Avatar
  // ============================================================
  Avatar: {
    name: 'Avatar',
    description: '인플루언서 얼굴. 사진이 없으면 이니셜을 색 배경에 얹는다 — 목록 행과 상세 패널이 같은 규칙을 쓴다.',
    where: 'InfluencerListRow, InfluencerDrawer (influencerAvatar.js가 색·이니셜을 정한다)',
    themeOverride: null,
    tokens: {
      palette: {
        items: [
          { token: 'tint.bg / tint.fg', role: '이름에서 뽑은 배경·글자색 — 같은 사람은 어디서나 같은 색' },
        ],
        affects: '아바타 색',
        howToUse: 'influencerAvatar.js의 값을 bgcolor·color에 넣는다',
      },
      typography: {
        items: [{ token: 'fontSize 16 · fontWeight 700', role: '이니셜' }],
        affects: '이니셜 크기',
        howToUse: '아바타 지름에 맞춰 조정',
      },
      shape: {
        items: [{ token: 'width · height 48 (Drawer)', role: '패널 머리, flexShrink 0으로 찌그러지지 않게' }],
        affects: '아바타 크기',
        howToUse: '목록은 더 작게, 패널은 48px',
      },
    },
  },

  // ============================================================
  // 16. Tooltip
  // ============================================================
  Tooltip: {
    name: 'Tooltip',
    description: '4단계 상태 아이콘의 뜻을 글로 알린다 — 색·모양만으로 정보를 전달하지 않기 위한 장치다.',
    where: 'StatusIconRow (InfluencerDrawer 안)',
    themeOverride: null,
    tokens: {
      typography: {
        items: [{ token: "title='{라벨}: Complete/Incomplete'", role: '아이콘이 말하는 내용을 글로 중복' }],
        affects: '접근성',
        howToUse: '상태를 아이콘으로만 말하지 않는다',
      },
      shape: {
        items: [{ token: 'arrow', role: '어떤 아이콘에 붙은 설명인지 가리킨다' }],
        affects: '말풍선 형태',
        howToUse: '<Tooltip arrow>',
      },
    },
  },

  // ============================================================
  // 17. Menu
  // ============================================================
  Menu: {
    name: 'Menu',
    description: '메시지 템플릿 고르기. 추천 템플릿을 위에 두고 구분한다.',
    where: 'MessageTemplateMenu',
    themeOverride: 'MuiMenuItem: Mui-selected 배경 accent.tint',
    tokens: {
      palette: {
        items: [{ token: 'text.secondary', role: "'Suggested' 구역 라벨" }],
        affects: '구역 라벨',
        howToUse: "variant='overline' + text.secondary",
      },
      spacing: {
        items: [{ token: 'px 2 · pt 0.5', role: '구역 라벨 여백' }],
        affects: '메뉴 안 리듬',
        howToUse: '라벨은 항목과 같은 가로 여백에 맞춘다',
      },
    },
  },

  // ============================================================
  // 18. Snackbar
  // ============================================================
  Snackbar: {
    name: 'Snackbar',
    description: '복사 완료 등 짧은 알림. useSnackbar 훅이 띄운다.',
    where: 'useSnackbar (BeautymasterDashboard가 렌더)',
    themeOverride: null,
    tokens: {
      palette: {
        items: [{ token: 'severity 색', role: 'Alert를 안에 넣어 상태색을 쓴다' }],
        affects: '알림 색',
        howToUse: '오래 남기지 않는다 — 짧은 확인용',
      },
    },
  },
};

/**
 * 토큰 카테고리 정의
 */
const tokenCategories = {
  palette: {
    name: 'Palette',
    description: '색상 토큰',
    figmaAnalogy: 'Color Styles / Variables',
    icon: '🎨',
  },
  typography: {
    name: 'Typography',
    description: '글자 크기·굵기',
    figmaAnalogy: 'Text Styles',
    icon: '📝',
  },
  spacing: {
    name: 'Spacing',
    description: '간격 토큰 (8px 기반)',
    figmaAnalogy: 'Auto Layout spacing',
    icon: '📐',
  },
  shape: {
    name: 'Shape',
    description: '모서리·크기 등 형태',
    figmaAnalogy: 'Corner Radius / Constraints',
    icon: '⬜',
  },
};

/**
 * 컴포넌트 목록 (화면에서 쓰는 순서대로)
 */
const componentList = [
  'Typography',
  'Button',
  'ToggleButton',
  'Chip',
  'TextField',
  'Select',
  'Table',
  'Alert',
  'Accordion',
  'Popover',
  'Skeleton',
  'Link',
  'Drawer',
  'Dialog',
  'Avatar',
  'Tooltip',
  'Menu',
  'Snackbar',
];

export { componentTokenMap, tokenCategories, componentList };
export default componentTokenMap;
