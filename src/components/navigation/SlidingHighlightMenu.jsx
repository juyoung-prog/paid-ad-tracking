import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

/**
 * SlidingHighlightMenu - 슬라이딩 하이라이트 메뉴
 *
 * 여러 개의 액션/네비게이션 아이템을 담는 시리즈 컨테이너.
 * hover 시 배경/언더라인 인디케이터가 아이템 간 부드럽게 이동한다.
 * 각 아이템은 독립적인 onClick 핸들러를 가진다 (선택 상태 없음).
 *
 * 동작 원리:
 * 1. 아이템에 마우스를 올리면 hoveredId가 업데이트된다
 * 2. 해당 아이템 내부에 motion.span(layoutId)이 렌더된다
 * 3. Framer Motion이 이전 위치 → 새 위치로 spring 애니메이션을 실행한다
 * 4. 마우스가 컨테이너를 벗어나면 AnimatePresence로 인디케이터가 fade out된다
 *
 * Props:
 * @param {Array} items - 아이템 목록 [{ id, label, onClick }] [Required]
 * @param {string} indicator - 인디케이터 스타일 ('background' | 'underline') [Optional, 기본값: 'background']
 * @param {string} direction - 메뉴 방향 ('horizontal' | 'vertical') [Optional, 기본값: 'horizontal']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <SlidingHighlightMenu
 *   items={[
 *     { id: 'about', label: 'About', onClick: () => navigate('/about') },
 *     { id: 'work', label: 'Work', onClick: () => navigate('/work') },
 *   ]}
 * />
 */
function SlidingHighlightMenu({
  items = [],
  indicator = 'background',
  direction = 'horizontal',
  sx,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  const isVertical = direction === 'vertical';
  const isUnderline = indicator === 'underline';

  return (
    <Box
      sx={ {
        display: 'inline-flex',
        flexDirection: isVertical ? 'column' : 'row',
        position: 'relative',
        gap: isVertical ? 0 : 0.5,
        ...(isUnderline && !isVertical && {
          borderBottom: '1px solid',
          borderColor: 'divider',
        }),
        ...(isUnderline && isVertical && {
          borderRight: '1px solid',
          borderColor: 'divider',
        }),
        ...sx,
      } }
      onMouseLeave={ () => setHoveredId(null) }
    >
      { items.map((item) => (
        <Box
          key={ item.id }
          component="button"
          onClick={ item.onClick }
          onMouseEnter={ () => setHoveredId(item.id) }
          sx={ {
            position: 'relative',
            px: 2,
            py: 1,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: 'transparent',
            zIndex: 1,
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: -2,
            },
          } }
        >
          {/* Hover 인디케이터 — layoutId가 아이템 간 위치 전환을 자동 애니메이션 */}
          { hoveredId === item.id && (
            <motion.div
              layoutId="hover-highlight"
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              transition={ { type: 'spring', stiffness: 500, damping: 35, opacity: { duration: 0.15 } } }
              style={ isUnderline
                ? {
                  position: 'absolute',
                  ...(isVertical
                    ? { right: -1, top: 0, width: 2, height: '100%' }
                    : { bottom: -1, left: 0, width: '100%', height: 2 }
                  ),
                  backgroundColor: '#000',
                }
                : {
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  borderRadius: '4px',
                }
              }
            />
          ) }

          {/* 라벨 */}
          <Typography
            variant="body2"
            sx={ {
              position: 'relative',
              zIndex: 1,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            } }
          >
            { item.label }
          </Typography>
        </Box>
      )) }
    </Box>
  );
}

export { SlidingHighlightMenu };
