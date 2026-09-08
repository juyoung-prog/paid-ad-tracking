import { useState } from 'react';
import Box from '@mui/material/Box';
import { RecapLearningsEditor } from './RecapLearningsEditor';
import { mockEventRecaps } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Templates/RecapLearningsEditor',
  component: RecapLearningsEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapLearningsEditor

이벤트 단위의 글을 적는 폼(Build Plan Phase 5) — 보고서 상태(draft/final), 요약
한 단락, "배운 점" 카드 목록(제목 + 본문, 추가·삭제·순서), 다음 제언. 이전 보고서의
Learnings 탭 구조를 그대로 옮겼다.

읽기 화면의 Learnings 섹션은 2026-09-08에 뺐다(Key takeaways·표의 해석 네 열과 중복). 그래서
여기서 쓴 배운 점·제언은 페이지에 표시되지 않고 저장·시트 내보내기·AI 초안에만 쓰인다.
상태(draft/final)와 요약은 머리글·목록에 계속 보인다.

LocalizedText의 \`lang\` 칸 하나만 편집하고 저장은 하지 않는다(onChange로 patch).
문구는 recapStrings.
        `,
      },
    },
  },
  argTypes: {
    recap: { control: 'object', description: '편집 중인 보고서(EventRecap)' },
    onChange: { action: 'changed', description: '(patch) => void' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '편집 언어' },
    isDisabled: { control: 'boolean', description: '저장 중 잠금' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

function Interactive(props) {
  const [recap, setRecap] = useState(props.recap);
  return (
    <Box sx={{ maxWidth: 960 }}>
      <RecapLearningsEditor {...props} recap={recap} onChange={(patch) => { props.onChange?.(patch); setRecap((r) => ({ ...r, ...patch })); }} />
    </Box>
  );
}

/** 저장된 Draft 보고서 — 배운 점 2개 */
export const Default = {
  args: { recap: mockEventRecaps[0] },
  render: (args) => <Interactive {...args} />,
};

/** 새 보고서 — 전부 비어 있다. "Add lesson"으로 카드를 만든다 */
export const Empty = {
  args: { recap: { id: null, eventName: 'BF4 Opening', status: 'draft', summary: null, learnings: [], nextSteps: null } },
  render: (args) => <Interactive {...args} />,
};

/** 저장 중 잠금 */
export const Disabled = {
  args: { recap: mockEventRecaps[0], isDisabled: true },
};
