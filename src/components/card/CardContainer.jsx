import { forwardRef } from 'react';
import Box from '@mui/material/Box';

/**
 * CardContainer 컴포넌트
 *
 * 자주 사용되는 카드 스타일을 미리 정의한 래퍼 컴포넌트.
 * outlined, elevation, ghost 등 다양한 변형을 지원한다.
 *
 * 동작 방식:
 * 1. variant에 따라 미리 정의된 스타일 적용
 * 2. hover 상태에서 시각적 피드백 제공
 * 3. sx prop으로 추가 커스터마이징 가능
 * 4. onClick이 있으면 role="button" + tabIndex + Enter/Space 키보드 조작을 자동 부여
 *
 * Props:
 * @param {string} variant - 카드 스타일 ('outlined' | 'elevation' | 'ghost' | 'filled') [Optional, 기본값: 'outlined']
 * @param {string} padding - 내부 패딩 ('none' | 'sm' | 'md' | 'lg') [Optional, 기본값: 'md']
 * @param {string} radius - 모서리 둥글기 ('none' | 'sm' | 'md' | 'lg') [Optional, 기본값: 'md']
 * @param {boolean} isInteractive - 호버 효과 활성화 [Optional, 기본값: false]
 * @param {boolean} isSelected - 선택 상태 표시 [Optional, 기본값: false]
 * @param {function} onClick - 클릭 핸들러 [Optional]
 * @param {node} children - 카드 내용 [Required]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <CardContainer variant="elevation" padding="lg" isInteractive>
 *   <Typography>Card Content</Typography>
 * </CardContainer>
 */
const CardContainer = forwardRef(function CardContainer({
  variant = 'outlined',
  padding = 'md',
  radius = 'md',
  isInteractive = false,
  isSelected = false,
  onClick,
  children,
  sx,
  ...props
}, ref) {
  /**
   * 패딩 크기 맵
   */
  const paddingMap = {
    none: 0,
    sm: 2,
    md: 3,
    lg: 4,
  };

  /**
   * Border radius 맵 — mui-theme.md의 Surface Radius System에 정의된 값(0/4px/6px)만
   * 쓴다. 숫자(1/2/3)를 그대로 두면 sx borderRadius가 theme.shape.borderRadius(0)와
   * 곱해져 전부 0px로 사라지는 버그였다(디자인 시스템 감사로 발견) — 이 프로젝트에서
   * CardContainer를 실제로 쓰는 곳은 CustomCard.jsx 하나뿐이고 radius="md"(기본값)만
   * 쓰므로 sm/lg 값을 새로 확정해도 기존 화면에 영향 없음을 확인했다.
   * none=0(구조 표면 기본), sm=4px(Input/Chip 급의 가벼운 라운딩), md/lg=6px(분석
   * 단위로 스캔되는 카드 컨테이너 역할) — 역할표는 6px보다 큰 값을 정의하지 않아서
   * lg를 md보다 더 둥글게 만들지 않는다(임의의 새 px 값을 만들지 않기 위함).
   */
  const radiusMap = {
    none: 0,
    sm: '4px',
    md: '6px',
    lg: '6px',
  };

  /**
   * variant별 기본 스타일
   */
  const getVariantStyles = () => {
    const base = {
      position: 'relative',
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevation':
        // 임의 rgba 대신 테마의 승인된 shadow 토큰(customShadows)만 쓴다 — 이 시스템의
        // 다른 hover/selected 링 그림자와 달리, elevation은 border 대신 진짜 "떠
        // 있음"을 표현하는 게 목적이라 shadow 자체는 유지하되 하드코딩된 값 대신
        // 테마 토큰을 참조하도록 고쳤다(디자인 시스템 감사로 발견).
        return {
          ...base,
          backgroundColor: 'background.paper',
          boxShadow: (theme) => theme.customShadows.sm,
        };

      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
          border: 'none',
        };

      case 'filled':
        return {
          ...base,
          backgroundColor: 'surface.muted',
          border: 'none',
        };

      case 'outlined':
      default:
        return {
          ...base,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        };
    }
  };

  /**
   * 인터랙티브 스타일 (호버, 클릭)
   */
  const getInteractiveStyles = () => {
    if (!isInteractive && !onClick) return {};

    const hoverStyles = {
      // "0 0 0 1px" 링 그림자는 실질적으로 테두리를 굵게 보이게 하는 눈속임이었다
      // — 바로 위 borderColor 변경이 이미 hover 강조를 전달하므로 shadow 없이도
      // 충분하다(border만으로 위계를 만든다는 원칙, 디자인 시스템 감사로 발견).
      outlined: {
        // 선택·활성·hover 강조는 전부 accent 하나에서 나온다(팔레트 자기 선언).
        // primary.main(#0000FF)은 브랜드 색으로만 남는다.
        borderColor: 'accent.main',
      },
      // elevation 변형의 hover도 임의 rgba 대신 테마 토큰(customShadows.lg)으로
      // 한 단계 더 진하게 — base(sm)보다 무거운 승인된 tier를 쓴다.
      elevation: {
        boxShadow: (theme) => theme.customShadows.lg,
        transform: 'translateY(-2px)',
      },
      ghost: {
        backgroundColor: 'action.hover',
      },
      filled: {
        backgroundColor: 'grey.200',
      },
    };

    return {
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': hoverStyles[variant] || hoverStyles.outlined,
      '&:active': {
        transform: 'scale(0.98)',
      },
      // 포커스는 앱 공통 문법 — 1px accent 테두리 + 옅은 ring(inset).
      // 2px 순수 파랑 아웃라인은 레이아웃이 1px 흔들리고 컨트롤이 콘텐츠보다
      // 강해 보여서 폐기한 옛 패턴이다(테마 accent 주석 참고).
      '&:focus-visible': {
        outline: '1px solid',
        outlineColor: 'accent.main',
        outlineOffset: -1,
        boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
      },
    };
  };

  /**
   * onClick이 있으면 키보드로도 동작하게 한다 (Enter/Space) — 마우스 전용
   * 상호작용은 WCAG 2.1.1(Keyboard) 위반이다.
   */
  const handleKeyDown = (event) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };

  /**
   * 선택 상태 스타일
   */
  const getSelectedStyles = () => {
    if (!isSelected) return {};

    // 선택 상태는 이미 borderColor 변경 + 아래 top accent bar(::before) 두 가지로
    // 전달되고 있어서, "0 0 0 2px" 링 그림자는 순수 중복이었다(디자인 시스템
    // 감사로 발견) — 제거.
    return {
      borderColor: 'accent.main',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'accent.main',
      },
    };
  };

  return (
    <Box
      ref={ref}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        p: paddingMap[padding] ?? paddingMap.md,
        borderRadius: radiusMap[radius] ?? radiusMap.md,
        ...getVariantStyles(),
        ...getInteractiveStyles(),
        ...getSelectedStyles(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
});

export { CardContainer };
