import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
import { TARGET_SCOPE, PLATFORM, campaignGroupKey, isUnassignedEvent } from '../../data/schema';
import { money, moneyWhole, dateRange, rangeDays } from '../../utils/format';

const STATUS_META = {
  planned: { label: 'Planned', color: 'grey.500' },
  active: { label: 'Active', color: 'success.main' },
  ended: { label: 'Ended', color: 'grey.400' },
  ended_early: { label: 'Ended Early', color: 'grey.400' },
  archived: { label: 'Archived', color: 'grey.400' },
};

const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

/**
 * 상태 표시 — 점 + 텍스트.
 *
 * 예전엔 filled Chip이었다. `Active`가 채도 높은 초록으로 채워져 행마다 반복되니,
 * **화면에서 가장 강한 시각 요소가 상태 칩**이 됐다(실화면 리뷰). 문제는 그 정보가
 * 대부분 중복이라는 것이다 — This Period 탭에서는 바로 위 `LIVE (4)` 헤더가 이미
 * 같은 말을 하고 있었다. 반대로 정작 판단이 필요한 페이스 문구는 회색 12px였다.
 *
 * 색이 담은 의미는 유지하되 면적을 줄인다. 8px 점 + 라벨이면 스캔할 때 눈을 끌지
 * 않으면서, 찾아보면 즉시 읽힌다.
 */
function StatusDot({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.ended;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: meta.color,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ fontSize: 13, lineHeight: 1.45, color: 'text.secondary', fontWeight: 500 }}>
        {meta.label}
      </Typography>
    </Box>
  );
}

function formatStoreLabel(targetScope, targetStoreIds) {
  if (targetScope === TARGET_SCOPE.ALL_STORES) return 'All Stores';
  return targetStoreIds.join(', ');
}

/**
 * Spend 열의 셋째 줄 — 예산. 없으면 null을 돌려주고 호출부가 줄을 통째로 생략한다.
 *
 * 계획 예산이 0이면 예산을 표시하지 않는다 — 동기화로 들어온 캠페인은 계획
 * 예산이라는 개념 자체가 없어 0으로 저장되는데, "$0 planned" 위에 "$2,261.5
 * spent"를 찍으면 "예산을 0으로 계획했는데 초과 집행 중"으로 읽힌다(실데이터
 * 스크린샷 리뷰로 발견). 일일 예산이 있으면 그걸 먼저 말한다 — 페이스 문구의
 * 기준값이라 바로 위 지출과 나란히 있어야 "빠른가"가 읽힌다.
 *
 * 예산은 moneyWhole(정수), 집행은 money(2자리)다. 예산은 사람이 정수 달러로
 * 정하고 일수를 곱해 만든 값이라 센트가 존재하지 않고, 집행은 플랫폼이 센트
 * 단위로 청구한 실측값이다(utils/format.js 참고).
 */
function formatBudgetLine(row) {
  if (row.budgetDaily != null) return `${moneyWhole(row.budgetDaily)}/day`;
  if (row.budgetPlanned > 0) return `${moneyWhole(row.budgetPlanned)} planned`;
  return null;
}

/** 페이스가 "정상"으로 읽히는 폭. 이 안이면 편차를 숫자로 말하지 않는다. */
const ON_PACE_TOLERANCE = 0.1;

/**
 * 일일 예산 대비 실제 소진 속도를 한 조각의 문장으로 바꾼다.
 *
 * 이걸 왜 행마다 보여주나: 예전엔 행이 `07.10–08.31 · $20/day · $514.49 spent`
 * 까지만 말했다. 이 세 값으로 "잘 쓰고 있나"를 알려면 사용자가 기간 일수를 세고,
 * 경과일을 곱하고, 실제 지출과 비교해야 한다 — 필요한 숫자가 전부 화면에 있는데
 * 관계만 사람 머리에 떠넘긴 형태였고, 10개 행마다 반복되니 실제로는 아무도 하지
 * 않았다. 그래서 화면이 "무슨 일이 일어나는가"에만 답하고 "그래서 괜찮은가"에는
 * 답하지 못했다.
 *
 * 임계(15%)를 넘으면 budget_pacing 알림이 따로 뜬다. 여기서는 **정상일 때도**
 * 말하는 게 핵심이다 — 알림이 없다는 것과 확인해 봤더니 괜찮다는 것은 사용자
 * 입장에서 전혀 다른 정보다.
 *
 * 문구에 "budget"을 반드시 넣는다. 그냥 "on pace"라고 쓰면 "잘되고 있다"로
 * 읽히는데, 이건 **돈을 계획한 속도로 쓰고 있다**는 뜻일 뿐 성과와는 무관하다.
 * 실제로 목표가 Traffic인데 클릭이 0인 캠페인이 "on pace"로 표시됐다 —
 * 계획대로 돈을 태워 아무것도 못 얻는 상태가 초록 신호로 보였다(실사용 리뷰).
 * 이 줄이 화면에서 유일하게 판단을 담은 문구라 오독의 대가가 크다.
 *
 * @param {number|null} paceRatio - 평균 일일 소진 / 일일 예산 (1이면 딱 계획대로)
 * @returns {{text: string, isOver: boolean}|null} 판단할 근거가 없으면 null
 */
function formatPace(paceRatio) {
  if (paceRatio == null || !Number.isFinite(paceRatio)) return null;
  const deviation = paceRatio - 1;
  /* 색은 판단이 있을 때만 — 정상·미달은 차분한 초록, 초과만 경고색. 미달은
     "예산 안에서 돌았다"는 뜻이라 건강한 쪽으로 읽는다(사용자 결정, 2026-09).
     초록은 success.main(#167C3D) — 채도 높은 초록이 아니라 글자용 어두운 값이다. */
  if (Math.abs(deviation) <= ON_PACE_TOLERANCE) return { text: 'on budget pace', tone: 'good' };
  const percent = Math.round(Math.abs(deviation) * 100);
  return deviation > 0
    ? { text: `${percent}% over budget pace`, tone: 'bad' }
    : { text: `${percent}% under budget pace`, tone: 'good' };
}
const PACE_COLOR = { good: 'success.main', bad: 'warning.main' };

/**
 * 우측 메타 열의 폭. 행마다 정보량이 달라도 **같은 x에 정렬**되도록 고정한다 —
 * 예전엔 우측이 한 문장("Jul 10 – Aug 31 (53 days) · $20/day · $771.20 spent ·
 * 26% under budget pace")이라 행마다 길이가 달라 훑을 때 눈이 매번 다른 곳에서
 * 멈췄다. 기간 | 지출 | 상태 세 열이면 같은 종류의 값이 세로로 줄을 선다.
 */
const META_COLUMN_WIDTH = { period: 136, spend: 128, status: 216 };
/**
 * 넓은 화면에서 우측 메타 블록과 화살표 사이에 두는 빈 열. 이 열이 없으면 메타
 * 블록이 화면 오른쪽 끝에 붙어 왼쪽 캠페인 정보와의 사이가 텅 비었다 — 블록을
 * 56px쯤 왼쪽으로 당겨 행이 한 덩어리로 읽히게 한다(처음 104px는 너무 왼쪽이었다). 이름 영역을 늘려서 채우는
 * 게 아니라(이름은 어차피 한 줄) 빈 공간을 오른쪽 끝으로 보내는 것이다.
 * 화살표는 그대로 오른쪽 끝에 남는다.
 */
const WIDE_TRAILING_GAP = 56;
/** 이 수부터는 형제 수 앞의 "+"를 뗀다 — "+95 ads"는 소음이다 */
const LARGE_SIBLING_COUNT = 10;
/** 썸네일 한 변 — 행이 2줄(이름 20 + 메타 18)이라 40이면 세로 여백 없이 꼭 맞는다 */
const THUMBNAIL_SIZE = 40;

/**
 * 알림 문구에서 맨 앞의 캠페인명을 떼어낸다.
 *
 * 알림 메시지는 캠페인명을 품고 있다("G10_Now Open_0706~0831 — $624.09 spent
 * with 0 clicks ..."). 벨 팝오버·배너에서는 어느 캠페인인지 알려면 그 이름이
 * 꼭 필요하다. 그런데 이 표의 행에서는 **바로 왼쪽에 같은 이름이 이미 크게**
 * 있어서, 이름이 우측 폭을 다 먹고 정작 조치를 말하는 뒷부분이 잘렸다
 * ("... — $514.49 spent with 0 cli…" — 실사용 리뷰로 발견).
 *
 * 메시지 자체를 바꾸지는 않는다(팝오버는 이름이 있어야 한다) — 이 자리에서만
 * 접두사를 떼서, 같은 폭에 "무엇을 해야 하는가"가 들어가게 한다.
 */
function stripCampaignName(text, name) {
  const prefix = `${name} — `;
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
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
 * @param {Array<{id: string, name: string, campaignGroup?: string|null, platform: string, accountLabel: string, targetScope: string, targetStoreIds: string[], startDate: string, endDate: string, budgetPlanned: number, budgetDaily?: number|null, spend?: number, paceRatio?: number|null, status: string, alertBadges?: Array<{text: string, severity: 'warning'|'error'}>, overlapNote?: string, thumbnailUrl?: string|null, creativeUrl?: string|null}>} rows - 미리 조인된 캠페인 행 배열(현재 탭/필터 적용됨). alertBadges는 캠페인 하나에 고긴급 알림이 동시에 여러 개 걸릴 수 있어 배열이다 [Required]
 * @param {Array<{id: string, name: string, campaignGroup?: string|null, platform: string}>} allCampaigns - 형제 칩 판단용 전체 캠페인 목록(탭/필터 미적용). 생략하면 rows로 대체 [Optional, 기본값: rows]
 * @param {boolean} isStatusRedundant - 이 목록을 감싼 헤더가 이미 상태를 말하고 있으면 true. 행의 상태 표시를 생략한다 — This Period 탭처럼 `LIVE (4)` 그룹 헤더 아래 모든 행에 `Active`가 반복되면 같은 정보가 두 번 말해지고, 그중 시각적으로 강한 쪽이 중복인 쪽이 된다 [Optional, 기본값: false]
 * @param {function} onRowClick - 행 클릭 핸들러 (campaignId) => void [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <CampaignTable rows={campaignRows} allCampaigns={allCampaigns} onRowClick={(id) => openCampaignDrawer(id)} />
 */
export function CampaignTable({ rows, allCampaigns = rows, isStatusRedundant = false, onRowClick, sx }) {
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
        const pace = formatPace(row.paceRatio);

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
              /* 행 안은 고정 그리드 — 우측 세 열이 모든 행에서 같은 x에 선다 */
              display: 'grid',
              gridTemplateColumns: {
                xs: `${THUMBNAIL_SIZE}px minmax(0, 1fr) ${META_COLUMN_WIDTH.period}px ${META_COLUMN_WIDTH.spend}px ${META_COLUMN_WIDTH.status}px 0px ${onRowClick ? '20px' : '0px'}`,
                lg: `${THUMBNAIL_SIZE}px minmax(0, 1fr) ${META_COLUMN_WIDTH.period}px ${META_COLUMN_WIDTH.spend}px ${META_COLUMN_WIDTH.status}px ${WIDE_TRAILING_GAP}px ${onRowClick ? '20px' : '0px'}`,
              },
              alignItems: 'center',
              columnGap: 2,
              py: 1.25,
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
                중립색 이니셜로 대체하므로 항상 뭔가 시각적으로 보인다 */}
            <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={THUMBNAIL_SIZE} />

            {/* 좌측 — 캠페인명(Hero) + 메타(플랫폼·매장·이벤트·+N ads) */}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* body1(16px)은 운영 화면 밀도에 안 맞는다(design-system.md) — 행의 강조는 body2 + 600 */}
                {/* 긴 이름은 말줄임 — 열 폭이나 행 높이를 늘리지 않는다. 전체 이름은
                    hover 툴팁(팝오버가 아니라 한 줄 Tooltip)으로 본다. */}
                <Tooltip title={row.name} enterDelay={400} placement="top-start">
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.45, minWidth: 0 }}>
                    {row.name}
                  </Typography>
                </Tooltip>
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
                      <OpenInNewIcon sx={(theme) => ({ fontSize: theme.iconSize.inline })} />
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, minWidth: 0, '& .MuiTypography-root': { fontSize: 13, lineHeight: 1.4 } }}>
                {(() => {
                  const parts = [
                    /* 플랫폼만 한 단 진하게 둔다. 같은 소재를 Meta·TikTok에
                       나눠 돌리면 이름이 공백 하나 차이로 거의 같고 썸네일은
                       아예 동일해서, 가장 강한 시각 신호(이미지)가 "같은 행"
                       이라고 거짓말을 한다 — 실제로 구분해 주는 유일한 값이
                       여기 회색 평문 첫 단어로 묻혀 있었다. 칩으로 올리지는
                       않는다(메타 줄은 평문이라는 기존 결정 유지). */
                    <Typography key="platform" variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
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
                      <Tooltip key="group" title={isUnassignedEvent(row.campaignGroup) ? 'No valid event assigned' : `Event: ${groupKey}`}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ color: 'text.secondary', cursor: 'help', maxWidth: 240 }}
                        >
                          {/* "noname" 같은 자리표시자는 Event 필터와 같은 말로 — Unassigned */}
                          {isUnassignedEvent(row.campaignGroup) ? 'Unassigned' : groupKey}
                        </Typography>
                      </Tooltip>,
                    );
                  }
                  /* 같은 플랫폼 형제 수 — "+4 ads". 한때 "4 more on Meta"였는데
                     플랫폼은 이미 이 줄 첫 단어라 반복이었고, 문장이 길어 행마다
                     메타 줄 길이가 들쭉날쭉했다. 무엇이 4개인지(같은 이벤트의
                     다른 광고)는 Tooltip이 이름 목록으로 말한다. */
                  if (samePlatformSiblingCount > 0) {
                    parts.push(
                      <Tooltip
                        key="siblings"
                        title={`Also in this group on ${PLATFORM_LABEL[row.platform] ?? row.platform}: ${siblingRows
                          .filter((r) => r.platform === row.platform)
                          .map((r) => r.name)
                          .join(', ')}`}
                      >
                        <Typography variant="body2" noWrap sx={{ color: 'text.secondary', cursor: 'help', fontVariantNumeric: 'tabular-nums' }}>
                          {/* 한 자릿수면 "+3 ads"(이 행 말고 3개 더), 그 이상이면 "95 ads" —
                              큰 수 앞의 +는 눈에만 걸리고 뜻을 더하지 않는다. */}
                          {samePlatformSiblingCount < LARGE_SIBLING_COUNT ? `+${samePlatformSiblingCount} ads` : `${samePlatformSiblingCount} ads`}
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

            {/* 우측 — 기간 | 지출 | 상태, 세 열 고정폭(META_COLUMN_WIDTH).
                예전엔 한 문장이었다(주석 참고). 각 열은 위 줄이 값, 아래 줄이
                단위·보조다: "Jul 10 – Aug 31 / 53 days", "$771.20 / spent /
                $20/day", "● Ended / 26% under budget pace". 열은 세로선이 아니라
                정렬과 간격으로 갈린다 — 선을 열마다 두면 표가 된다. 상태 열 앞에만
                아주 옅은 선 하나를 남겨 "여기부터 판단"임을 표시한다. */}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontSize: 13, lineHeight: 1.45, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                {dateRange(row.startDate, row.endDate)}
              </Typography>
              <Typography variant="body2" noWrap sx={{ fontSize: 12, lineHeight: 1.4, color: 'text.secondary', mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
                {rangeDays(row.startDate, row.endDate)}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              {/* 지출이 캠페인명 다음으로 강하다 — 이 행에서 두 번째로 자주 찾는 값 */}
              <Typography variant="body2" noWrap sx={{ fontSize: 13, lineHeight: 1.45, fontWeight: 600, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                {row.spend != null ? money(row.spend) : '—'}
              </Typography>
              {/* 지출이 없을 때의 말은 상태에 따라 다르다 — 도는 중이면 "아직"이고,
                  끝났으면 "데이터가 없다"다. 둘 다 $0.00으로 찍지 않는다: 그건
                  "0을 측정했다"는 주장이다. */}
              <Typography variant="body2" noWrap sx={{ fontSize: 12, lineHeight: 1.4, color: 'text.secondary', mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
                {row.spend != null ? 'spent' : (row.status === 'active' || row.status === 'planned' ? 'No spend yet' : 'No spend data')}
                {formatBudgetLine(row) && ` · ${formatBudgetLine(row)}`}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0, pl: 2, borderLeft: '1px solid', borderColor: 'chart.grid' }}>
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
                  <Box sx={{ cursor: 'help', minWidth: 0 }}>
                    {/* 알림은 상태 자리를 대신한다 — 색이 있는 굵은 텍스트(레퍼런스의
                        "Visit Unconfirmed" 톤). 둘째 줄이 무엇을 해야 하는지 말한다. */}
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontSize: 13, lineHeight: 1.45, fontWeight: 600, color: worstSeverity === 'error' ? 'error.main' : 'warning.main' }}
                    >
                      {worstSeverity === 'error' ? 'Action Required' : 'Needs Attention'}
                    </Typography>
                    <Typography
                      variant="body2"
                      noWrap
                      title={stripCampaignName(alertBadges[0].text, row.name)}
                      sx={{ fontSize: 12, lineHeight: 1.4, color: 'text.secondary', mt: 0.25 }}
                    >
                      {alertBadges.length > 1 ? `${alertBadges.length} issues · ` : ''}
                      {stripCampaignName(alertBadges[0].text, row.name)}
                    </Typography>
                  </Box>
                </Tooltip>
              ) : (
                <>
                  {/* 감싼 헤더가 이미 상태를 말하면 점은 생략하고 페이스만 남긴다 */}
                  {!isStatusRedundant && <StatusDot status={row.status} />}
                  {/* 페이스 — 이 행에서 유일하게 **판단**을 담은 조각. 색이 이미
                      판단을 말하므로 굵기는 500으로 — 600이면 지출 금액과 무게가
                      같아져 보조 정보가 주인공과 경쟁했다. 정상·미달 초록, 초과만
                      경고색 — formatPace 주석. */}
                  {pace ? (
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontSize: 12, lineHeight: 1.4, fontWeight: 500, color: PACE_COLOR[pace.tone], mt: isStatusRedundant ? 0 : 0.25 }}
                    >
                      {pace.text}
                    </Typography>
                  ) : (
                    isStatusRedundant && (
                      <Typography variant="body2" sx={{ fontSize: 12, lineHeight: 1.4, color: 'text.disabled' }}>—</Typography>
                    )
                  )}
                </>
              )}
            </Box>

            <Box aria-hidden />
            {onRowClick && (
              <ChevronRightIcon
                sx={(theme) => ({ fontSize: theme.iconSize.control, color: 'text.disabled', flexShrink: 0, justifySelf: 'end' })}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
