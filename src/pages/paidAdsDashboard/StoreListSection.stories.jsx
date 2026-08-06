import { useState } from 'react';
import Box from '@mui/material/Box';
import { StoreListSection } from './StoreListSection';
import { mockStores, mockCampaigns } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Section/StoreListSection',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## StoreListSection

/stores 페이지를 구성하는 섹션. 매장 목록(StoreTable) + 추가/수정 폼(StoreForm,
Dialog 하나를 공유) 조합. 중복 코드 검증(추가 시)을 이 섹션이 직접 소유한다.
행을 클릭하면 같은 Dialog가 수정 모드(매장 코드 잠금)로 열린다.
        `,
      },
    },
  },
};

function Interactive() {
  const [stores, setStores] = useState(mockStores.slice(0, 6));
  return (
    <Box sx={{ maxWidth: 720 }}>
      <StoreListSection
        stores={stores}
        campaigns={mockCampaigns}
        // 저장 핸들러는 성공 시 저장된 값을 돌려줘야 한다 — StoreListSection이
        // 반환값으로 성공/실패를 가른다(실스토어의 addStore/updateStore가 실패 시
        // null을 주는 계약). setStores(...)는 undefined라서, 그대로 두면 매장이
        // 실제로 추가되는데도 "Save failed"가 뜬다.
        onAddStore={(store) => {
          setStores((prev) => [...prev, store]);
          return store;
        }}
        onUpdateStore={(storeId, patch) => {
          setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...patch } : s)));
          return { id: storeId, ...patch };
        }}
      />
    </Box>
  );
}

export const Default = {
  render: Interactive,
};
