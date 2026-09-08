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

### 사람 값만
자동 제안은 없다(2026-09-08 — 종합 등급 개념 자체를 뺐다). 판정을 고르지 않으면 null로 남고
그대로 저장된다("아직 사람이 안 정함"). 판정은 표에 보이지 않고 시트 내보내기에만 남는다.
장점·아쉬운 점·이유는 표의 What worked · Could improve · Why 열에서 자동 문장보다 우선한다 —
단 "ㅇㅇ"·"TBD" 같은 자리표시자는 없는 것으로 본다.

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
