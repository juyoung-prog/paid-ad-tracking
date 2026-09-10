import { useState } from 'react';
import Box from '@mui/material/Box';
import { RecapNoteEditor } from './RecapNoteEditor';
import { mockRecapCampaignNotes } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Templates/RecapNoteEditor',
  component: RecapNoteEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapNoteEditor

Recap 표의 캠페인 한 줄에 대한 사람의 판단을 적는 폼(Build Plan Phase 5) —
판정(good/mid/bad), 장점·아쉬운 점·이유, 선택 입력인 오가닉 조회·참여.

### 캠페인 한 줄의 수기 입력 — 표의 ⋯ 버튼이 여는 팝오버 안
What worked(장점)·Could improve(아쉬운 점)는 2026-09-10부터 캠페인 표 안에서 직접 고친다 — 지표를 보면서
해석을 쓰도록. 같은 값을 두 곳에서 고치지 않게 이 폼에서는 뺐고, 표 아래에 있던 "Notes — N campaigns"
카드도 없앴다. 남은 것은 화면에 나오지 않는 값뿐이다: **이유**(시트 내보내기·AI 초안이 쓴다)와
**오가닉 조회/참여**(광고 API에 없어 손으로 적는 값 — 아직 읽는 곳은 없다).

평가(Good/Fair/Weak) 토글도 뺐다 — 등급은 제품에서 없앤 개념이다. 저장된 값과 시트의 Efficiency 열은
그대로 남으므로 기존 데이터는 잃지 않는다.

### 언어
LocalizedText의 \`lang\` 칸 하나만 편집한다. 3단계의 언어 탭이 이 prop을 바꾼다.
저장은 하지 않는다 — onChange로 바뀐 필드만 올린다. 문구는 recapStrings.
        `,
      },
    },
  },
  argTypes: {
    note: { control: 'object', description: '편집 중인 코멘트(RecapCampaignNote) 또는 null' },
    campaignLabel: { control: 'text', description: '단계 이름 + 플랫폼' },
    onChange: { action: 'changed', description: '(patch) => void' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '편집 언어' },
    isDisabled: { control: 'boolean', description: '저장 중 잠금' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/** 상호작용용 — 로컬 상태로 patch를 합친다 */
function Interactive(props) {
  const [note, setNote] = useState(props.note ?? null);
  return (
    <Box sx={{ maxWidth: 960 }}>
      <RecapNoteEditor {...props} note={note} onChange={(patch) => { props.onChange?.(patch); setNote((n) => ({ ...(n ?? {}), ...patch })); }} />
    </Box>
  );
}

/** 저장된 코멘트 편집 — 평가는 사람이 고른 값만 남는다(자동 제안 없음, 2026-09-08) */
export const Default = {
  args: { note: mockRecapCampaignNotes[0], campaignLabel: 'Grand Opening · Meta' },
  render: (args) => <Interactive {...args} />,
};

/** 빈 코멘트 — 아무것도 고르지 않은 상태 */
export const Empty = {
  args: { note: null, campaignLabel: 'Coming Soon · Meta' },
  render: (args) => <Interactive {...args} />,
};

/** 저장 중 잠금 */
export const Disabled = {
  args: { note: mockRecapCampaignNotes[0], campaignLabel: 'Grand Opening · Meta', isDisabled: true },
};
