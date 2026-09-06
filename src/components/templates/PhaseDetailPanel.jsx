import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
import { PLATFORM } from '../../data/schema';
import { money, moneyWhole, percent, dateRangeWithDays } from '../../utils/format';

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
 * PhaseDetailPanel 컴포넌트
 *
 * Reports의 Event timeline에서 **막대 한 줄(phase)**을 눌렀을 때 열리는 읽기
 * 전용 패널.
 *
 * ## 왜 캠페인 패널을 바로 열지 않나
 *
 * 타임라인의 한 줄은 캠페인 하나가 아니다. 같은 단계를 Meta·TikTok에 나눠
 * 돌리면 캠페인 두 건이 한 막대로 합쳐진다(buildPhaseTimeline) — 실계정의
 * "G10 Opening"은 다섯 줄 중 넷이 `Meta + TikTok`이다. 그 줄을 눌렀을 때
 * 캠페인 드로어(CampaignDetailPanel)를 바로 열면 **둘 중 어느 쪽인지** 정할
 * 수 없다. 바로 아래 Budget Breakdown 표를 클릭 불가로 둔 이유와 같다.
 *
 * 그래서 한 단계를 더 둔다: 이 패널이 단계의 합계(기간·일일예산·계획 예산·
 * 실지출)를 먼저 말하고, 그 아래 캠페인 목록에서 한 건을 고르면 기존
 * CampaignDetailPanel이 열린다. 캠페인이 한 건뿐인 단계도 같은 화면을 지난다 —
 * 어떤 줄은 바로 열리고 어떤 줄은 한 번 더 눌러야 하는 목록이 되면, 눌러보기
 * 전에는 어느 쪽인지 알 수 없다.
 *
 * 편집은 없다. Reports는 비교하는 화면이고, 이 패널의 값은 전부 캠페인 여러
 * 건을 합친 것이라 고칠 대상 자체가 없다(고치려면 캠페인 한 건으로 내려가야
 * 하고, 그 경로가 곧 아래 목록이다).
 *
 * Props:
 * @param {{key: string, name: string, platformLabel: string, startDate: string, endDate: string, totalDaily: number|null, totalBudget: number}} phase - buildPhaseTimeline()이 만든 phase. 없으면 아무것도 그리지 않는다 [Required]
 * @param {Array<{id: string, name: string, platform: string, spend?: number|null, thumbnailUrl?: string|null}>} campaigns - 이 phase를 이루는 캠페인들. 호출부가 phase.key로 걸러 넘긴다 [Optional, 기본값: []]
 * @param {function} onClose - 닫기 핸들러 [Required]
 * @param {function} onSelectCampaign - 목록에서 캠페인을 고를 때 (campaignId) => void. 없으면 목록이 클릭 불가가 된다 [Optional]
 *
 * Example usage:
 * <PhaseDetailPanel
 *   phase={phase}
 *   campaigns={campaignsInPhase}
 *   onClose={() => setPhaseKey(null)}
 *   onSelectCampaign={(id) => setDetailCampaignId(id)}
 * />
 */
export function PhaseDetailPanel({ phase, campaigns = [], onClose, onSelectCampaign }) {
  if (!phase) return null;

  /* 합계는 넘어온 캠페인에서 다시 세지 않고 phase가 들고 있는 값을 쓴다 —
     Budget Breakdown 표와 같은 숫자가 나와야 한다(같은 buildPhaseTimeline 출처).
     실지출만 캠페인 쪽에 있어 여기서 더한다. */
  const spends = campaigns.map((c) => c.spend).filter((v) => v != null);
  const totalSpend = spends.length > 0 ? spends.reduce((a, b) => a + b, 0) : null;
  /* 계획 대비는 계획이 실제로 있을 때만. 0으로 나눈 비율도, "계획 $0 대비
     초과"도 둘 다 거짓말이다(동기화 캠페인은 계획 예산 개념이 없다). */
  const spentRatio = totalSpend != null && phase.totalBudget > 0 ? totalSpend / phase.totalBudget : null;

  return (
    <Drawer anchor="right" open onClose={onClose}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {/* 이름은 타임라인에서 잘렸던 원본 전체를 그대로 — 이 패널이 그걸
                온전히 읽는 자리다(타임라인 첫 줄은 코드·기간을 벗긴 표시 이름). */}
            <Typography variant="title" sx={{ wordBreak: 'break-word' }}>
              {phase.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {[phase.platformLabel, dateRangeWithDays(phase.startDate, phase.endDate)].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose} aria-label="Close phase details">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Row label="Daily budget" value={phase.totalDaily ? `${moneyWhole(phase.totalDaily)}/day` : null} />
          <Row label="Planned budget" value={phase.totalBudget > 0 ? moneyWhole(phase.totalBudget) : null} />
          <Row label="Spend" value={totalSpend != null ? money(totalSpend) : null} />
          <Row label="Spent vs planned" value={spentRatio != null ? percent(spentRatio) : null} />
        </Box>

        <Typography variant="label" sx={{ display: 'block', mb: 1, color: 'text.primary' }}>
          {`Campaigns (${campaigns.length})`}
        </Typography>
        {campaigns.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No campaigns in this phase.
          </Typography>
        ) : (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            {campaigns.map((campaign) => (
              <Box
                key={campaign.id}
                onClick={onSelectCampaign ? () => onSelectCampaign(campaign.id) : undefined}
                onKeyDown={
                  onSelectCampaign
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectCampaign(campaign.id);
                        }
                      }
                    : undefined
                }
                role={onSelectCampaign ? 'button' : undefined}
                tabIndex={onSelectCampaign ? 0 : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: onSelectCampaign ? 'pointer' : 'default',
                  ...(onSelectCampaign && {
                    '@media (hover: hover)': {
                      '&:hover': { backgroundColor: 'action.hover' },
                    },
                    // 포커스는 앱 공통 문법(1px accent 테두리 + 옅은 ring) — CampaignTable 행과 동일
                    '&:focus-visible': {
                      outline: '1px solid',
                      outlineColor: 'accent.main',
                      outlineOffset: -1,
                      boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                    },
                  }),
                }}
              >
                <CampaignThumbnail
                  thumbnailUrl={campaign.thumbnailUrl}
                  name={campaign.name}
                  platform={campaign.platform}
                  size={32}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {/* 목록 안에서는 캠페인끼리 구분만 되면 된다 — 전체 이름은 hover 툴팁 */}
                  <Tooltip title={campaign.name} enterDelay={400} placement="top-start">
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {campaign.name}
                    </Typography>
                  </Tooltip>
                  <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {PLATFORM_LABEL[campaign.platform] ?? campaign.platform}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', color: campaign.spend != null ? 'text.primary' : 'text.secondary' }}
                >
                  {campaign.spend != null ? money(campaign.spend) : '—'}
                </Typography>
                {onSelectCampaign && (
                  <ChevronRightIcon
                    sx={(theme) => ({ fontSize: theme.iconSize.control, color: 'text.disabled', flexShrink: 0 })}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
