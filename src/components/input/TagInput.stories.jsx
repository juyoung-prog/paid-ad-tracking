import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TagInput } from './TagInput';

export default {
  title: 'Component/7. Input & Control/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## TagInput

태그 입력 및 관리 필드 컴포넌트.

### 기능
- 태그 추가/삭제
- 최대 태그 수 제한
- 자동완성 제안 지원
        `,
      },
    },
  },
  argTypes: {
    tags: { control: 'object', description: '현재 태그 목록 (string 배열)' },
    label: { control: 'text', description: '입력 필드 위에 표시할 레이블' },
    placeholder: { control: 'text', description: '입력 플레이스홀더' },
    maxTags: {
      control: { type: 'number', min: 1, max: 20 },
      description: '최대 태그 개수. 도달하면 더 이상 추가되지 않는다',
    },
    suggestions: {
      control: 'object',
      description: '자동완성 제안 목록 (string 배열). 입력 중 일치하는 항목이 아래에 뜬다',
    },
    variant: {
      control: 'select',
      options: ['outlined', 'filled'],
      description: '스타일 변형',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: '크기 (최소 높이·칩 크기·글자 크기가 함께 바뀐다)',
    },
    chipColor: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: '태그 칩에 전달할 MUI Chip color',
    },
    isDisabled: { control: 'boolean', description: '비활성화 상태' },
    onChange: { action: 'changed', description: '태그 변경 핸들러 (tags[]) => void' },
  },
};

/**
 * TagInput 기본 사용 예시
 */
export const Default = {
  render: () => {
    const [tags, setTags] = useState(['minimal', 'dark']);

    return (
      <Box sx={{ maxWidth: 400 }}>
        <TagInput
          tags={tags}
          onChange={setTags}
          placeholder="Add tags..."
          maxTags={8}
          label="Style Keywords"
        />
      </Box>
    );
  },
};

/**
 * TagInput with Suggestions
 */
export const WithSuggestions = {
  render: () => {
    const [tags, setTags] = useState([]);
    const suggestions = ['minimal', 'bold', 'colorful', 'dark', 'light', 'retro', 'modern', 'organic', 'geometric', 'playful'];

    return (
      <Box sx={{ maxWidth: 400 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          TagInput with Suggestions
        </Typography>
        <TagInput
          tags={tags}
          onChange={setTags}
          placeholder="Type to see suggestions..."
          suggestions={suggestions}
          maxTags={5}
        />
      </Box>
    );
  },
};
