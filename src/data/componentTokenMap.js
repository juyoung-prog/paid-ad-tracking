/**
 * MUI 컴포넌트별 토큰 사용 매핑 데이터
 *
 * 이 파일은 MUI 컴포넌트가 디자인될 때 어떤 테마 토큰을 참조하는지 정의합니다.
 * 디자이너가 각 컴포넌트의 스타일링 구조를 이해하는 데 도움을 줍니다.
 *
 * 토큰 카테고리:
 * - palette: 색상 (primary, secondary, error, text 등)
 * - typography: 타이포그래피 (fontFamily, fontSize, fontWeight 등)
 * - spacing: 간격 (padding, margin)
 * - shape: 모양 (borderRadius)
 * - shadows: 그림자 (elevation)
 * - transitions: 전환 효과 (duration, easing)
 * - zIndex: 레이어 순서
 */

const componentTokenMap = {
  // ============================================================
  // 1. Button
  // ============================================================
  Button: {
    name: 'Button',
    description: '클릭 가능한 인터랙션 요소. 주요 액션을 유도하는 데 사용됩니다.',
    variants: ['contained', 'outlined', 'text'],
    sizes: ['small', 'medium', 'large'],

    tokens: {
      palette: {
        items: [
          { token: 'primary', role: '기본 버튼 색상 — 표면은 accent.main(#2563EB)이다. MuiButton override가 파랑 단일화를 버튼에도 적용한다' },
          { token: 'secondary', role: '보조 버튼 색상' },
          { token: 'error', role: '삭제/위험 액션' },
          { token: 'warning', role: '주의 필요 액션' },
          { token: 'success', role: '완료/확인 액션' },
          { token: 'info', role: '정보성 액션' },
        ],
        affects: '배경색 (contained), 테두리색 (outlined), 텍스트색',
        howToUse: 'color prop으로 지정 (예: color="primary")',
      },
      typography: {
        items: [
          { token: 'button', role: '버튼 텍스트 스타일' },
        ],
        affects: '폰트 크기 (14px), 자간 (0.02em). **굵기는 500** — MuiButton root override가 typography.button(600)을 덮는다',
        howToUse: '자동 적용 (theme.typography.button) + MuiButton root override',
      },
      spacing: {
        items: [
          { token: 'spacing(1)', role: 'small 버튼 padding' },
          { token: 'spacing(2)', role: 'medium 버튼 padding' },
          { token: 'spacing(3)', role: 'large 버튼 padding' },
        ],
        affects: '버튼 내부 여백',
        howToUse: 'size prop으로 간접 조절',
      },
      shape: {
        items: [
          { token: 'radius.control', role: '버튼 모서리 곡률' },
        ],
        affects: '버튼 외곽선 모서리',
        howToUse: 'theme.shape.radius.control (현재: 6px — 상호작용 컨트롤 재분류, MuiButton override)',
      },
      shadows: {
        items: [
          { token: 'none', role: '버튼에는 그림자가 없다' },
        ],
        affects: 'root/hover/active 전부 boxShadow: none — MuiButton override가 전역으로 끈다',
        howToUse: '별도 처리 불필요(disableElevation도 필요 없다). 위계는 그림자가 아니라 테두리·여백이 만든다',
      },
      transitions: {
        items: [
          { token: 'duration.short', role: '상태 변화 속도' },
          { token: 'easing.easeInOut', role: '애니메이션 곡선' },
        ],
        affects: 'hover, focus, active 전환 효과',
        howToUse: '자동 적용',
      },
    },

    stateTokens: {
      hover: 'palette.action.hover (배경 오버레이)',
      focus: 'palette.action.focus + focusVisible 링',
      active: 'palette.accent.dark (primary 버튼 기준) — 그 외 색은 palette.[color].dark',
      disabled: 'palette.action.disabled, disabledBackground',
    },
  },

  // ============================================================
  // 2. Typography
  // ============================================================
  Typography: {
    name: 'Typography',
    description: '텍스트를 표시하는 컴포넌트. 제목부터 본문까지 다양한 텍스트 스타일을 제공합니다.',
    variants: ['display', 'title', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline'],

    tokens: {
      typography: {
        items: [
          { token: 'display', role: 'KPI 등 화면에서 가장 큰 숫자 (24px, 600, tabular-nums) — 역할 토큰, div로 렌더' },
          { token: 'title', role: '섹션 제목 (18px, 600) — 역할 토큰, h3로 렌더' },
          { token: 'label', role: '그룹·컬럼 헤더 (13px, 600, 대문자) — 역할 토큰, div로 렌더' },
          { token: 'h1', role: '가장 큰 제목 (40px, 900)' },
          { token: 'h2', role: '섹션 제목 (32px, 900)' },
          { token: 'h3', role: '하위 섹션 제목 (28px, 800)' },
          { token: 'h4', role: '카드 제목 (24px, 700)' },
          { token: 'h5', role: '작은 제목 (20px, 700)' },
          { token: 'h6', role: '가장 작은 제목 (18px, 600)' },
          { token: 'subtitle1', role: '부제목 (16px, 500)' },
          { token: 'subtitle2', role: '작은 부제목 (14px, 500)' },
          { token: 'body1', role: '기본 본문 (16px)' },
          { token: 'body2', role: '보조 본문 (14px)' },
          { token: 'caption', role: '캡션/주석 (12px)' },
          { token: 'overline', role: '라벨/분류 (12px, 대문자)' },
        ],
        affects: 'fontFamily, fontSize, fontWeight, lineHeight, letterSpacing',
        howToUse: 'variant prop으로 지정. h1~h6은 **크기 스케일**, display/title/label은 **역할** 토큰이고 운영 화면은 역할 토큰을 먼저 쓴다(body1 16px는 이 정보 밀도에 안 맞는다). 역할 토큰의 HTML 태그는 MuiTypography.variantMapping이 정한다 — display→div, label→div, title→h3',
      },
      palette: {
        items: [
          { token: 'text.primary', role: '주요 텍스트 색상' },
          { token: 'text.secondary', role: '보조 텍스트 색상' },
          { token: 'text.disabled', role: '비활성 텍스트 색상' },
          { token: 'accent.main', role: '강조 텍스트·활성 상태 (primary.main은 브랜드 값이라 화면에서 안 쓴다)' },
          { token: 'error.main', role: '오류 텍스트' },
        ],
        affects: '텍스트 색상',
        howToUse: 'color prop으로 지정 (예: color="textSecondary")',
      },
    },
  },

  // ============================================================
  // 3. TextField
  // ============================================================
  TextField: {
    name: 'TextField',
    description: '텍스트 입력 필드. 사용자로부터 텍스트 데이터를 입력받습니다.',
    variants: ['outlined', 'filled', 'standard'],

    tokens: {
      palette: {
        items: [
          { token: 'accent.main', role: 'focus 시 테두리 색상 (+ accent.ring 3px 번짐)' },
          { token: 'grey.300 / grey.400', role: '기본 / hover 테두리 색상 — MUI 기본 rgba(0,0,0,0.23) 대신' },
          { token: 'error.main', role: '오류 상태 색상' },
          { token: 'text.primary', role: '입력 텍스트 색상' },
          { token: 'text.secondary', role: '라벨/플레이스홀더 색상' },
          { token: 'action.hover', role: 'hover 시 배경' },
          { token: 'action.disabled', role: '비활성 상태' },
        ],
        affects: '테두리, 라벨, 입력 텍스트, 배경 색상',
        howToUse: 'color, error prop으로 지정',
      },
      typography: {
        items: [
          { token: 'body1', role: '입력 텍스트 스타일' },
          { token: 'caption', role: 'helperText 스타일' },
          { token: 'body2', role: '라벨 스타일' },
        ],
        affects: '입력 필드 내 텍스트 스타일',
        howToUse: '자동 적용',
      },
      spacing: {
        items: [
          { token: 'spacing(1.5)', role: '내부 padding' },
          { token: 'spacing(1)', role: 'helperText 간격' },
        ],
        affects: '필드 내부 여백',
        howToUse: 'size, margin prop으로 조절',
      },
      shape: {
        items: [
          { token: 'radius.control', role: '필드 모서리' },
        ],
        affects: 'outlined, filled variant 모서리',
        howToUse: 'theme.shape.radius.control (현재: 6px — MuiOutlinedInput override)',
      },
      transitions: {
        items: [
          { token: 'duration.shorter', role: 'focus 전환 속도' },
        ],
        affects: '테두리 색상, 라벨 위치 전환',
        howToUse: '자동 적용',
      },
    },

    stateTokens: {
      hover: '테두리 색상 진해짐',
      focus: 'accent.main 테두리 — 두께는 1px 그대로(MUI 기본 2px를 override) + 0 0 0 3px accent.ring',
      error: 'error.main 테두리/라벨',
      disabled: 'action.disabled 배경, 텍스트',
    },
  },

  // ============================================================
  // 4. Select
  // ============================================================
  Select: {
    name: 'Select',
    description: '드롭다운 선택 컴포넌트. 여러 옵션 중 하나를 선택할 수 있습니다.',
    variants: ['outlined', 'filled', 'standard'],

    tokens: {
      palette: {
        items: [
          { token: 'accent.main', role: 'focus 시 테두리 색상 (TextField와 동일)' },
          { token: 'text.primary', role: '선택된 값 텍스트' },
          { token: 'text.secondary', role: '라벨/플레이스홀더' },
          { token: 'action.hover', role: '옵션 hover 배경' },
          { token: 'accent.tint / accent.tintHover', role: '선택된 옵션 배경 / 그 hover — MuiMenuItem override' },
          { token: 'background.paper', role: '드롭다운 메뉴 배경' },
        ],
        affects: '필드, 드롭다운 메뉴 색상',
        howToUse: 'TextField와 동일',
      },
      typography: {
        items: [
          { token: 'body1', role: '선택된 값 텍스트' },
          { token: 'body2', role: '옵션 텍스트' },
        ],
        affects: '텍스트 스타일',
        howToUse: '자동 적용',
      },
      shape: {
        items: [
          { token: 'radius.control', role: '필드 및 메뉴 모서리' },
        ],
        affects: '모서리 곡률',
        howToUse: '필드는 theme.shape.radius.control (6px, MuiOutlinedInput override 공유). **드롭다운 메뉴 종이는 radius.container(8px) + 1px divider 테두리**(MuiMenu override)',
      },
      shadows: {
        items: [
          { token: 'elevation8', role: '드롭다운 메뉴 그림자' },
        ],
        affects: '메뉴 떠있는 효과',
        howToUse: 'MenuProps로 조절 가능',
      },
      zIndex: {
        items: [
          { token: 'modal', role: '드롭다운 레이어 순서' },
        ],
        affects: '다른 요소 위에 표시',
        howToUse: '자동 적용',
      },
    },
  },

  // ============================================================
  // 5. Card
  // ============================================================
  Card: {
    name: 'Card',
    description: '콘텐츠를 담는 컨테이너. 관련 정보를 그룹화하여 표시합니다.',
    subComponents: ['CardHeader', 'CardContent', 'CardActions', 'CardMedia'],

    tokens: {
      palette: {
        items: [
          { token: 'background.paper', role: '카드 배경색' },
          { token: 'text.primary', role: '제목 텍스트' },
          { token: 'text.secondary', role: '부제목, 설명 텍스트' },
          { token: 'divider', role: '구분선 색상' },
        ],
        affects: '카드 배경, 텍스트 색상',
        howToUse: 'sx prop으로 커스텀',
      },
      shape: {
        items: [
          { token: 'borderRadius', role: '카드 모서리' },
        ],
        affects: '카드 외곽 모서리',
        howToUse: 'theme.shape.borderRadius (현재: 0px)',
      },
      shadows: {
        items: [
          { token: 'elevation1', role: '기본 그림자' },
          { token: 'elevation2-24', role: 'elevation prop 값' },
        ],
        affects: '카드 떠있는 효과',
        howToUse: 'elevation prop으로 지정',
      },
      spacing: {
        items: [
          { token: 'spacing(2)', role: 'CardContent padding' },
          { token: 'spacing(1)', role: 'CardActions padding' },
        ],
        affects: '내부 여백',
        howToUse: '자동 적용, sx로 조절',
      },
    },
  },

  // ============================================================
  // 6. Table
  // ============================================================
  Table: {
    name: 'Table',
    description: '데이터를 행과 열로 구성하여 표시하는 테이블 컴포넌트.',
    subComponents: ['TableHead', 'TableBody', 'TableRow', 'TableCell', 'TablePagination'],

    tokens: {
      palette: {
        items: [
          { token: 'background.paper', role: '테이블 배경' },
          { token: 'text.primary', role: '셀 텍스트' },
          { token: 'text.secondary', role: '보조 텍스트' },
          { token: 'divider', role: '셀 구분선' },
          { token: 'action.hover', role: '행 hover 배경' },
          { token: 'action.selected', role: '선택된 행 배경' },
        ],
        affects: '배경, 텍스트, 구분선 색상',
        howToUse: 'sx prop으로 커스텀',
      },
      typography: {
        items: [
          { token: '13px / 1.5', role: '셀 텍스트 — MuiTableCell root override' },
          { token: '12px / 500 / text.secondary', role: '헤더 셀 — 값보다 한 단 물러난 라벨. 한 줄 고정(nowrap)' },
        ],
        affects: '텍스트 스타일',
        howToUse: '자동 적용 (MuiTableCell root/head override). MUI 기본(본문 14px, 헤더 14/500 검정)은 헤더가 값과 같은 급으로 읽혀 표 위쪽이 무거웠다',
      },
      spacing: {
        items: [
          { token: '10px 16px', role: '셀 padding (기본)' },
          { token: '8px 16px', role: '셀 padding (size="small")' },
        ],
        affects: '셀 내부 여백 — 행 높이',
        howToUse: 'MuiTableCell override가 정한다. size prop(small)은 위아래만 줄인다',
      },
    },

    stateTokens: {
      hover: 'action.hover 행 배경 (MuiTableRow override — hover prop을 준 행만)',
      selected: 'action.selected 행 배경',
      sortActive: '별도 override 없음 (MUI 기본)',
    },
  },

  // ============================================================
  // 7. Chip
  // ============================================================
  Chip: {
    name: 'Chip',
    description: '태그, 상태, 카테고리를 표시하는 작은 컴포넌트.',
    variants: ['filled', 'outlined'],
    sizes: ['small', 'medium'],

    tokens: {
      palette: {
        items: [
          { token: 'default', role: '기본 회색 배경' },
          { token: 'primary', role: '주요 강조' },
          { token: 'secondary', role: '보조 강조' },
          { token: 'error', role: '오류/삭제 상태' },
          { token: 'warning', role: '주의 상태' },
          { token: 'success', role: '성공/완료 상태' },
          { token: 'info', role: '정보 상태' },
        ],
        affects: '배경색 (filled), 테두리색 (outlined)',
        howToUse: 'color prop으로 지정',
      },
      typography: {
        items: [
          { token: '11px / height 20', role: '칩 텍스트 (size="small") — 운영 화면 정보 밀도 기준' },
        ],
        affects: '라벨 텍스트',
        howToUse: '자동 적용',
      },
      shape: {
        items: [
          { token: 'radius.control', role: '칩 모서리 — pill이 아니라 다른 컨트롤과 같은 6px' },
        ],
        affects: '둥근 모서리',
        howToUse: 'theme.components.MuiChip (현재: 6px — radius.control)',
      },
      spacing: {
        items: [
          { token: 'spacing(0.5)', role: '아이콘-텍스트 간격' },
          { token: 'spacing(1)', role: '내부 padding' },
        ],
        affects: '내부 여백',
        howToUse: 'size prop으로 조절',
      },
    },

    stateTokens: {
      hover: '배경색 진해짐 (clickable)',
      focus: 'focusVisible 링',
      disabled: 'action.disabled',
    },
  },

  // ============================================================
  // 8. Alert
  // ============================================================
  Alert: {
    name: 'Alert',
    description: '사용자에게 중요한 메시지를 전달하는 피드백 컴포넌트.',
    variants: ['standard', 'filled', 'outlined'],
    severities: ['error', 'warning', 'success', 'info'],

    tokens: {
      palette: {
        items: [
          { token: 'error', role: '오류 메시지 (빨간색)' },
          { token: 'warning', role: '경고 메시지 (주황색)' },
          { token: 'success', role: '성공 메시지 (초록색)' },
          { token: 'info', role: '정보 안내 — 색면이 아니라 surface.sunken + 1px divider + text.primary다(MuiAlert standardInfo override). 색은 경고(warning/error)에만 남긴다' },
        ],
        affects: '배경색, 아이콘색, 텍스트색',
        howToUse: 'severity prop으로 지정',
      },
      typography: {
        items: [
          { token: 'body2', role: '메시지 텍스트' },
          { token: 'subtitle2', role: '제목 텍스트 (AlertTitle)' },
        ],
        affects: '텍스트 스타일',
        howToUse: '자동 적용',
      },
      shape: {
        items: [
          { token: 'radius.control', role: 'Alert 모서리' },
        ],
        affects: '외곽 모서리',
        howToUse: 'theme.shape.radius.control (현재: 6px — MuiAlert override)',
      },
      spacing: {
        items: [
          { token: 'spacing(1.5)', role: '내부 padding' },
          { token: 'spacing(1.5)', role: '아이콘-텍스트 간격' },
        ],
        affects: '내부 여백',
        howToUse: '자동 적용',
      },
    },
  },

  // ============================================================
  // 9. Tabs
  // ============================================================
  Tabs: {
    name: 'Tabs',
    description: '콘텐츠를 탭으로 구분하여 네비게이션하는 컴포넌트.',
    subComponents: ['Tab'],

    tokens: {
      palette: {
        items: [
          { token: 'primary.main', role: '선택된 탭, indicator 색상' },
          { token: 'accent.main', role: '선택된 탭 텍스트 + indicator (MuiTab/MuiTabs override — primary 변형 한정)' },
          { token: 'text.secondary', role: '비선택 탭 텍스트' },
          { token: 'action.hover', role: '탭 hover 배경' },
          { token: 'divider', role: '탭 구분선 (선택적)' },
        ],
        affects: '탭 텍스트, indicator 색상',
        howToUse: 'textColor, indicatorColor prop',
      },
      typography: {
        items: [
          { token: '14px / 500 / textTransform none', role: '탭 라벨 — MuiTab override (typography.button 600을 덮는다)' },
        ],
        affects: '탭 라벨 텍스트',
        howToUse: '자동 적용',
      },
      spacing: {
        items: [
          { token: '12px 16px', role: '탭 내부 padding' },
          { token: 'minHeight 44 / minWidth 0', role: '탭 높이와 최소폭 — 밑줄이 라벨 폭만큼만 그어진다' },
        ],
        affects: '탭 크기, 간격',
        howToUse: '자동 적용 (MuiTab/MuiTabs override). indicator 높이는 2px',
      },
      transitions: {
        items: [
          { token: 'duration.standard', role: 'indicator 이동 속도' },
        ],
        affects: 'indicator 슬라이드 애니메이션',
        howToUse: '자동 적용',
      },
    },

    stateTokens: {
      hover: 'action.hover 배경',
      selected: 'accent.main 텍스트, indicator',
      disabled: 'text.disabled',
    },
  },

  // ============================================================
  // 10. Dialog
  // ============================================================
  Dialog: {
    name: 'Dialog',
    description: '모달 창. 사용자의 주의를 끌어 중요한 정보나 액션을 요청합니다.',
    subComponents: ['DialogTitle', 'DialogContent', 'DialogActions'],

    tokens: {
      palette: {
        items: [
          { token: 'background.paper', role: '다이얼로그 배경' },
          { token: 'text.primary', role: '제목, 본문 텍스트' },
          { token: 'text.secondary', role: '보조 텍스트' },
          { token: 'divider', role: '섹션 구분선' },
          { token: 'action.active', role: 'backdrop (어두운 오버레이)' },
        ],
        affects: '배경, 텍스트, backdrop 색상',
        howToUse: 'sx prop으로 커스텀',
      },
      typography: {
        items: [
          { token: 'h6', role: 'DialogTitle 텍스트' },
          { token: 'body1', role: 'DialogContent 텍스트' },
        ],
        affects: '텍스트 스타일',
        howToUse: '자동 적용',
      },
      shape: {
        items: [
          { token: 'borderRadius', role: '다이얼로그 모서리' },
        ],
        affects: '외곽 모서리',
        howToUse: 'theme.shape.borderRadius',
      },
      shadows: {
        items: [
          { token: 'elevation24', role: '다이얼로그 그림자' },
        ],
        affects: '떠있는 효과',
        howToUse: '자동 적용 (가장 높은 elevation)',
      },
      zIndex: {
        items: [
          { token: 'modal (1300)', role: '레이어 순서' },
        ],
        affects: '다른 모든 요소 위에 표시',
        howToUse: '자동 적용',
      },
      spacing: {
        items: [
          { token: 'spacing(2)', role: 'DialogTitle padding' },
          { token: 'spacing(3)', role: 'DialogContent padding' },
          { token: 'spacing(1)', role: 'DialogActions padding' },
        ],
        affects: '내부 여백',
        howToUse: '자동 적용',
      },
      transitions: {
        items: [
          { token: 'duration.enteringScreen', role: '열림 애니메이션' },
          { token: 'duration.leavingScreen', role: '닫힘 애니메이션' },
        ],
        affects: '나타남/사라짐 효과',
        howToUse: 'TransitionComponent prop',
      },
    },
  },
};

/**
 * 토큰 카테고리 메타데이터
 * 각 토큰 카테고리의 설명과 피그마 비유
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
    description: '타이포그래피 토큰',
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
    description: '모양 토큰',
    figmaAnalogy: 'Corner Radius',
    icon: '⬜',
  },
  shadows: {
    name: 'Shadows',
    description: '그림자/Elevation 토큰',
    figmaAnalogy: 'Drop Shadow Effects',
    icon: '🌑',
  },
  transitions: {
    name: 'Transitions',
    description: '전환 효과 토큰',
    figmaAnalogy: 'Smart Animate',
    icon: '⏱️',
  },
  zIndex: {
    name: 'Z-Index',
    description: '레이어 순서',
    figmaAnalogy: 'Layer Order',
    icon: '📚',
  },
};

/**
 * 테마가 실제로 override하는 MUI 컴포넌트 전부.
 *
 * 위 componentTokenMap이 "이 컴포넌트는 어떤 토큰을 읽나"를 설명한다면, 이 표는
 * "우리 테마가 MUI 기본값에서 무엇을 바꿨나"를 한 줄씩 말한다. 둘을 나눈 이유:
 * 토큰 맵은 컴포넌트 열 개짜리 상세 문서라 항목을 늘리면 읽는 비용이 커지는데,
 * override는 목록만 있어도 "여긴 우리가 손댔다"는 사실이 전달된다. 화면에서
 * 예상과 다른 모양이 나오면 여기부터 본다.
 *
 * 원천은 src/styles/themes/default.js의 components 블록이다.
 */
const themeOverrides = [
  { component: 'MuiCssBaseline', changes: '얇은 스크롤바, 글자 안티에일리어싱(13px 소형 텍스트가 번지지 않게)' },
  { component: 'MuiPaper', changes: 'elevation 0~4를 customShadows(sm~xl)로 — offset 없이 blur만' },
  { component: 'MuiButton', changes: 'radius.control(6px) · textTransform none · **굵기 500** · **그림자 전면 제거** · contained/outlined/text primary를 accent로(outlined 테두리는 accent 35%) · sizeSmall 13px' },
  { component: 'MuiCard', changes: 'radius 0 — 구조 표면은 각진다' },
  { component: 'MuiTypography', changes: 'variantMapping — display→div, label→div, title→h3 (역할 토큰의 HTML 태그)' },
  { component: 'MuiOutlinedInput', changes: 'radius.control · 기본 테두리 grey.300, hover grey.400 · focus는 **1px accent + 3px accent.ring**(MUI 기본 2px 아님)' },
  { component: 'MuiMenuItem', changes: '선택 배경 accent.tint / hover accent.tintHover (MUI 기본 순수 파랑 틴트 대신)' },
  { component: 'MuiChip', changes: 'radius.control · sizeSmall 높이 20, 11px' },
  { component: 'MuiToggleButton', changes: 'radius.control · 13px/500 · 비선택 text.secondary · 선택은 accent.tint 채움 + accent.main 글자(테두리는 그대로)' },
  { component: 'MuiAlert', changes: 'radius.control · **standardInfo는 색면이 아니라 surface.sunken + 1px divider + text.primary**' },
  { component: 'MuiMenu / MuiPopover', changes: '1px divider 테두리 + radius.container(8px) + 거의 안 보이는 그림자' },
  { component: 'MuiTooltip', changes: '12px · radius.control · 배경 text.primary' },
  { component: 'MuiSkeleton', changes: 'rounded 변형에 radius.control (전역 shape 0을 곱해 각졌던 것)' },
  { component: 'MuiTabs / MuiTab', changes: 'indicator 2px accent · 탭 44px/14px/500/none · 비선택 text.secondary · primary 변형 한정' },
  { component: 'MuiTableCell', changes: '본문 13px · **헤더 12px/500/text.secondary/nowrap** · padding 10px 16px(small 8px 16px) · borderBottom 1px divider' },
  { component: 'MuiTableRow', changes: 'hover 배경 action.hover (hover prop을 준 행만)' },
  { component: 'MuiTablePagination', changes: '12px · text.secondary · toolbar minHeight 44' },
  { component: 'MuiDrawer', changes: 'paper 폭 440 (CampaignDetailPanel만 580으로 늘려 쓴다)' },
];

/**
 * 컴포넌트 목록 (순서대로)
 */
const componentList = [
  'Button',
  'Typography',
  'TextField',
  'Select',
  'Card',
  'Table',
  'Chip',
  'Alert',
  'Tabs',
  'Dialog',
];

export { componentTokenMap, tokenCategories, componentList, themeOverrides };
export default componentTokenMap;
