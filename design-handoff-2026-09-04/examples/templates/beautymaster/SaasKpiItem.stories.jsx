import Box from '@mui/material/Box';
import SaasKpiItem from './SaasKpiItem';
import { SAAS_FONT } from './SaasShell';

export default {
  title: 'BeautyMaster/Atom/SaasKpiItem',
  component: SaasKpiItem,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: '지표 이름' },
    value: { control: 'text', description: '지표 값 (숫자 또는 포맷된 문자열)' },
    total: { control: { type: 'number' }, description: '값 옆에 "of N"으로 붙일 모수. null이면 생략' },
    isFirst: { control: 'boolean', description: '첫 셀 여부 — 좌측 divider와 padding을 없앤다' },
    isAlert: { control: 'boolean', description: '주의 상태 — 라벨·값을 warning 색으로 렌더' },
  },
  decorators: [
    Story => (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, fontFamily: SAAS_FONT }}>
        <Story />
      </Box>
    ),
  ],
};

/** 기본 — 값만 표시 */
export const Default = {
  args: { label: 'Tracked', value: 189, isFirst: true },
};

/** 모수 병기 — "of N"이 붙어 비율을 함께 읽는다 */
export const WithTotal = {
  args: { label: 'Agreement', value: 185, total: 189, isFirst: true },
};

/** 주의 상태 — Review queue처럼 사람이 손대야 하는 지표 */
export const Alert = {
  args: { label: 'Needs attention', value: 86, isAlert: true, isFirst: true },
};

/**
 * 스트립 구성 — 실제로는 여러 셀을 나란히 놓고 첫 셀만 isFirst를 준다.
 * 셀 구분은 카드가 아니라 좌측 1px divider로만 한다.
 *
 * 마지막 셀만 분모가 다르다(전체가 아니라 발급 수) — 안 보낸 크레딧이 쓰일 리 없어서다.
 */
export const Strip = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <SaasKpiItem label="Agreement" value={185} total={189} isFirst />
      <SaasKpiItem label="Visit" value={130} total={189} />
      <SaasKpiItem label="Upload" value={101} total={189} />
      <SaasKpiItem label="Credit" value={102} total={189} />
      <SaasKpiItem label="Credit used" value={12} total={102} />
    </>
  ),
};
