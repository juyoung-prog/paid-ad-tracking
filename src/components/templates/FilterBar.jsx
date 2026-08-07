import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloseIcon from '@mui/icons-material/Close';
import { SearchBar } from '../input/SearchBar';
import { DateRangeField } from '../input/DateRangeField';

/**
 * FilterBar 템플릿
 *
 * 검색 및 태그 기반 필터링 인터랙션을 관리하는 상단 바.
 * SearchBar, Keyword Chip 등을 조합한 필터링 UI.
 *
 * 동작 방식:
 * 1. 검색어 입력으로 실시간 필터링
 * 2. 태그 Chip 클릭으로 필터 토글
 * 3. 정렬 옵션 선택
 * 4. 뷰 모드 전환 (그리드/리스트)
 *
 * Props:
 * @param {string} searchValue - 현재 검색어 [Optional, 기본값: '']
 * @param {function} onSearchChange - 검색어 변경 핸들러 [Required]
 * @param {string[]} availableTags - 사용 가능한 태그 목록 [Optional]
 * @param {string[]} selectedTags - 선택된 태그 목록 [Optional, 기본값: []]
 * @param {function} onTagToggle - 태그 토글 핸들러 (tag) => void [Required]
 * @param {function} onClearFilters - 필터 초기화 핸들러 [Optional]
 * @param {string} sortBy - 현재 정렬 기준 [Optional, 기본값: 'newest']
 * @param {function} onSortChange - 정렬 변경 핸들러 [Optional]
 * @param {string} viewMode - 현재 뷰 모드 ('grid' | 'list') [Optional, 기본값: 'grid']
 * @param {function} onViewModeChange - 뷰 모드 변경 핸들러 [Optional]
 * @param {number} resultCount - 검색 결과 수 [Optional]
 * @param {Array<{key: string, label: string, allLabel?: string, options: Array<{value: string, label: string}>, variant?: 'select'|'segmented'}>} filterGroups - 범용 필터 그룹 (도메인 필드를 하드코딩하지 않고 호출부에서 정의). allLabel은 필터 해제 항목의 문구(기본값 `All {label}s`) — 선택이 없을 때 트리거에 뜨는 문구이기도 하다. variant='segmented'면 드롭다운 대신 All+옵션 전부를 ToggleButtonGroup으로 보여준다 — 옵션이 2~4개로 고정된 배타적 선택지(예: Platform)에 적합, 옵션 개수가 늘어날 수 있는 필터(예: Campaign Group)는 기본값(select)을 쓴다 [Optional, 기본값: []]
 * @param {object} groupValues - filterGroups 각 key의 현재 선택값 { [key]: value } [Optional, 기본값: {}]
 * @param {function} onGroupChange - 그룹 필터 변경 핸들러 (key, value) => void [Optional]
 * @param {{ start: string, end: string }} dateRange - 기간 필터 값 [Optional]
 * @param {function} onDateRangeChange - 기간 필터 변경 핸들러 ({ start, end }) => void [Optional]
 * @param {boolean} showSearch - SearchBar 노출 여부. 텍스트 검색이 필요 없는 도메인(예: 구조화된 드롭다운 필터만 쓰는 화면)에서 false로 끔 [Optional, 기본값: true]
 * @param {string} searchPlaceholder - SearchBar 플레이스홀더 [Optional, 기본값: 'Search references...']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <FilterBar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   availableTags={allTags}
 *   selectedTags={activeTags}
 *   onTagToggle={handleTagToggle}
 *   resultCount={filteredItems.length}
 * />
 *
 * Example usage (도메인 특화 드롭다운 필터 — 태그 대신 filterGroups 사용):
 * <FilterBar
 *   searchValue=""
 *   onSearchChange={() => {}}
 *   filterGroups={[
 *     { key: 'platform', label: '플랫폼', options: [{ value: 'meta', label: 'Meta' }, { value: 'tiktok', label: 'TikTok' }] },
 *     { key: 'store', label: '매장', options: storeOptions },
 *   ]}
 *   groupValues={{ platform: 'meta', store: '' }}
 *   onGroupChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
 *   dateRange={{ start: '2026-07-01', end: '2026-07-31' }}
 *   onDateRangeChange={setDateRange}
 * />
 */
/** 이 개수를 넘는 옵션 목록에만 검색창을 붙인다(적으면 검색이 단계만 늘린다). */
const OPTION_SEARCH_THRESHOLD = 8;

/** 드롭다운 최대 높이. 이 높이를 넘으면 목록만 스크롤된다(검색창은 sticky로 남는다). */
const OPTION_MENU_MAX_HEIGHT = 440;

export function FilterBar({
  searchValue = '',
  onSearchChange,
  availableTags = [],
  selectedTags = [],
  onTagToggle,
  onClearFilters,
  sortBy = 'newest',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  resultCount,
  filterGroups = [],
  groupValues = {},
  onGroupChange,
  dateRange,
  onDateRangeChange,
  showSearch = true,
  searchPlaceholder = 'Search references...',
  sx,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  /* 드롭다운 안 검색어(그룹 키별). 드롭다운을 닫을 때 비운다 — 남겨두면 다음에
     열었을 때 목록이 이미 걸러진 채로 떠서 "항목이 사라졌다"로 보인다. */
  const [optionSearch, setOptionSearch] = useState({});

  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
    { id: 'name-asc', label: 'Name (A-Z)' },
    { id: 'name-desc', label: 'Name (Z-A)' },
  ];

  const hasActiveFilters = selectedTags.length > 0 || searchValue.length > 0;

  /**
   * 태그 토글 핸들러
   */
  const handleTagClick = useCallback(
    (tag) => {
      onTagToggle(tag);
    },
    [onTagToggle]
  );

  /**
   * 정렬 메뉴 열기
   */
  const handleSortOpen = useCallback((event) => {
    setSortAnchorEl(event.currentTarget);
  }, []);

  /**
   * 정렬 메뉴 닫기
   */
  const handleSortClose = useCallback(() => {
    setSortAnchorEl(null);
  }, []);

  /**
   * 정렬 선택
   */
  const handleSortSelect = useCallback(
    (sortId) => {
      onSortChange?.(sortId);
      handleSortClose();
    },
    [onSortChange, handleSortClose]
  );

  /**
   * 모든 필터 초기화
   */
  const handleClearAll = useCallback(() => {
    onClearFilters?.();
  }, [onClearFilters]);

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {/* 메인 바 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {/* 검색바 (showSearch=false면 렌더링하지 않음 — 텍스트 검색이 필요 없는 도메인용) */}
        {showSearch && (
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            hasFilter
            isFilterActive={showFilters}
            onFilterToggle={() => setShowFilters(!showFilters)}
            sx={{ flex: 1, minWidth: 200 }}
          />
        )}

        {/* 범용 필터 그룹 (도메인 특화 필터 — 태그와 별개로 병행 사용 가능).
            variant='segmented'는 옵션이 2~4개로 고정된 배타적 선택지용 —
            드롭다운은 열어야만 지금 뭐가 선택됐는지 보이고 고르는 데도 클릭이
            2번 필요한데, 세그먼트 버튼은 항상 다 보이고 클릭 한 번이면 된다
            (By Store의 All/Georgia/Florida 세그먼트와 같은 이유로 Platform에
            적용 — 실무자+전문가 리뷰로 결정). Campaign Group처럼 옵션 개수가
            늘어날 수 있는 필터는 계속 기본값(select)을 쓴다. */}
        {/* group.label은 세그먼트 버튼 자체엔 안 보이고(All/옵션들만 보임),
            Select는 비어있을 때만 placeholder로 보인다 — 둘 다 값이 선택된
            뒤엔 스크린리더가 "이 컨트롤이 뭘 필터링하는지" 알 방법이 없다
            (접근성 리뷰로 발견). aria-label로 각각 직접 이름을 준다. */}
        {filterGroups.map((group) =>
          group.variant === 'segmented' ? (
            <ToggleButtonGroup
              key={group.key}
              value={groupValues[group.key] ?? ''}
              exclusive
              size="small"
              onChange={(e, next) => { if (next !== null) onGroupChange?.(group.key, next); }}
              aria-label={group.label}
            >
              <ToggleButton value="" sx={{ textTransform: 'none', px: 2 }}>All</ToggleButton>
              {group.options.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: 'none', px: 2 }}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          ) : (
            <Select
              key={group.key}
              size="small"
              displayEmpty
              /* 옵션에 없는 값이면 빈 값으로 되돌려 보여준다. 저장된 필터가 가리키던
                 항목이 사라지면(이벤트 그룹 규칙이 바뀌는 등) MUI가 대응하는
                 MenuItem을 못 찾아 트리거가 **통째로 빈칸**이 된다 — 실제로 그 상태를
                 봤다. 호출부의 필터 판정도 모르는 값은 이미 무시하므로, 여기서
                 빈 값으로 보이게 하면 화면과 실제 동작이 일치한다. */
              value={group.options.some((o) => o.value === groupValues[group.key]) ? groupValues[group.key] : ''}
              onChange={(e) => onGroupChange?.(group.key, e.target.value)}
              onClose={() => setOptionSearch((prev) => ({ ...prev, [group.key]: '' }))}
              slotProps={{ input: { 'aria-label': group.label } }}
              /* 목록이 화면 바닥까지 늘어지면 어디가 끝인지 안 보이고 스크롤도
                 페이지와 섞인다. 높이를 묶고 목록만 스크롤시킨다. */
              MenuProps={{ PaperProps: { sx: { maxHeight: OPTION_MENU_MAX_HEIGHT } } }}
              sx={{ minWidth: 140 }}
            >
              {/* 옵션이 많으면 검색을 붙인다. Event 필터가 25개 넘는 항목을
                  정렬·그룹 없이 쏟아내서 원하는 걸 찾는 게 스캔 작업이었다
                  (자동 생성된 게시물 이름·오타·"- Copy" 사본이 섞여 있다).
                  적을 때는 검색창이 오히려 단계를 늘리므로 안 띄운다. */}
              {group.options.length > OPTION_SEARCH_THRESHOLD && (
                <Box
                  onKeyDown={(e) => e.stopPropagation()}
                  /* 목록이 스크롤돼도 검색창은 붙어 있어야 한다 — autoFocus가 걸려
                     있어서, 스크롤과 함께 사라지면 "타이핑은 되는데 입력창이 안
                     보이는" 상태가 된다. */
                  sx={{ px: 1.5, py: 1, position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.paper' }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    autoFocus
                    placeholder={`Search ${group.label.toLowerCase()}`}
                    value={optionSearch[group.key] ?? ''}
                    onChange={(e) => setOptionSearch((prev) => ({ ...prev, [group.key]: e.target.value }))}
                    slotProps={{ input: { 'aria-label': `Search ${group.label}` } }}
                  />
                </Box>
              )}
              {/* 필터 해제 항목이자 목록의 첫 선택지. 검색창 **아래**에 둔다 —
                  검색은 목록을 다루는 도구라 머리말 자리가 맞고, 이게 검색창과
                  목록 사이에 끼면 어디까지가 머리말인지 흐려진다.
                  라벨은 예전에 그룹 이름("Event")이라 목록 안에서 제목처럼 보이고
                  정작 "전체로 되돌리기"라는 기능은 읽히지 않았다. 하는 일을 그대로
                  적는다 — 선택이 없을 때 트리거에 뜨는 문구이기도 하다.
                  검색어와 무관하게 항상 남긴다: 검색 결과가 아니라 언제든 눌러야
                  하는 동작이다. */}
              <MenuItem value="">{group.allLabel ?? `All ${group.label}s`}</MenuItem>
              {group.options
                .filter((opt) => {
                  // 선택된 항목은 검색어와 무관하게 항상 남긴다 — MUI Select는
                  // 선택된 MenuItem이 자식에 없으면 닫힌 상태의 라벨을 못 그린다.
                  if (opt.value === groupValues[group.key]) return true;
                  const query = (optionSearch[group.key] ?? '').trim().toLowerCase();
                  return !query || opt.label.toLowerCase().includes(query);
                })
                .map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
            </Select>
          )
        )}

        {/* 기간 필터 — 시작/종료를 따로 타이핑하던 것(LocalizedDateField 2개 + "~")을
            CampaignForm의 Campaign Dates와 같은 캘린더 팝오버(DateRangeField)로
            통일했다. 두 컴포넌트가 애초에 같은 { start, end } 모양을 쓰므로
            dateRange/onDateRangeChange를 그대로 넘기면 된다. */}
        {dateRange && onDateRangeChange && (
          // DateRangeField 내부 TextField는 fullWidth라 컨테이너 폭을 그대로
          // 채운다 — CampaignForm처럼 폼 그리드 한 칸을 혼자 차지하는 곳에서는
          // 맞는 동작이지만, 여기(플랫폼/이벤트/매장 옆에 나란히 붙는 짧은
          // 필터 하나)에서는 minWidth만 주면 flex row의 남은 폭을 전부 먹어서
          // 저 혼자 다음 줄 전체를 가로지르는 줄이 생겼다(실사용 피드백으로
          // 발견). 고정 width로 다른 필터들과 같은 "짧은 컨트롤 하나" 크기로
          // 맞춘다.
          <DateRangeField
            value={dateRange}
            onChange={onDateRangeChange}
            sx={{ width: 220 }}
          />
        )}

        {/* 정렬 버튼 */}
        {onSortChange && (
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SortIcon />}
              onClick={handleSortOpen}
              sx={{
                textTransform: 'none',
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            >
              {sortOptions.find((opt) => opt.id === sortBy)?.label || 'Sort'}
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
            >
              {sortOptions.map((option) => (
                <MenuItem
                  key={option.id}
                  selected={option.id === sortBy}
                  onClick={() => handleSortSelect(option.id)}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* 뷰 모드 토글 */}
        {onViewModeChange && (
          <Box
            sx={{
              display: 'flex',
              border: '1px solid',
              borderColor: 'divider',
              // 상호작용 컨트롤 → control radius. 안쪽 세그먼트는 0 유지 —
              // overflow:hidden인 이 컨테이너가 바깥 모서리를 잘라준다.
              borderRadius: (theme) => `${theme.shape.radius.control}px`,
              overflow: 'hidden',
            }}
          >
            {/* 아이콘만 있고 텍스트 라벨이 없어 스크린리더가 이름 없는 버튼으로
                읽었다(접근성 리뷰로 발견) — aria-label과 현재 선택 상태를
                전달하는 aria-pressed를 추가한다. */}
            <IconButton
              size="small"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              sx={{
                borderRadius: 0,
                bgcolor: viewMode === 'grid' ? 'action.selected' : 'transparent',
                // "선택됨"은 accent — 파랑 단일화(테마 accent 주석) 적용
                color: viewMode === 'grid' ? 'accent.main' : 'text.secondary',
              }}
            >
              <GridViewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              sx={{
                borderRadius: 0,
                bgcolor: viewMode === 'list' ? 'action.selected' : 'transparent',
                color: viewMode === 'list' ? 'accent.main' : 'text.secondary',
              }}
            >
              <ViewListIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* 확장 필터 영역 */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: (theme) => `${theme.shape.radius.control}px`,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Filter by Tags
              </Typography>
            </Box>
            {hasActiveFilters && onClearFilters && (
              <Button
                size="small"
                onClick={handleClearAll}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Clear all
              </Button>
            )}
          </Box>

          {/* 태그 Chip 목록 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  onClick={() => handleTagClick(tag)}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    // "선택됨"은 accent 하나로 — 아래 활성 필터 칩과 같은 문법.
                    // 예전엔 이 칩만 MUI 내장 color="primary"(#0000FF)라, 같은
                    // 패널 안에서 선택 상태를 두 가지 파랑으로 말하고 있었다.
                    ...(isSelected && {
                      backgroundColor: 'accent.tint',
                      color: 'accent.main',
                      borderColor: 'accent.main',
                    }),
                    '&:hover': {
                      backgroundColor: isSelected ? 'accent.tintHover' : 'action.hover',
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Collapse>

      {/* 활성 필터 표시 & 결과 수 */}
      {(hasActiveFilters || resultCount !== undefined) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* 활성 필터 Chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {selectedTags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                onDelete={() => handleTagClick(tag)}
                deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                sx={{
                  fontWeight: 500,
                  // primary.lighter는 팔레트에 존재하지 않는 키였다(무효 CSS로
                  // 조용히 투명 배경) — 선택 상태 배경은 accent.tint가 정답.
                  bgcolor: 'accent.tint',
                  color: 'accent.main',
                  '& .MuiChip-deleteIcon': {
                    color: 'accent.main',
                    // base와 같은 값(primary.dark = #0000B2)을 주면 hover 피드백이
                    // 시각적으로 0이 된다 — 한 단 더 어두운 accent.dark를 쓴다.
                    '&:hover': {
                      color: 'accent.dark',
                    },
                  },
                }}
              />
            ))}
            {searchValue && (
              <Chip
                label={`"${searchValue}"`}
                size="small"
                onDelete={() => onSearchChange('')}
                deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                sx={{
                  fontWeight: 500,
                  bgcolor: 'grey.200',
                  '& .MuiChip-deleteIcon': {
                    color: 'text.secondary',
                  },
                }}
              />
            )}
          </Box>

          {/* 결과 수 */}
          {resultCount !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
