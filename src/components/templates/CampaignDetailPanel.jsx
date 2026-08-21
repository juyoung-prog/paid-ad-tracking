import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { PacingIndicator } from '../data-display/PacingIndicator';
import { ScrollArea } from '../container/ScrollArea';
import { PlatformMetricList } from '../data-display/PlatformMetricList';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
import { calcBudgetPacing, effectiveBudgetPlanned, PLATFORM } from '../../data/schema';
import { money, moneyWhole, count, dateRangeWithDays, dateMed, EMPTY } from '../../utils/format';

const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

/** 라벨 + 값 한 줄. 값이 없으면 줄 자체를 그리지 않는다(빈 줄이 늘어서면 뭐가 없는지 흐려진다). */
function Row({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * CampaignDetailPanel 컴포넌트
 *
 * Reports에서 캠페인 한 건을 **그 자리에서** 펼쳐 보는 읽기 전용 패널.
 *
 * ## 왜 Dashboard로 보내지 않나
 *
 * 예전엔 Reports 표의 행을 클릭하면 `/dashboard?campaign={id}`로 **이동**해서
 * 편집 드로어가 열렸다. Reports는 비교하는 화면이다 — 중앙값도, goal별 분리도,
 * Meta/TikTok 짝 배치도 전부 행끼리 훑어 비교하라고 만든 장치다. 한 행을
 * 확인하려고 다른 페이지로 끌려가면 그 맥락이 통째로 날아간다.
 *
 * 필터는 URL에 있어 살아남지만 **스크롤 위치와 페이지 번호는 안 살아난다.**
 * Traffic 표는 115건 = 8페이지인데, 7페이지에서 한 건 보고 돌아오면 1페이지다.
 *
 * ## 왜 편집 드로어를 그대로 안 쓰나
 *
 * Reports에서 하는 일은 읽기지 고치기가 아니다. 그리고 편집 드로어의
 * `Save & Next`는 **Dashboard의 필터된 목록** 순서로 다음 캠페인에 가는데,
 * Reports에서 열면 "다음"이 무엇인지부터 모호해진다. 저장 핸들러·미저장 변경
 * 가드·삭제 확인이 전부 DashboardPage 상태에 얽혀 있기도 하다.
 *
 * 그래서 여기서는 **읽기만** 한다. 고칠 게 있으면 `Edit on Dashboard`로 간다 —
 * 지금처럼 당하는 이동이 아니라 사용자가 고르는 이동이 된다.
 *
 * Props:
 * @param {object} campaign - 캠페인 [Required]
 * @param {object} performance - 이 캠페인의 성과 레코드. 없으면 성과 블록을 안 그린다 [Optional]
 * @param {Array} dailyRows - **이 캠페인의** 일별 성과(PerformanceDaily[]). 호출부가 캠페인으로 걸러 넘긴다. 비면 섹션째 안 그린다 — 수동 등록 캠페인은 일별 데이터가 영영 없어서, 상시 빈 상태 문구는 안내가 아니라 소음이 된다 [Optional, 기본값: []]
 * @param {string} accountLabel - 광고 계정 표시명 [Optional]
 * @param {string} adsManagerHref - 플랫폼 광고 관리자에서 이 캠페인을 여는 링크. **호출부가 계산해서 넘긴다** — 링크 규칙(adsManagerUrl)은 pages 레이어에 있고, 컴포넌트가 pages를 임포트하면 의존 방향이 뒤집힌다 [Optional]
 * @param {string} billingHref - 이 캠페인이 속한 계정의 청구 내역(Meta: Billing & payments → Payment activity)으로 가는 링크. adsManagerHref와 같은 이유로 호출부(billingUrl)가 계산해 넘긴다 [Optional]
 * @param {Date} today - 페이싱 계산 기준일 [Optional, 기본값: new Date()]
 * @param {function} onClose - 닫기 핸들러 [Required]
 * @param {function} onEdit - "Edit on Dashboard" 핸들러 (campaignId) => void [Optional]
 *
 * Example usage:
 * {selected && <CampaignDetailPanel campaign={selected} performance={perf} onClose={close} onEdit={goEdit} />}
 */
export function CampaignDetailPanel({
  campaign,
  performance,
  dailyRows = [],
  accountLabel,
  adsManagerHref,
  billingHref,
  today = new Date(),
  onClose,
  onEdit,
}) {
  if (!campaign) return null;

  const spend = performance?.spend ?? null;
  // 수동 링크(creativeUrl)가 있으면 그쪽 우선 — 사람이 굳이 입력한 데는 이유가 있다.
  const viewAdHref = campaign.creativeUrl || campaign.adLink || null;
  // 호출부가 정렬을 보장하지 않으므로 여기서 시간순으로 고정한다 — 일별 표가
  // 뒤죽박죽이면 "언제부터 줄었나"를 읽을 수 없다. 원본은 건드리지 않는다.
  const sortedDaily = [...dailyRows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const planned = effectiveBudgetPlanned(campaign);
  const pacing = calcBudgetPacing(campaign, spend ?? 0, today);
  const showPacing = spend != null && (planned != null || campaign.budgetDaily != null);

  /* 테마 기본 드로어 폭(440)을 이 패널에서만 넓힌다.
     440에서는 문 네 개(View ad · Ads Manager · Billing · Edit on Dashboard)가
     한 줄에 안 들어가 마지막 하나가 혼자 다음 줄로 접혔다 — 실측 합계
     523px(104+143+92+160 + 간격 24)에 좌우 여백 48을 더하면 571이 필요하다.
     580은 그 위로 잡은 값이다. 라벨을 늘리거나 버튼을 더하면 이 값도 같이
     봐야 한다(`Payment activity`를 `Billing`으로 줄인 것도 같은 이유).
     형제인 Dashboard 편집 드로어는 440 그대로다 — 거기는 문이 셋이라 440에서
     이미 한 줄이고, 폼 필드 폭을 건드릴 이유가 없다. */
  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 580 } } }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <CampaignThumbnail
            thumbnailUrl={campaign.thumbnailUrl}
            name={campaign.name}
            platform={campaign.platform}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="title" sx={{ wordBreak: 'break-word' }}>
              {campaign.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {[PLATFORM_LABEL[campaign.platform] ?? campaign.platform, accountLabel, campaign.campaignGroup]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose} aria-label="Close campaign detail">
              <CloseIcon sx={(t) => ({ fontSize: t.iconSize.control })} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 바깥으로 나가는 문 — **헤더 바로 아래**에 둔다. 원래 맨 아래였는데
            지표 목록이 길면 낮은 창에서 접힌 화면 밖으로 밀렸다 — 이 링크들이
            패널을 연 이유인 경우가 많은데 스크롤해야 보였다(실사용 지적).
            하단 액션은 확인/취소가 있는 다이얼로그의 관행이고, 여기는 저장할
            것 없는 읽기 패널이라 그 관행이 적용될 이유가 없다. Dashboard 편집
            드로어도 액션(복제·삭제)이 상단이다 — 형제 드로어끼리 문법을 맞춘다.
            Close 버튼은 없다: 우상단 ✕·바깥 클릭·ESC로 이미 셋이다.

            Dashboard 편집 드로어와 같은 쌍이다.
            View ad는 실제 게시물(creativeUrl, 사람이 입력한 링크), Ads Manager는
            플랫폼 관리 화면(외부 id로 결정론적 생성, Meta만 — TikTok은 캠페인
            단위 딥링크가 안정적으로 구성되지 않아 호출부가 안 넘긴다).
            성과가 이상해 보일 때 다음 행동이 "원본을 열어 확인"이라, 그 문이
            이 패널에 없으면 표 → 패널까지 와 놓고 다시 Dashboard를 거쳐야 한다.

            Billing은 방향이 다른 세 번째 문이다 — 위 둘이 "광고가 어떻게
            나갔나"라면 이건 "얼마가 청구됐나"다. 리포트를 보다 인보이스를
            뽑아야 할 때 Ads Manager로 가도 거기서 Billing & payments →
            Payment activity를 또 찾아 들어가야 해서, 그 경로를 링크가 대신한다.
            인보이스는 계정 단위 문서라 링크도 캠페인이 아니라 계정으로 간다.
            라벨이 착지점 이름("Payment activity")이 아니라 상위 메뉴명인 이유는
            폭이다 — 네 개를 한 줄에 두려면 이만큼 짧아야 하고, Meta의 좌측
            메뉴가 실제로 "Billing & payments"라 도착해서도 말이 맞는다. */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {viewAdHref && (
            <Button
              component="a"
              href={viewAdHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              endIcon={<OpenInNewIcon sx={(t) => ({ fontSize: t.iconSize.inline })} />}
              sx={{ boxShadow: 'none' }}
            >
              View ad
            </Button>
          )}
          {adsManagerHref && (
            <Button
              component="a"
              href={adsManagerHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              endIcon={<OpenInNewIcon sx={(t) => ({ fontSize: t.iconSize.inline })} />}
              sx={{ boxShadow: 'none' }}
            >
              Ads Manager
            </Button>
          )}
          {billingHref && (
            <Button
              component="a"
              href={billingHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              endIcon={<OpenInNewIcon sx={(t) => ({ fontSize: t.iconSize.inline })} />}
              sx={{ boxShadow: 'none' }}
            >
              Billing
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onEdit(campaign.id)}
              sx={{ boxShadow: 'none' }}
            >
              Edit on Dashboard
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Row label="Dates" value={dateRangeWithDays(campaign.startDate, campaign.endDate)} />
          {/* 계획 예산은 정수, 집행은 2자리 (utils/format.js 규칙) */}
          <Row label="Planned budget" value={planned != null ? moneyWhole(planned) : null} />
          <Row label="Daily budget" value={campaign.budgetDaily != null ? `${moneyWhole(campaign.budgetDaily)}/day` : null} />
          <Row label="Spend" value={spend != null ? money(spend) : null} />
          {/* 배달 지표(Reach·Impressions)는 소재 반응을 다루는 아래 Platform
              Metrics와 성격이 달라 예산·집행 블록에 둔다. Reach 컬럼이 없는
              goal 표에서 드로어로 들어오면 여기가 유일한 확인 지점이다. */}
          <Row label="Reach" value={performance?.reach != null ? count(performance.reach) : null} />
          <Row label="Impressions" value={performance?.impressions != null ? count(performance.impressions) : null} />
        </Box>

        {showPacing && (
          <PacingIndicator
            {...pacing}
            budgetPlanned={planned}
            budgetDaily={campaign.budgetDaily}
            spend={spend}
            sx={{ mb: 3 }}
          />
        )}

        {/* 이 캠페인만의 일별 지출 — Reports의 Daily spend 표는 필터에 걸린
            캠페인들의 **합**이라, 같은 플랫폼에서 기간이 겹치는 캠페인이 있으면
            캠페인 하나를 집어 볼 방법이 없었다(실사용 요청). 캠페인 단위 일별은
            캠페인 상세의 질문이므로 이 패널이 맡는다.
            Spend 줄(누적)과 이 표의 Total이 같은 값이어야 정상이다 — 어긋나면
            일별 backfill이 덜 됐거나 플랫폼 사후 정정이 반영 중이라는 신호라,
            일부러 둘 다 보이게 둔다. */}
        {sortedDaily.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Daily spend{' '}
              <Typography component="span" variant="body2" color="text.secondary">
                — {sortedDaily.length} {sortedDaily.length === 1 ? 'day' : 'days'}
              </Typography>
            </Typography>
            {/* Reports의 Daily spend 표와 같은 문법(stickyHeader + maxHeight 스크롤,
                tabular-nums, Total 행 굵게) — 같은 데이터가 화면마다 다른 모양이면
                둘 중 하나가 틀린 것으로 읽힌다. TableContainer가 아니라 ScrollArea인
                것도 같은 이유 — 스크롤이 남았다는 신호(아래 그림자)가 없으면 21일
                짜리 표가 열 줄에서 끝난 것처럼 보인다(Reports에서 실사용 신고 i-9). */}
            <ScrollArea label="Daily spend" maxHeight={320}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Spend</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Impressions</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Clicks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedDaily.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {dateMed(row.date)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{money(row.spend)}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.impressions != null ? count(row.impressions) : EMPTY}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.clicks != null ? count(row.clicks) : EMPTY}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {money(sortedDaily.reduce((sum, r) => sum + r.spend, 0))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {sortedDaily.some((r) => r.impressions != null)
                        ? count(sortedDaily.reduce((sum, r) => sum + (r.impressions ?? 0), 0))
                        : EMPTY}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {sortedDaily.some((r) => r.clicks != null)
                        ? count(sortedDaily.reduce((sum, r) => sum + (r.clicks ?? 0), 0))
                        : EMPTY}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </Box>
        )}

        {/* 전 지표를 세로로 한눈에 — 표에도 같은 값이 있지만 여기서는 한
            캠페인만 놓고 읽는다. 값이 없는 항목은 이 컴포넌트가 알아서 숨긴다. */}
        <PlatformMetricList metrics={performance} sx={{ mb: 3 }} />

        {!performance && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No performance data yet for this campaign.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
