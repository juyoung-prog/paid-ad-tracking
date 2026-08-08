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
 * @param {Array<{ label: string, value: number|string, sub?: string, delta?: {text: string, direction?: 'up'|'down'|'flat', tone?: 'good'|'bad'|'neutral'}, isAlert?: boolean, onClick?: function }>} items - KPI 항목 배열. value는 숫자뿐 아니라 "$8,200" 같은 포맷된 문자열도 가능하다. sub는 값 **옆 같은 줄**에 작게 붙는 부가 설명(레퍼런스의 "of 82" 자리) — 짧아야 한다, 길면 옆 항목을 민다. delta는 비교 기준 한 줄로, **실제로 계산 가능한 비교가 있을 때만** 넘긴다(없으면 생략 — 지어내지 않는다). 항목 사이 세로 구분선은 자동이다(레퍼런스가 모든 KPI 사이에 둔다). onClick이 있는 항목만 클릭 가능해진다 [Required]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <KpiBar
 *   items={[
 *     { label: '진행중', value: 5 },
 *     { label: '예정', value: 2 },
 *     { label: '종료', value: 8 },
 *     { label: '미보고', value: 1, isAlert: true, onClick: () => filterMissingReport() },
 *     { label: '집행 예산', value: '$8,200', delta: { text: '계획의 62%', tone: 'neutral' } },
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
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {/* 구분선은 **모든 항목 사이**에 자동으로 긋는다 — 레퍼런스가 네 KPI
              사이 전부에 세로선을 둔다(13-1ref 실측). 예전엔 항목별 opt-in
              (separator prop)이었는데 어떤 호출부도 쓰지 않아서, 결과적으로
              레퍼런스에 있는 선이 우리 화면에만 없었다. 높이는 라벨+숫자
              블록을 덮는 40px. */}
          {index > 0 && (
            <Box sx={{ width: '1px', height: 40, alignSelf: 'center', backgroundColor: 'divider' }} />
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
                // 클릭 가능한 인터랙션 객체 → control radius (하드 '4px' 토큰화)
                borderRadius: (theme) => `${theme.shape.radius.control}px`,
                '&:hover': { opacity: 0.7 },
                // 포커스는 앱 공통 문법(테마 MuiOutlinedInput과 동일) — 1px
                // accent 테두리 + 옅은 ring. CampaignTable 행과 같은 규칙.
                // 바깥이 아니라 **안쪽**으로 그린다: 이 바의 루트가 overflowX:auto라
                // (가로 스크롤 대비) 상하좌우가 모두 클리핑되는 스크롤 컨테이너다.
                // offset을 양수로 주면 첫 항목의 좌측과 모든 항목의 상·하단이 잘리고
                // 포커스할 때마다 불필요한 스크롤 점프가 생긴다.
                '&:focus-visible': {
                  outline: '1px solid',
                  outlineColor: 'accent.main',
                  outlineOffset: -1,
                  boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                },
              }),
            }}
          >
            {/* 라벨이 숫자 "위"에 온다 — 레퍼런스(influencer tracking dashboard)
                실측 배치. 스타일도 실측값 그대로다: 12px / 400 / 문장형.

                한때 label 토큰(13/600 대문자)으로 바꿨다가 되돌렸다 — "표 컬럼
                헤더와 같은 역할이니 같은 토큰"이라는 논리였는데, 레퍼런스의 KPI
                라벨은 보통 굵기 문장형("Agreement")이다. 이 프로젝트의 1순위
                규칙은 "같은 회사 툴군처럼 보이기"라 일반화보다 실측이 먼저다
                (실사용 지적: "무조건 똑같이"). */}
            <Typography
              variant="caption"
              component="span"
              sx={{
                display: 'block',
                fontWeight: 400,
                whiteSpace: 'nowrap',
                color: item.isAlert ? 'error.main' : 'text.secondary',
              }}
            >
              {item.label}
            </Typography>
            {/* 값은 display 토큰(24px) — 레퍼런스 KPI 실측값. 한때 28px로
                올렸다가 되돌렸다(테마의 display 주석 참고).

                sub는 값 **옆 같은 줄**에 붙는다 — 레퍼런스의 "82 of 82" 해부다.
                예전엔 값 아래 별도 줄이어서 sub가 있는 항목만 3줄이 됐고, 바
                전체가 레퍼런스보다 세로로 두꺼워 훑는 리듬이 달랐다(실사용
                검토). 같은 줄이니 sub 유무가 바 높이를 흔들지도 않아, 아래
                줄이던 시절 필요했던 자리 예약(reservesSubLine)도 없앴다. */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              <Typography
                variant="display"
                component="span"
                sx={{
                  whiteSpace: 'nowrap',
                  color: item.isAlert ? 'error.main' : 'text.primary',
                }}
              >
                {item.value}
              </Typography>
              {item.sub && (
                <Typography
                  variant="caption"
                  component="span"
                  sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}
                >
                  {item.sub}
                </Typography>
              )}
            </Box>
            {/* 비교 기준 — "$8.63"만으로는 그게 좋은지 나쁜지 화면이 답하지
                못한다. 다만 이 앱의 성과 레코드는 캠페인당 누적 1건이라 시계열이
                없다: "지난 30일 대비" 같은 기간 비교는 **계산할 수 없다**.
                그래서 실제로 도출 가능한 비교(계획 대비, 전체 평균 대비)만
                호출부가 넘기고, 근거가 없으면 아예 넣지 않는다. */}
            {item.delta && (
              <Typography
                variant="caption"
                component="span"
                sx={{
                  mt: 0.25,
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  color:
                    item.delta.tone === 'bad'
                      ? 'warning.main'
                      : item.delta.tone === 'good'
                        ? 'success.main'
                        : 'text.secondary',
                }}
              >
                {/* 방향을 색이 아니라 기호로도 말한다 — 색만으로 구분하면
                    색각 이상 사용자에게는 증감이 사라진다. */}
                {item.delta.direction === 'up' ? '▲ ' : item.delta.direction === 'down' ? '▼ ' : ''}
                {item.delta.text}
              </Typography>
            )}
          </Box>
        </Fragment>
      ))}
    </Box>
  );
}
