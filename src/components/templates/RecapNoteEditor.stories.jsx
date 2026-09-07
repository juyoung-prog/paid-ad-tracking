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

### 제안값과 사람 값
벤치마크가 제안한 판정은 옆에 칩(툴팁 "suggested")으로 보이고 "Use suggestion"으로
받아들일 수 있다. 아무것도 고르지 않으면 판정은 null로 남고, 화면은 제안값 칩을 계속
보여준다 — "아직 사람이 안 정함"이 저장되는 상태다.

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
    suggestedVerdict: { control: 'select', options: ['good', 'mid', 'bad', null], description: '벤치마크 제안 판정' },
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

/** 저장된 코멘트 편집 — 사람이 이미 good을 골랐고 제안도 good이라 "Use suggestion"이 숨는다 */
export const Default = {
  args: { note: mockRecapCampaignNotes[0], campaignLabel: 'Grand Opening · Meta', suggestedVerdict: 'good' },
  render: (args) => <Interactive {...args} />,
};

/** 빈 코멘트 + 제안 mid — 제안값 칩과 "Use suggestion" 버튼 */
export const EmptyWithSuggestion = {
  args: { note: null, campaignLabel: 'Coming Soon · Meta', suggestedVerdict: 'mid' },
  render: (args) => <Interactive {...args} />,
};

/** 비교군이 없어 제안이 없는 캠페인 */
export const NoSuggestion = {
  args: { note: null, campaignLabel: 'Now Open · Meta', suggestedVerdict: null },
  render: (args) => <Interactive {...args} />,
};

/** 저장 중 잠금 */
export const Disabled = {
  args: { note: mockRecapCampaignNotes[0], campaignLabel: 'Grand Opening · Meta', suggestedVerdict: 'good', isDisabled: true },
};
