import { useState } from 'react';
import Box from '@mui/material/Box';
import { StoreMultiSelect } from './StoreMultiSelect';
import { TARGET_SCOPE } from '../../data/schema';

const demoStores = [
  { id: 'G01', name: 'Georgia - Atlanta' },
  { id: 'G02', name: 'Georgia - Duluth' },
  { id: 'G03', name: 'Georgia - Marietta' },
  { id: 'BF1', name: 'Florida - Orlando' },
  { id: 'BF2', name: 'Florida - Tampa' },
];

export default {
  title: 'Paid Ads Dashboard/Input/StoreMultiSelect',
  component: StoreMultiSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## StoreMultiSelect

캠페인의 타겟 매장 범위(단일/복수/전체)를 선택하는 입력 컴포넌트.

### 기능
- 단일 매장 / 복수 매장 / 전체 매장 3가지 범위 전환
- 전체 매장 선택 시 매장 선택기를 숨기고 안내 문구로 대체
- 매장 목록은 props로만 전달받음 (mock 데이터를 직접 import하지 않음)
        `,
      },
    },
  },
  argTypes: {
    stores: { control: 'object', description: '선택 가능한 매장 목록 [{ id, name }]' },
    scope: {
      control: 'select',
      options: [TARGET_SCOPE.SINGLE_STORE, TARGET_SCOPE.MULTI_STORE, TARGET_SCOPE.ALL_STORES],
      description: '현재 타겟 범위',
    },
    selectedStoreIds: { control: 'object', description: '선택된 매장 id 배열' },
    onScopeChange: { action: 'scopeChanged', description: '범위 변경 핸들러' },
    onSelectionChange: { action: 'selectionChanged', description: '매장 선택 변경 핸들러' },
    label: { control: 'text', description: '필드 레이블' },
    isDisabled: { control: 'boolean', description: '비활성화 여부' },
  },
};

/**
 * StoreMultiSelect 기본 사용 예시 (단일 매장)
 */
export const Default = {
  render: (args) => {
    const [scope, setScope] = useState(args.scope ?? TARGET_SCOPE.SINGLE_STORE);
    const [selectedStoreIds, setSelectedStoreIds] = useState(args.selectedStoreIds ?? ['G01']);

    return (
      <Box sx={{ maxWidth: 420 }}>
        <StoreMultiSelect
          {...args}
          stores={demoStores}
          scope={scope}
          selectedStoreIds={selectedStoreIds}
          onScopeChange={(next) => {
            setScope(next);
            setSelectedStoreIds([]);
            args.onScopeChange?.(next);
          }}
          onSelectionChange={(next) => {
            setSelectedStoreIds(next);
            args.onSelectionChange?.(next);
          }}
        />
      </Box>
    );
  },
  args: {
    label: '타겟 매장',
    scope: TARGET_SCOPE.SINGLE_STORE,
    selectedStoreIds: ['G01'],
    isDisabled: false,
  },
};

/**
 * 3가지 범위 상태를 나란히 비교
 */
export const Variants = {
  render: () => {
    const [single, setSingle] = useState(['G01']);
    const [multi, setMulti] = useState(['G01', 'G02']);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 420 }}>
        <StoreMultiSelect
          label="단일 매장"
          stores={demoStores}
          scope={TARGET_SCOPE.SINGLE_STORE}
          selectedStoreIds={single}
          onScopeChange={() => {}}
          onSelectionChange={setSingle}
        />
        <StoreMultiSelect
          label="복수 매장"
          stores={demoStores}
          scope={TARGET_SCOPE.MULTI_STORE}
          selectedStoreIds={multi}
          onScopeChange={() => {}}
          onSelectionChange={setMulti}
        />
        <StoreMultiSelect
          label="전체 매장"
          stores={demoStores}
          scope={TARGET_SCOPE.ALL_STORES}
          selectedStoreIds={[]}
          onScopeChange={() => {}}
          onSelectionChange={() => {}}
        />
      </Box>
    );
  },
};
