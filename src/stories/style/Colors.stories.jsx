import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import {
  blue,
  blueGrey,
  grey,
  red,
  orange,
  green,
  lightBlue,
} from '@mui/material/colors';
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

/** 팔레트 스케일 컴포넌트 - 큰 블록 형태 */
const PaletteScale = ({ name, colorObj, description }) => (
  <Box sx={ { mb: 6 } }>
    <Typography variant="h6" sx={ { fontWeight: 600, mb: 0.5 } }>{ name }</Typography>
    <Typography variant="body2" color="text.secondary" sx={ { mb: 2 } }>{ description }</Typography>
    <Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 1 } }>
      { [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
        <Box
          key={ shade }
          sx={ {
            width: 80,
            height: 80,
            backgroundColor: colorObj[shade],
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
          } }
        >
          <Typography
            variant="caption"
            sx={ {
              color: shade >= 400 ? 'white' : 'rgba(0,0,0,0.7)',
              fontSize: 12,
              fontWeight: 700,
            } }
          >
            { shade }
          </Typography>
          <Typography
            variant="caption"
            sx={ {
              color: shade >= 400 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
              fontSize: 10,
              fontFamily: 'monospace',
            } }
          >
            { colorObj[shade] }
          </Typography>
        </Box>
      )) }
    </Box>
  </Box>
);

/** 시멘틱 토큰 블록 컴포넌트 */
const SemanticColorBlock = ({ name, colorObj, description }) => {
  const shades = ['light', 'main', 'dark'];
  return (
    <Box sx={ { mb: 6 } }>
      <Typography variant="h6" sx={ { fontWeight: 600, mb: 0.5 } }>{ name }</Typography>
      <Typography variant="body2" color="text.secondary" sx={ { mb: 2 } }>{ description }</Typography>
      <Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 1 } }>
        { shades.map((shade) => {
          const color = colorObj[shade];
          const isLight = shade === 'light';
          return (
            <Box
              key={ shade }
              sx={ {
                width: 120,
                height: 80,
                backgroundColor: color,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                border: isLight ? '1px solid rgba(0,0,0,0.1)' : 'none',
              } }
            >
              <Typography
                variant="caption"
                sx={ {
                  color: isLight ? 'rgba(0,0,0,0.7)' : 'white',
                  fontSize: 12,
                  fontWeight: 700,
                } }
              >
                { shade }
              </Typography>
              <Typography
                variant="caption"
                sx={ {
                  color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                  fontSize: 10,
                  fontFamily: 'monospace',
                } }
              >
                { color }
              </Typography>
            </Box>
          );
        }) }
      </Box>
    </Box>
  );
};

/** 단일 색상 블록 컴포넌트 */
const SingleColorBlock = ({ name, color, hasBorder = false }) => (
  <Box
    sx={ {
      width: 120,
      height: 80,
      backgroundColor: color,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 1,
      border: hasBorder ? '1px solid rgba(0,0,0,0.1)' : 'none',
    } }
  >
    <Typography
      variant="caption"
      sx={ {
        color: hasBorder ? 'rgba(0,0,0,0.7)' : 'white',
        fontSize: 12,
        fontWeight: 700,
      } }
    >
      { name }
    </Typography>
    <Typography
      variant="caption"
      sx={ {
        color: hasBorder ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontFamily: 'monospace',
      } }
    >
      { color }
    </Typography>
  </Box>
);

/** Docs - 색상 시스템 문서 (첫 번째 스토리) */
export const Docs = {
  render: () => {
    const theme = useTheme();

    // 토큰 구조 (트리 뷰용)
    const tokenStructure = {
      palette: {
        primary: theme.palette.primary,
        secondary: theme.palette.secondary,
        error: theme.palette.error,
        warning: theme.palette.warning,
        success: theme.palette.success,
        info: theme.palette.info,
        text: theme.palette.text,
        background: theme.palette.background,
        accent: theme.palette.accent,
        surface: theme.palette.surface,
        divider: theme.palette.divider,
      },
    };

    // 토큰 값 (테이블용)
    const tokenValues = [
      { token: 'primary.main', value: theme.palette.primary.main, description: '주요 브랜드 색상, CTA 버튼' },
      { token: 'primary.light', value: theme.palette.primary.light, description: 'hover 상태, 배경 강조' },
      { token: 'primary.dark', value: theme.palette.primary.dark, description: 'active 상태, 텍스트 강조' },
      { token: 'secondary.main', value: theme.palette.secondary.main, description: '보조 액션, 태그' },
      { token: 'error.main', value: theme.palette.error.main, description: '오류, 삭제, 위험' },
      { token: 'warning.main', value: theme.palette.warning.main, description: '주의, 경고' },
      { token: 'success.main', value: theme.palette.success.main, description: '성공, 완료, 활성' },
      { token: 'info.main', value: theme.palette.info.main, description: '정보, 안내' },
      { token: 'text.primary', value: theme.palette.text.primary, description: '주요 텍스트' },
      { token: 'text.secondary', value: theme.palette.text.secondary, description: '보조 텍스트, 캡션' },
      { token: 'background.default', value: theme.palette.background.default, description: '페이지 배경' },
      { token: 'background.paper', value: theme.palette.background.paper, description: '카드, 모달 배경' },
      // 상호작용 액센트 — 활성·선택·포커스가 전부 이 한 값에서 나온다.
      // primary.main(#0000FF)은 채도 100%라 목록이 주인공인 화면에서 컨트롤이
      // 가장 강한 요소가 돼버려서, "선택됨"의 기준색은 한 단 낮은 이 값이다.
      { token: 'accent.main', value: theme.palette.accent.main, description: '활성·선택·포커스 단일 액센트 (내비 활성, 탭 밑줄)' },
      { token: 'accent.tint', value: theme.palette.accent.tint, description: '선택 배경 — 채우지 않고 옅게 깐다' },
      { token: 'accent.tintHover', value: theme.palette.accent.tintHover, description: '선택 배경의 hover' },
      { token: 'accent.ring', value: theme.palette.accent.ring, description: '포커스 외곽 링 (테두리 1px 유지 + 번짐)' },
      // 면 위계 — grey.50/100을 날것으로 쓰면 무엇이 배경이고 무엇이 트랙인지
      // 코드만 봐서는 구분되지 않는다. 이름으로 역할을 고정한다.
      { token: 'surface.sunken', value: theme.palette.surface.sunken, description: '한 단 낮은 면 (레일 배경, 정보 스트립)' },
      { token: 'surface.muted', value: theme.palette.surface.muted, description: '무채색 채움 (차트 트랙, 라벨 배경)' },
      { token: 'divider', value: theme.palette.divider, description: '구분선, 보더' },
    ];

    return (
      <>
        <DocumentTitle
          title="Color System"
          status="Available"
          note="Color palette and semantic color tokens"
          brandName="Design System"
          systemName="Starter Kit"
          version="1.0"
        />
        <PageContainer>
          {/* 제목 + 1줄 개요 */}
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Color System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            프로젝트에서 사용하는 색상 팔레트와 시멘틱 컬러 토큰입니다.
          </Typography>

          {/* 토큰 구조 (트리 뷰) */}
          <SectionTitle title="토큰 구조" description="theme.palette 계층 구조" />
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 4 } }>
            { Object.entries(tokenStructure).map(([key, value]) => (
              <TreeNode key={ key } keyName={ key } value={ value } defaultOpen />
            )) }
          </Box>

          {/* 토큰 값 (테이블) */}
          <SectionTitle title="토큰 값" description="주요 색상 토큰의 실제 값" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Value</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Preview</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>설명</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { tokenValues.map((row) => (
                  <TableRow key={ row.token }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.token }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.value }</TableCell>
                    <TableCell>
                      <Box
                        sx={ {
                          width: 24,
                          height: 24,
                          backgroundColor: row.value,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '4px',
                        } }
                      />
                    </TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.description }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          {/* 사용 예시 */}
          <SectionTitle title="사용 예시" description="MUI sx prop에서의 색상 토큰 활용" />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'grey.100',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              borderRadius: 1,
              mb: 4,
            } }
          >
{ `// 배경색 적용
<Box sx={{ backgroundColor: 'primary.main' }} />
<Box sx={{ backgroundColor: 'background.paper' }} />

// 텍스트 색상
<Typography sx={{ color: 'text.primary' }}>주요 텍스트</Typography>
<Typography sx={{ color: 'text.secondary' }}>보조 텍스트</Typography>

// 보더 색상
<Box sx={{ border: '1px solid', borderColor: 'divider' }} />

// 상태별 색상
<Button color="primary">Primary</Button>
<Button color="error">Error</Button>

// hover 상태
<Box sx={{
  backgroundColor: 'primary.main',
  '&:hover': { backgroundColor: 'primary.dark' }
}} />

// 활성/선택 상태 — primary가 아니라 accent를 쓴다
<Box sx={{
  backgroundColor: 'accent.tint',
  color: 'accent.main',
  '&:hover': { backgroundColor: 'accent.tintHover' }
}} />

// 면 위계 — grey.50/100 대신 역할 이름으로
<Box sx={{ backgroundColor: 'surface.sunken' }} />  // 한 단 낮은 면
<Box sx={{ backgroundColor: 'surface.muted' }} />   // 차트 트랙, 라벨 배경` }
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
              color: 'grey.100',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              borderRadius: 1,
            } }
          >
{ `/* 색상 토큰 활용 프롬프트 예시 */

"primary.main (${theme.palette.primary.main})을 사용해서 CTA 버튼을 만들어줘.
hover 시 primary.dark로 변경되도록 해줘."

"text.primary와 text.secondary를 사용해서
카드 컴포넌트의 제목과 설명 텍스트 색상을 구분해줘."

"background.paper 배경에 primary.main 보더를 가진
선택된 상태의 카드를 만들어줘."

"error.main 색상으로 삭제 버튼을 만들고,
hover 시 error.dark로 어두워지게 해줘."

"내비 항목의 활성 상태를 accent.tint 배경 + accent.main 글자로 만들어줘.
primary.main은 쓰지 마 — 선택 상태의 기준색은 accent야."

"사이드바 배경은 grey.50 대신 surface.sunken을 써줘."` }
          </Box>
        </PageContainer>
      </>
    );
  },
};

/** 1. Color Palette - 원시 색상 */
export const Palette = {
  name: '1. Color Palette',
  render: () => (
    <>
      <DocumentTitle
        title="Color Palette"
        status="Available"
        note="MUI default color palette"
        brandName="Design System"
        systemName="Starter Kit"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          Color Palette (원시 색상)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          MUI에서 제공하는 기본 색상 팔레트입니다. 이 색상들을 조합하여 테마를 구성합니다.
        </Typography>

        <Divider sx={ { mb: 4 } } />

        <PaletteScale name="Blue" colorObj={ blue } description="Primary 색상의 기반" />
        <PaletteScale name="Blue Grey" colorObj={ blueGrey } description="Secondary 색상의 기반" />
        <PaletteScale name="Grey" colorObj={ grey } description="텍스트, 배경, 보더" />
        <PaletteScale name="Red" colorObj={ red } description="Error 상태" />
        <PaletteScale name="Orange" colorObj={ orange } description="Warning 상태" />
        <PaletteScale name="Green" colorObj={ green } description="Success 상태" />
        <PaletteScale name="Light Blue" colorObj={ lightBlue } description="Info 상태" />

        <SectionTitle title="명도 가이드" />

        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={ { fontWeight: 600, width: '20%' } }>50-100</TableCell>
                <TableCell>매우 밝음 - 배경색</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontWeight: 600 } }>200-300</TableCell>
                <TableCell>밝음 - hover, 보더</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontWeight: 600 } }>400-500</TableCell>
                <TableCell>기본 - main 색상</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontWeight: 600 } }>600-700</TableCell>
                <TableCell>어두움 - active, dark</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontWeight: 600 } }>800-900</TableCell>
                <TableCell>매우 어두움 - 텍스트</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>
    </>
  ),
};

/** 2. Semantic Tokens - 역할별 색상 */
export const SemanticTokens = {
  name: '2. Semantic Tokens',
  render: () => {
    const theme = useTheme();
    return (
      <>
        <DocumentTitle
          title="Semantic Tokens"
          status="Available"
          note="Role-based semantic colors"
          brandName="Design System"
          systemName="Starter Kit"
          version="1.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Semantic Tokens (역할별 색상)
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            색상에 의미와 역할을 부여한 토큰입니다. 컴포넌트에서 이 토큰을 참조합니다.
          </Typography>

          <SectionTitle title="브랜드 색상" />

          <SemanticColorBlock
            name="Primary"
            colorObj={ theme.palette.primary }
            description="CTA 버튼, 링크, 선택된 상태"
          />
          <SemanticColorBlock
            name="Secondary"
            colorObj={ theme.palette.secondary }
            description="보조 버튼, 태그"
          />

          <SectionTitle
            title="상태 색상 (Feedback Colors)"
            description="사용자에게 시스템 상태를 전달하는 색상입니다."
          />

          <SemanticColorBlock
            name="Error"
            colorObj={ theme.palette.error }
            description="오류, 삭제, 위험"
          />
          <SemanticColorBlock
            name="Warning"
            colorObj={ theme.palette.warning }
            description="주의, 경고"
          />
          <SemanticColorBlock
            name="Success"
            colorObj={ theme.palette.success }
            description="성공, 완료, 활성"
          />
          <SemanticColorBlock
            name="Info"
            colorObj={ theme.palette.info }
            description="정보, 안내"
          />

          <SectionTitle title="텍스트 및 배경 색상" />

          <Box sx={ { mb: 6 } }>
            <Typography variant="h6" sx={ { fontWeight: 600, mb: 0.5 } }>Text</Typography>
            <Typography variant="body2" color="text.secondary" sx={ { mb: 2 } }>텍스트 색상</Typography>
            <Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 1 } }>
              <SingleColorBlock name="primary" color={ theme.palette.text.primary } />
              <SingleColorBlock name="secondary" color={ theme.palette.text.secondary } />
              <SingleColorBlock name="disabled" color={ theme.palette.text.disabled } />
            </Box>
          </Box>

          <Box sx={ { mb: 6 } }>
            <Typography variant="h6" sx={ { fontWeight: 600, mb: 0.5 } }>Background</Typography>
            <Typography variant="body2" color="text.secondary" sx={ { mb: 2 } }>배경 색상</Typography>
            <Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 1 } }>
              <SingleColorBlock name="default" color={ theme.palette.background.default } hasBorder />
              <SingleColorBlock name="paper" color={ theme.palette.background.paper } hasBorder />
            </Box>
          </Box>
        </PageContainer>
      </>
    );
  },
};

/** 3. Usage - 컴포넌트에서의 활용 */
export const Usage = {
  name: '3. Usage',
  render: () => (
    <>
      <DocumentTitle
        title="Color Usage"
        status="Available"
        note="Color application in components"
        brandName="Design System"
        systemName="Starter Kit"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          컴포넌트 적용 예시
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          Semantic Token이 실제 컴포넌트에 어떻게 적용되는지 확인합니다.
        </Typography>

        <SectionTitle
          title="Button 컴포넌트"
          description="Button의 color prop에 Semantic Token 이름을 전달하면 해당 색상이 적용됩니다."
        />

        <Box
          component="pre"
          sx={ {
            backgroundColor: '#f5f5f5',
            p: 2,
            fontSize: 12,
            fontFamily: 'monospace',
            overflow: 'auto',
            mb: 4,
          } }
        >
{ `<Button variant="contained" color="primary">Primary</Button>
<Button variant="contained" color="error">Error</Button>
<Button variant="contained" color="success">Success</Button>` }
        </Box>

        <SectionTitle
          title="sx prop으로 직접 사용"
          description="sx prop에서 theme 값을 직접 참조할 수 있습니다."
        />

        <Box
          component="pre"
          sx={ {
            backgroundColor: '#f5f5f5',
            p: 2,
            fontSize: 12,
            fontFamily: 'monospace',
            overflow: 'auto',
          } }
        >
{ `// 문자열로 참조 (권장)
<Box sx={{ backgroundColor: 'primary.main' }} />
<Box sx={{ color: 'text.secondary' }} />
<Box sx={{ borderColor: 'divider' }} />

// 함수로 참조 (복잡한 계산 필요시)
<Box sx={{ backgroundColor: (theme) => theme.palette.primary.light }} />` }
        </Box>
      </PageContainer>
    </>
  ),
};
