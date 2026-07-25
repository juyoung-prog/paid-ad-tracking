import { Fragment } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * KpiBar 컴포넌트
 *
 * 헤더에 위치하는 KPI 숫자 요약 바. label/value 쌍의 배열을 받아
 * 가로로 나열한다 (예: 진행중 N · 예정 N · 종료 N · 미보고 N).
 * 숫자는 tabular-nums로 자릿수가 바뀌어도 레이아웃이 흔들리지 않는다.
 *
 * 항목별 onClick은 선택적이다 — 실제로 필터·드릴다운으로 이어지는 항목에만
 * 붙이고, 나머지는 순수 표시용으로 남긴다 (모든 숫자를 반사적으로 클릭 가능하게
 * 만들면 status-first/저노이즈 원칙과 충돌한다).
 *
 * Dashboard(sticky 헤더 툴바)와 Reports(본문 상단 요약)가 예전엔 KPI류 숫자를
 * 각각 다른 컴포넌트(KpiBar / CampaignSummaryGrid의 테두리 박스 그리드)로
 * 표현해서 같은 개념이 화면마다 다르게 보였다. 이제 이 컴포넌트 하나로
 * 통일한다 — CampaignSummaryGrid는 삭제하지 않았지만 어느 페이지에도 연결돼
 * 있지 않다.
 *
 * Props:
 * @param {Array<{ label: string, value: number|string, sub?: string, isAlert?: boolean, separator?: boolean, onClick?: function }>} items - KPI 항목 배열. value는 숫자뿐 아니라 "$8,200" 같은 포맷된 문자열도 가능하다. sub는 "across reported campaigns"처럼 값 아래 붙는 부가 설명(선택). separator:true면 앞에 세로 구분선(1px)을 두어 알림성 항목처럼 나머지와 분리한다(Influencer 레퍼런스의 ALERTS 앞 구분선과 동일). onClick이 있는 항목만 클릭 가능해진다 [Required]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <KpiBar
 *   items={[
 *     { label: '진행중', value: 5 },
 *     { label: '예정', value: 2 },
 *     { label: '종료', value: 8 },
 *     { label: '미보고', value: 1, isAlert: true, onClick: () => filterMissingReport() },
 *     { label: '집행 예산', value: '$8,200' },
 *     { label: '평균 CPM', value: '$8.39', sub: '성과 보고된 캠페인 기준' },
 *   ]}
 * />
 */
export function KpiBar({ items, sx }) {
  return (
    // 항목이 줄바꿈되면 라벨이 두 줄로 꺾여 못생겨 보이므로(각 항목에
    // flexShrink:0 + whiteSpace:nowrap 적용) 대신 화면이 정말 좁으면 줄바꿈이
    // 아니라 가로 스크롤로 빠지게 한다 — 잘리거나 겹치는 것보다 안전하다.
    // gap:4(32px)·alignItems:'flex-start'는 실제 Influencer Tracking
    // Dashboard(live, /beautymaster)를 Playwright로 열어 getComputedStyle로
    // 잰 값이다 — 일반 항목 사이 간격이 정확히 32px, 정렬은 flex-start였다.
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, overflowX: 'auto', ...sx }}>
      {items.map((item) => (
        <Fragment key={item.label}>
          {item.separator && (
            // 레퍼런스의 ALERTS 앞 구분선을 그대로 측정한 값: 1px 폭,
            // 24px 높이, 앞뒤로 컨테이너 gap(32px) 위에 추가 mx:1(8px)씩
            // 더해서 양쪽 40px 간격이 나온다(레퍼런스 실측: credit→divider
            // 40px, divider→alerts 40px).
            <Box sx={{ width: '1px', height: 24, alignSelf: 'center', backgroundColor: 'divider', mx: 1 }} />
          )}
          <Box
            onClick={item.onClick}
            onKeyDown={
              item.onClick
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      item.onClick(event);
                    }
                  }
                : undefined
            }
            role={item.onClick ? 'button' : undefined}
            tabIndex={item.onClick ? 0 : undefined}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              ...(item.onClick && {
                cursor: 'pointer',
                borderRadius: '4px',
                '&:hover': { opacity: 0.7 },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }),
            }}
          >
            {/* 라벨이 숫자 "위"에 온다 — 실제 Influencer Tracking Dashboard
                레퍼런스 이미지로 확인한 배치. 이전엔 숫자 옆에 나란히 뒀는데
                (03-visual-direction.md의 글로 된 스펙만 보고 추정한 배치라
                실제와 달랐다), 실제 레퍼런스는 라벨-숫자를 세로로 쌓는다.
                숫자 크기도 문서가 요구한 32px 대신 테마 공유 h4 기본값(24px)을
                그대로 쓴다 — 실물로 보니 32px는 과했다. */}
            <Typography
              variant="caption"
              component="span"
              sx={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                color: item.isAlert ? 'error.main' : 'text.secondary',
              }}
            >
              {item.label}
            </Typography>
            <Typography
              variant="h4"
              component="span"
              sx={{
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                color: item.isAlert ? 'error.main' : 'text.primary',
              }}
            >
              {item.value}
            </Typography>
            {item.sub && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'nowrap' }}>
                {item.sub}
              </Typography>
            )}
          </Box>
        </Fragment>
      ))}
    </Box>
  );
}
