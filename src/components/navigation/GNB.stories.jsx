import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SettingsIcon from '@mui/icons-material/Settings';
import { GNB } from './GNB';
import { NavMenu } from './NavMenu';
import { DocumentTitle, PageContainer } from '../storybookDocumentation';
import { SectionContainer } from '../container/SectionContainer';

export default {
  title: 'Component/10. Navigation/GNB',
  component: GNB,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'gallery', label: 'Gallery', icon: <PhotoLibraryIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

const Logo = () => (
  <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.5px' }}>
    STARTER.
  </Typography>
);

/**
 * ## Default
 * 
 * 기본 GNB. 로고와 네비게이션 메뉴를 포함합니다.
 * 브레이크포인트(md) 미만에서 햄버거 메뉴로 전환됩니다.
 */
export const Default = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="GNB"
        status="Ready"
        note="Global Navigation Bar - 반응형 헤더 + 드로어"
        brandName="Navigation"
        systemName="GNB"
        version="1.0"
      />
      <SectionContainer sx={{ py: 0 }}>
        <GNB
          logo={<Logo />}
          navContent={
            <NavMenu
              items={navItems}
              activeId="dashboard"
              variant="underline"
            />
          }
        />
        <Box sx={{ p: 4, bgcolor: 'grey.50', minHeight: 300 }}>
          <Typography color="text.secondary">
            브라우저 너비를 줄여서 반응형 전환을 확인하세요.
          </Typography>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * ## Transparent Header
 * 
 * 투명 배경의 GNB. 히어로 섹션 위에 오버레이할 때 사용합니다.
 */
export const Transparent = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="GNB - Transparent"
        status="Ready"
        note="투명 배경 + 블러 효과"
        brandName="Navigation"
        systemName="GNB"
        version="1.0"
      />
      <SectionContainer sx={{ py: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <GNB
            logo={<Logo />}
            navContent={
              <NavMenu
                items={navItems}
                activeId="dashboard"
                variant="underline"
              />
            }
            isTransparent
            hasBorder={false}
          />
          <Box
            sx={{
              height: 400,
              /* 투명 GNB를 보여주려면 어두운 면이 필요하다 — 테마 밖 보라
                 그라디언트(#667eea) 대신 팔레트의 secondary(blueGrey 900)를 쓴다. */
              backgroundColor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" color="white" fontWeight={700}>
              Hero Section
            </Typography>
          </Box>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * ## With Persistent Elements
 * 
 * 항상 표시되는 요소(검색바, 프로필 등)와 함께 사용합니다.
 */
export const WithPersistent = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="GNB - With Persistent"
        status="Ready"
        note="항상 표시되는 요소 포함"
        brandName="Navigation"
        systemName="GNB"
        version="1.0"
      />
      <SectionContainer sx={{ py: 0 }}>
        <GNB
          logo={<Logo />}
          navContent={
            <NavMenu
              items={navItems}
              activeId="dashboard"
              variant="underline"
            />
          }
          persistent={
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              S
            </Box>
          }
        />
        <Box sx={{ p: 4, bgcolor: 'grey.50', minHeight: 300 }}>
          <Typography color="text.secondary">
            프로필 아바타는 모바일에서도 항상 표시됩니다.
          </Typography>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * ## Custom Breakpoint
 * 
 * 브레이크포인트를 lg로 변경하여 더 넓은 화면에서 전환합니다.
 */
export const CustomBreakpoint = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="GNB - Custom Breakpoint"
        status="Ready"
        note="breakpoint='lg' 설정"
        brandName="Navigation"
        systemName="GNB"
        version="1.0"
      />
      <SectionContainer sx={{ py: 0 }}>
        <GNB
          logo={<Logo />}
          navContent={
            <NavMenu
              items={navItems}
              activeId="dashboard"
              variant="underline"
            />
          }
          breakpoint="lg"
        />
        <Box sx={{ p: 4, bgcolor: 'grey.50', minHeight: 300 }}>
          <Typography color="text.secondary">
            lg(1200px) 미만에서 햄버거 메뉴로 전환됩니다.
          </Typography>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * ## Props
 */
export const Props = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="GNB Props"
        status="Ready"
        note="GNB 컴포넌트 Props 문서"
        brandName="Navigation"
        systemName="GNB"
        version="1.0"
      />
      <SectionContainer>
        <Box sx={{ overflowX: 'auto' }}>
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              '& th, & td': {
                p: 2,
                textAlign: 'left',
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
              '& th': {
                bgcolor: 'grey.50',
                fontWeight: 600,
              },
            }}
          >
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>logo</code></td>
                <td>node</td>
                <td>-</td>
                <td>로고 영역 (항상 표시)</td>
              </tr>
              <tr>
                <td><code>navContent</code></td>
                <td>node</td>
                <td>-</td>
                <td>네비게이션 콘텐츠 (반응형 전환 대상)</td>
              </tr>
              <tr>
                <td><code>persistent</code></td>
                <td>node</td>
                <td>-</td>
                <td>항상 표시될 요소 (검색, 프로필 등)</td>
              </tr>
              <tr>
                <td><code>drawerHeader</code></td>
                <td>node</td>
                <td>logo</td>
                <td>드로어 상단 커스텀 요소</td>
              </tr>
              <tr>
                <td><code>drawerFooter</code></td>
                <td>node</td>
                <td>-</td>
                <td>드로어 하단 커스텀 요소</td>
              </tr>
              <tr>
                <td><code>breakpoint</code></td>
                <td>'sm' | 'md' | 'lg'</td>
                <td>'md'</td>
                <td>반응형 전환 브레이크포인트</td>
              </tr>
              <tr>
                <td><code>height</code></td>
                <td>number</td>
                <td>64</td>
                <td>헤더 높이 (px)</td>
              </tr>
              <tr>
                <td><code>drawerWidth</code></td>
                <td>number</td>
                <td>280</td>
                <td>드로어 너비 (px)</td>
              </tr>
              <tr>
                <td><code>hasBorder</code></td>
                <td>boolean</td>
                <td>true</td>
                <td>헤더 하단 보더</td>
              </tr>
              <tr>
                <td><code>isSticky</code></td>
                <td>boolean</td>
                <td>true</td>
                <td>헤더 고정 여부</td>
              </tr>
              <tr>
                <td><code>isTransparent</code></td>
                <td>boolean</td>
                <td>false</td>
                <td>투명 배경 + 블러 효과</td>
              </tr>
            </tbody>
          </Box>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};

