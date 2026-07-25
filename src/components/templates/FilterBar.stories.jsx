import { useState } from 'react';
import Box from '@mui/material/Box';
import { FilterBar } from './FilterBar';
import { mockStores } from '../../data/paidAdsMockData';

export default {
  title: 'Template/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## FilterBar

검색 및 태그 기반 필터링 UI. \`filterGroups\`/\`dateRange\` props를 추가해
도메인 특화 필터(플랫폼/계정/매장 등)와 기간 필터를 범용적으로 확장했다 —
광고 도메인 필드를 하드코딩하지 않고, 이 값들은 호출부에서 정의해서 넘긴다.
filterGroups 항목에 \`variant: 'segmented'\`를 주면 드롭다운 대신 All+옵션
전부를 세그먼트 버튼(ToggleButtonGroup)으로 보여준다 — 옵션이 2~4개로 고정된
배타적 선택지(예: Platform)에 적합. 옵션 개수가 늘어날 수 있는 필터(예: 매장
그룹)는 기본값(select)을 쓴다. 기존 검색/태그/정렬/뷰모드 기능은 그대로 유지된다.
        `,
      },
    },
  },
  argTypes: {
    searchValue: { control: 'text' },
    onSearchChange: { action: 'searchChanged' },
    availableTags: { control: 'object' },
    selectedTags: { control: 'object' },
    onTagToggle: { action: 'tagToggled' },
    resultCount: { control: { type: 'number' } },
    filterGroups: { control: 'object', description: "{ key, label, options, variant? } 배열 — variant:'segmented'면 드롭다운 대신 세그먼트 버튼" },
    groupValues: { control: 'object' },
    onGroupChange: { action: 'groupChanged' },
    dateRange: { control: 'object' },
    onDateRangeChange: { action: 'dateRangeChanged' },
  },
};

/**
 * 기존 검색 + 태그 필터링 (기존 동작, 변경 없음)
 */
export const Default = {
  render: (args) => {
    const [search, setSearch] = useState('');
    const [tags, setTags] = useState([]);
    return (
      <Box>
        <FilterBar
          {...args}
          searchValue={search}
          onSearchChange={setSearch}
          availableTags={['minimal', 'bold', 'dark', 'retro']}
          selectedTags={tags}
          onTagToggle={(tag) =>
            setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
          }
          resultCount={12}
        />
      </Box>
    );
  },
};

/**
 * 광고 대시보드 사용 예시 — 태그 대신 filterGroups(플랫폼/계정)와 dateRange(기간)
 */
export const AdsDashboardFilters = {
  render: () => {
    const [search, setSearch] = useState('');
    const [groupValues, setGroupValues] = useState({ platform: '', store: '' });
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    return (
      <Box>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filterGroups={[
            {
              key: 'platform',
              label: '플랫폼',
              variant: 'segmented',
              options: [
                { value: 'meta', label: 'Meta' },
                { value: 'tiktok', label: 'TikTok' },
              ],
            },
            {
              key: 'store',
              label: '매장',
              options: mockStores.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` })),
            },
          ]}
          groupValues={groupValues}
          onGroupChange={(key, value) => setGroupValues((v) => ({ ...v, [key]: value }))}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          resultCount={11}
        />
      </Box>
    );
  },
};
