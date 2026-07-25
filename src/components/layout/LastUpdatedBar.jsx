import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * lastUpdatedAt(ISO datetime)을 "MM/DD HH:mm" 형태로 표시용 포맷팅한다.
 * @param {string} isoDatetime
 * @returns {string}
 */
function formatTimestamp(isoDatetime) {
  const date = new Date(isoDatetime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * LastUpdatedBar 컴포넌트
 *
 * 캠페인/성과 데이터가 마지막으로 입력·수정된 시각을 표시한다.
 * Influencer Tracking Dashboard의 SyncStatusBar를 참고했지만, 이 프로젝트는
 * 실시간 자동 동기화가 없으므로(수동 입력 기반) 새로고침 버튼 없이
 * 단순 타임스탬프 표시로 재해석했다.
 *
 * Props:
 * @param {string|null} lastUpdatedAt - ISO 8601 datetime, 없으면 "기록 없음" 표시 [Required]
 * @param {string} label - 라벨 텍스트 [Optional, 기본값: '최근 수정']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <LastUpdatedBar lastUpdatedAt={campaign.updatedAt} />
 */
export function LastUpdatedBar({ lastUpdatedAt, label = 'Last updated', sx }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...sx }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {lastUpdatedAt ? formatTimestamp(lastUpdatedAt) : 'No data'}
      </Typography>
    </Box>
  );
}
