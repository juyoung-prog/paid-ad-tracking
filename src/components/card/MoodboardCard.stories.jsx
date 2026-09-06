import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Masonry from '@mui/lab/Masonry';
import { MoodboardCard } from './MoodboardCard';
import Placeholder, { placeholderSvg } from '../../common/ui/Placeholder';

// 테스트용 에셋 데이터 생성 (Placeholder SVG 사용)
const createMockAssets = (category, count = 4) => {
  const labels = {
    abstract: ['Abstract Flow', 'Geometric Pattern', 'Color Study', 'Form Exploration', 'Shape Play', 'Texture Map', 'Wave Motion', 'Grid System'],
    fineart: ['Oil Canvas', 'Brushwork Study', 'Color Palette', 'Gallery Piece', 'Impressionist', 'Still Life', 'Landscape', 'Portrait Study'],
    illustration: ['Digital Art', 'Vector Scene', 'Character Design', 'Icon Set', 'Infographic', 'Editorial Art', 'Book Cover', 'Poster Design'],
    photography: ['Product Shot', 'Still Life', 'Editorial', 'Documentary', 'Landscape', 'Architecture', 'Street Photo', 'Nature'],
    portrait: ['Fashion Portrait', 'Studio Shot', 'Environmental', 'Candid Moment', 'Editorial Look', 'Close-up', 'Full Body', 'Profile'],
    poster: ['Typographic', 'Event Poster', 'Brand Visual', 'Film Poster', 'Concert Art', 'Minimal Poster', 'Retro Style', 'Modern Design'],
  };
  const categoryLabels = labels[category] || labels.abstract;
  return Array.from({ length: count }, (_, index) => ({
    id: `asset-${category}-${index}`,
    title: categoryLabels[index % categoryLabels.length],
    thumbnail: placeholderSvg(320, 320),
    src: {
      small: placeholderSvg(160, 160),
      medium: placeholderSvg(320, 320),
      large: placeholderSvg(640, 640),
    },
  }));
};

// 샘플 무드보드 데이터
const sampleMoodboards = [
  {
    id: 'board-1',
    name: 'Abstract Art',
    description: 'Abstract and geometric artwork collection for brand exploration',
    items: createMockAssets('abstract', 4),
    createdAt: '2024-10-15',
  },
  {
    id: 'board-2',
    name: 'Fine Art',
    description: 'Paintings and canvas artwork',
    items: createMockAssets('fineart', 4),
    createdAt: '2024-10-10',
  },
  {
    id: 'board-3',
    name: 'Illustration',
    description: 'Digital illustration and artwork for UI design inspiration',
    items: createMockAssets('illustration', 4),
    createdAt: '2024-09-28',
  },
  {
    id: 'board-4',
    name: 'Photography',
    description: 'Product and editorial photography',
    items: createMockAssets('photography', 4),
    createdAt: '2024-09-15',
  },
  {
    id: 'board-5',
    name: 'Portrait',
    description: 'Fashion and artistic portraits',
    items: createMockAssets('portrait', 4),
    createdAt: '2024-09-01',
  },
];

export default {
  title: 'Component/3. Card/MoodboardCard',
  component: MoodboardCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## MoodboardCard

무드보드 컬렉션을 표시하는 카드 컴포넌트입니다.

### ImageCard와의 차이점

| 요소 | ImageCard | MoodboardCard |
|------|-----------|---------------|
| **썸네일** | 단일 이미지 | 2×2 그리드 (4개 이미지) |
| **타이틀** | body2 (14px) | subtitle1 (16px), bold |
| **메타데이터** | 태그 칩 | 설명, 아이템 수, 생성일 |

### 주요 기능
- **2×2 썸네일 그리드**: 기본 상태에서 컬렉션 미리보기
- **Hover 이미지 순환**: 마우스 hover 시 0.3초 간격으로 이미지가 fade 트랜지션
- **반응형 메타데이터**: 이름, 설명, 아이템 수, 생성일
- **Hover 인터랙션**: 편집/삭제 버튼 표시
- **빈 상태 처리**: 이미지가 없을 때 placeholder 표시
        `,
      },
    },
  },
  argTypes: {
    name: {
      control: 'text',
      description: '무드보드 이름',
      table: {
        type: { summary: 'string' },
      },
    },
    description: {
      control: 'text',
      description: '무드보드 설명 (최대 2줄 표시)',
      table: {
        type: { summary: 'string' },
      },
    },
    items: {
      control: 'object',
      description: '무드보드 내 아이템 배열 (thumbnail 필드 필요)',
      table: {
        type: { summary: 'Array<{id, title, thumbnail}>' },
      },
    },
    createdAt: {
      control: 'text',
      description: '생성 날짜 (YYYY-MM-DD 형식)',
      table: {
        type: { summary: 'string' },
      },
    },
    onClick: {
      action: 'clicked',
      description: '카드 클릭 핸들러',
      table: {
        type: { summary: 'function' },
      },
    },
    onEdit: {
      action: 'edit',
      description: '편집 버튼 클릭 핸들러',
      table: {
        type: { summary: 'function' },
      },
    },
    onDelete: {
      action: 'delete',
      description: '삭제 버튼 클릭 핸들러',
      table: {
        type: { summary: 'function' },
      },
    },
  },
};

/** 기본 MoodboardCard */
export const Default = {
  args: {
    id: 'board-1',
    name: 'Abstract Art',
    description: 'Abstract and geometric artwork collection for brand exploration',
    items: createMockAssets('abstract', 4),
    createdAt: '2024-10-15',
  },
  render: (args) => (
    <Box sx={ { width: 280 } }>
      <MoodboardCard { ...args } />
    </Box>
  ),
};

/** 이미지 개수별 상태 */
export const ItemCounts = {
  render: () => (
    <Box sx={ { display: 'flex', gap: 3, flexWrap: 'wrap' } }>
      { [4, 3, 2, 1, 0].map((count) => (
        <Box key={ count } sx={ { width: 240 } }>
          <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
            { count } items
          </Typography>
          <MoodboardCard
            id={ `board-${count}` }
            name={ count === 0 ? 'Empty Board' : `${count} Images` }
            description={ count === 0 ? 'Start adding images to this board' : 'Sample description text' }
            items={ createMockAssets('abstract', count) }
            createdAt="2024-10-15"
            onEdit={ () => {} }
            onDelete={ () => {} }
          />
        </Box>
      )) }
    </Box>
  ),
};

/** 긴 텍스트 처리 */
export const LongText = {
  render: () => (
    <Box sx={ { display: 'flex', gap: 3 } }>
      <Box sx={ { width: 280 } }>
        <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
          긴 제목
        </Typography>
        <MoodboardCard
          id="board-long-title"
          name="This is a very long moodboard name that should be truncated with ellipsis"
          description="Short description"
          items={ createMockAssets('fineart', 4) }
          createdAt="2024-10-15"
          onEdit={ () => {} }
        />
      </Box>
      <Box sx={ { width: 280 } }>
        <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
          긴 설명
        </Typography>
        <MoodboardCard
          id="board-long-desc"
          name="Fine Art Collection"
          description="This is a very long description that spans multiple lines and should be clamped at two lines with an ellipsis at the end to maintain visual consistency across all cards in the grid layout."
          items={ createMockAssets('fineart', 4) }
          createdAt="2024-10-15"
          onEdit={ () => {} }
        />
      </Box>
    </Box>
  ),
};

/** Masonry 그리드 레이아웃 */
export const MasonryGrid = {
  render: () => (
    <Box sx={ { width: '100%', maxWidth: 1200 } }>
      <Typography variant="h6" sx={ { fontWeight: 700, mb: 3 } }>
        Moodboards
      </Typography>
      <Masonry columns={ { xs: 1, sm: 2, md: 3, lg: 4 } } spacing={ 2 }>
        { sampleMoodboards.map((board) => (
          <MoodboardCard
            key={ board.id }
            { ...board }
            onClick={ () => console.log('Navigate to:', board.id) }
            onEdit={ (id) => console.log('Edit:', id) }
            onDelete={ (id) => console.log('Delete:', id) }
          />
        )) }
      </Masonry>
    </Box>
  ),
  parameters: {
    layout: 'padded',
  },
};

/** Grid 레이아웃 (균등 높이) */
export const GridLayout = {
  render: () => (
    <Box sx={ { width: '100%', maxWidth: 1200 } }>
      <Typography variant="h6" sx={ { fontWeight: 700, mb: 3 } }>
        Moodboards (Grid Layout)
      </Typography>
      <Grid container spacing={ 2 }>
        { sampleMoodboards.map((board) => (
          <Grid key={ board.id } size={ { xs: 12, sm: 6, md: 4, lg: 3 } }>
            <MoodboardCard
              { ...board }
              onClick={ () => console.log('Navigate to:', board.id) }
              onEdit={ (id) => console.log('Edit:', id) }
            />
          </Grid>
        )) }
      </Grid>
    </Box>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * 액션 버튼 없음 (읽기 전용)
 *
 * 파일 최상단 argTypes의 action 스파이가 모든 스토리에 onEdit/onDelete를 주입하므로,
 * 여기서 명시적으로 undefined를 덮어써야 hover 시 편집·삭제 버튼이 뜨지 않는다.
 */
export const ReadOnly = {
  args: {
    id: 'board-readonly',
    name: 'Read Only Board',
    description: 'This board has no edit or delete actions',
    items: createMockAssets('poster', 4),
    createdAt: '2024-10-15',
  },
  render: (args) => (
    <Box sx={ { width: 280 } }>
      <MoodboardCard { ...args } onEdit={ undefined } onDelete={ undefined } />
    </Box>
  ),
};

/** Hover 이미지 순환 (많은 이미지) */
export const HoverTransition = {
  render: () => (
    <Box sx={ { display: 'flex', gap: 3 } }>
      <Box sx={ { width: 280 } }>
        <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
          8개 이미지 (Hover하여 순환 확인)
        </Typography>
        <MoodboardCard
          id="board-many"
          name="Many Images"
          description="Hover to see images cycle through with fade transition"
          items={ [
            ...createMockAssets('abstract', 4),
            ...createMockAssets('fineart', 4),
          ] }
          createdAt="2024-10-15"
          onEdit={ () => {} }
        />
      </Box>
      <Box sx={ { width: 280 } }>
        <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
          1개 이미지 (순환 없음)
        </Typography>
        <MoodboardCard
          id="board-single"
          name="Single Image"
          description="Only one image, no cycling on hover"
          items={ createMockAssets('photography', 1) }
          createdAt="2024-10-15"
          onEdit={ () => {} }
        />
      </Box>
    </Box>
  ),
};
