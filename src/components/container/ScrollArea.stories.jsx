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
- 그림자는 검정 알파 그라디언트라 색을 더하지 않고, 클릭도 가로채지 않는다
- \`startOffset\`으로 좌측 그림자 위치를 안쪽으로 밀 수 있다 — 표의 고정(sticky) 열처럼
  스크롤해도 제자리에 있는 요소가 앞을 덮고 있을 때, 그림자는 그 요소의 오른쪽 경계에
  붙어야 "여기서부터 움직인다"로 읽힌다
- \`label\`을 주면 \`role="region"\` + 키보드 포커스가 붙는다 (WCAG 2.1.1 — 스크롤 영역은
  키보드로도 조작 가능해야 한다)

### 상태 관리
상태로 두는 값은 "그림자를 켤지 말지"라는 불리언 두 개뿐이다. 스크롤 좌표 자체를 상태로
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
