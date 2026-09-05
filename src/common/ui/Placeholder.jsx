import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { testImages } from '../../utils/pexels-test-data';

/**
 * Placeholder 컴포넌트 시스템
 *
 * 스토리북 예제에서 실제 콘텐츠 대신 사용하는 FPO(For Position Only) 블록.
 * Semantic UI Placeholder의 조합형 서브컴포넌트 패턴을 차용.
 *
 * 동작 방식:
 * 1. 서브컴포넌트(Box, Image, Text, Line, Paragraph, Card, Media)를 조합하여 사용
 * 2. 중립적 시각 톤(grey 계열, dashed border, grayscale)으로 컴포넌트 구조에 시선 집중
 * 3. label, ratio, length 등 props로 콘텐츠 유형을 선언적으로 표현
 *
 * Example usage:
 * <Placeholder.Box label="Sidebar" height={300} />
 * <Placeholder.Image ratio="16/9" />
 * <Placeholder.Media index={0} />
 * <Placeholder.Paragraph lines={3} />
 * <Placeholder.Card ratio="4/3" lines={2} />
 */

/** 공통 라벨 스타일 */
const labelSx = {
  fontSize: '0.75rem',
  color: 'text.disabled',
  fontFamily: 'monospace',
  userSelect: 'none',
  lineHeight: 1,
};

// ============================================================
// placeholderSvg — 점 패턴 SVG data URI 생성
// ============================================================

/**
 * 점 그리드로 가상 공간을 표현하는 SVG data URI를 생성한다.
 * 다른 컴포넌트에서 <img src={placeholderSvg(800, 450)} /> 형태로 사용 가능.
 *
 * @param {number} width - SVG 폭 [Optional, 기본값: 400]
 * @param {number} height - SVG 높이 [Optional, 기본값: 300]
 * @returns {string} data:image/svg+xml data URI
 *
 * Example usage:
 * <img src={placeholderSvg(800, 450)} alt="placeholder" />
 */
function placeholderSvg(width = 400, height = 300) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect fill="#f5f5f5" width="${width}" height="${height}"/>`,
    '<defs>',
    '<pattern id="d" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">',
    '<circle cx="8" cy="8" r="1" fill="#bdbdbd"/>',
    '</pattern>',
    '</defs>',
    `<rect fill="url(#d)" width="${width}" height="${height}"/>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ============================================================
// Placeholder.Box — 범용 영역 블록
// ============================================================

/**
 * Placeholder.Box
 *
 * 레이아웃 영역을 나타내는 범용 플레이스홀더 블록.
 * 그리드 셀, 사이드바, 패널 등 공간 데모에 사용.
 *
 * Props:
 * @param {string} label - 영역 라벨 텍스트 [Optional]
 * @param {number|string} width - 폭 [Optional, 기본값: '100%']
 * @param {number|string} height - 높이 [Optional, 기본값: 120]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <Placeholder.Box label="Content Area" height={200} />
 */
function PlaceholderBox({ label, width = '100%', height = 120, sx, ...props }) {
  return (
    <Box
      sx={ {
        width,
        height,
        backgroundColor: 'grey.100',
        border: '1px dashed',
        borderColor: 'grey.300',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      } }
      { ...props }
    >
      { label && (
        <Typography sx={ labelSx }>
          { label }
        </Typography>
      ) }
    </Box>
  );
}

// ============================================================
// Placeholder.Image — 점 패턴 SVG 이미지 슬롯
// ============================================================

/**
 * Placeholder.Image
 *
 * 점 그리드 SVG로 가상 공간을 표현하는 이미지 플레이스홀더.
 * aspect-ratio로 비율을 유지하며, <img> 태그 기반이라 다른 컴포넌트에서도 동일하게 사용 가능.
 *
 * Props:
 * @param {string} ratio - 종횡비 ('16/9' | '4/3' | '1/1' | '3/4' | '9/16') [Optional, 기본값: '16/9']
 * @param {number|string} width - 폭 [Optional, 기본값: '100%']
 * @param {number|string} height - 높이 (ratio와 함께 사용 시 ratio 우선) [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <Placeholder.Image ratio="16/9" />
 * <Placeholder.Image ratio="1/1" width={120} />
 */
function PlaceholderImage({ ratio = '16/9', width = '100%', height, sx, ...props }) {
  return (
    <Box
      component="img"
      src={ placeholderSvg(400, 300) }
      alt=""
      sx={ {
        width,
        height: height || 'auto',
        aspectRatio: ratio,
        objectFit: 'cover',
        display: 'block',
        ...sx,
      } }
      { ...props }
    />
  );
}

// ============================================================
// Placeholder.Text — 텍스트 블록
// ============================================================

/** 텍스트 variant별 크기 맵 */
const textVariants = {
  heading: { height: 24, width: '60%' },
  body: { height: 14, width: '100%' },
  caption: { height: 10, width: '40%' },
};

/**
 * Placeholder.Text
 *
 * 텍스트 한 줄을 나타내는 솔리드 바 플레이스홀더.
 * heading, body, caption 등 텍스트 유형별 크기 프리셋 제공.
 *
 * Props:
 * @param {string} variant - 텍스트 유형 ('heading' | 'body' | 'caption') [Optional, 기본값: 'body']
 * @param {number|string} width - 폭 (variant 기본값 오버라이드) [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <Placeholder.Text variant="heading" />
 * <Placeholder.Text variant="body" />
 */
function PlaceholderText({ variant = 'body', width, sx, ...props }) {
  const preset = textVariants[variant] || textVariants.body;

  return (
    <Box
      sx={ {
        height: preset.height,
        width: width || preset.width,
        backgroundColor: 'grey.300',
        borderRadius: (theme) => `${theme.shape.radius.inlay}px`,
        ...sx,
      } }
      { ...props }
    />
  );
}

// ============================================================
// Placeholder.Line — 단일 라인
// ============================================================

/** 길이 프리셋 */
const lengthMap = {
  full: '100%',
  long: '85%',
  medium: '65%',
  short: '45%',
};

/**
 * Placeholder.Line
 *
 * Semantic UI Placeholder.Line과 동일한 패턴.
 * length prop으로 라인 폭을 선언적으로 제어.
 *
 * Props:
 * @param {string} length - 라인 길이 ('full' | 'long' | 'medium' | 'short') [Optional, 기본값: 'full']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <Placeholder.Line length="long" />
 */
function PlaceholderLine({ length = 'full', sx, ...props }) {
  return (
    <Box
      sx={ {
        height: 14,
        width: lengthMap[length] || length,
        backgroundColor: 'grey.300',
        borderRadius: (theme) => `${theme.shape.radius.inlay}px`,
        ...sx,
      } }
      { ...props }
    />
  );
}

// ============================================================
// Placeholder.Paragraph — 여러 줄 텍스트 블록
// ============================================================

/** 자연스러운 줄 길이 패턴 */
const linePattern = ['full', 'long', 'full', 'long', 'full'];

/**
 * Placeholder.Paragraph
 *
 * 여러 줄의 텍스트를 나타내는 플레이스홀더.
 * 마지막 줄은 자동으로 짧게 처리하여 자연스러운 문단 느낌.
 *
 * Props:
 * @param {number} lines - 줄 수 [Optional, 기본값: 3]
 * @param {number} gap - 줄 간격 (theme.spacing 단위) [Optional, 기본값: 1]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <Placeholder.Paragraph lines={4} />
 */
function PlaceholderParagraph({ lines = 3, gap = 1, sx, ...props }) {
  return (
    <Box sx={ { display: 'flex', flexDirection: 'column', gap, ...sx } } { ...props }>
      { Array.from({ length: lines }, (_, i) => {
        const isLast = i === lines - 1;
        const length = isLast ? 'medium' : linePattern[i % linePattern.length];
        return <PlaceholderLine key={ i } length={ length } />;
      }) }
    </Box>
  );
}

// ============================================================
// Placeholder.Media — 실제 이미지 기반 미디어 플레이스홀더
// ============================================================

/** 전체 이미지 풀 (카테고리 무관, 인덱스로 접근) */
const allImages = Object.values(testImages).flat();

/**
 * Placeholder.Media
 *
 * 실제 스톡 이미지를 사용하는 미디어 플레이스홀더.
 * grayscale 필터로 중립 톤을 유지하며, 이미지가 필요한 데모에 사용.
 * index로 결정적(deterministic) 이미지를 선택하여 스토리 렌더링이 안정적.
 *
 * 동작 방식:
 * 1. index로 pexels 테스트 이미지 풀에서 이미지를 선택한다
 * 2. category를 지정하면 해당 카테고리 내에서 선택한다
 * 3. grayscale(1) 필터로 무채색 톤을 유지한다
 * 4. ratio로 aspect-ratio를 제어한다
 *
 * Props:
 * @param {number} index - 이미지 인덱스 (같은 index = 같은 이미지) [Optional, 기본값: 0]
 * @param {string} category - 이미지 카테고리 ('abstract' | 'fineart' | 'illustration' | 'poster' | 'gradient' | 'photography' | 'portrait' | 'spatial') [Optional]
 * @param {string} ratio - 종횡비 ('16/9' | '4/3' | '1/1' | '3/4' | '9/16') [Optional]
 * @param {string} size - 이미지 크기 ('small' | 'medium' | 'large') [Optional, 기본값: 'medium']
 * @param {number|string} width - 폭 [Optional, 기본값: '100%']
 * @param {number|string} height - 높이 (ratio 미지정 시 사용) [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <Placeholder.Media />
 * <Placeholder.Media index={2} ratio="16/9" />
 * <Placeholder.Media category="spatial" index={1} size="large" />
 */
function PlaceholderMedia({
  index = 0,
  category,
  ratio,
  size = 'medium',
  width = '100%',
  height,
  sx,
  ...props
}) {
  const pool = category && testImages[category] ? testImages[category] : allImages;
  const safeIndex = ((index % pool.length) + pool.length) % pool.length;
  const image = pool[safeIndex];

  return (
    <Box
      component="img"
      src={ image.src[size] || image.src.medium }
      alt={ image.alt }
      sx={ {
        width,
        height: height || 'auto',
        ...(ratio && { aspectRatio: ratio }),
        objectFit: 'cover',
        display: 'block',
        filter: 'grayscale(1)',
        ...sx,
      } }
      { ...props }
    />
  );
}

// ============================================================
// Placeholder.Card — 이미지 + 텍스트 복합 블록
// ============================================================

/**
 * Placeholder.Card
 *
 * 카드형 콘텐츠를 나타내는 복합 플레이스홀더.
 * Image + Paragraph를 조합하여 한 줄로 카드 슬롯 표현.
 *
 * Props:
 * @param {string} ratio - 이미지 종횡비 [Optional, 기본값: '16/9']
 * @param {number} lines - 본문 줄 수 [Optional, 기본값: 2]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <Placeholder.Card ratio="4/3" lines={3} />
 */
function PlaceholderCard({ ratio = '16/9', lines = 2, sx, ...props }) {
  return (
    <Box
      sx={ {
        border: '1px dashed',
        borderColor: 'grey.300',
        overflow: 'hidden',
        ...sx,
      } }
      { ...props }
    >
      <PlaceholderImage ratio={ ratio } />
      <Box sx={ { p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 } }>
        <PlaceholderText variant="heading" />
        <PlaceholderParagraph lines={ lines } />
      </Box>
    </Box>
  );
}

// ============================================================
// Namespace export
// ============================================================

const Placeholder = {
  Box: PlaceholderBox,
  Image: PlaceholderImage,
  Media: PlaceholderMedia,
  Text: PlaceholderText,
  Line: PlaceholderLine,
  Paragraph: PlaceholderParagraph,
  Card: PlaceholderCard,
  svg: placeholderSvg,
};

export default Placeholder;
export {
  placeholderSvg,
  PlaceholderBox,
  PlaceholderImage,
  PlaceholderMedia,
  PlaceholderText,
  PlaceholderLine,
  PlaceholderParagraph,
  PlaceholderCard,
};
