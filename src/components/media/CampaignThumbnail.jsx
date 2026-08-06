import { useState } from 'react';
import Box from '@mui/material/Box';
import { PLATFORM } from '../../data/schema';

/** 접근성 이름용 표기 — 원본 값('tiktok')을 그대로 읽히면 브랜드 표기와 어긋난다. */
const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * CampaignThumbnail 컴포넌트
 *
 * 캠페인 소재 미리보기 썸네일. thumbnailUrl이 있으면 실제 이미지를,
 * 없거나 로드에 실패하면 중립 배경 + 캠페인명 이니셜로 대체한다 —
 * 광고 목록에서 캠페인을 시각적으로 구분하는 데 항상 뭔가가 보여야 하므로
 * (사용자가 URL을 입력하지 않은 새 캠페인도 예외 없이) 대체 표시는 선택이
 * 아니라 항상 렌더링되는 fallback이다.
 *
 * 대체 표시는 한때 플랫폼 원색(Meta=primary #0000FF, TikTok=secondary)으로
 * 채웠는데 중립 톤으로 바꿨다. 두 가지 이유다 — (1) 이건 이미지가 없을 때 뜨는
 * 자리표시자인데 채도 100% 파랑이 깔리면 목록에서 가장 강한 요소가 된다("컨트롤이
 * 목록보다 강하면 안 된다"는 테마 원칙이 자리표시자에도 그대로 적용된다),
 * (2) 플랫폼은 바로 옆 Platform 컬럼이 글자로 이미 말하고 있어서 색으로 또
 * 인코딩할 이유가 없다. platform prop은 색이 아니라 접근성 이름에 쓴다 —
 * 스크린리더는 옆 컬럼을 함께 읽어주지 않기 때문이다.
 *
 * Props:
 * @param {string|null} thumbnailUrl - 소재 미리보기 이미지 URL [Optional]
 * @param {string} name - 캠페인명 (대체 표시 이니셜/alt 텍스트 생성에 사용) [Required]
 * @param {string} platform - PLATFORM.META | PLATFORM.TIKTOK. 대체 표시의 접근성 이름에 포함된다 [Optional]
 * @param {number} size - 세로 길이(px). Meta/TikTok 캠페인 소재는 대부분 Reels/Stories(9:16 세로형)라
 *   정사각형이 아니라 9:16 세로 비율로 렌더링한다 — 가로폭은 이 값에서 자동 계산됨 [Optional, 기본값: 40]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={48} />
 */
export function CampaignThumbnail({ thumbnailUrl, name, platform, size = 40, sx }) {
  // hasError를 단순 boolean으로 두면, 한 번 실패한 뒤 thumbnailUrl이 유효한
  // 값으로 바뀌어도(예: URL 수정 직후) 계속 이니셜로 고정되는 버그가 생긴다.
  // 실패했던 URL 자체를 기억해서, 그 값이 바뀌면 다시 이미지 로드를 시도한다.
  const [erroredUrl, setErroredUrl] = useState(null);
  const showImage = Boolean(thumbnailUrl) && thumbnailUrl !== erroredUrl;
  const width = Math.round(size * (9 / 16));

  if (showImage) {
    return (
      <Box
        component="img"
        src={thumbnailUrl}
        alt={`${name} creative thumbnail`}
        onError={() => setErroredUrl(thumbnailUrl)}
        sx={{
          width,
          height: size,
          borderRadius: (theme) => `${theme.shape.radius.control}px`,
          objectFit: 'cover',
          flexShrink: 0,
          ...sx,
        }}
      />
    );
  }

  return (
    <Box
      role="img"
      aria-label={`${name}${platform ? ` (${PLATFORM_LABEL[platform] ?? platform})` : ''} thumbnail — no creative image uploaded`}
      sx={{
        width,
        height: size,
        borderRadius: (theme) => `${theme.shape.radius.control}px`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // 중립 자리표시자 — 면은 한 단 낮추고 테두리로 슬롯의 경계만 잡는다.
        backgroundColor: 'surface.muted',
        border: '1px solid',
        borderColor: 'divider',
        boxSizing: 'border-box',
        color: 'text.secondary',
        fontWeight: 700,
        fontSize: Math.round(width * 0.5),
        letterSpacing: '0.02em',
        ...sx,
      }}
    >
      {getInitials(name)}
    </Box>
  );
}
