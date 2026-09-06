import { useState } from 'react';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';

/**
 * ExportMenu 컴포넌트
 *
 * "Export ▾" 버튼 하나에 내보내기 방법들을 드롭다운으로 모은다 — Google Sheets,
 * PDF(인쇄) 등. 항목마다 버튼을 늘어놓으면 툴바가 언어 선택·편집 버튼과 함께
 * 한 줄을 넘친다(사용자 결정, 2026-09). 항목의 동작은 호출부가 준다 — 이
 * 컴포넌트는 메뉴만 안다.
 *
 * Props:
 * @param {Array<{ key: string, label: string, icon?: ReactNode, hint?: string, onSelect: function, isDisabled?: boolean }>} items - 메뉴 항목 [Required]
 * @param {string} label - 버튼 글자 [Optional, 기본값: 'Export']
 * @param {boolean} isDisabled - 전체 잠금 [Optional, 기본값: false]
 * @param {object} sx - 버튼 추가 스타일 [Optional]
 *
 * Example usage:
 * <ExportMenu items={[{ key: 'sheets', label: 'Google Sheets', onSelect: copyForSheets }, { key: 'pdf', label: 'PDF', onSelect: () => window.print() }]} />
 */
export function ExportMenu({ items, label = 'Export', isDisabled = false, sx }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<IosShareOutlinedIcon />}
        endIcon={<ArrowDropDownIcon />}
        disabled={isDisabled}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={isOpen ? 'true' : undefined}
        sx={sx}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.key}
            disabled={item.isDisabled}
            onClick={() => { setAnchorEl(null); item.onSelect(); }}
            sx={{ fontSize: 13, minWidth: 220 }}
          >
            {item.icon && <ListItemIcon sx={{ minWidth: 32, '& svg': { fontSize: 18 } }}>{item.icon}</ListItemIcon>}
            <ListItemText
              primary={item.label}
              secondary={item.hint}
              slotProps={{ primary: { sx: { fontSize: 13 } }, secondary: { sx: { fontSize: 11 } } }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
