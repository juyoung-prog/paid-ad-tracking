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
 *
 * 확인 포인트: **매장 드롭다운을 열면 검색창이 붙는다**(옵션 15개 > 임계 8개).
 * 옵션 순서는 호출부 책임이다 — 이 컴포넌트는 받은 배열 순서대로 그린다
 * (Reports의 Event는 최근 집행순, 계획만 있는 이벤트가 맨 위).
 * 순서는 **검색창 → All Stores → 목록**이다 — 검색은 목록을 다루는 도구라
 * 머리말 자리에 두고, 그 아래부터 선택지가 시작된다(검색창이 해제 항목과 목록
 * 사이에 끼면 어디까지가 머리말인지 흐려진다). `All Stores`는 검색어와 무관하게
 * 항상 남는다 — 검색 결과가 아니라 언제든 눌러야 하는 동작이다.
 * 아무것도 안 골랐을 때 트리거에 뜨는 문구도 같은 값이다 — 예전엔 그 자리에 그룹 이름("Store")이 들어가서
 * 목록 안에서 제목처럼 보였고 트리거는 빈칸처럼 읽혔다.
 * 목록이 440px를 넘으면 **목록만** 스크롤되고 검색창은 sticky로 남는다
 * (autoFocus가 걸려 있어 검색창이 스크롤로 사라지면 "타이핑은 되는데 입력창이
 * 안 보이는" 상태가 된다).
 * 플랫폼은 segmented라 해당 없고, 옵션이 적은 그룹에는 검색이 안 붙는다 —
 * 적을 때는 검색창이 오히려 단계를 늘린다.
 *
 * 실계정의 Event 필터가 25개 넘는 항목을 정렬·그룹 없이 쏟아내면서 원하는 걸
 * 찾는 게 스캔 작업이 된 것이 이 기능의 계기다(자동 생성된 게시물 이름·오타·
 * "- Copy" 사본이 섞여 있다). 검색어를 넣어도 **선택된 항목은 목록에 남는지**
 * 같이 본다 — 빠지면 MUI Select가 닫힌 상태의 라벨을 못 그린다.
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
