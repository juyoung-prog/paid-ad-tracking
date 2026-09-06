import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppShell } from './AppShell';
import { NavMenu } from '../navigation/NavMenu';
import { DocumentTitle, PageContainer } from '../storybookDocumentation';
import { SectionContainer } from '../container/SectionContainer';
import Placeholder from '../../common/ui/Placeholder';

// Navigation Items
const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'products', label: 'Products' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export default {
  title: 'Component/8. Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    logo: { control: false, description: 'GNB 왼쪽 로고 영역 (항상 표시)' },
    headerPersistent: {
      control: false,
      description: '브레이크포인트와 무관하게 헤더에 계속 남는 요소',
    },
    headerCollapsible: {
      control: false,
      description: '브레이크포인트 아래에서 드로어로 옮겨지는 요소 (네비게이션 메뉴 등)',
    },
    drawerHeader: { control: false, description: '드로어 상단 커스텀 요소' },
    drawerFooter: { control: false, description: '드로어 하단 커스텀 요소' },
    children: { control: false, description: 'main 태그로 감싸지는 메인 콘텐츠 영역' },
    breakpoint: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '헤더 메뉴가 드로어로 바뀌는 전환 브레이크포인트',
    },
    headerHeight: {
      control: { type: 'number', min: 40, max: 120, step: 4 },
      description: '헤더 높이 (px)',
    },
    drawerWidth: {
      control: { type: 'number', min: 200, max: 400, step: 10 },
      description: '드로어 너비 (px)',
    },
    hasHeaderBorder: { control: 'boolean', description: '헤더 하단 보더 표시 여부' },
    isHeaderSticky: { control: 'boolean', description: '스크롤해도 헤더를 상단에 고정' },
    isHeaderTransparent: { control: 'boolean', description: '헤더 배경을 투명하게' },
  },
};

/**
 * ## 기본 사용법
 * 
 * 반응형 애플리케이션 쉘입니다.
 * 모바일에서는 자동으로 드로어 메뉴로 전환됩니다.
 */
export const Default = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="AppShell"
        status="Ready"
        note="반응형 애플리케이션 쉘 컴포넌트"
        brandName="Navigation"
        systemName="AppShell"
        version="1.0"
      />
      <SectionContainer>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', height: 400 }}>
          <AppShell
            logo={
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.5px' }}>
                Brand
              </Typography>
            }
            headerPersistent={
              <IconButton size="small">
                <AccountCircleIcon />
              </IconButton>
            }
            headerCollapsible={
              <NavMenu
                items={navItems}
                activeId="home"
                variant="underline"
              />
            }
          >
            <Box sx={{ p: 4 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Welcome to Dashboard
              </Typography>
              <Typography color="text.secondary">
                화면 크기를 조절해보세요. 모바일에서는 네비게이션이 드로어 메뉴로 전환됩니다.
              </Typography>
            </Box>
          </AppShell>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * ## 다양한 기능 조합
 * 
 * 검색, CTA 버튼, 드로어 푸터 등을 포함한 전체 기능 예시입니다.
 */
export const FullFeatured = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="AppShell - Full Featured"
        status="Ready"
        note="다양한 기능이 포함된 전체 구성 예시"
        brandName="Navigation"
        systemName="AppShell"
        version="1.0"
      />
      <SectionContainer>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', height: 500 }}>
          <AppShell
            logo={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  SK
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Starter Kit
                </Typography>
              </Box>
            }
            headerPersistent={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small">
                  <SearchIcon />
                </IconButton>
                <Button variant="contained" size="small" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  Get Started
                </Button>
              </Box>
            }
            headerCollapsible={
              <NavMenu
                items={navItems}
                activeId="home"
                variant="underline"
              />
            }
            drawerFooter={
              <Button variant="contained" fullWidth>
                Get Started
              </Button>
            }
            breakpoint="lg"
          >
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.50',
              }}
            >
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Home Page
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                  메인 콘텐츠 영역입니다. AppShell이 반응형 헤더와 자동 드로어 변환을 제공합니다.
                </Typography>
              </Box>
            </Box>
          </AppShell>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * ## 투명 헤더
 * 
 * Hero 섹션에 적합한 투명 헤더 모드입니다.
 */
export const TransparentHeader = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="AppShell - Transparent Header"
        status="Ready"
        note="Hero 섹션에 적합한 투명 헤더 모드"
        brandName="Navigation"
        systemName="AppShell"
        version="1.0"
      />
      <SectionContainer>
        <Box sx={{ borderRadius: 2, overflow: 'hidden', height: 400 }}>
          <AppShell
            logo={
              <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                Brand
              </Typography>
            }
            headerCollapsible={
              <NavMenu
                items={navItems}
                activeId="home"
                sx={{ '& button': { color: 'white' } }}
              />
            }
            isHeaderTransparent
            hasHeaderBorder={false}
          >
            <Placeholder.Box
              label="Hero Section"
              sx={ {
                flex: 1,
                backgroundColor: 'grey.800',
                border: 'none',
                color: 'white',
                '& .MuiTypography-root': { color: 'white', fontSize: '1rem' },
              } }
            />
          </AppShell>
        </Box>
      </SectionContainer>
    </PageContainer>
  ),
};
