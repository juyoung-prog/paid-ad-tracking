import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddIcon from '@mui/icons-material/Add';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import {
  DocumentTitle,
  PageContainer,
  SectionTitle,
} from '../../components/storybookDocumentation';

/** 대시보드가 실제로 쓰는 아이콘 — 이름 → 컴포넌트 */
const ICON_SET = {
  ListAltOutlined: ListAltOutlinedIcon,
  BarChartOutlined: BarChartOutlinedIcon,
  RouteOutlined: RouteOutlinedIcon,
  SettingsOutlined: SettingsOutlinedIcon,
  RefreshOutlined: RefreshOutlinedIcon,
  OpenInNewOutlined: OpenInNewOutlinedIcon,
  OpenInNew: OpenInNewIcon,
  SearchOutlined: SearchOutlinedIcon,
  CalendarMonthOutlined: CalendarMonthOutlinedIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  ExpandMore: ExpandMoreIcon,
  FileDownloadOutlined: FileDownloadOutlinedIcon,
  LinkOutlined: LinkOutlinedIcon,
  Close: CloseIcon,
  PersonOutline: PersonOutlineIcon,
  EmailOutlined: EmailOutlinedIcon,
  Add: AddIcon,
  CheckCircleOutline: CheckCircleOutlineIcon,
  ErrorOutline: ErrorOutlineIcon,
  DeleteOutline: DeleteOutlineIcon,
  ChatBubbleOutline: ChatBubbleOutlineIcon,
  TaskAlt: TaskAltIcon,
  CheckCircle: CheckCircleIcon,
  CloudDone: CloudDoneIcon,
  Paid: PaidIcon,
  RadioButtonUnchecked: RadioButtonUncheckedIcon,
};

/** 아이콘별 쓰임새 — where는 소스에서 확인한 자리 */
const ICON_USAGE = [
  { name: 'ListAltOutlined', size: 16, color: 'text.secondary', where: 'SaasShell — Operations 메뉴' },
  { name: 'BarChartOutlined', size: 16, color: 'text.secondary', where: 'SaasShell — Report 메뉴' },
  { name: 'RouteOutlined', size: 16, color: 'text.secondary', where: 'SaasShell — Workflow 메뉴' },
  { name: 'SettingsOutlined', size: 16, color: 'text.secondary', where: 'SaasShell — 시트 설정' },
  { name: 'RefreshOutlined', size: 16, color: 'text.secondary', where: 'SaasShell — 데이터 새로고침' },
  { name: 'OpenInNewOutlined', size: 16, color: 'text.secondary', where: 'SaasShell — 시트 열기' },
  { name: 'OpenInNew', size: 11, color: 'inherit', where: '링크 뒤 외부 이동 표시 — verticalAlign: text-top' },
  { name: 'SearchOutlined', size: 16, color: 'text.secondary', where: 'SaasOperationsView — 검색창 startAdornment' },
  { name: 'CalendarMonthOutlined', size: 16, color: 'text.secondary', where: 'SaasDateRangeSelect — 기간 버튼' },
  { name: 'ChevronLeft', size: 18, color: 'text.secondary', where: 'SaasRangeCalendar — 이전 달' },
  { name: 'ChevronRight', size: 18, color: 'text.secondary', where: 'SaasRangeCalendar — 다음 달, 행 펼침' },
  { name: 'ExpandMore', size: 24, color: 'text.secondary', where: 'SaasWorkflowView — Accordion expandIcon (기본 크기)' },
  { name: 'FileDownloadOutlined', size: 14, color: 'inherit', where: 'SaasAnalyticsView — Sheet script 내려받기 버튼' },
  { name: 'LinkOutlined', size: 22, color: 'text.secondary', where: 'SheetSetupScreen — 시트 연결 안내' },
  { name: 'Close', size: 24, color: 'text.secondary', where: 'InfluencerDrawer · SheetSettingsModal — 닫기 (기본 크기)' },
  { name: 'PersonOutline', size: 15, color: 'text.secondary', where: 'InfluencerDrawer — 프로필 줄' },
  { name: 'EmailOutlined', size: 15, color: 'text.secondary', where: 'InfluencerDrawer — 메일 줄' },
  { name: 'Add', size: 24, color: 'inherit', where: 'SheetSettingsModal — 시트 추가 버튼 startIcon' },
  { name: 'CheckCircleOutline', size: 16, color: 'success.main', where: 'SheetSettingsModal — 연결 성공' },
  { name: 'ErrorOutline', size: 16, color: 'error.main', where: 'SheetSettingsModal — 연결 실패' },
  { name: 'DeleteOutline', size: 24, color: 'text.secondary', where: 'SheetSettingsModal — 시트 제거 (fontSize="small")' },
  { name: 'ChatBubbleOutline', size: 16, color: 'text.secondary', where: 'MessageTemplateMenu — 메시지 템플릿 열기' },
  { name: 'TaskAlt', size: 18, color: 'success.main', where: 'StatusIconRow — Agreement 완료' },
  { name: 'CheckCircle', size: 18, color: 'success.main', where: 'StatusIconRow — Visit 완료' },
  { name: 'CloudDone', size: 18, color: 'success.main', where: 'StatusIconRow — Content Upload 완료' },
  { name: 'Paid', size: 18, color: 'success.main', where: 'StatusIconRow — Credit Sent 완료' },
  { name: 'RadioButtonUnchecked', size: 18, color: 'text.disabled', where: 'StatusIconRow — 미완료 (4단계 공통)' },
];

/**
 * AppIcon 컴포넌트
 *
 * 대시보드에서 쓰는 @mui/icons-material 아이콘을 이름으로 골라 그린다.
 * 아이콘 크기와 색을 화면 규칙대로 확인해 보기 위한 스토리북 전용 래퍼다.
 *
 * Props:
 * @param {string} name - ICON_SET에 등록된 아이콘 이름 [Required]
 * @param {number} size - 아이콘 크기(px) [Optional, 기본값: 16]
 * @param {string} color - 테마 색 토큰 경로 [Optional, 기본값: 'text.secondary']
 *
 * Example usage:
 * <AppIcon name="SearchOutlined" size={ 16 } color="text.secondary" />
 */
function AppIcon({ name, size = 16, color = 'text.secondary' }) {
  const Icon = ICON_SET[name] || ICON_SET.OpenInNew;
  return <Icon sx={ { fontSize: size, color } } />;
}

export default {
  title: 'Style/Icons',
  component: AppIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## 아이콘

대시보드는 **@mui/icons-material의 SVG 아이콘**을 쓴다. 폰트 아이콘(Material Symbols)은
스토리북 미리보기에만 로드돼 있고 앱에는 없다 — 화면에 나가는 아이콘은 전부 이 SVG 세트다.

### 규칙
- **Outlined 계열이 기본**. 채워진(filled) 아이콘은 4단계 완료 표시(StatusIconRow)에서만 쓴다 — 채움 자체가 "완료"라는 뜻이다.
- **크기는 글자에 맞춘다**: 내비·검색 16px, 달력 이동 18px, Drawer 연락처 15px, 인라인 링크 표시 11px.
- **색은 text.secondary가 기본**. 아이콘이 정보를 대표하는 자리가 아니라 글자를 거드는 자리다.
- 상태를 알려야 할 때만 색을 올린다 — 활성은 accent.main, 시트 연결 결과는 success/error.main.
        `,
      },
    },
  },
  argTypes: {
    name: {
      control: 'select',
      options: Object.keys(ICON_SET),
      description: '아이콘 이름 (대시보드에서 쓰는 세트)',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'SearchOutlined' } },
    },
    size: {
      control: { type: 'range', min: 10, max: 32, step: 1 },
      description: '아이콘 크기 (px)',
      table: { type: { summary: 'number' }, defaultValue: { summary: 16 } },
    },
    color: {
      control: 'select',
      options: ['text.secondary', 'text.primary', 'accent.main', 'warning.main', 'error.main', 'inherit'],
      description: '테마 색 토큰',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'text.secondary' } },
    },
  },
};

/** Default - 컨트롤로 크기·색 확인 */
export const Default = {
  args: {
    name: 'SearchOutlined',
    size: 16,
    color: 'text.secondary',
  },
};

/** 1. In Use - 대시보드가 쓰는 아이콘 전부 */
export const InUse = {
  name: '1. In Use',
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <>
      <DocumentTitle
        title="Icons In Use"
        status="Available"
        note="Every icon the dashboard renders, with its size and color"
        brandName="BeautyMaster"
        systemName="Influencer Dashboard"
        version="2.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          쓰는 아이콘
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          대시보드 화면에 나가는 아이콘은 아래 27개가 전부다 — 목록·리포트·Workflow에 더해 상세 Drawer(StatusIconRow 포함)와 시트 설정 모달까지, BeautymasterDashboard가 실제로 불러오는 화면 전부에서 센 것이다.
        </Typography>

        <SectionTitle title="목록" description="크기와 색까지 소스에 있는 그대로" />
        <TableContainer sx={ { mb: 4 } }>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={ { fontWeight: 600, width: 60 } }>Icon</TableCell>
                <TableCell sx={ { fontWeight: 600, width: 220 } }>Name</TableCell>
                <TableCell sx={ { fontWeight: 600, width: 70 } }>Size</TableCell>
                <TableCell sx={ { fontWeight: 600, width: 130 } }>Color</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>쓰이는 곳</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              { ICON_USAGE.map((row) => (
                <TableRow key={ row.name + row.size }>
                  <TableCell>
                    <AppIcon name={ row.name } size={ row.size } color={ row.color } />
                  </TableCell>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>{ row.name }</TableCell>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>{ row.size }px</TableCell>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>{ row.color }</TableCell>
                  <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.where }</TableCell>
                </TableRow>
              )) }
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="사용 예시" description="대시보드 코드에서 그대로 가져온 형태" />
        <Box
          component="pre"
          sx={ {
            backgroundColor: 'surface.muted',
            p: 2,
            fontSize: 12,
            fontFamily: 'monospace',
            overflow: 'auto',
            mb: 4,
          } }
        >
{ `import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

// 입력창 안 아이콘 — 글자와 같은 급으로 낮춘다
<InputAdornment position="start">
  <SearchOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
</InputAdornment>

// 링크 뒤 외부 이동 표시 — 글자 크기에 맞춰 11px
<OpenInNewIcon sx={{ fontSize: 11, verticalAlign: 'text-top', ml: 0.4 }} />

// 내비 아이콘은 라벨(13px)보다 조금 크게
<Icon sx={{ fontSize: 16, flexShrink: 0 }} />` }
        </Box>

        <SectionTitle
          title="Vibe Coding Prompt"
          description="AI 코딩 도구에 아이콘 규칙을 설명할 때 쓰는 문장"
        />
        <Box
          component="pre"
          sx={ {
            backgroundColor: 'grey.900',
            color: 'grey.100',
            p: 2,
            fontSize: 12,
            fontFamily: 'monospace',
            overflow: 'auto',
          } }
        >
{ `/* 이 대시보드의 아이콘 규칙 */

"아이콘은 @mui/icons-material에서 Outlined 계열만 골라 써.
Material Symbols 폰트 아이콘은 앱에 로드돼 있지 않다."

"크기는 옆 글자에 맞춘다 — 내비·검색 16px, 인라인 표시 11px.
기본 24px을 그대로 두면 글자보다 아이콘이 커져 화면이 시끄러워진다."

"색은 text.secondary가 기본. 아이콘만 accent 색으로 올리지 마."` }
        </Box>
      </PageContainer>
    </>
  ),
};
