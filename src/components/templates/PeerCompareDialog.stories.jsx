import { useState } from 'react';
import Button from '@mui/material/Button';
import { PeerCompareDialog } from './PeerCompareDialog';
import { buildPeerComparison, BENCHMARK_METRICS } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords } from '../../data/paidAdsMockData';

/* 계산은 schema.js — 스토리는 결과를 넘길 뿐 */
const subject = mockRecapCampaigns.find((c) => c.id === 'rc-g10-go-m');
const comparison = buildPeerComparison(subject, mockRecapCampaigns, mockRecapPerformanceRecords, { metricKey: 'hookRate' });
const tiktokSubject = mockRecapCampaigns.find((c) => c.id === 'rc-g10-go-t');
const tiktokComparison = buildPeerComparison(tiktokSubject, mockRecapCampaigns, mockRecapPerformanceRecords, { metricKey: 'cpm' });
const METRIC_KEYS = BENCHMARK_METRICS.map((m) => m.key);

export default {
  title: 'Paid Ads Dashboard/Templates/PeerCompareDialog',
  component: PeerCompareDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## PeerCompareDialog

캠페인 하나와 그 비교군을 **나란히** 놓는 대화상자. Recap 표의 벤치마크("top 25%")
글자를 누르면 열린다. 벤치마크는 중앙값 하나만 말하는데, "BF4 Grand Opening보다
나았나"처럼 개별 캠페인과 맞대고 싶을 때 쓴다.

- 첫 행이 주인공(accent 틴트 + 굵게), 나머지가 비교군
- 지표 열 머리를 누르면 그 열로 정렬 — 비용 지표(CPM·CPC·CPA)는 낮은 값이 위
- rows는 \`schema.js\`의 \`buildPeerComparison()\` 결과. 대화상자는 정렬 방향만 바꾼다
        `,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean', description: '열림 여부' },
    onClose: { action: 'closed', description: '닫기' },
    rows: { control: 'object', description: 'buildPeerComparison().rows — 첫 행이 주인공' },
    scope: { control: 'select', options: ['phase', 'goal', 'none'], description: '비교군 기준' },
    metricKeys: { control: 'object', description: '열로 보여줄 지표 키' },
    initialMetricKey: { control: 'text', description: '처음 정렬 기준' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
  },
};

/** Meta Grand Opening — 같은 단계 비교군 4개, Hook 기준 정렬로 시작 */
export const Default = {
  args: { isOpen: true, rows: comparison.rows, scope: comparison.scope, metricKeys: METRIC_KEYS, initialMetricKey: 'hookRate' },
};

/** TikTok — 비교군이 부족해 scope 'none'. 주인공 한 줄만 보인다 */
export const NotEnoughPeers = {
  args: { isOpen: true, rows: tiktokComparison.rows, scope: tiktokComparison.scope, metricKeys: METRIC_KEYS, initialMetricKey: 'cpm' },
};

/** 버튼으로 열고 닫기 */
export const Triggered = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="outlined" size="small" onClick={() => setIsOpen(true)}>Compare</Button>
        <PeerCompareDialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  },
  args: { rows: comparison.rows, scope: comparison.scope, metricKeys: METRIC_KEYS, initialMetricKey: 'cpm' },
};
