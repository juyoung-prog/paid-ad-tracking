import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import {
  DocumentTitle,
  PageContainer,
  SectionTitle,
  TreeNode,
} from '../../components/storybookDocumentation';

export default {
  title: 'Style/Typography',
  parameters: {
    layout: 'padded',
  },
};

/**
 * 화면에 실제로 나가는 텍스트 크기.
 *
 * 대시보드는 Typography variant 대신 sx의 fontSize(px)로 글자 크기를 정한다.
 * variant 스케일(body1 16px)은 운영 화면의 정보 밀도에 맞지 않아, 10~14px 구간을
 * 손으로 잡아 쓰고 있다. count는 소스에서 센 실제 사용 횟수(아이콘 크기 제외)다.
 */
const UI_SCALE = [
  { px: 22, weight: 600, count: 1, role: 'KPI 수치', where: 'SaasKpiItem — letterSpacing -0.02em, lineHeight 1' },
  { px: 18, weight: 600, count: 1, role: 'Workflow 단계 수치', where: 'SaasWorkflowView — tabular-nums' },
  { px: 14, weight: 600, count: 6, role: '섹션 제목', where: 'SaasAnalyticsView component="h2" — letterSpacing -0.01em' },
  { px: 13, weight: '500~600', count: 33, role: '내비 라벨 · 퍼널 라벨 · 버튼', where: 'SaasShell 메뉴, 필터 초기화 버튼' },
  { px: 12, weight: 400, count: 27, role: '표 셀 · 목록 행 본문', where: 'SaasOperationsView 인플루언서 행' },
  { px: 11, weight: '400~500', count: 59, role: '표 헤더 · 칩 · 메타 라벨', where: '가장 많이 쓰는 크기 — 부가 정보 전반' },
  { px: 10, weight: 500, count: 4, role: '태그 · 배지', where: 'surface.muted 배경 위, lineHeight 1.6' },
];

/** 아이콘 크기는 글자 스케일과 별개로 관리한다 */
const ICON_SCALE = [
  { px: 22, where: 'SheetSetupScreen 안내 아이콘' },
  { px: 18, where: '달력 이동, Select 화살표' },
  { px: 16, where: '내비 아이콘, 검색, 기간 선택, 모달 상태 아이콘' },
  { px: 15, where: 'Drawer 연락처 줄 아이콘' },
  { px: 14, where: '버튼 안 아이콘, Drawer 외부 링크' },
  { px: 12, where: '행 안 보조 아이콘' },
  { px: 11, where: '가장 작은 인라인 아이콘' },
];

/** 타이포그래피 시스템 문서 */
export const Docs = {
  render: function TypographyDocs() {
    const theme = useTheme();

    const tokenStructure = {
      typography: {
        fontFamily: theme.typography.fontFamily,
        headingFontFamily: theme.typography.headingFontFamily,
        fontSize: theme.typography.fontSize,
        fontWeightRegular: theme.typography.fontWeightRegular,
        fontWeightMedium: theme.typography.fontWeightMedium,
        fontWeightBold: theme.typography.fontWeightBold,
        h4: theme.typography.h4,
        h5: theme.typography.h5,
        h6: theme.typography.h6,
        body1: theme.typography.body1,
        body2: theme.typography.body2,
        caption: theme.typography.caption,
        overline: theme.typography.overline,
      },
    };

    const variantRows = [
      { variant: 'h1', usage: '스토리북 문서 전용 — 대시보드 화면에는 없다' },
      { variant: 'h2', usage: '스토리북 문서 전용' },
      { variant: 'h3', usage: '스토리북 문서 전용' },
      { variant: 'h4', usage: '스토리북 문서 제목. tabular-nums 지정 — KPI에 쓸 것을 전제로 만든 값' },
      { variant: 'h5', usage: '스토리북 문서 소제목. tabular-nums' },
      { variant: 'h6', usage: '대시보드 안내 화면 제목 (SheetSetupScreen)' },
      { variant: 'subtitle1', usage: '미사용' },
      { variant: 'subtitle2', usage: '미사용' },
      { variant: 'body1', usage: '문서 본문. 대시보드 본문은 이 크기(16px)를 쓰지 않는다' },
      { variant: 'body2', usage: '문서 보조 본문, SheetSetupScreen 안내문' },
      { variant: 'button', usage: 'Button 기본값 — textTransform: none으로 대문자 변환을 껐다' },
      { variant: 'caption', usage: 'SheetSetupScreen 단계 번호·설명' },
      { variant: 'overline', usage: 'SheetSetupScreen 구역 라벨 — 대문자 + letterSpacing 0.08em' },
    ].map((row) => ({
      ...row,
      fontSize: theme.typography[row.variant]?.fontSize,
      fontWeight: theme.typography[row.variant]?.fontWeight,
    }));

    return (
      <>
        <DocumentTitle
          title="Typography"
          status="Available"
          note="Theme variants and the px scale the dashboard actually renders"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Typography System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            폰트 설정은 테마에서, 실제 글자 크기는 화면 코드에서 온다 — 둘 다 적는다.
          </Typography>

          <SectionTitle title="폰트" description="본문과 헤딩이 서로 다른 패밀리를 쓴다" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 200 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>fontFamily</TableCell>
                  <TableCell sx={ { fontSize: 12, color: 'text.secondary' } }>
                    Pretendard Variable → 시스템 한글 폰트 순 (self-host)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>headingFontFamily</TableCell>
                  <TableCell sx={ { fontSize: 12, color: 'text.secondary' } }>
                    Outfit Variable → Pretendard. h1~h6에만 적용
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>fontVariantNumeric</TableCell>
                  <TableCell sx={ { fontSize: 12, color: 'text.secondary' } }>
                    h4 · h5에 tabular-nums — 숫자 자릿수가 바뀌어도 폭이 흔들리지 않게
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle
            title="화면 실사용 스케일"
            description="대시보드는 variant 대신 sx의 fontSize(px)로 크기를 잡는다. 아래가 화면에 실제로 나가는 값이다."
          />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>Size</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 90 } }>Weight</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>사용 수</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 200 } }>역할</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Sample</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { UI_SCALE.map((row) => (
                  <TableRow key={ row.px }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.px }px</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.weight }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.count }</TableCell>
                    <TableCell sx={ { fontSize: 13 } }>
                      { row.role }
                      <Box component="span" sx={ { display: 'block', fontSize: 11, color: 'text.secondary' } }>
                        { row.where }
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={ { fontSize: row.px, fontWeight: Number(row.weight) || 500, whiteSpace: 'nowrap' } }>
                        Serena Hale · 24,180
                      </Box>
                    </TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="아이콘 크기" description="글자 스케일과 따로 관리한다 (@mui/icons-material의 fontSize)" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>Size</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>쓰이는 곳</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { ICON_SCALE.map((row) => (
                  <TableRow key={ row.px }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.px }px</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.where }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="토큰 구조" description="theme.typography 계층" />
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider', mb: 4 } }>
            { Object.entries(tokenStructure).map(([key, value]) => (
              <TreeNode key={ key } keyName={ key } value={ value } defaultOpen />
            )) }
          </Box>

          <SectionTitle title="Variant 값" description="테마에 정의된 스케일과, 그 variant가 실제로 어디에 쓰이는지" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 100 } }>Variant</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 90 } }>Size</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 80 } }>Weight</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>실제 용도</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { variantRows.map((row) => (
                  <TableRow key={ row.variant }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.variant }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.fontSize || '-' }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.fontWeight || '-' }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.usage }</TableCell>
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
{ `// 섹션 제목 — 시맨틱은 h2, 크기는 화면 스케일로
<Typography component="h2" sx={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
  Campaign Summary
</Typography>

// 표 헤더 — 11px + text.secondary가 기본 조합
<TableRow sx={{ '& th': { fontSize: 11, fontWeight: 500, color: 'text.secondary' } }} />

// 숫자는 자릿수가 바뀌어도 폭이 흔들리지 않게
<Typography sx={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
  {count}
</Typography>

// 한 줄 목록은 넘칠 때 자른다
sx={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}` }
          </Box>

          <SectionTitle
            title="Vibe Coding Prompt"
            description="AI 코딩 도구에 이 스케일을 설명할 때 쓰는 문장"
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
{ `/* 이 대시보드의 글자 규칙 */

"운영 화면 글자는 10 · 11 · 12 · 13 · 14px 다섯 단만 쓴다.
body1(16px) 같은 variant 기본 크기는 이 화면에 너무 크다."

"표 헤더와 메타 라벨은 11px + fontWeight 500 + text.secondary.
행 본문은 12px, 내비·버튼 라벨은 13px."

"수치는 22px(KPI) / 18px(단계 카운트) + fontVariantNumeric: 'tabular-nums'.
자릿수가 바뀌어도 폭이 흔들리면 안 된다."

"제목은 시맨틱 태그(component='h2')로 잡고 크기는 sx로 준다.
variant='h2'를 쓰면 32px이 나와 화면이 깨진다."` }
          </Box>
        </PageContainer>
      </>
    );
  },
};
