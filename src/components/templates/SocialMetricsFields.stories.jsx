import { useState } from 'react';
import Box from '@mui/material/Box';
import { SocialMetricsFields } from './SocialMetricsFields';
import { PLATFORM } from '../../data/schema';

export default {
  title: 'Paid Ads Dashboard/Templates/SocialMetricsFields',
  component: SocialMetricsFields,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## SocialMetricsFields

참여 내역 중 **사람이 고칠 수 있는 칸**(Likes · Comments · Shares · Saves · Reposts)의 숫자 입력 그리드.
어느 칸을 보일지는 **플랫폼이 정한다**(schema.js \`SOCIAL_METRIC_KEYS\` · \`editableSocialMetricKeysFor\`):
TikTok은 Reposts가 없다(인스타그램 개념). **Follows · Profile Visits는 어디서도 고치지 못한다**(2026-09-11 제품
결정) — TikTok API만 주는 값이라 읽기 목록(PlatformMetricList)에만 남는다. 플랫폼을 모르면 다섯 칸 전부.

### 두 곳이 같은 컴포넌트를 쓴다 (2026-09-11)
- **PerformanceForm**(수기 캠페인) — Social Metrics 섹션
- **동기화 캠페인 드로어** — API가 채운 값을 사람이 고치는 자리. 고친 칸은 \`manualFields\`로 받아 라벨 옆에
  **edited**(accent)를 붙인다. 이 표시가 있는 칸은 다음 동기화가 API 값으로 덮지 않고 직전 값을 이월한다
  (performance_records.manual_fields · sync-performance). 어느 숫자가 API 것이고 어느 숫자가 사람 것인지 구분되어야 한다

2열 고정(440px 드로어 전용), 빈 칸은 null. 계산은 없다 — 값을 그대로 부모에 올린다.
        `,
      },
    },
  },
  argTypes: {
    platform: { control: 'select', options: [undefined, PLATFORM.META, PLATFORM.TIKTOK], description: '어느 칸을 보일지. 없으면 고칠 수 있는 다섯 칸 전부' },
    values: { control: 'object', description: '폼 값 { likes, comments, shares, saves, reposts }' },
    manualFields: { control: 'object', description: '사람이 고친 칸의 key 목록 — 라벨 옆 "edited"' },
    errors: { control: 'object', description: '필드별 에러 메시지' },
    isDisabled: { control: 'boolean', description: '입력 잠금' },
    onChange: { action: 'fieldChanged' },
  },
};

const tiktokValues = { likes: 490, comments: 1, shares: 73, follows: 183, profileVisits: 230, saves: 75, reposts: null };
const metaValues = { likes: 73, comments: 1, shares: 9, follows: null, profileVisits: null, saves: 5, reposts: null };

function Interactive(args) {
  const [values, setValues] = useState(args.values);
  return (
    <Box sx={{ maxWidth: 440 }}>
      <SocialMetricsFields
        {...args}
        values={values}
        onChange={(field, value) => { setValues((v) => ({ ...v, [field]: value })); args.onChange?.(field, value); }}
      />
    </Box>
  );
}

/** TikTok — 네 칸(Reposts 없음, Follows·Visits는 고치지 못해 읽기 목록에만). Saves는 API가 안 주는 칸이라 사람이 적은 값이고 "edited"가 붙는다 */
export const TikTok = { args: { platform: PLATFORM.TIKTOK, values: tiktokValues, manualFields: ['saves'] }, render: Interactive };

/** Meta — 다섯 칸(Follows·Visits 없음). Saves는 API 값, Reposts는 사람이 적는 칸 */
export const Meta = { args: { platform: PLATFORM.META, values: metaValues, manualFields: [] }, render: Interactive };

/** 플랫폼 모름(수기 캠페인) — 고칠 수 있는 다섯 칸 전부, 빈 값 */
export const AllFields = { args: { platform: undefined, values: {}, manualFields: [] }, render: Interactive };
