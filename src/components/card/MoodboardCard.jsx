import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CollectionsIcon from '@mui/icons-material/Collections';
import { CustomCard } from './CustomCard';
import { ImageTransition } from '../media/ImageTransition';

/**
 * MoodboardCard 컴포넌트
 *
 * 무드보드 컬렉션을 표시하는 카드. CustomCard를 확장하여 구현.
 * 2×2 썸네일 그리드로 컬렉션 미리보기를 제공하고,
 * 무드보드의 메타데이터(이름, 설명, 아이템 수, 생성일)를 표시.
 *
 * 동작 방식:
 * 1. 기본 상태: items 배열의 처음 4개 이미지를 2×2 그리드로 표시
 * 2. 이미지가 4개 미만일 경우: 빈 슬롯은 회색 배경으로 표시
 * 3. 이미지가 0개일 경우: 전체 placeholder 아이콘 표시
 * 4. Hover 시: 0.3초 간격으로 이미지가 하나씩 fade 트랜지션되며 순환
 * 5. Hover 해제 시: 2×2 그리드로 복귀
 *
 * Props:
 * @param {string} id - 무드보드 ID [Required]
 * @param {string} name - 무드보드 이름 [Required]
 * @param {string} description - 무드보드 설명 [Optional]
 * @param {Array} items - 무드보드 내 아이템 배열 [Required]
 * @param {string} createdAt - 생성 날짜 (YYYY-MM-DD) [Optional]
 * @param {function} onClick - 카드 클릭 핸들러 [Optional]
 * @param {function} onEdit - 편집 버튼 핸들러 [Optional]
 * @param {function} onDelete - 삭제 버튼 핸들러 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <MoodboardCard
 *   id="board-1"
 *   name="Abstract Art"
 *   description="Abstract and geometric artwork collection"
 *   items={moodboard.items}
 *   createdAt="2024-10-15"
 *   onClick={() => navigate(`/moodboards/${id}`)}
 *   onEdit={() => handleEdit(id)}
 * />
 */
export function MoodboardCard({
  id,
  name,
  description,
  items = [],
  createdAt,
  onClick,
  onEdit,
  onDelete,
  sx,
  ...props
}) {
  // ============================================
  // 상태 관리
  // ============================================
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef(null);

  // 썸네일에 표시할 이미지 (최대 4개)
  const thumbnailImages = items.slice(0, 4);
  const itemCount = items.length;

  /**
   * Hover 시 자동 이미지 순환
   * - 마우스 진입: 0.3초 간격으로 이미지 인덱스 증가
   * - 마우스 이탈: interval 정리 및 인덱스 초기화
   */
  useEffect(() => {
    if (isHovered && items.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % items.length);
      }, 300);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHovered, items.length]);

  /**
   * 마우스 이벤트 핸들러
   */
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveIndex(0);
  };

  /**
   * ImageTransition용 이미지 배열 생성
   */
  const transitionImages = items.map((item) => ({
    src: item.thumbnail || item.src?.medium || item.src,
    alt: item.title || 'Moodboard image',
  }));

  /**
   * 날짜 포맷팅 (YYYY-MM-DD → MMM DD, YYYY)
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * 미디어 슬롯 렌더링
   * - 기본 상태: 2×2 썸네일 그리드
   * - Hover 상태: ImageTransition으로 단일 이미지 순환
   * - 이미지 없음: placeholder 아이콘 표시
   */
  const renderMediaSlot = () => {
    // 이미지가 없는 경우: placeholder
    if (items.length === 0) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100',
            color: 'grey.400',
          }}
        >
          <CollectionsIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="caption" color="inherit">
            No images yet
          </Typography>
        </Box>
      );
    }

    // Hover 상태: ImageTransition으로 이미지 순환
    if (isHovered && items.length > 1) {
      return (
        <ImageTransition
          images={transitionImages}
          activeIndex={activeIndex}
          transition="fade"
          duration={300}
          aspectRatio="1/1"
          objectFit="cover"
          sx={{
            width: '100%',
            height: '100%',
          }}
        />
      );
    }

    // 기본 상태: 2×2 썸네일 그리드
    return (
      <Box
        className="thumbnail-grid"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '2px',
          width: '100%',
          height: '100%',
          backgroundColor: 'grey.200',
          transition: 'transform 0.3s ease',
        }}
      >
        {[...Array(4)].map((_, index) => {
          const image = thumbnailImages[index];
          return (
            <Box
              key={index}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'grey.100',
              }}
            >
              {image ? (
                <Box
                  component="img"
                  src={image.thumbnail || image.src?.medium}
                  alt={image.title || `Image ${index + 1}`}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'grey.100',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  /**
   * 오버레이 슬롯 (액션 버튼 + 아이템 수 배지)
   * - 액션 버튼: Hover 시에만 표시
   * - 아이템 수 배지: 항상 표시
   */
  const OverlayContent = (
    <>
      {/* 액션 버튼 (Hover 시 표시) */}
      <Box
        className="moodboard-actions"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        {onEdit && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            sx={{
              bgcolor: 'background.paper',
              // 임의 shadow 대신 border로 사진 배경과의 경계를 준다 — bgcolor가
              // 이미 불투명(paper)이라 shadow 없이도 아래 이미지와 확실히
              // 구분된다(디자인 시스템 감사로 발견).
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'white' },
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        {onDelete && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            sx={{
              bgcolor: 'background.paper',
              // 임의 shadow 대신 border로 사진 배경과의 경계를 준다 — bgcolor가
              // 이미 불투명(paper)이라 shadow 없이도 아래 이미지와 확실히
              // 구분된다(디자인 시스템 감사로 발견).
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'white',
              },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* 아이템 수 배지 */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          px: 1.5,
          py: 0.5,
          borderRadius: (theme) => `${theme.shape.radius.control}px`,
          bgcolor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        >
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Typography>
      </Box>
    </>
  );

  return (
    <CustomCard
      layout="vertical"
      mediaSlot={renderMediaSlot()}
      mediaRatio="1/1"
      contentPadding="md"
      overlaySlot={OverlayContent}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        // CustomCard(내부적으로 CardContainer variant="outlined")가 이미 주는
        // 기본 테두리를 border:'none'으로 지워버리고 shadow+lift로만 hover를
        // 표현했었다 — border를 되살리고 hover에선 색만 진하게 바꿔서
        // (translateY+shadow 없이) border만으로 위계를 만든다(디자인 시스템
        // 감사로 발견).
        // 강조색은 accent 하나로(팔레트 자기 선언).
        // @media (hover:hover) 가드는 여기 걸지 않는다 — 이 hover 블록은 색만
        // 바꾸는 게 아니라 액션 버튼 노출(opacity 0→1)까지 겸하고 있어서,
        // 가드를 씌우면 터치 기기에서 버튼에 영영 접근할 수 없게 된다.
        // (터치의 hover 잔상은 색이 남는 정도라 접근 불가보다 가볍다.)
        '&:hover': {
          borderColor: 'accent.main',
          '& .moodboard-actions': {
            opacity: 1,
          },
        },
        ...sx,
      }}
      {...props}
    >
      {/* 타이틀 */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mb: description ? 0.5 : 0,
        }}
      >
        {name}
      </Typography>

      {/* 설명 */}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
            mb: 1.5,
          }}
        >
          {description}
        </Typography>
      )}

      {/* 메타데이터 */}
      {createdAt && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            fontSize: '0.75rem',
          }}
        >
          Created {formatDate(createdAt)}
        </Typography>
      )}
    </CustomCard>
  );
}

export default MoodboardCard;
