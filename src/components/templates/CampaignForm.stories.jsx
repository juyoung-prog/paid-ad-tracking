import { useState } from 'react';
import Box from '@mui/material/Box';
import { CampaignForm } from './CampaignForm';
import { TARGET_SCOPE, PLATFORM, GOAL } from '../../data/schema';
import { mockStores, mockAdAccounts } from '../../data/paidAdsMockData';

const emptyValues = {
  name: '',
  campaignGroup: '',
  platform: PLATFORM.META,
  accountId: '',
  targetScope: TARGET_SCOPE.SINGLE_STORE,
  targetStoreIds: [],
  startDate: '',
  endDate: '',
  budgetPlanned: '',
  budgetDaily: null,
  goal: GOAL.AWARENESS,
  creativeUrl: '',
  thumbnailUrl: '',
};

export default {
  title: 'Paid Ads Dashboard/Templates/CampaignForm',
  component: CampaignForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## CampaignForm

캠페인 등록/수정 폼. 관련 필드를 2열로 그룹핑해 세로 길이를 줄였고, 좁은
화면에서는 1열로 쌓인다. 매장 선택은 Tier 0의 StoreMultiSelect를 재사용한다.

### 기능
- 플랫폼 선택 시 계정 목록을 해당 플랫폼으로 자동 필터링(선택값 초기화)
- Campaign Name 옆에 **Event**(campaignGroup, 필수) — 하나의 마케팅 이니셔티브가 여러 캠페인(메타+틱톡 동시 진행, 또는 여러 단계)으로 쪼개질 때 이 값으로 묶는다. schema.js의 campaignGroupKey()가 이 값(없으면 name)을 CampaignTable의 "+N more in group" 칩·FilterBar의 Event 필터·overlap_target 억제 판단에 전부 사용
- Planned Budget(총액, 필수) 옆에 Daily Budget(선택) — 있으면 Planned Budget이 Daily Budget × 기간으로 자동 계산됨(pacing 계산에도 반영)
- Ad Link(creativeUrl, 사람이 타이핑하는 실제 링크)와 Thumbnail(thumbnailUrl, 업로드 전용 이미지)은 별개 필드 — 하나로 합쳤다가 실제 링크를 입력할 방법이 없어지는 문제로 다시 분리함
- Thumbnail 옆에 CampaignThumbnail 실시간 미리보기, 업로드 성공 여부는 "Uploaded"/"Not uploaded" 상태 텍스트로 표시
- 검증 로직은 갖지 않음 — errors prop으로 외부에서 주입
        `,
      },
    },
  },
  argTypes: {
    values: { control: 'object', description: '폼 값 객체' },
    stores: { control: 'object', description: 'StoreMultiSelect에 전달할 매장 목록' },
    accounts: { control: 'object', description: '광고 계정 목록' },
    errors: { control: 'object', description: '필드별 에러 메시지' },
    readOnlyFields: { control: 'object', description: "입력 대신 평문으로 보여줄 필드 — 'name' | 'platform' | 'accountId' | 'dates' | 'creativeUrl' | 'thumbnailUrl'" },
    onChange: { action: 'fieldChanged' },
  },
};

/**
 * CampaignForm 기본 사용 예시 (빈 폼)
 */
export const Default = {
  render: function DefaultStory(args) {
    const [values, setValues] = useState(emptyValues);
    return (
      <Box sx={{ maxWidth: 640 }}>
        <CampaignForm
          {...args}
          stores={mockStores}
          accounts={mockAdAccounts}
          values={values}
          onChange={(field, value) => {
            setValues((v) => ({ ...v, [field]: value }));
            args.onChange?.(field, value);
          }}
        />
      </Box>
    );
  },
};

/**
 * 기존 캠페인 값으로 채워진 수정 폼
 */
export const Prefilled = {
  render: function PrefilledStory(args) {
    const [values, setValues] = useState({
      name: 'Morrow Grand Opening Awareness',
      campaignGroup: 'Morrow Grand Opening',
      platform: PLATFORM.META,
      accountId: 'meta-ga',
      targetScope: TARGET_SCOPE.SINGLE_STORE,
      targetStoreIds: ['G04'],
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      budgetPlanned: 1500,
      budgetDaily: 50,
      goal: GOAL.AWARENESS,
      creativeUrl: 'https://business.facebook.com/adsmanager/manage/campaigns?campaign_id=001',
      thumbnailUrl: '',
    });
    return (
      <Box sx={{ maxWidth: 640 }}>
        <CampaignForm
          {...args}
          stores={mockStores}
          accounts={mockAdAccounts}
          values={values}
          onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
        />
      </Box>
    );
  },
};

/**
 * 검증 에러 상태
 */
export const WithErrors = {
  render: function WithErrorsStory(args) {
    const [values, setValues] = useState({ ...emptyValues, startDate: '2026-08-31', endDate: '2026-08-01' });
    return (
      <Box sx={{ maxWidth: 640 }}>
        <CampaignForm
          {...args}
          stores={mockStores}
          accounts={mockAdAccounts}
          values={values}
          onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
          errors={{
            name: '캠페인명을 입력하세요',
            endDate: '종료일은 시작일 이후여야 합니다',
          }}
        />
      </Box>
    );
  },
};

/**
 * 동기화 캠페인의 수정 폼 — Dashboard 드로어가 `readOnlyFields`로 여는 형태.
 *
 * 플랫폼이 원천인 값은 입력창을 주지 않는다. 이름·썸네일은 sync-campaigns가 매번
 * 덮어써서 여기서 고쳐도 다음 날 되돌아오고, 플랫폼·계정은 애초에 바뀔 수 없으며,
 * 기간은 광고 관리자가 정한 값이다. 입력창을 그려두는 것 자체가 "고칠 수 있다"는
 * 거짓말이었다.
 *
 * 확인 포인트:
 * - Campaign Name·Platform·Account·Campaign Dates·Ad Link가 **평문**인가
 *   (기간은 `Jul 6 – Aug 31 (57 days)` 한 줄로 접힌다)
 * - Thumbnail에 Upload/Remove 버튼 대신 "From Ads Manager — updates with the next sync."
 *   한 줄만 있는가
 * - 편집 가능한 건 **Event · Target Store(s) · Daily/Planned Budget · Goal** 넷뿐인가
 *   — 동기화가 사람이 넣은 값을 보존하는 필드들이다
 * - Ad Link처럼 값이 비면 `—`로 자리만 지키는가
 */
export const SyncedCampaign = {
  render: function SyncedCampaignStory(args) {
    const [values, setValues] = useState({
      name: 'G10_Now Open_0706 ~0831',
      campaignGroup: 'G10 Opening',
      platform: PLATFORM.META,
      accountId: 'meta-ga',
      targetScope: TARGET_SCOPE.SINGLE_STORE,
      targetStoreIds: ['G04'],
      startDate: '2026-07-06',
      endDate: '2026-08-31',
      budgetPlanned: 1140,
      budgetDaily: 20,
      goal: GOAL.ENGAGEMENT,
      creativeUrl: '',
      thumbnailUrl: '',
    });
    return (
      <Box sx={{ maxWidth: 640 }}>
        <CampaignForm
          {...args}
          stores={mockStores}
          accounts={mockAdAccounts}
          values={values}
          onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
          readOnlyFields={['name', 'platform', 'accountId', 'dates', 'creativeUrl', 'thumbnailUrl']}
        />
      </Box>
    );
  },
};
