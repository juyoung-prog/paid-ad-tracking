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
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloseIcon from '@mui/icons-material/Close';
import { SearchBar } from '../input/SearchBar';

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
 */
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
  sx,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

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
        {/* 검색바 */}
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search references..."
          hasFilter
          isFilterActive={showFilters}
          onFilterToggle={() => setShowFilters(!showFilters)}
          sx={{ flex: 1, minWidth: 200 }}
        />

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
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <IconButton
              size="small"
              onClick={() => onViewModeChange('grid')}
              sx={{
                borderRadius: 0,
                bgcolor: viewMode === 'grid' ? 'action.selected' : 'transparent',
                color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
              }}
            >
              <GridViewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onViewModeChange('list')}
              sx={{
                borderRadius: 0,
                bgcolor: viewMode === 'list' ? 'action.selected' : 'transparent',
                color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
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
            borderRadius: 1,
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
                  color={isSelected ? 'primary' : 'default'}
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
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
                  bgcolor: 'primary.lighter',
                  color: 'primary.dark',
                  '& .MuiChip-deleteIcon': {
                    color: 'primary.main',
                    '&:hover': {
                      color: 'primary.dark',
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
