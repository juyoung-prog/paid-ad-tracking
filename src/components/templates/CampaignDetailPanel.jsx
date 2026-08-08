import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { PacingIndicator } from '../data-display/PacingIndicator';
import { PlatformMetricList } from '../data-display/PlatformMetricList';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
import { calcBudgetPacing, effectiveBudgetPlanned, PLATFORM } from '../../data/schema';
import { money, moneyWhole, dateRange } from '../../utils/format';

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
 * @param {string} accountLabel - 광고 계정 표시명 [Optional]
 * @param {string} adsManagerHref - 플랫폼 광고 관리자에서 이 캠페인을 여는 링크. **호출부가 계산해서 넘긴다** — 링크 규칙(adsManagerUrl)은 pages 레이어에 있고, 컴포넌트가 pages를 임포트하면 의존 방향이 뒤집힌다 [Optional]
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
  accountLabel,
  adsManagerHref,
  today = new Date(),
  onClose,
  onEdit,
}) {
  if (!campaign) return null;

  const spend = performance?.spend ?? null;
  const planned = effectiveBudgetPlanned(campaign);
  const pacing = calcBudgetPacing(campaign, spend ?? 0, today);
  const showPacing = spend != null && (planned != null || campaign.budgetDaily != null);

  return (
    <Drawer anchor="right" open onClose={onClose}>
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

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Row label="Dates" value={dateRange(campaign.startDate, campaign.endDate)} />
          {/* 계획 예산은 정수, 집행은 2자리 (utils/format.js 규칙) */}
          <Row label="Planned budget" value={planned != null ? moneyWhole(planned) : null} />
          <Row label="Daily budget" value={campaign.budgetDaily != null ? `${moneyWhole(campaign.budgetDaily)}/day` : null} />
          <Row label="Spend" value={spend != null ? money(spend) : null} />
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

        {/* 전 지표를 세로로 한눈에 — 표에도 같은 값이 있지만 여기서는 한
            캠페인만 놓고 읽는다. 값이 없는 항목은 이 컴포넌트가 알아서 숨긴다. */}
        <PlatformMetricList metrics={performance} sx={{ mb: 3 }} />

        {!performance && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No performance data yet for this campaign.
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* 바깥으로 나가는 문 두 개 — Dashboard 편집 드로어와 같은 쌍이다.
            View ad는 실제 게시물(creativeUrl, 사람이 입력한 링크), Ads Manager는
            플랫폼 관리 화면(외부 id로 결정론적 생성, Meta만 — TikTok은 캠페인
            단위 딥링크가 안정적으로 구성되지 않아 호출부가 안 넘긴다).
            성과가 이상해 보일 때 다음 행동이 "원본을 열어 확인"이라, 그 문이
            이 패널에 없으면 표 → 패널까지 와 놓고 다시 Dashboard를 거쳐야 한다. */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {campaign.creativeUrl && (
            <Button
              component="a"
              href={campaign.creativeUrl}
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
          <Button size="small" onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Drawer>
  );
}
