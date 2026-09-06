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

/** 타이포그래피 시스템 문서 */
export const Docs = {
  render: () => {
    const theme = useTheme();

    // 토큰 구조 (트리 뷰용)
    const tokenStructure = {
      typography: {
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize,
        fontWeightLight: theme.typography.fontWeightLight,
        fontWeightRegular: theme.typography.fontWeightRegular,
        fontWeightMedium: theme.typography.fontWeightMedium,
        fontWeightBold: theme.typography.fontWeightBold,
        h1: theme.typography.h1,
        h2: theme.typography.h2,
        h3: theme.typography.h3,
        h4: theme.typography.h4,
        h5: theme.typography.h5,
        h6: theme.typography.h6,
        body1: theme.typography.body1,
        body2: theme.typography.body2,
        subtitle1: theme.typography.subtitle1,
        subtitle2: theme.typography.subtitle2,
        button: theme.typography.button,
        caption: theme.typography.caption,
        overline: theme.typography.overline,
        // 역할 토큰 — h1~h6이 '크기 스케일'이라면 이 셋은 '역할'이다
        display: theme.typography.display,
        title: theme.typography.title,
        label: theme.typography.label,
      },
    };

    // 토큰 값 (테이블용)
    const tokenValues = [
      { variant: 'h1', fontSize: theme.typography.h1?.fontSize, fontWeight: theme.typography.h1?.fontWeight, usage: '페이지 메인 타이틀' },
      { variant: 'h2', fontSize: theme.typography.h2?.fontSize, fontWeight: theme.typography.h2?.fontWeight, usage: '섹션 타이틀' },
      { variant: 'h3', fontSize: theme.typography.h3?.fontSize, fontWeight: theme.typography.h3?.fontWeight, usage: '서브섹션 타이틀' },
      { variant: 'h4', fontSize: theme.typography.h4?.fontSize, fontWeight: theme.typography.h4?.fontWeight, usage: '카드 타이틀' },
      { variant: 'h5', fontSize: theme.typography.h5?.fontSize, fontWeight: theme.typography.h5?.fontWeight, usage: '작은 타이틀' },
      { variant: 'h6', fontSize: theme.typography.h6?.fontSize, fontWeight: theme.typography.h6?.fontWeight, usage: '라벨 타이틀' },
      { variant: 'subtitle1', fontSize: theme.typography.subtitle1?.fontSize, fontWeight: theme.typography.subtitle1?.fontWeight, usage: '서브타이틀' },
      { variant: 'subtitle2', fontSize: theme.typography.subtitle2?.fontSize, fontWeight: theme.typography.subtitle2?.fontWeight, usage: '작은 서브타이틀' },
      { variant: 'body1', fontSize: theme.typography.body1?.fontSize, fontWeight: theme.typography.body1?.fontWeight, usage: '본문 텍스트' },
      { variant: 'body2', fontSize: theme.typography.body2?.fontSize, fontWeight: theme.typography.body2?.fontWeight, usage: '보조 본문' },
      { variant: 'button', fontSize: theme.typography.button?.fontSize, fontWeight: theme.typography.button?.fontWeight, usage: '버튼 텍스트' },
      { variant: 'caption', fontSize: theme.typography.caption?.fontSize, fontWeight: theme.typography.caption?.fontWeight, usage: '캡션, 주석' },
      { variant: 'overline', fontSize: theme.typography.overline?.fontSize, fontWeight: theme.typography.overline?.fontWeight, usage: '라벨, 카테고리' },
      { variant: 'display', fontSize: theme.typography.display?.fontSize, fontWeight: theme.typography.display?.fontWeight, usage: '[역할] KPI 값 등 화면에서 가장 큰 숫자' },
      { variant: 'title', fontSize: theme.typography.title?.fontSize, fontWeight: theme.typography.title?.fontWeight, usage: '[역할] 섹션 제목' },
      { variant: 'label', fontSize: theme.typography.label?.fontSize, fontWeight: theme.typography.label?.fontWeight, usage: '[역할] 그룹 헤더·컬럼 헤더' },
    ];

    // Font Weight 데이터
    const fontWeights = [
      { name: 'Light', token: 'fontWeightLight', value: theme.typography.fontWeightLight },
      { name: 'Regular', token: 'fontWeightRegular', value: theme.typography.fontWeightRegular },
      { name: 'Medium', token: 'fontWeightMedium', value: theme.typography.fontWeightMedium },
      { name: 'Bold', token: 'fontWeightBold', value: theme.typography.fontWeightBold },
    ];

    return (
      <>
        <DocumentTitle
          title="Typography"
          status="Available"
          note="Font and text style system"
          brandName="Design System"
          systemName="Starter Kit"
          version="1.0"
        />
        <PageContainer>
          {/* 제목 + 1줄 개요 */}
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Typography System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            프로젝트에서 사용하는 타이포그래피 스케일과 폰트 설정입니다.
          </Typography>

          {/* 토큰 구조 (트리 뷰) */}
          <SectionTitle title="토큰 구조" description="theme.typography 계층 구조" />
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 4 } }>
            { Object.entries(tokenStructure).map(([key, value]) => (
              <TreeNode key={ key } keyName={ key } value={ value } defaultOpen />
            )) }
          </Box>

          {/* 토큰 값 (테이블) - Typography Scale */}
          <SectionTitle title="토큰 값" description="Typography variant별 설정" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 100 } }>Variant</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 80 } }>Size</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 80 } }>Weight</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 'auto' } }>Sample</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 140 } }>용도</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { tokenValues.map((row) => (
                  <TableRow key={ row.variant }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.variant }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.fontSize || '-' }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.fontWeight || '-' }</TableCell>
                    <TableCell sx={ { minWidth: 320 } }>
                      <Typography variant={ row.variant } sx={ { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>
                        Typography
                      </Typography>
                    </TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.usage }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          {/* Font Weight 테이블 */}
          <SectionTitle title="Font Weight" description="사용 가능한 폰트 굵기" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Name</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Value</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Sample</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { fontWeights.map((row) => (
                  <TableRow key={ row.token }>
                    <TableCell>{ row.name }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.token }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.value }</TableCell>
                    <TableCell>
                      <Box component="span" sx={ { fontWeight: row.value } }>
                        The quick brown fox
                      </Box>
                    </TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          {/* 사용 예시 */}
          <SectionTitle
            title="운영 화면의 밀도"
            description="이 대시보드가 기본 스케일 대신 역할 토큰과 sx px를 쓰는 이유"
          />
          <Box sx={ { mb: 4 } }>
            <Typography variant="body2" sx={ { mb: 1 } }>
              본문 스케일은 <strong>10 · 11 · 12 · 13 · 14px</strong>가 주력입니다. 표 한 화면에 스무 행,
              드로어 한 화면에 지표 열여덟 줄이 들어와야 하는 화면이라 <code>body1</code>(16px)은 이 정보
              밀도에 맞지 않습니다 — 밀도 높은 목록·표의 강조 텍스트는 <code>body1</code> 대신
              <code>body2 + fontWeight</code> 또는 <code>sx</code>의 px를 씁니다.
            </Typography>
            <Typography variant="body2" sx={ { mb: 1 } }>
              <code>h1~h6</code>은 <strong>크기 스케일</strong>이고, 화면이 실제로 필요로 한 건
              <strong>역할</strong>이었습니다 — &ldquo;KPI 숫자 / 섹션 제목 / 그룹·컬럼 헤더&rdquo; 세 자리.
              스케일에서 가장 가까운 걸 골라 쓰다 보니 섹션 제목(<code>subtitle1</code> 16/500)과 본문
              (<code>body1</code> 16/400)이 크기가 같고 굵기만 100 차이라 제목으로 스캔되지 않았고,
              구조를 나누는 그룹 헤더(<code>overline</code> 12px)가 화면에서 가장 작은 글씨라 위계가
              역전됐습니다. 그래서 스케일은 그대로 두고 역할 칸을 새로 팠습니다 —
              <code>display</code>(24/600) · <code>title</code>(18/600) · <code>label</code>(13/600 대문자).
            </Typography>
            <Typography variant="body2">
              숫자는 자릿수가 바뀌어도 폭이 흔들리지 않게 <code>fontVariantNumeric: &apos;tabular-nums&apos;</code>를
              함께 씁니다. 표 헤더는 12px/500 <code>text.secondary</code>로 값보다 한 단 물러납니다 —
              헤더가 값과 같은 급이면 표 위쪽이 무거워집니다.
            </Typography>
          </Box>

          <SectionTitle title="사용 예시" description="MUI Typography 컴포넌트 활용" />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'surface.muted',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              borderRadius: 1,
              mb: 4,
            } }
          >
{ `// Typography variant 사용
<Typography variant="h1">페이지 타이틀</Typography>
<Typography variant="body1">본문 텍스트</Typography>
<Typography variant="caption">캡션 텍스트</Typography>

// sx prop으로 커스텀
<Typography sx={{ fontWeight: 700 }}>볼드 텍스트</Typography>
<Typography sx={{ fontSize: '1.5rem' }}>커스텀 크기</Typography>

// color와 함께 사용
<Typography variant="h4" color="primary">Primary 컬러 제목</Typography>
<Typography variant="body2" color="text.secondary">보조 텍스트</Typography>

// fontWeight 토큰 사용
<Box sx={{ fontWeight: 'fontWeightBold' }}>볼드 텍스트</Box>
<Box sx={{ fontWeight: 'fontWeightLight' }}>라이트 텍스트</Box>` }
          </Box>

          {/* Vibe Coding Prompt */}
          <SectionTitle
            title="Vibe Coding Prompt"
            description="AI 코딩 도구에서 활용할 수 있는 프롬프트 예시"
          />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'grey.900',
              color: 'surface.muted',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              borderRadius: 1,
            } }
          >
{ `/* 타이포그래피 토큰 활용 프롬프트 예시 */

"Typography variant='h4'를 사용해서 카드 제목을 만들어줘.
fontWeight: 700으로 볼드 처리해줘."

"body1으로 본문, caption으로 날짜를 표시하는
블로그 포스트 카드를 만들어줘."

"h2는 섹션 제목, body2는 설명으로 사용해서
가격표 컴포넌트를 만들어줘."

"overline variant로 카테고리 라벨을 만들고,
h5로 아이템 이름을 표시해줘."

"fontWeightLight (${theme.typography.fontWeightLight})와
fontWeightBold (${theme.typography.fontWeightBold})를 사용해서
강조 텍스트와 일반 텍스트를 구분해줘."` }
          </Box>
        </PageContainer>
      </>
    );
  },
};
