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
  title: 'Style/Colors',
  parameters: {
    layout: 'padded',
  },
};

/**
 * 색 견본 하나
 *
 * Props:
 * @param {string} name - 토큰 이름 [Required]
 * @param {string} color - 색상 값 [Required]
 * @param {string} where - 화면에서 쓰이는 자리 [Optional]
 * @param {boolean} hasBorder - 밝은 색이라 테두리가 필요한지 [Optional, 기본값: false]
 *
 * Example usage:
 * <Swatch name="accent.main" color="#0000B2" where="사이드바 활성 항목" />
 */
function Swatch({ name, color, where, hasBorder = false }) {
  return (
    <Box sx={ { width: 168 } }>
      <Box
        sx={ {
          height: 72,
          backgroundColor: color,
          border: hasBorder ? '1px solid' : 'none',
          borderColor: 'divider',
        } }
      />
      <Typography sx={ { mt: 0.75, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 } }>
        { name }
      </Typography>
      <Typography sx={ { fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' } }>
        { color }
      </Typography>
      { where && (
        <Typography sx={ { mt: 0.25, fontSize: 11, color: 'text.secondary', lineHeight: 1.5 } }>
          { where }
        </Typography>
      ) }
    </Box>
  );
}

/**
 * 색 견본 줄
 *
 * Props:
 * @param {string} title - 묶음 제목 [Required]
 * @param {string} description - 묶음 설명 [Optional]
 * @param {ReactNode} children - Swatch 목록 [Required]
 *
 * Example usage:
 * <SwatchRow title="액센트"><Swatch ... /></SwatchRow>
 */
function SwatchRow({ title, description, children }) {
  return (
    <Box sx={ { mb: 5 } }>
      <Typography variant="h6" sx={ { fontWeight: 600, mb: 0.5 } }>{ title }</Typography>
      { description && (
        <Typography variant="body2" color="text.secondary" sx={ { mb: 2 } }>{ description }</Typography>
      ) }
      <Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 2 } }>{ children }</Box>
    </Box>
  );
}

/**
 * light / main / dark 3단 견본
 *
 * Props:
 * @param {string} name - 토큰 이름 [Required]
 * @param {object} colorObj - light/main/dark를 가진 팔레트 객체 [Required]
 * @param {string} where - 화면에서 쓰이는 자리 [Optional]
 *
 * Example usage:
 * <ScaleRow name="warning" colorObj={ theme.palette.warning } where="Alert 배너" />
 */
function ScaleRow({ name, colorObj, where }) {
  return (
    <Box sx={ { mb: 4 } }>
      <Typography sx={ { fontFamily: 'monospace', fontSize: 13, fontWeight: 600, mb: 0.25 } }>
        { name }
      </Typography>
      { where && (
        <Typography variant="body2" color="text.secondary" sx={ { mb: 1.5 } }>{ where }</Typography>
      ) }
      <Box sx={ { display: 'flex', gap: 1 } }>
        { ['light', 'main', 'dark'].map((shade) => (
          <Box key={ shade } sx={ { width: 136 } }>
            <Box sx={ { height: 56, backgroundColor: colorObj[shade] } } />
            <Typography sx={ { mt: 0.5, fontSize: 11, fontWeight: 600 } }>{ shade }</Typography>
            <Typography sx={ { fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' } }>
              { colorObj[shade] }
            </Typography>
          </Box>
        )) }
      </Box>
    </Box>
  );
}

/** Docs - 색상 시스템 문서 (첫 번째 스토리) */
export const Docs = {
  render: function ColorDocs() {
    const theme = useTheme();

    // 토큰 구조 (트리 뷰용) — 대시보드가 실제로 참조하는 가지만
    const tokenStructure = {
      palette: {
        primary: theme.palette.primary,
        secondary: theme.palette.secondary,
        accent: theme.palette.accent,
        surface: theme.palette.surface,
        text: theme.palette.text,
        background: theme.palette.background,
        action: theme.palette.action,
        error: theme.palette.error,
        warning: theme.palette.warning,
        success: theme.palette.success,
        divider: theme.palette.divider,
      },
    };

    // 토큰 값 (테이블용) — where는 실제 코드에서 확인한 자리
    const tokenValues = [
      { token: 'accent.main', value: theme.palette.accent.main, where: '사이드바 활성 항목, 선택된 칩 글자·테두리, 오늘 날짜, Drawer 링크 (29곳)' },
      { token: 'accent.tint', value: theme.palette.accent.tint, where: '선택 배경 — 채우지 않고 옅게 깐다 (사이드바 · 칩 · MenuItem)' },
      { token: 'accent.tintHover', value: theme.palette.accent.tintHover, where: '선택된 항목의 hover' },
      { token: 'accent.ring', value: theme.palette.accent.ring, where: '포커스 링 — boxShadow 0 0 0 3px (검색창 · 기간 선택 · 매장 Select)' },
      { token: 'surface.default', value: theme.palette.surface.default, where: '기본 면 — 메인 영역' },
      { token: 'surface.sunken', value: theme.palette.surface.sunken, where: '한 단 낮은 면 — 사이드바, 표 헤더, 그룹 헤더' },
      { token: 'surface.muted', value: theme.palette.surface.muted, where: '채워진 작은 면 — 태그, 프로그레스 트랙, 아바타' },
      { token: 'text.primary', value: theme.palette.text.primary, where: '이름·수치 등 주 텍스트' },
      { token: 'text.secondary', value: theme.palette.text.secondary, where: '라벨·메타·표 헤더 — 대시보드에서 가장 많이 쓰는 색 (141곳)' },
      { token: 'text.disabled', value: theme.palette.text.disabled, where: '⚠ 비활성 컨트롤 전용 — 2.68:1로 AA 미달, 읽을 글자에 쓰지 말 것' },
      { token: 'action.hover', value: theme.palette.action.hover, where: '행·버튼 hover' },
      { token: 'action.selected', value: theme.palette.action.selected, where: '목록에서 열려 있는 행' },
      { token: 'divider', value: theme.palette.divider, where: '구분선·표 경계 (41곳)' },
      { token: 'warning.main', value: theme.palette.warning.main, where: '미이행 경고 — 최하위 행 틴트, 미확인 점' },
      { token: 'success.main', value: theme.palette.success.main, where: 'Opinion USE' },
      { token: 'error.main', value: theme.palette.error.main, where: "Opinion DON'T, 에러 Alert" },
      { token: 'secondary.main', value: theme.palette.secondary.main, where: 'Workflow 역할 배지 테두리·글자' },
      { token: 'primary.dark', value: theme.palette.primary.dark, where: 'Workflow 링크 글자 — 순수 #0000FF는 흰 배경에서 가장자리가 떨려 한 단 낮춘다' },
      { token: 'primary.main', value: theme.palette.primary.main, where: '브랜드 값. 화면에서 직접 쓰는 곳은 없다 — 컨트롤 상태는 전부 accent가 맡는다' },
    ];

    return (
      <>
        <DocumentTitle
          title="Color System"
          status="Available"
          note="Tokens actually used by the BeautyMaster dashboard"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Color System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            대시보드 화면에 실제로 나가는 색만 담는다 — 값은 <code>src/styles/themes/default.js</code>에서 읽어온다.
          </Typography>

          <SectionTitle title="토큰 구조" description="theme.palette 계층 — accent · surface는 이 프로젝트에서 추가한 가지다" />
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider', mb: 4 } }>
            { Object.entries(tokenStructure).map(([key, value]) => (
              <TreeNode key={ key } keyName={ key } value={ value } defaultOpen />
            )) }
          </Box>

          <SectionTitle title="토큰 값" description="값과 그 색이 실제로 쓰이는 자리" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Value</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Preview</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>쓰이는 곳</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { tokenValues.map((row) => (
                  <TableRow key={ row.token }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' } }>{ row.token }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' } }>{ row.value }</TableCell>
                    <TableCell>
                      <Box
                        sx={ {
                          width: 24,
                          height: 24,
                          backgroundColor: row.value,
                          border: '1px solid',
                          borderColor: 'divider',
                        } }
                      />
                    </TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.where }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="정의는 있지만 화면에 없는 값" description="테마에 남아 있으나 대시보드가 참조하지 않는 토큰" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>왜 안 쓰는가</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>info.*</TableCell>
                  <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>
                    상태 4종 중 info만 쓸 자리가 없다. 정보성 안내는 text.secondary로 처리한다.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>grey.200~900</TableCell>
                  <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>
                    면은 surface, 글자는 text 토큰이 맡는다. grey는 surface 정의의 재료로만 남는다.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>primary.light</TableCell>
                  <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>
                    밝은 파랑을 얹을 자리를 accent.tint가 대신한다.
                  </TableCell>
                </TableRow>
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
{ `// 선택 상태 — 채우지 않고 틴트로 깐다 (SaasShell 사이드바)
<Box sx={{
  backgroundColor: isActive ? 'accent.tint' : 'transparent',
  color: isActive ? 'accent.main' : 'text.secondary',
  '&:hover': { backgroundColor: isActive ? 'accent.tintHover' : 'action.hover' },
}} />

// 포커스 — 테두리 두께는 그대로 두고 바깥 링으로만 알린다 (레이아웃 1px 흔들림 방지)
'&.Mui-focused': { boxShadow: theme => \`0 0 0 3px \${theme.palette.accent.ring}\` }

// 면 위계 — 한 단 낮은 면
<TableRow sx={{ '& th': { backgroundColor: 'surface.sunken', color: 'text.secondary' } }} />

// 경고는 글자색과 아주 옅은 배경 두 갈래로만 (SaasAnalyticsView 최하위 행)
sx={{
  backgroundColor: theme => alpha(theme.palette.warning.main, 0.06),
  color: 'warning.main',
}}` }
          </Box>

          <SectionTitle
            title="Vibe Coding Prompt"
            description="AI 코딩 도구에 이 시스템을 설명할 때 쓰는 문장"
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
{ `/* 이 대시보드의 색 규칙 */

"활성·선택·포커스는 전부 accent(${theme.palette.accent.main})로 통일해줘.
배경은 채우지 말고 accent.tint를 깔고, 포커스는 테두리 두께를 바꾸지 말고
accent.ring으로 3px 링만 둘러줘."

"면은 surface.default / surface.sunken / surface.muted 세 단만 써줘.
grey.50, grey.100을 직접 박지 말 것."

"보조 텍스트는 전부 text.secondary. text.disabled는 대비가 AA 미달이라
비활성 컨트롤에만 쓰고 읽어야 하는 글자에는 쓰지 마."

"상태색은 success / warning / error 셋만 쓴다. info는 이 화면에 없다."` }
          </Box>
        </PageContainer>
      </>
    );
  },
};

/** 1. 화면에서 쓰는 색 - 역할별 견본 */
export const InUse = {
  name: '1. In Use',
  render: function ColorsInUseDoc() {
    const theme = useTheme();
    return (
      <>
        <DocumentTitle
          title="Colors In Use"
          status="Available"
          note="Grouped by the role each color plays on screen"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            화면에서 쓰는 색
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            색을 색상군이 아니라 화면에서 맡은 역할로 묶는다.
          </Typography>

          <SwatchRow
            title="액센트 — 상태를 알리는 유일한 색"
            description="활성·선택·포커스가 모두 이 한 값에서 나온다. 브랜드 파랑(primary.main)보다 한 단 낮춰 목록이 주인공 자리를 지키게 한다."
          >
            <Swatch name="accent.main" color={ theme.palette.accent.main } where="활성 라벨, 선택 칩 테두리, 오늘 날짜" />
            <Swatch name="accent.tint" color={ theme.palette.accent.tint } where="선택 배경" hasBorder />
            <Swatch name="accent.tintHover" color={ theme.palette.accent.tintHover } where="선택 배경 hover" hasBorder />
            <Swatch name="accent.ring" color={ theme.palette.accent.ring } where="포커스 링 (3px 번짐)" hasBorder />
          </SwatchRow>

          <SwatchRow
            title="면 위계"
            description="흰 배경 위에서 한 단씩 낮아진다. hover·selected는 반투명 action 토큰이 맡는다."
          >
            <Swatch name="surface.default" color={ theme.palette.surface.default } where="메인 영역" hasBorder />
            <Swatch name="surface.sunken" color={ theme.palette.surface.sunken } where="사이드바, 표 헤더" hasBorder />
            <Swatch name="surface.muted" color={ theme.palette.surface.muted } where="태그, 프로그레스 트랙" hasBorder />
          </SwatchRow>

          <SwatchRow title="텍스트" description="읽어야 하는 글자는 primary와 secondary 둘로 끝낸다.">
            <Swatch name="text.primary" color={ theme.palette.text.primary } where="이름, 수치" />
            <Swatch name="text.secondary" color={ theme.palette.text.secondary } where="라벨, 메타, 표 헤더" />
            <Swatch name="text.disabled" color={ theme.palette.text.disabled } where="비활성 컨트롤 전용 (AA 미달)" />
          </SwatchRow>

          <SwatchRow title="상태" description="성과·이행 여부를 알리는 세 색. info는 쓰지 않는다.">
            <Swatch name="success.main" color={ theme.palette.success.main } where="Opinion USE" />
            <Swatch name="warning.main" color={ theme.palette.warning.main } where="미이행·미확인" />
            <Swatch name="error.main" color={ theme.palette.error.main } where="Opinion DON'T, 에러 Alert" />
          </SwatchRow>

          <SwatchRow title="브랜드 · 구분선" description="브랜드 파랑은 정체성 값으로 남고, 상태 표시는 accent가 맡는다.">
            <Swatch name="primary.main" color={ theme.palette.primary.main } where="브랜드 값 (화면 직접 사용 없음)" />
            <Swatch name="primary.dark" color={ theme.palette.primary.dark } where="Workflow 링크 글자" />
            <Swatch name="secondary.main" color={ theme.palette.secondary.main } where="역할 배지" />
            <Swatch name="divider" color={ theme.palette.divider } where="구분선, 표 경계" hasBorder />
          </SwatchRow>
        </PageContainer>
      </>
    );
  },
};

/** 2. Semantic Tokens - light / main / dark 3단 */
export const SemanticTokens = {
  name: '2. Semantic Tokens',
  render: function SemanticTokensDoc() {
    const theme = useTheme();
    return (
      <>
        <DocumentTitle
          title="Semantic Tokens"
          status="Available"
          note="light / main / dark steps of the semantic palette"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Semantic Tokens
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            역할 색의 3단 값이다. 화면은 대부분 main만 쓰고, dark는 글자, light는 아직 자리를 찾지 못했다.
          </Typography>

          <SectionTitle title="브랜드" />
          <ScaleRow name="primary" colorObj={ theme.palette.primary } where="브랜드 파랑. dark만 링크 글자로 나간다" />
          <ScaleRow name="secondary" colorObj={ theme.palette.secondary } where="Workflow 역할 배지" />

          <SectionTitle title="상태" description="MUI 기본값에서 브랜드 전용 값으로 교체된 색이다." />
          <ScaleRow name="success" colorObj={ theme.palette.success } where="Opinion USE" />
          <ScaleRow name="warning" colorObj={ theme.palette.warning } where="미이행·미확인 경고" />
          <ScaleRow name="error" colorObj={ theme.palette.error } where="Opinion DON'T, 에러 Alert" />

          <SectionTitle title="투명도로 만드는 값" description="불투명 색이 아니라 검정/액센트의 알파로 정의된 토큰" />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Value</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>쓰이는 곳</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { [
                  ['divider', theme.palette.divider, '구분선 — 어떤 면 위에 올려도 합성된다'],
                  ['action.hover', theme.palette.action.hover, '행·버튼 hover'],
                  ['action.selected', theme.palette.action.selected, '열려 있는 행'],
                  ['accent.tint', theme.palette.accent.tint, '선택 배경'],
                  ['accent.ring', theme.palette.accent.ring, '포커스 링'],
                ].map(([token, value, where]) => (
                  <TableRow key={ token }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ token }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ value }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ where }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>
        </PageContainer>
      </>
    );
  },
};

/** 3. Usage - 대시보드 코드에서의 적용 */
export const Usage = {
  name: '3. Usage',
  render: () => (
    <>
      <DocumentTitle
        title="Color Usage"
        status="Available"
        note="Patterns taken from the dashboard source"
        brandName="BeautyMaster"
        systemName="Influencer Dashboard"
        version="2.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          적용 패턴
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          아래 네 가지가 대시보드 색 사용의 거의 전부다.
        </Typography>

        <SectionTitle
          title="1) 선택은 채우지 않고 깐다"
          description="SaasShell 사이드바 · SaasOperationsView 필터 칩"
        />
        <Box component="pre" sx={ { backgroundColor: 'surface.muted', p: 2, fontSize: 12, fontFamily: 'monospace', overflow: 'auto', mb: 4 } }>
{ `backgroundColor: isActive ? 'accent.tint' : 'transparent',
color: isActive ? 'accent.main' : 'text.secondary',
borderColor: isActive ? 'accent.main' : 'divider',` }
        </Box>

        <SectionTitle
          title="2) 포커스는 두께가 아니라 번짐으로"
          description="테두리를 굵히면 레이아웃이 1px 흔들린다"
        />
        <Box component="pre" sx={ { backgroundColor: 'surface.muted', p: 2, fontSize: 12, fontFamily: 'monospace', overflow: 'auto', mb: 4 } }>
{ `'&.Mui-focused': {
  boxShadow: theme => \`0 0 0 3px \${theme.palette.accent.ring}\`,
}
// 테두리는 1px 유지, 색만 accent.main으로` }
        </Box>

        <SectionTitle
          title="3) 면은 세 단"
          description="grey.50 / grey.100을 직접 쓰지 않는다"
        />
        <Box component="pre" sx={ { backgroundColor: 'surface.muted', p: 2, fontSize: 12, fontFamily: 'monospace', overflow: 'auto', mb: 4 } }>
{ `<Box sx={{ backgroundColor: 'surface.sunken' }} />   // 사이드바, 표 헤더
<Box sx={{ backgroundColor: 'surface.muted' }} />    // 태그, 프로그레스 트랙
<Box sx={{ '&:hover': { backgroundColor: 'action.hover' } }} />` }
        </Box>

        <SectionTitle
          title="4) 경고는 글자색 + 아주 옅은 배경"
          description="배경을 진하게 채우면 표에서 그 행만 튄다"
        />
        <Box component="pre" sx={ { backgroundColor: 'surface.muted', p: 2, fontSize: 12, fontFamily: 'monospace', overflow: 'auto' } }>
{ `import { alpha } from '@mui/material/styles';

backgroundColor: isWorst ? theme => alpha(theme.palette.warning.main, 0.06) : 'transparent',
color: isWorst ? 'warning.main' : 'text.secondary',` }
        </Box>
      </PageContainer>
    </>
  ),
};
