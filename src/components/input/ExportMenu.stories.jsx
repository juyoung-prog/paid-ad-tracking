import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { ExportMenu } from './ExportMenu';

export default {
  title: 'Paid Ads Dashboard/Input/ExportMenu',
  component: ExportMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## ExportMenu

"Export ▾" 버튼 하나에 내보내기 방법들을 드롭다운으로 모은다 — Recap 툴바에서
Google Sheets와 PDF(인쇄)를 담는다. 항목마다 버튼을 늘어놓으면 언어 선택·편집
버튼과 함께 한 줄을 넘쳐서 메뉴로 접었다(사용자 결정, 2026-09).

항목의 동작은 호출부가 준다 — 이 컴포넌트는 메뉴만 안다. Google Sheets 항목은
표를 클립보드에 복사하고 새 시트를 연다(\`utils/recapSheets.js\`).
        `,
      },
    },
  },
  argTypes: {
    items: { control: 'object', description: '메뉴 항목 — { key, label, icon?, hint?, onSelect, isDisabled? }' },
    label: { control: 'text', description: '버튼 글자' },
    isDisabled: { control: 'boolean', description: '전체 잠금' },
    sx: { control: 'object', description: '버튼 추가 스타일' },
  },
};

const items = [
  { key: 'sheets', label: 'Google Sheets', hint: 'Copies the tables, then opens a new sheet', icon: <TableChartOutlinedIcon />, onSelect: () => {} },
  { key: 'pdf', label: 'PDF (print)', hint: 'Opens the browser print dialog', icon: <PictureAsPdfOutlinedIcon />, onSelect: () => {} },
];

export const Default = {
  args: { items, label: 'Export' },
};

/** 항목 하나가 잠긴 경우 */
export const PartlyDisabled = {
  args: { items: [items[0], { ...items[1], isDisabled: true }], label: 'Export' },
};
