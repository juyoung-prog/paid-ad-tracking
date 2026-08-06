import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { CustomCard } from './CustomCard';

/**
 * ImageCard 컴포넌트
 *
 * 메인 그리드의 기본 아이템. CustomCard를 확장하여 구현.
 * Hover 시 위치 변경 효과와 액션 버튼 표시.
 *
 * 동작 방식:
 * 1. 사용자가 카드에 마우스를 올리면 카드가 위로 살짝 이동
 * 2. Hover 상태에서 우측 상단에 좋아요 버튼 표시
 * 3. 카드 하단에 제목과 태그 정보 항상 표시
 *
 * Props:
 * @param {string} src - 이미지 URL [Required]
 * @param {string} title - 이미지 제목/설명 [Optional]
 * @param {string[]} tags - 관련 태그 목록 [Optional]
 * @param {function} onLike - 좋아요 버튼 클릭 핸들러 [Optional]
 * @param {boolean} hideActions - 기본 액션 버튼 숨김 여부 [Optional, 기본값: false]
 * @param {node} customOverlay - 커스텀 오버레이 요소 (hideActions와 함께 사용) [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <ImageCard
 *   src="/image.jpg"
 *   title="Beautiful landscape"
 *   tags={['nature', 'landscape']}
 *   onLike={() => handleLike()}
 * />
 *
 * // 커스텀 오버레이 사용
 * <ImageCard
 *   src="/image.jpg"
 *   hideActions
 *   customOverlay={<MyCustomButtons />}
 * />
 */
export function ImageCard({
  src,
  title,
  tags = [],
  onLike,
  hideActions = false,
  customOverlay,
  sx,
  ...props
}) {
  /**
   * 액션 버튼 오버레이
   * - Hover 시에만 표시 (opacity 트랜지션)
   * - 좋아요 버튼 제공
   */
  const ActionButtons = (
    <Box
      className="action-buttons"
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        gap: 0.5,
        opacity: 0,
        transition: 'opacity 0.2s',
      }}
    >
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onLike?.();
        }}
        sx={{
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.customShadows.sm,
          '&:hover': { bgcolor: 'white' },
        }}
      >
        <FavoriteBorderIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  // 제목이나 태그가 있는지 확인
  const hasContent = title || tags.length > 0;

  return (
    <CustomCard
      layout="vertical"
      mediaSrc={src}
      mediaAlt={title || 'Image asset'}
      mediaRatio="auto"
      contentPadding={hasContent ? 'sm' : 'none'}
      overlaySlot={hideActions ? customOverlay : ActionButtons}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          '& .action-buttons': {
            opacity: 1,
          },
        },
        // CustomCard 기본 border 제거 (기존 ImageCard 스타일 유지)
        border: 'none',
        ...sx,
      }}
      {...props}
    >
      {hasContent && (
        <>
          {/* 제목 */}
          {title && (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Typography>
          )}
          {/* 태그 */}
          {tags.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mt: title ? 0.5 : 0,
              }}
            >
              {tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                  }}
                />
              ))}
            </Box>
          )}
        </>
      )}
    </CustomCard>
  );
}
