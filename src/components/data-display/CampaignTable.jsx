import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
import { TARGET_SCOPE, PLATFORM, campaignGroupKey } from '../../data/schema';

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
 * 우측 상태줄의 기간 뒤에 붙는 예산·집행 문자열. 없으면 빈 문자열을 돌려주고
 * 호출부가 구분자(·)까지 통째로 생략한다.
 *
 * 계획 예산이 0이면 예산을 표시하지 않는다 — 동기화로 들어온 캠페인은 계획
 * 예산이라는 개념 자체가 없어 0으로 저장되는데, "$0 · $2,261.5 spent"로 찍으면
 * "예산을 0으로 계획했는데 초과 집행 중"으로 읽힌다(실데이터 스크린샷 리뷰로
 * 발견). 그 경우 spend만 남긴다. 계획 예산 없이 일일 예산만 있으면 그것만
 * 표시한다(있는 것만 말한다).
 */
function formatBudget(row) {
  const parts = [];
  if (row.budgetPlanned > 0) {
    const daily = row.budgetDaily != null ? ` ($${row.budgetDaily.toLocaleString('en-US')}/day)` : '';
    parts.push(`$${row.budgetPlanned.toLocaleString('en-US')}${daily}`);
  } else if (row.budgetDaily != null) {
    parts.push(`$${row.budgetDaily.toLocaleString('en-US')}/day`);
  }
  if (row.spend != null) parts.push(`$${row.spend.toLocaleString('en-US')} spent`);
  return parts.join(' · ');
}

/**
 * CampaignTable 컴포넌트
 *
 * Dashboard 캠페인 목록. 실제 Influencer Tracking Dashboard 레퍼런스 이미지
 * 기준으로 다시 맞췄다 — 한때 Enterprise UX 리뷰(Fiori List Report/Carbon
 * Data Table)를 근거로 8컬럼 dense table로 바꿨는데, 실제 레퍼런스를 보니
 * 그쪽은 아바타 없는 2줄 리스트(이름+메타 / 우측 상태 2줄)로 훨씬 여유 있게
 * 짜여 있었다. "Fiori/Carbon처럼 고밀도로" 보다 "같은 회사 툴군처럼 보이게"가
 * 이 프로젝트의 1순위 목표(visual-direction.md)라 레퍼런스 쪽을 따른다 —
 * 지금 캠페인 수(10여 개) 규모에서는 dense table의 실익도 크지 않았다.
 *
 * 사람이 아니라 캠페인이 주체라 아바타는 안 쓴다(기존 결정 유지) — 대신 소재
 * 썸네일(CampaignThumbnail)은 "사람 아바타"가 아니라 "광고 자체의 시각적
 * 미리보기"라 별개로 필요하다는 피드백에 따라 추가했다. thumbnailUrl(업로드
 * 전용 이미지)과 creativeUrl(사람이 타이핑하는 실제 링크, "View Ad")은 서로
 * 다른 값일 수 있어 별개 필드다(한때 하나로 합쳤다가, 업로드 전용으로 만들고
 * 나서 실제 링크를 입력할 방법이 없어지는 문제가 생겨 다시 분리함). 이름 옆
 * 외부 링크 아이콘 클릭은 행 클릭=Drawer 열기와 겹치지 않도록 stopPropagation한다.
 * 캠페인 1개 = 플랫폼 1개라 같은 마케팅 아이디어를 메타·틱톡에 나눠 돌리거나
 * 여러 단계(phase)로 나눠 등록하면 캠페인이 여러 개로 쪼개지는데, 같은 플랫폼
 * 안의 형제 캠페인(schema.js의 campaignGroupKey — campaignGroup이 있으면 그걸,
 * 없으면 name — 이 같은 캠페인)이 있으면 "+N more in group" 칩으로 관계를
 * 보여준다(예: 그랜드 오프닝 Coming Soon/Now Open/Grand Opening/1 Month
 * Deals처럼 같은 플랫폼 안에서 단계만 다른 경우). 플랫폼이 다른 형제를 위한
 * "Also on {플랫폼}" 칩은 삭제함(실사용 피드백 — 크로스플랫폼 관계까지는
 * 안 보여줘도 된다는 판단). 이 매칭은 지금 화면에 보이는 rows가 아니라
 * allCampaigns(탭/필터와 무관한 전체 목록)를 기준으로 한다 — rows만 기준으로
 * 하면, 짝인 캠페인이 다른 탭(예: 하나는 Active, 하나는 Ended)에 있을 때
 * 서로를 못 찾는다.
 *
 * Props:
 * @param {Array<{id: string, name: string, campaignGroup?: string|null, platform: string, accountLabel: string, targetScope: string, targetStoreIds: string[], startDate: string, endDate: string, budgetPlanned: number, budgetDaily?: number|null, spend?: number, status: string, alertBadges?: Array<{text: string, severity: 'warning'|'error'}>, overlapNote?: string, thumbnailUrl?: string|null, creativeUrl?: string|null}>} rows - 미리 조인된 캠페인 행 배열(현재 탭/필터 적용됨). alertBadges는 캠페인 하나에 고긴급 알림이 동시에 여러 개 걸릴 수 있어 배열이다 [Required]
 * @param {Array<{id: string, name: string, campaignGroup?: string|null, platform: string}>} allCampaigns - 형제 칩 판단용 전체 캠페인 목록(탭/필터 미적용). 생략하면 rows로 대체 [Optional, 기본값: rows]
 * @param {function} onRowClick - 행 클릭 핸들러 (campaignId) => void [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <CampaignTable rows={campaignRows} allCampaigns={allCampaigns} onRowClick={(id) => openCampaignDrawer(id)} />
 */
export function CampaignTable({ rows, allCampaigns = rows, onRowClick, sx }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, ...sx }}>
        No campaigns match the current filters.
      </Typography>
    );
  }

  return (
    <Box sx={sx}>
      {rows.map((row) => {
        const statusMeta = STATUS_META[row.status] ?? STATUS_META.ended;
        const alertBadges = row.alertBadges ?? [];
        const hasAlert = alertBadges.length > 0;
        const worstSeverity = alertBadges.some((a) => a.severity === 'error') ? 'error' : 'warning';
        // campaignGroupKey가 같은 형제 캠페인. allCampaigns 기준(탭/필터 무관)이라
        // 짝이 다른 탭에 있어도 찾는다. 플랫폼이 다른 형제("메타+틱톡 동시
        // 진행")와 플랫폼이 같은 형제(같은 플랫폼 안의 여러 단계)를 구분해서
        // 서로 다른 칩으로 보여준다 — 안 그러면 같은 플랫폼 형제만 있어도
        // "Also on Meta"가 떠서 지금 보고 있는 것도 이미 Meta인데 혼란스럽다.
        const groupKey = campaignGroupKey(row);
        const siblingRows = allCampaigns.filter((r) => r.id !== row.id && campaignGroupKey(r) === groupKey);
        const crossPlatformSiblings = siblingRows.filter((r) => r.platform !== row.platform);
        const samePlatformSiblingCount = siblingRows.length - crossPlatformSiblings.length;
        // Campaign Group을 명시적으로 입력했으면 짝이 아직 하나도 없어도 태그
        // 칩을 보여준다 — "이 캠페인은 Raffle 이벤트용이다"처럼 목적/카테고리를
        // 태그해둔 것 자체가 의미 있는 선언인데, 짝이 생길 때까지 숨기면 태그를
        // 걸어놓고도 리스트에서 찾을 방법이 없어진다(실사용 피드백으로 발견).
        const showGroupTag = Boolean(row.campaignGroup);

        return (
          <Box
            key={row.id}
            onClick={onRowClick ? () => onRowClick(row.id) : undefined}
            onKeyDown={
              onRowClick
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(row.id);
                    }
                  }
                : undefined
            }
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              cursor: onRowClick ? 'pointer' : 'default',
              ...(onRowClick && {
                '&:hover': { backgroundColor: 'action.hover' },
                // 포커스는 앱 공통 문법(테마 MuiOutlinedInput과 동일) — 1px
                // accent 테두리 + 옅은 ring. 2px 순수 primary 아웃라인은 입력
                // 컨트롤의 은은한 남색 번짐과 다른 두 번째 포커스 언어였다.
                '&:focus-visible': {
                  outline: '1px solid',
                  outlineColor: 'accent.main',
                  outlineOffset: -1,
                  boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                },
              }),
            }}
          >
            {/* 소재 썸네일 — thumbnailUrl이 없으면 CampaignThumbnail이 자체적으로
                플랫폼색 이니셜로 대체하므로 항상 뭔가 시각적으로 보인다 */}
            <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={40} />

            {/* 좌측 — 캠페인명(Hero) + 메타(플랫폼·계정·타겟) */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {row.name}
                </Typography>
                {row.creativeUrl && (
                  <Tooltip title="View Ad">
                    <IconButton
                      component="a"
                      href={row.creativeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      aria-label={`View Ad — ${row.name}`}
                      onClick={(event) => event.stopPropagation()}
                      sx={{ color: 'text.secondary', '&:hover': { color: 'accent.main' } }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {/* 메타 줄은 칩이 아니라 평문 + 가운뎃점이다.
                  예전엔 Store·그룹·중복타겟이 전부 outlined Chip이라 한 행에
                  테두리가 5~6개씩 생겨, 정작 주인공인 캠페인명보다 테두리가
                  먼저 눈에 들어왔다. 레퍼런스(influencer tracking dashboard)의
                  목록도 이 자리를 평문 컬럼(Instagram · T2 · General)으로 둔다.
                  칩은 "상태"에만 남긴다(우측 상태 칩, StoreTable과 동일 기준).

                  accountLabel(예: "Georgia")은 여전히 안 보여준다 — 옆 Store가
                  이미 구체적인 매장명을 보여줘서 지역 정보가 중복이다. */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, minWidth: 0 }}>
                {(() => {
                  const parts = [
                    <Typography key="platform" variant="body2" color="text.secondary">
                      {PLATFORM_LABEL[row.platform] ?? row.platform}
                    </Typography>,
                    <Typography key="store" variant="body2" color="text.secondary" noWrap>
                      {formatStoreLabel(row.targetScope, row.targetStoreIds)}
                    </Typography>,
                  ];

                  /* 그룹명을 그대로 노출한다 — "+N more in group"만 쓰면 실제
                     그룹명이 Tooltip 안에만 있어 hover해야 알 수 있었다(실사용
                     피드백). Tooltip은 형제 캠페인 이름 목록 같은 보조 정보로만
                     남긴다. campaignGroup을 명시적으로 입력했으면 짝이 아직
                     없어도 태그를 보여준다 — 태그해둔 캠페인이 짝이 생기기 전까지
                     리스트에서 아예 안 보이던 문제를 고친 결정. */
                  if (samePlatformSiblingCount > 0 || showGroupTag) {
                    parts.push(
                      <Tooltip
                        key="group"
                        title={
                          samePlatformSiblingCount > 0
                            ? `Also in this group: ${siblingRows
                                .filter((r) => r.platform === row.platform)
                                .map((r) => r.name)
                                .join(', ')}`
                            : `Tagged with campaign group "${groupKey}"`
                        }
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ color: 'text.secondary', cursor: 'help', maxWidth: 240 }}
                        >
                          {samePlatformSiblingCount > 0 ? `${groupKey} (+${samePlatformSiblingCount})` : groupKey}
                        </Typography>
                      </Tooltip>,
                    );
                  }

                  /* 중복 타겟은 저긴급이지만 그래도 "확인해봐야 하는" 신호라,
                     테두리를 뗀 대신 색(warning)으로 남긴다 — 평문 회색으로
                     내리면 다른 메타와 구분이 안 돼 신호 자체가 사라진다. */
                  if (row.overlapNote) {
                    parts.push(
                      <Tooltip key="overlap" title={row.overlapNote} arrow>
                        <Typography variant="body2" noWrap sx={{ color: 'warning.main', cursor: 'help' }}>
                          Overlapping Target
                        </Typography>
                      </Tooltip>,
                    );
                  }

                  return parts.flatMap((part, i) =>
                    i === 0
                      ? [part]
                      : [
                          <Typography key={`sep-${i}`} variant="body2" sx={{ color: 'text.disabled' }} aria-hidden>
                            ·
                          </Typography>,
                          part,
                        ],
                  );
                })()}
              </Box>
            </Box>

            {/* 우측 — 2줄 상태 스택(Influencer의 "Visit Unconfirmed / 12d overdue..."
                구조와 동일). 알림이 있으면 알림이 우선, 없으면 캠페인 상태 + 기간·예산. */}
            <Box sx={{ textAlign: 'right', flexShrink: 0, maxWidth: 320 }}>
              {hasAlert ? (
                <Tooltip
                  title={
                    alertBadges.length > 1 ? (
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {alertBadges.map((a, i) => (
                          <li key={i}>{a.text}</li>
                        ))}
                      </Box>
                    ) : (
                      alertBadges[0].text
                    )
                  }
                  arrow
                >
                  <Box sx={{ cursor: 'help' }}>
                    {/* Influencer 레퍼런스의 "Visit Unconfirmed"는 pill(Chip)이
                        아니라 색이 있는 굵은 텍스트다 — 알림 줄은 그 톤을
                        따르고, 캠페인 상태(아래 else 분기)만 이 앱 나머지
                        전체와 일관되게 Chip을 유지한다(StoreTable 등도 상태는
                        Chip). */}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: worstSeverity === 'error' ? 'error.main' : 'warning.main' }}
                    >
                      {worstSeverity === 'error' ? 'Action Required' : 'Needs Attention'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {alertBadges.length > 1 ? `${alertBadges.length} issues · ` : ''}
                      {alertBadges[0].text}
                    </Typography>
                  </Box>
                </Tooltip>
              ) : (
                <>
                  <Chip
                    label={statusMeta.label}
                    size="small"
                    variant={statusMeta.variant}
                    sx={{
                      ...(statusMeta.variant === 'filled'
                        ? { backgroundColor: statusMeta.color, color: '#fff' }
                        : { borderColor: statusMeta.color, color: statusMeta.color }),
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                    {[`${formatDate(row.startDate)}–${formatDate(row.endDate)}`, formatBudget(row)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </>
              )}
            </Box>

            {onRowClick && <ChevronRightIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />}
          </Box>
        );
      })}
    </Box>
  );
}
