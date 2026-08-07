import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { BulkEventTagDialog } from './BulkEventTagDialog';

/**
 * 실제 계정의 이름 형태를 그대로 쓴다 — 매장 코드 접두사(`G10_`), 기간 접미사,
 * 그리고 Meta가 게시물 부스팅을 캠페인으로 만들며 캡션을 잘라 넣은 이름까지.
 * 마지막 것에는 매장 코드가 없어서 제안 로직이 침묵해야 정상이다.
 */
const UNTAGGED = [
  {
    id: 'u-1',
    name: 'G10_Coming Soon_0617~0707',
    platform: 'tiktok',
    startDate: '2026-06-17',
    endDate: '2026-07-07',
  },
  {
    id: 'u-2',
    name: 'G10_Grand Opening_0706~0801',
    platform: 'meta',
    startDate: '2026-07-06',
    endDate: '2026-08-01',
  },
  {
    id: 'u-3',
    name: 'G10_Now Open_0706~0831',
    platform: 'meta',
    startDate: '2026-07-06',
    endDate: '2026-08-31',
  },
];

const MIXED = [
  ...UNTAGGED,
  {
    id: 'u-4',
    name: 'BF3_1$ Deals_5.15~6.7',
    platform: 'meta',
    startDate: '2026-05-15',
    endDate: '2026-06-07',
  },
  {
    id: 'u-5',
    name: 'Instagram post: 🌟 COMING SOON TO UNION CITY, GA ✨ Don’t miss…',
    platform: 'meta',
    startDate: '2026-06-17',
    endDate: '2026-06-24',
  },
];

const EVENT_OPTIONS = ['G10 Opening', 'G09 Opening', 'BF3 Grand Opening', 'Labor Day'];

export default {
  title: 'Paid Ads Dashboard/Templates/BulkEventTagDialog',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## BulkEventTagDialog

Event 태그가 없는 캠페인들에 Event를 **한 번에** 붙인다.

### 왜 필요한가
Event(campaignGroup)는 이 앱의 핵심 추상화다 — 계획 대비, 이벤트 요약, 타임라인이
전부 그 위에 있다. 그런데 태깅은 캠페인 하나씩 Drawer를 열어서 해야 했다. 캠페인이
170건이고 **동기화될 때마다 태그 없는 캠페인이 새로 들어오므로 이 비용은 매번
반복된다.** 실제로는 태깅을 포기하게 되고, 그러면 그 위에 쌓아 올린 나머지가 같이
무너진다.

### 왜 목록 전체에 체크박스를 달지 않았나
이 일의 트리거는 "새 캠페인이 태그 없이 동기화됐다"는 순간이다. 목록 전체를 선택
가능하게 만들면 매일 읽는 화면에 영구적인 시각 소음이 생기는데, 정작 필요한 건
**태그 없는 것만 모아 보는 자리**다. Dashboard에서는 태그 없는 캠페인이 있을 때만
안내 배너가 뜨고, 선택은 이 대화상자 안에서만 한다.

### 제안값의 한계
매장 코드가 하나로 모일 때만 기존 Event를 제안한다. 서버의 정식 규칙
(\`sync-campaigns\`의 \`resolveEventGroup\`)을 클라이언트로 복제하지 **않는다** —
같은 규칙이 두 벌 있으면 한쪽만 고쳐지며 조용히 갈라지고, 이 프로젝트는 이미 그
문제로 백필을 두 번 다시 짰다.

### 마운트 규칙
호출부가 \`{isOpen && <BulkEventTagDialog … />}\`로 조건부 렌더한다. \`isOpen\`
prop이 없고 초기화 effect도 없다 — 매번 새로 마운트되는 것이 곧 초기화다.
        `,
      },
    },
  },
};

/** 대화상자는 마운트되면 바로 열리므로, 스토리도 여닫는 버튼과 함께 보여준다. */
function Harness({ campaigns, eventOptions }) {
  const [isOpen, setIsOpen] = useState(true);
  const [lastApplied, setLastApplied] = useState(null);

  return (
    <Box sx={{ minWidth: 360 }}>
      <Button variant="outlined" onClick={() => setIsOpen(true)} sx={{ boxShadow: 'none' }}>
        Tag them
      </Button>
      {lastApplied && (
        <Box sx={{ mt: 2, typography: 'body2', color: 'text.secondary' }}>
          {`Applied "${lastApplied.name}" to ${lastApplied.count} campaign(s)`}
        </Box>
      )}
      {isOpen && (
        <BulkEventTagDialog
          campaigns={campaigns}
          eventOptions={eventOptions}
          onApply={async (ids, name) => {
            setLastApplied({ name, count: ids.length });
            return ids.length;
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </Box>
  );
}

/**
 * 매장이 하나로 모이는 경우 — 세 캠페인이 전부 `G10_`이라 기존 Event
 * "G10 Opening"이 제안된다.
 *
 * 확인 포인트:
 * - helperText에 `Suggested from the campaign names: G10 Opening`
 * - `Use "G10 Opening"` 버튼을 누르면 입력칸이 채워지고 제안이 사라진다
 * - 기본값이 **전체 선택**이다 — 이 대화상자에 들어온 목적이 그것이라서
 * - Event를 비워 두면 적용 버튼이 잠긴다(태그를 지우는 경로가 아니다)
 */
export const SingleStore = {
  name: 'Suggests an event (one store)',
  render: () => <Harness campaigns={UNTAGGED} eventOptions={EVENT_OPTIONS} />,
};

/**
 * 매장이 섞인 경우 — 제안하지 않는다. 여러 매장을 한 Event로 묶는 건 사람이
 * 의도해야 하는 결정이라 시스템이 추측하면 안 된다.
 *
 * 확인 포인트:
 * - 제안 문구·버튼이 **없다**(helperText가 일반 안내로 돌아간다)
 * - 매장 코드가 없는 부스팅 게시물 행도 목록에 정상적으로 뜬다
 * - 체크를 풀어 G10 세 건만 남기면 그 순간 제안이 나타난다
 */
export const MixedStores = {
  name: 'No suggestion (mixed stores)',
  render: () => <Harness campaigns={MIXED} eventOptions={EVENT_OPTIONS} />,
};

/**
 * 기존 Event가 하나도 없는 계정 — 추천 목록이 비어 있어도 자유 입력으로
 * 새 이름을 만들 수 있어야 한다(첫 사용자의 경로).
 */
export const NoExistingEvents = {
  name: 'First run (no events yet)',
  render: () => <Harness campaigns={UNTAGGED} eventOptions={[]} />,
};
