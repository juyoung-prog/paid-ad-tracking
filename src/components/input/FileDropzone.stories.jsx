import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FileDropzone } from './FileDropzone';
import Placeholder, { placeholderSvg } from '../../common/ui/Placeholder';

export default {
  title: 'Component/7. Input & Control/FileDropzone',
  component: FileDropzone,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## FileDropzone

드래그 앤 드롭 파일 업로드 영역 컴포넌트.

### 기능
- 드래그 앤 드롭 파일 선택
- default, compact, minimal 변형 지원
- 파일 미리보기 및 업로드 진행률 표시
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'minimal'],
      description: '스타일 변형',
    },
    accept: {
      control: 'text',
      description: '허용 파일 형식 (input의 accept 속성)',
    },
    maxSize: {
      control: { type: 'number' },
      description: '최대 파일 크기(bytes). 초과하면 파일을 넘기지 않고 에러 메시지를 띄운다',
    },
    selectedFile: { control: false, description: '현재 선택된 File 객체 (이름·크기 표시에 사용)' },
    previewUrl: { control: 'text', description: '선택된 파일의 미리보기 이미지 URL' },
    isUploading: { control: 'boolean', description: '업로드 중 상태 (진행률 바 표시)' },
    uploadProgress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '업로드 진행률 (0-100)',
    },
    isComplete: { control: 'boolean', description: '업로드 완료 상태 (완료 아이콘 표시)' },
    onFileSelect: { action: 'fileSelected', description: '파일 선택 핸들러 (file) => void' },
    onFileRemove: { action: 'fileRemoved', description: '파일 제거 핸들러' },
  },
};

/**
 * FileDropzone 기본 사용 예시
 */
export const Default = {
  render: () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleSelect = (selectedFile) => {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
      }
    };

    const handleRemove = () => {
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    };

    return (
      <Box sx={ { maxWidth: 400 } }>
        <FileDropzone
          onFileSelect={ handleSelect }
          onFileRemove={ handleRemove }
          selectedFile={ file }
          previewUrl={ preview }
        />
      </Box>
    );
  },
};

/**
 * FileDropzone 변형
 */
export const Variants = {
  render: () => (
    <Box sx={ { display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 } }>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
          Default
        </Typography>
        <FileDropzone onFileSelect={ (f) => console.log(f) } variant="default" />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
          Compact
        </Typography>
        <FileDropzone onFileSelect={ (f) => console.log(f) } variant="compact" />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={ { mb: 1, display: 'block' } }>
          Minimal
        </Typography>
        <FileDropzone onFileSelect={ (f) => console.log(f) } variant="minimal" />
      </Box>
    </Box>
  ),
};

/**
 * FileDropzone 업로드 상태
 */
export const Uploading = {
  render: () => (
    <Box sx={ { maxWidth: 400 } }>
      <Typography variant="subtitle2" sx={ { mb: 2, fontWeight: 600 } }>
        Uploading State
      </Typography>
      <FileDropzone
        onFileSelect={ () => {} }
        selectedFile={ { name: 'sample-image.jpg', size: 2500000 } }
        previewUrl={ placeholderSvg(600, 400) }
        isUploading
        uploadProgress={ 65 }
      />
    </Box>
  ),
};
