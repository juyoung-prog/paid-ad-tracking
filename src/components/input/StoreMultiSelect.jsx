import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { TARGET_SCOPE } from '../../data/schema';

const SCOPE_OPTIONS = [
  { value: TARGET_SCOPE.SINGLE_STORE, label: 'Single Store' },
  { value: TARGET_SCOPE.MULTI_STORE, label: 'Multiple Stores' },
  { value: TARGET_SCOPE.ALL_STORES, label: 'All Stores' },
];

/**
 * StoreMultiSelect 컴포넌트
 *
 * 캠페인의 타겟 매장 범위(단일/복수/전체)를 선택하는 입력 컴포넌트.
 * 전체 매장 선택 시 매장 목록 선택기는 숨기고 안내 문구만 표시한다.
 *
 * Props:
 * @param {Array<{id: string, name: string}>} stores - 선택 가능한 매장 목록 [Required]
 * @param {string} scope - 현재 타겟 범위 ('single_store' | 'multi_store' | 'all_stores') [Required]
 * @param {string[]} selectedStoreIds - 선택된 매장 id 배열 [Required]
 * @param {function} onScopeChange - 범위 변경 핸들러 (scope) => void [Required]
 * @param {function} onSelectionChange - 매장 선택 변경 핸들러 (storeIds[]) => void [Required]
 * @param {string} label - 필드 레이블 [Optional]
 * @param {boolean} isDisabled - 비활성화 여부 [Optional, 기본값: false]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <StoreMultiSelect
 *   stores={mockStores}
 *   scope={campaign.targetScope}
 *   selectedStoreIds={campaign.targetStoreIds}
 *   onScopeChange={setScope}
 *   onSelectionChange={setStoreIds}
 * />
 */
export function StoreMultiSelect({
  stores,
  scope,
  selectedStoreIds,
  onScopeChange,
  onSelectionChange,
  label,
  isDisabled = false,
  sx,
}) {
  const handleScopeChange = (event, nextScope) => {
    if (nextScope === null) return;
    onScopeChange(nextScope);
  };

  const handleSingleChange = (event) => {
    const value = event.target.value;
    onSelectionChange(value ? [value] : []);
  };

  const handleMultiChange = (event) => {
    const value = event.target.value;
    onSelectionChange(typeof value === 'string' ? value.split(',') : value);
  };

  const storeName = (id) => stores.find((s) => s.id === id)?.name ?? id;

  return (
    <Box sx={sx}>
      {label && (
        <Typography
          variant="caption"
          sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}
        >
          {label}
        </Typography>
      )}

      <ToggleButtonGroup
        value={scope}
        exclusive
        onChange={handleScopeChange}
        disabled={isDisabled}
        size="small"
        // 위 label은 시각적 캡션일 뿐이라 스크린리더와 프로그램적으로
        // 연결되지 않는다 — aria-label로 이 그룹과 아래 Select 각각에
        // 직접 이름을 준다(접근성 리뷰로 발견).
        aria-label={label ? `${label} scope` : undefined}
        sx={{ mb: 1.5 }}
      >
        {SCOPE_OPTIONS.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: 'none', px: 2 }}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {scope === TARGET_SCOPE.ALL_STORES && (
        <Typography variant="body2" color="text.secondary">
          All {stores.length} stores are included in this target.
        </Typography>
      )}

      {scope === TARGET_SCOPE.SINGLE_STORE && (
        <Select
          value={selectedStoreIds[0] ?? ''}
          onChange={handleSingleChange}
          disabled={isDisabled}
          displayEmpty
          fullWidth
          size="small"
          renderValue={(value) => (value ? storeName(value) : 'Select store')}
          slotProps={{ input: { 'aria-label': label ? `${label} selection` : undefined } }}
        >
          {stores.map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.name} ({store.id})
            </MenuItem>
          ))}
        </Select>
      )}

      {scope === TARGET_SCOPE.MULTI_STORE && (
        <Select
          multiple
          value={selectedStoreIds}
          onChange={handleMultiChange}
          disabled={isDisabled}
          displayEmpty
          fullWidth
          size="small"
          slotProps={{ input: { 'aria-label': label ? `${label} selection` : undefined } }}
          renderValue={(selected) =>
            selected.length === 0 ? (
              <Typography component="span" color="text.secondary">
                Select stores
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((id) => (
                  <Chip key={id} label={id} size="small" sx={{ borderRadius: (theme) => `${theme.shape.radius.control}px` }} />
                ))}
              </Box>
            )
          }
        >
          {stores.map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.name} ({store.id})
            </MenuItem>
          ))}
        </Select>
      )}
    </Box>
  );
}
