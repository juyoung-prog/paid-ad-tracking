import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import WorkIcon from '@mui/icons-material/Work';
import MailIcon from '@mui/icons-material/Mail';
import { NavMenu } from './NavMenu';
import { DocumentTitle, PageContainer } from '../storybookDocumentation';
import { SectionContainer } from '../container/SectionContainer';

// Navigation Items
const navItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'about', label: 'About', icon: <InfoIcon /> },
  { id: 'work', label: 'Work', icon: <WorkIcon /> },
  { id: 'contact', label: 'Contact', icon: <MailIcon /> },
];

/**
 * Story Component: Interactive Demo
 */
function InteractiveDemo() {
  const [activeId, setActiveId] = useState('home');

  return (
    <PageContainer>
      <DocumentTitle
        title="NavMenu - Interactive"
        status="Ready"
        note="Click to change active state"
        brandName="Navigation"
        systemName="NavMenu"
        version="1.0"
      />
      <SectionContainer>
        <NavMenu
          items={navItems}
          activeId={activeId}
          variant="underline"
          onItemClick={(item) => setActiveId(item.id)}
        />
        <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
          Active: {activeId}
        </Typography>
      </SectionContainer>
    </PageContainer>
  );
}

/**
 * Story Component: Variants Demo
 */
function VariantsDemo() {
  const [activeId, setActiveId] = useState('home');

  return (
    <PageContainer>
      <DocumentTitle
        title="NavMenu - Variants"
        status="Ready"
        note="Different style variants"
        brandName="Navigation"
        systemName="NavMenu"
        version="1.0"
      />
      <SectionContainer>
        <Stack spacing={4}>
          {['default', 'pills', 'underline'].map((variant) => (
            <Box key={variant}>
              <Typography
                variant="caption"
                sx={{ mb: 1.5, display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}
              >
                {variant}
              </Typography>
              <NavMenu
                items={navItems}
                activeId={activeId}
                variant={variant}
                onItemClick={(item) => setActiveId(item.id)}
              />
            </Box>
          ))}
        </Stack>
      </SectionContainer>
    </PageContainer>
  );
}

/**
 * Story Component: Vertical Demo
 */
function VerticalDemo() {
  const [activeId, setActiveId] = useState('home');

  const items = [
    ...navItems,
    { id: 'disabled', label: 'Disabled Item', icon: <MailIcon />, disabled: true },
  ];

  return (
    <PageContainer>
      <DocumentTitle
        title="NavMenu - Vertical"
        status="Ready"
        note="Sidebar navigation style"
        brandName="Navigation"
        systemName="NavMenu"
        version="1.0"
      />
      <SectionContainer>
        <Box sx={{ maxWidth: 280 }}>
          <NavMenu
            items={items}
            activeId={activeId}
            orientation="vertical"
            variant="default"
            onItemClick={(item) => setActiveId(item.id)}
          />
        </Box>
      </SectionContainer>
    </PageContainer>
  );
}

export default {
  title: 'Component/10. Navigation/NavMenu',
  component: NavMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    items: {
      control: 'object',
      description: '메뉴 아이템 배열 [{ id, label, icon, href, disabled }]',
    },
    activeId: { control: 'text', description: '현재 활성 아이템의 id' },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
      description: '배치 방향',
    },
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline'],
      description: '활성 아이템 표시 방식',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '크기 (여백·글자 크기·아이콘 크기가 함께 바뀐다)',
    },
    isIconOnly: { control: 'boolean', description: '라벨 없이 아이콘만 표시' },
    hasIconStart: { control: 'boolean', description: '아이콘을 텍스트 앞에 배치' },
    onItemClick: { action: 'itemClicked', description: '아이템 클릭 핸들러 (item) => void' },
  },
};

/**
 * Default horizontal menu
 */
export const Default = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="NavMenu"
        status="Ready"
        note="Navigation menu component for headers and sidebars"
        brandName="Navigation"
        systemName="NavMenu"
        version="1.0"
      />
      <SectionContainer>
        <NavMenu
          items={navItems}
          activeId="home"
          variant="underline"
        />
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * Interactive menu
 */
export const Interactive = {
  render: () => <InteractiveDemo />,
};

/**
 * Style variants
 */
export const Variants = {
  render: () => <VariantsDemo />,
};

/**
 * Vertical orientation (sidebar)
 */
export const Vertical = {
  render: () => <VerticalDemo />,
};

/**
 * Icon only mode
 */
export const IconOnly = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="NavMenu - Icon Only"
        status="Ready"
        note="Compact icon-only navigation"
        brandName="Navigation"
        systemName="NavMenu"
        version="1.0"
      />
      <SectionContainer>
        <NavMenu
          items={navItems}
          activeId="home"
          isIconOnly
          variant="pills"
        />
      </SectionContainer>
    </PageContainer>
  ),
};

/**
 * Size comparison
 */
export const Sizes = {
  render: () => (
    <PageContainer>
      <DocumentTitle
        title="NavMenu - Sizes"
        status="Ready"
        note="Size comparison: sm, md, lg"
        brandName="Navigation"
        systemName="NavMenu"
        version="1.0"
      />
      <SectionContainer>
        <Stack spacing={4}>
          {['sm', 'md', 'lg'].map((size) => (
            <Box key={size}>
              <Typography
                variant="caption"
                sx={{ mb: 1, display: 'block', color: 'text.secondary' }}
              >
                {size.toUpperCase()}
              </Typography>
              <NavMenu
                items={navItems}
                activeId="home"
                size={size}
                variant="pills"
              />
            </Box>
          ))}
        </Stack>
      </SectionContainer>
    </PageContainer>
  ),
};
