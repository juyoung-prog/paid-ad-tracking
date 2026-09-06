import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ScrollArea } from './ScrollArea';
import Placeholder from '../../common/ui/Placeholder';

export default {
  title: 'Component/2. Container/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## ScrollArea

가로로 넘치는 내용을 스크롤시키되, **더 볼 게 남았다는 사실 자체를 보이게** 하는 컨테이너.

### 왜 필요한가
브라우저 기본 \`overflow: auto\`는 스크롤바가 뜨기 전까지 아무 신호도 주지 않는다.
특히 macOS 오버레이 스크롤바에서는 스크롤을 시작해야 스크롤바가 나타나므로, 넘친 표가
"딱 맞게 끝난 것"처럼 보인다 — 조금만 넘칠수록 오히려 더 완결돼 보여서 발견이 어렵다.
(Reports 성과표에서 마지막 컬럼이 통째로 안 보이는데 아무 표시가 없던 실사용 문제로 추가)

### 기능
- 남은 방향에만 가장자리 그림자를 띄우고, 끝에 닿으면 사라진다
- \`maxHeight\`를 주면 세로 스크롤도 받고, 세로로 넘치면 신호를 띄운다 — 없으면
  가로와 같은 함정이 세로로 재발한다(43일짜리 Daily spend 표가 열한 줄에서 끝난
  것처럼 보인 실사용 신고). 위쪽 그림자는 일부러 없다 — 스크롤을 시작한 사람에게만
  생기는 상태라 발견 신호가 아니고, sticky 헤더 위에 얹으려면 헤더를 덮어야 한다
- \`scrollHint\`가 그 신호를 고른다. \`'fade'\`(기본)는 아래 그라데이션,
  \`'scrollbar'\`는 **항상 보이는 얇은 스크롤바**다. 좁은 드로어의 표에서는 아래
  페이드가 마지막 행 위에 가로로 깔려 "이 행이 선택됐다"로 읽혀서(실사용 지적)
  스크롤바 쪽을 쓴다 — 신호를 없애면 위의 함정이 그대로 돌아오므로 바꾸기만 한다.
  좌우 페이드는 두 모드 모두 그대로다
- 그림자는 검정 알파 그라디언트라 색을 더하지 않고, 클릭도 가로채지 않는다
- \`startOffset\`으로 좌측 그림자 위치를 안쪽으로 밀 수 있다 — 표의 고정(sticky) 열처럼
  스크롤해도 제자리에 있는 요소가 앞을 덮고 있을 때, 그림자는 그 요소의 오른쪽 경계에
  붙어야 "여기서부터 움직인다"로 읽힌다
- \`label\`을 주면 \`role="region"\` + 키보드 포커스가 붙는다 (WCAG 2.1.1 — 스크롤 영역은
  키보드로도 조작 가능해야 한다)

### 상태 관리
상태로 두는 값은 "그림자를 켤지 말지"라는 불리언 세 개(좌·우·아래)뿐이다. 스크롤 좌표 자체를 상태로
올리면 스크롤 프레임마다 리렌더가 돈다. 전환도 opacity만 사용한다.
        `,
      },
    },
  },
  argTypes: {
    children: { control: false, description: '스크롤될 내용' },
    label: { control: 'text', description: '스크롤 영역의 접근성 이름. 주면 role="region" + 키보드 포커스가 붙는다' },
    startOffset: {
      control: { type: 'number', min: 0, max: 400 },
      description: '좌측 그림자를 그릴 x 위치(px). 고정 열 폭 등',
    },
    maxHeight: {
      control: { type: 'number', min: 0, max: 1000 },
      description: '세로 최대 높이(px). 주면 세로 스크롤도 이 영역이 받고, 넘치면 scrollHint가 정한 신호를 띄운다',
    },
    scrollHint: {
      control: { type: 'radio' },
      options: ['fade', 'scrollbar'],
      description: "세로 스크롤 신호 — 'fade'(기본, 아래 그라데이션) 또는 'scrollbar'(항상 보이는 얇은 스크롤바)",
    },
    sx: { control: 'object', description: '추가 스타일 오버라이드' },
  },
};

/** 넘치는 내용을 담아 양끝 그림자를 확인한다. 좌우로 스크롤해 보면 끝에 닿을 때 그림자가 사라진다. */
export const Default = {
  args: {
    label: 'Example scroll area',
    startOffset: 0,
  },
  render: (args) => (
    <ScrollArea { ...args } sx={ { maxWidth: 520 } }>
      <Box sx={ { display: 'flex', gap: 2, width: 1200 } }>
        { [0, 1, 2, 3, 4, 5].map((i) => (
          <Placeholder.Box key={ i } label={ `Block ${i + 1}` } sx={ { width: 180, height: 120, flexShrink: 0 } } />
        )) }
      </Box>
    </ScrollArea>
  ),
};

/**
 * maxHeight — 세로로 넘치는 목록. 기본(scrollHint='fade')은 아래쪽 그림자가
 * "더 볼 게 남았다"를 말하고, 끝까지 스크롤하면 사라진다. 스크롤을 시작하기
 * 전에도 보이는 게 핵심이다 — 이 신호가 없으면 목록이 화면에 보이는 줄에서
 * 끝난 것처럼 읽힌다.
 */
export const VerticalOverflow = {
  render: () => (
    <ScrollArea label="Vertically overflowing list" maxHeight={ 280 } sx={ { maxWidth: 360 } }>
      <Box sx={ { display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 } }>
        { [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Placeholder.Box key={ i } label={ `Row ${i + 1}` } sx={ { height: 64 } } />
        )) }
      </Box>
    </ScrollArea>
  ),
};

/**
 * startOffset — 고정 열이 앞을 덮고 있는 경우.
 * 좌측 그림자가 컨테이너 왼쪽 끝이 아니라 고정 영역의 오른쪽 경계에 붙는다.
 */
export const WithStickyStart = {
  render: () => (
    <ScrollArea label="Table with a frozen first column" startOffset={ 160 } sx={ { maxWidth: 520 } }>
      <Box sx={ { display: 'flex', width: 1200 } }>
        <Box
          sx={ {
            position: 'sticky',
            left: 0,
            zIndex: 1,
            width: 160,
            flexShrink: 0,
            backgroundColor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 1.5,
          } }
        >
          <Typography variant="body2" sx={ { fontWeight: 600 } }>
            고정 열
          </Typography>
        </Box>
        <Box sx={ { display: 'flex', gap: 2, p: 1.5 } }>
          { [0, 1, 2, 3, 4, 5].map((i) => (
            <Placeholder.Box key={ i } label={ `Col ${i + 1}` } sx={ { width: 160, height: 96, flexShrink: 0 } } />
          )) }
        </Box>
      </Box>
    </ScrollArea>
  ),
};

/**
 * scrollHint='scrollbar' — 아래 페이드 대신 **항상 보이는 얇은 스크롤바**로
 * "더 있다"를 말한다. CampaignDetailPanel의 Daily spend 표가 쓰는 형태다.
 *
 * 왜 나눴나: 좁은 드로어의 표에서는 아래 페이드가 마지막 행 위에 가로로 깔려서
 * 그 행이 선택된 것처럼 읽혔다(실사용 지적 — 옅게 낮춰도 남았다). 그렇다고
 * 신호를 없애면 47일짜리 표가 여덟 줄에서 끝난 것처럼 보이던 문제가 돌아온다.
 * 그래서 신호를 **바꾸기만** 한다.
 *
 * 확인 포인트:
 * - 표 아래에 회색 띠가 **없는가** — 마지막 행이 흰 배경으로 깨끗하게 끝난다
 * - 오른쪽에 얇은 스크롤바가 마우스를 올리지 않아도 보이는가
 * - 좌우로도 넘치면 좌우 페이드는 그대로 나오는가(이 모드에서도 유지된다)
 */
export const ScrollbarHint = {
  args: {
    label: 'Scrollbar hint demo',
    maxHeight: 200,
    scrollHint: 'scrollbar',
  },
  render: (args) => (
    <Box sx={{ maxWidth: 360, border: '1px solid', borderColor: 'divider' }}>
      <ScrollArea {...args}>
        <Box>
          {Array.from({ length: 20 }, (_, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontSize: 13,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{`Row ${i + 1}`}</span>
              <span>{`$${(20 + i).toFixed(2)}`}</span>
            </Box>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  ),
};
