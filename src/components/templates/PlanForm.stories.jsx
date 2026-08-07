import { useState } from 'react';
import Box from '@mui/material/Box';
import { PlanForm } from './PlanForm';
import { PLATFORM } from '../../data/schema';

const EVENT_OPTIONS = ['G10 Opening', 'BF4 Opening', 'Labor Day', 'WorldCup2026', '1$ Deals'];

export default {
  title: 'Paid Ads Dashboard/Templates/PlanForm',
  component: PlanForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PlanForm

집행 **전에** 세우는 이벤트 계획 입력 폼. 캠페인 등록 폼이 아니다 — 이 앱은 캠페인을
만들지 않는다(원본이 항상 Meta/TikTok에 있고, 여기서 만들면 external_campaign_id가
없어 성과가 영원히 안 붙는 반쪽짜리가 된다). 계획은 그것과 별개로, 돈을 쓰기 전에
짜두고 나중에 실제 집행과 대조하기 위한 문서다.

**이름이 대조 키다.** plans.name = campaigns.campaignGroup이라 이름이 실제 이벤트와
같아야 "계획 vs 실제"가 붙는다. 그래서 이름 칸은 기존 이벤트에서 고르되 **새 이름도
칠 수 있는**(freeSolo) 형태다 — 이미 집행한 이벤트에 사후 계획을 붙이는 경우와, 아직
없는 이벤트를 미리 계획하는 경우가 둘 다 실제로 있다.

**총액은 입력받지 않는다.** 일일 예산 × 기간으로 계산해 읽기 전용으로 보여준다 — 두
값을 다 입력받으면 어긋났을 때 어느 쪽이 맞는지 알 수 없고, 광고 관리자에서 실제로
설정하는 값도 일일 예산이다(캠페인 폼의 Planned Budget과 같은 규칙).

### 이름이 안 맞을 때 — 막지 않고 묻는다
자유 입력이라 **오타로 끊어진 계획이 오류 없이 저장된다.** 나중에 화면은 "실제 집행
없음"만 보여주고, 사용자는 계획이 끊어진 걸 모른 채 예산을 판단한다. 실제 계정에
\`50%Off\` / \`50%Offdeals Reach\` / \`50%Offdeals Trafp\`처럼 닮은 이름이 이미 있어서
가정이 아니라 실재하는 위험이다.

\`matchEventName()\`(schema.js)이 네 경우를 구분하고, 폼은 helperText와 경고로 **다르게**
말한다:

| 경우 | 화면 |
|---|---|
| \`exact\` — 그대로 일치 | helperText: \`Linked — actuals … will be compared\` |
| \`normalized\` — 대소문자·구분자만 다름 | 경고 + \`Use it\` (거의 확실히 같은 이벤트) |
| \`typo\` — 편집 거리가 가까움 | 경고 + \`Did you mean …?\` |
| \`new\` — 닮은 게 없음 | 경고 **없음**. 아직 없는 이벤트를 미리 계획하는 건 정상 경로다 |

**매장 코드가 다르면 제안하지 않는다.** \`G11 Opening\`은 \`G10 Opening\`과 편집 거리
1이지만 오타가 아니라 **새로 여는 11호점**이다. 6호점 계획을 세우는 사람에게
"3호점 말씀이신가요?"를 묻는 건 최악의 제안이다.
        `,
      },
    },
  },
};

/** 상태를 들고 있는 래퍼 — 폼은 제어 컴포넌트라 스토리가 값을 소유해야 한다. */
function Harness({ initial }) {
  const [values, setValues] = useState(initial);
  return (
    <Box sx={{ maxWidth: 900 }}>
      <PlanForm
        values={values}
        onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
        onItemsChange={(items) => setValues((v) => ({ ...v, items }))}
        eventOptions={EVENT_OPTIONS}
      />
    </Box>
  );
}

/** 빈 폼 — "Add phase"로 단계를 쌓아 나간다. 합계는 항목이 없으면 '—'다. */
export const Empty = {
  render: () => <Harness initial={{ name: '', notes: '', items: [] }} />,
};

/**
 * 채워진 계획 — 제안 단계에서 예시로 쓴 G10 Opening 그대로다.
 *
 * 확인 포인트: 각 줄 우측의 금액이 `일일 예산 × 기간(양 끝 포함)`인가
 * ($40/day × 6/17~7/7 = 21일 = $840). 상단 Planned total이 네 줄의 합
 * ($3,130)인가. 총액 입력칸은 **없어야** 한다 — 계산 결과지 입력값이 아니다.
 */
export const Filled = {
  render: () => (
    <Harness
      initial={{
        name: 'G10 Opening',
        notes: 'Union City opening — 4 phases across Meta and TikTok.',
        items: [
          { label: 'Coming Soon', platform: PLATFORM.META, startDate: '2026-06-17', endDate: '2026-07-07', budgetDaily: '40' },
          { label: 'Coming Soon', platform: PLATFORM.TIKTOK, startDate: '2026-06-17', endDate: '2026-07-07', budgetDaily: '20' },
          { label: 'Grand Opening', platform: PLATFORM.META, startDate: '2026-07-06', endDate: '2026-08-01', budgetDaily: '30' },
          { label: '1 Month Deals', platform: PLATFORM.TIKTOK, startDate: '2026-07-10', endDate: '2026-08-31', budgetDaily: '20' },
        ],
      }}
    />
  ),
};

/**
 * 이름이 정확히 일치 — 대조가 붙는 상태.
 *
 * 확인 포인트: 경고가 **없고** helperText가 `Linked — actuals from this event
 * will be compared against the plan`으로 바뀌는가. 이름 칸이 잘 맞았다는 걸
 * 화면이 적극적으로 말해야, 안 맞을 때의 경고도 신호로 읽힌다.
 */
export const NameMatchesEvent = {
  name: 'Name matches an event (linked)',
  render: () => <Harness initial={{ name: 'G10 Opening', notes: '', items: [] }} />,
};

/**
 * 오타 — 기존 `G10 Opening`과 한 글자 차이.
 *
 * 확인 포인트:
 * - `No campaigns are tagged with this name yet. Did you mean "G10 Opening"?`
 * - `Use it`을 누르면 이름이 교정되고 경고가 사라지며 helperText가 Linked로 바뀐다
 * - **저장을 막지는 않는다** — 경고지 오류가 아니다
 */
export const NameLooksLikeTypo = {
  name: 'Name looks like a typo (suggests)',
  render: () => <Harness initial={{ name: 'G10 Openin', notes: '', items: [] }} />,
};

/**
 * 대소문자·공백만 다른 경우 — 사실상 같은 이벤트다.
 *
 * 확인 포인트: 오타 문구가 아니라 `only spacing or case differs` 문구가 나온다.
 * 둘을 같은 말로 뭉뚱그리면 "내가 오타를 냈나?"와 "표기만 다르구나"를 구분할 수
 * 없다.
 */
export const NameDiffersOnlyInCase = {
  name: 'Name differs only in case/spacing',
  render: () => <Harness initial={{ name: 'g10  opening', notes: '', items: [] }} />,
};

/**
 * 아직 없는 매장의 새 이벤트 — **경고가 뜨면 안 된다.**
 *
 * `G11 Opening`은 `G10 Opening`과 편집 거리 1이지만 새로 여는 11호점이다.
 * 매장 코드가 다르면 후보에서 아예 제외한다(schema.js sameStoreCodes).
 *
 * 확인 포인트: 경고 없이 `No campaigns use this name yet — that is fine for a
 * plan made before launch`만 나오는가. 이게 이 기능의 **정상 경로**다.
 */
export const NewStoreEvent = {
  name: 'New store event (no false suggestion)',
  render: () => <Harness initial={{ name: 'G11 Opening', notes: '', items: [] }} />,
};

/**
 * 덜 채워진 줄 — 일일 예산이나 기간이 비면 그 줄의 금액은 '—'이고 합계에서도
 * 빠진다. 0으로 세지 않는 게 핵심이다: "예산 0으로 계획했다"는 사실이 아니다.
 * 저장할 때도 이런 줄은 걸러진다(PlanPanel).
 */
export const IncompleteRow = {
  render: () => (
    <Harness
      initial={{
        name: 'BF4 Opening',
        notes: '',
        items: [
          { label: 'Coming Soon', platform: PLATFORM.META, startDate: '2026-04-10', endDate: '2026-04-12', budgetDaily: '25' },
          { label: '', platform: PLATFORM.TIKTOK, startDate: '', endDate: '', budgetDaily: '' },
        ],
      }}
    />
  ),
};
