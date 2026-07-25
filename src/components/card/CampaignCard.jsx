import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { CustomCard } from './CustomCard';
import { TARGET_SCOPE, PLATFORM } from '../../data/schema';

const STATUS_META = {
  planned: { label: 'Planned', color: 'grey.500', variant: 'outlined' },
  active: { label: 'Active', color: 'success.main', variant: 'filled' },
  ended: { label: 'Ended', color: 'grey.400', variant: 'outlined' },
  ended_early: { label: 'Ended Early', color: 'grey.400', variant: 'outlined' },
  archived: { label: 'Archived', color: 'grey.400', variant: 'outlined' },
};

const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

function formatDate(isoDate) {
  const [, month, day] = isoDate.split('-');
  return `${month}.${day}`;
}

function formatStoreLabel(targetScope, targetStoreIds) {
  if (targetScope === TARGET_SCOPE.ALL_STORES) return 'All Stores';
  return targetStoreIds.join(', ');
}

/**
 * CampaignCard 컴포넌트
 *
 * 캠페인 현황 대시보드의 카드 그리드에 쓰이는 요약 카드.
 * CustomCard 위에 구성하며 미디어 없이 텍스트 콘텐츠만 사용한다.
 * "지금 이 캠페인이 뭐고 언제 끝나는가"만 전달하고, 성과 지표는 표시하지 않는다
 * (Drawer 등 상세 뷰의 몫 — Visual Direction의 카드 정보 위계 원칙).
 *
 * Props:
 * @param {string} name - 캠페인명 [Required]
 * @param {string} platform - 플랫폼 ('meta' | 'tiktok') [Required]
 * @param {string} accountLabel - 계정 표시명 (예: "Georgia") [Required]
 * @param {string} targetScope - 타겟 범위 ('single_store' | 'multi_store' | 'all_stores') [Required]
 * @param {string[]} targetStoreIds - 타겟 매장 코드 배열 [Required]
 * @param {string} startDate - ISO 8601 date [Required]
 * @param {string} endDate - ISO 8601 date [Required]
 * @param {number} budgetPlanned - 계획 예산 (USD) [Required]
 * @param {number} spend - 실집행 예산 (USD) [Optional]
 * @param {string} status - effectiveStatus 계산값 ('planned'|'active'|'ended'|'ended_early'|'archived') [Required]
 * @param {{ text: string, severity: 'warning'|'error' }} alertBadge - 고긴급 알림 뱃지 (있을 때만) [Optional]
 * @param {string} overlapNote - 저긴급 중복 타겟팅 문구 (있을 때만 칩 노출). shouldTriggerOverlapAlert가 이미 계산한 구체적 충돌 캠페인명을 그대로 전달 — 칩에는 요약만, Tooltip에 전체 문구 (Visual Direction 알림 긴급도 매핑) [Optional]
 * @param {function} onClick - 카드 클릭 핸들러 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <CampaignCard
 *   name="Morrow Grand Opening Awareness"
 *   platform="meta"
 *   accountLabel="Georgia"
 *   targetScope="single_store"
 *   targetStoreIds={['G11']}
 *   startDate="2026-08-01"
 *   endDate="2026-08-31"
 *   budgetPlanned={1500}
 *   status="planned"
 *   onClick={() => openDrawer('camp-01')}
 * />
 */
export function CampaignCard({
  name,
  platform,
  accountLabel,
  targetScope,
  targetStoreIds,
  startDate,
  endDate,
  budgetPlanned,
  spend,
  status,
  alertBadge,
  overlapNote,
  onClick,
  sx,
}) {
  const statusMeta = STATUS_META[status] ?? STATUS_META.ended;

  return (
    <CustomCard isInteractive={Boolean(onClick)} onClick={onClick} contentPadding="md" sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0.75 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Chip
          label={statusMeta.label}
          size="small"
          variant={statusMeta.variant}
          sx={{
            flexShrink: 0,
            ml: 1,
            ...(statusMeta.variant === 'filled'
              ? { backgroundColor: statusMeta.color, color: '#fff' }
              : { borderColor: statusMeta.color, color: statusMeta.color }),
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <Chip label={PLATFORM_LABEL[platform] ?? platform} size="small" variant="outlined" />
        <Typography variant="body2" color="text.secondary">
          {accountLabel}
        </Typography>
        <Chip label={formatStoreLabel(targetScope, targetStoreIds)} size="small" variant="outlined" sx={{ ml: 'auto' }} />
        {overlapNote && (
          <Tooltip title={overlapNote} arrow>
            <Chip
              label="Overlapping Target"
              size="small"
              variant="outlined"
              sx={{ borderColor: 'grey.400', color: 'text.secondary', cursor: 'help' }}
            />
          </Tooltip>
        )}
      </Box>

      <Typography variant="body2" sx={{ mb: alertBadge ? 0.75 : 0 }}>
        <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatDate(startDate)}–{formatDate(endDate)}
        </Box>
        {'  ·  '}
        <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          ${budgetPlanned.toLocaleString('en-US')}
        </Box>
        {spend != null && (
          <Box component="span" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
            {' '}(spent ${spend.toLocaleString('en-US')})
          </Box>
        )}
      </Typography>

      {alertBadge && (
        <Typography variant="body2" sx={{ fontWeight: 500, color: alertBadge.severity === 'error' ? 'error.main' : 'warning.main' }}>
          ⚠ {alertBadge.text}
        </Typography>
      )}

      {/* onClick 존재만으로는 클릭 가능함이 hover 전에 드러나지 않아서(카드 자체엔
          호버 시 테두리 색만 바뀜), 항상 보이는 명시적 안내를 둔다.
          Planned 캠페인은 아직 시작 전이라 보고할 성과가 없다 — "Update
          performance"는 거짓 CTA가 되므로 상태별로 라벨을 다르게 둔다. */}
      {onClick && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.75, color: 'text.secondary' }}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {status === 'planned' ? 'Edit campaign details' : 'Update performance'}
          </Typography>
          <ChevronRightIcon sx={{ fontSize: 14 }} />
        </Box>
      )}
    </CustomCard>
  );
}
