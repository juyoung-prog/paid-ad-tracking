import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { PageContainer } from '../../components/layout/PageContainer';
import { KpiBar } from '../../components/data-display/KpiBar';
import { AlertBanner } from '../../components/data-display/AlertBanner';
import { PacingIndicator } from '../../components/data-display/PacingIndicator';
import { CampaignTable } from '../../components/data-display/CampaignTable';
import { CampaignThumbnail } from '../../components/media/CampaignThumbnail';
import { LastUpdatedBar } from '../../components/layout/LastUpdatedBar';
import { FilterBar } from '../../components/templates/FilterBar';
import { CampaignForm } from '../../components/templates/CampaignForm';
import { PerformanceForm } from '../../components/templates/PerformanceForm';
import { PlatformMetricList } from '../../components/data-display/PlatformMetricList';

import { getEffectiveStatus, calcBudgetPacing, calcAutoBudgetPlanned, campaignGroupKey, ALERT_SEVERITY, TARGET_SCOPE, PLATFORM, GOAL } from '../../data/schema';
import { usePaidAdsStore } from './usePaidAdsStore';
import { TODAY, PAGE_GUTTER_X, campaignInDateRange, generateId } from './paidAdsPageUtils';
import { useSnackbar } from '../../hooks/useSnackbar';

const TAB_GROUPS = {
  all: ['active', 'planned', 'ended', 'ended_early', 'archived'],
  active: ['active'],
  planned: ['planned'],
  ended: ['ended', 'ended_early', 'archived'],
};

// All 탭 안에서 상태가 뒤섞여 보이지 않도록(예: 알림 없는 Ended가 알림 없는
// Active보다 위로 올라오는 것 방지) 정렬 1순위로 쓴다 — 개별 상태 탭에서는
// 한 그룹만 걸러진 상태라 이 값이 전부 같아서 기존 정렬(severity→종료일)
// 결과에 영향을 주지 않는다.
const STATUS_GROUP_ORDER = { active: 0, planned: 1, ended: 2, ended_early: 2, archived: 2 };

const HIGH_SEVERITY_TYPES = ['ending_soon', 'budget_pacing'];

const emptyCampaignValues = {
  name: '',
  campaignGroup: '',
  platform: PLATFORM.META,
  accountId: '',
  targetScope: TARGET_SCOPE.SINGLE_STORE,
  targetStoreIds: [],
  startDate: '',
  endDate: '',
  budgetPlanned: '',
  budgetDaily: null,
  goal: GOAL.AWARENESS,
  creativeUrl: '',
  thumbnailUrl: '',
};

// 탭·필터를 세션 간 기억한다 — Fiori의 Variant Management(저장된 필터 뷰)를
// 그대로 구현하기엔 과하지만("이름 붙여 여러 개 저장"까지는 필요 없음), 매번
// 빈 화면에서 새로 필터링해야 하는 문제의 대부분은 "마지막으로 보던 화면
// 기억"만으로 해결된다. 캠페인 등 실제 데이터와는 별도 키로 저장한다.
const VIEW_STORAGE_KEY = 'paidAdsDashboard:lastView:v1';

function loadLastView() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// 생성 폼(New Campaign Dialog)과 수정 폼(캠페인 Drawer)이 같은 필수 필드 규칙을 쓴다.
// Event(campaignGroup)는 모든 캠페인이 어떤 상위 이벤트에 속하는지 태깅되어야
// 한다는 운영 방침이라 optional이 아니라 필수다.
function isCampaignFormValid(values) {
  return Boolean(
    values.name &&
      values.campaignGroup &&
      values.accountId &&
      values.startDate &&
      values.endDate &&
      values.budgetPlanned &&
      (values.targetScope === TARGET_SCOPE.ALL_STORES || values.targetStoreIds.length > 0)
  );
}

/**
 * DashboardPage
 *
 * 페이드 광고 트래킹 대시보드 메인 화면. usePaidAdsStore(localStorage 영속화)로
 * 실제로 캠페인을 등록·성과를 입력하면 새로고침해도 남는다. 알림은 저장된
 * 값이 아니라 schema.js의 generateAlerts()로 매번 다시 계산된다.
 *
 * 레이아웃: 단일 컬럼(KPI 툴바 sticky·py:2.5 → 탭 → 필터 → 리스트).
 * visual-direction 문서의 2컬럼 구조(좌측 280px 고정 aside)로 시작했지만,
 * 필터가 좌측 aside와 상단 탭으로 쪼개져 하나의 필터링 파이프라인이 아니라
 * 두 시스템처럼 보인다는 피드백으로 aside를 걷어냈다(아래 탭/FilterBar 주석 참고).
 * 화면 단위 내비게이션은 글로벌 셸의 좌측 레일(PaidAdsRail)이 담당한다.
 */
export function DashboardPage() {
  const {
    stores,
    campaigns,
    performanceRecords,
    adAccounts,
    alerts,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    upsertPerformanceRecord,
  } = usePaidAdsStore();

  const [tab, setTab] = useState(() => loadLastView()?.tab ?? 'active');
  const [groupValues, setGroupValues] = useState(() => loadLastView()?.groupValues ?? { platform: '', store: '' });
  const [dateRange, setDateRange] = useState(() => loadLastView()?.dateRange ?? { start: '', end: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCampaignValues, setNewCampaignValues] = useState(emptyCampaignValues);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [editCampaignValues, setEditCampaignValues] = useState(emptyCampaignValues);
  const [performanceValues, setPerformanceValues] = useState({});
  const [bellAnchorEl, setBellAnchorEl] = useState(null);
  // 삭제는 되돌릴 수 없어서(수정처럼 "미저장 변경 취소"가 안 됨) 바로 지우지
  // 않고 확인 Dialog를 한 번 거친다 — 기존 미저장 변경 확인(discardTarget)과
  // 같은 톤이지만 별도 state로 둔다: 저건 "닫아도 되나"고 이건 "정말 지워도
  // 되나"라 의미가 달라서 하나로 합치면 조건 분기가 헷갈린다.
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  // Save 버튼들이 아무 피드백 없이 조용히 저장만 해서 "저장이 안 된 줄 알았다"는
  // 혼란을 일으켰다 — 저장 성공 시 스낵바로 명시적으로 알린다.
  const { notify, SnackbarComponent } = useSnackbar();

  // Platform·Campaign Group·기간·매장(By Store 클릭)은 4개의 독립된 컨트롤에
  // 흩어져 있어서, 지금 뭐가 걸려 있는지 한눈에 보거나 한 번에 초기화할 방법이
  // 없었다(실무자+전문가 리뷰로 발견) — 사이드바 맨 위에 활성 필터 요약 줄을
  // 두고 전체 초기화를 제공한다. storeRegion(By Store 지역 세그먼트)은 여기
  // 포함하지 않는다 — 이건 메인 리스트를 필터링하지 않고 사이드바 목록만
  // 재구성하는 별개 축이라, 같이 넣으면 다시 "이것도 필터링에 영향을 주나?"
  // 하는 개념모형 혼란이 생긴다.
  const hasActiveFilters = Boolean(
    groupValues.platform || groupValues.campaignGroup || groupValues.store || dateRange.start
  );
  const handleClearAllFilters = () => {
    setGroupValues((v) => ({ ...v, platform: '', campaignGroup: '', store: '' }));
    setDateRange({ start: '', end: '' });
  };

  // Drawer를 열 때의 "원본" 스냅샷 — editCampaignValues/performanceValues가
  // 여기서 벗어났는지로 미저장 변경 여부를 판단한다. 저장이 성공하면 이 스냅샷도
  // 같이 갱신해서(핸들러 쪽에서), 저장 직후엔 dirty로 오탐하지 않게 한다.
  const [originalCampaignSnapshot, setOriginalCampaignSnapshot] = useState(null);
  const [originalPerformanceSnapshot, setOriginalPerformanceSnapshot] = useState(null);
  // 'newCampaign' | 'drawer' | null — 닫으려는 대상에 미저장 변경이 있을 때만 연다.
  const [discardTarget, setDiscardTarget] = useState(null);

  const accountLabelFor = (accountId) => {
    const account = adAccounts.find((a) => a.id === accountId);
    if (!account) return accountId;
    return account.label.replace(/^Meta - |^TikTok - /, '');
  };

  const campaignsWithStatus = useMemo(
    () => campaigns.map((c) => ({ ...c, effectiveStatus: getEffectiveStatus(c, TODAY) })),
    [campaigns]
  );

  // 카드 클릭·알림 클릭·벨 팝오버 클릭이 전부 이 한 경로로 모인다 —
  // 어디서 열든 항상 같은 방식으로 캠페인 편집 값·성과 입력 값을 채운다.
  const openCampaignDrawer = (campaignId) => {
    setSelectedCampaignId(campaignId);
    const campaign = campaigns.find((c) => c.id === campaignId);
    let campaignSnapshot = campaign ? { ...campaign } : emptyCampaignValues;
    // CampaignForm은 budgetDaily+기간이 있으면 Planned Budget을 항상 그 공식값으로
    // 보여준다(disabled 필드) — 스냅샷을 저장된 그대로 두면, 이 자동계산 기능이
    // 생기기 전에 다르게 저장해둔 캠페인(예: Summer Sale Traffic)을 열자마자
    // CampaignForm이 mount 시점에 자기 계산값으로 조용히 덮어써서 아무것도 안
    // 건드렸는데 "미저장 변경" 취급되는 버그가 있었다. 열 때 스냅샷 자체를
    // 미리 같은 공식으로 정규화해두면 CampaignForm의 계산값과 항상 일치해서
    // 그 오탐이 사라진다.
    if (campaign) {
      const auto = calcAutoBudgetPlanned(campaign.budgetDaily, campaign.startDate, campaign.endDate);
      if (auto) campaignSnapshot = { ...campaignSnapshot, budgetPlanned: auto.amount };
    }
    setEditCampaignValues(campaignSnapshot);
    setOriginalCampaignSnapshot(campaignSnapshot);
    const existing = performanceRecords.find((p) => p.campaignId === campaignId) ?? {};
    setPerformanceValues(existing);
    setOriginalPerformanceSnapshot(existing);
    setBellAnchorEl(null);
  };

  // Reports 페이지 등 외부에서 /dashboard?campaign=ID로 들어왔을 때 진입 시점에만
  // 딥링크를 소비한다 — 이후로는 selectedCampaignId(로컬 state)가 유일한 소스다.
  // URL과 state를 둘 다 진실 소스로 두면 동기화 버그가 생기므로 여기서 한 번
  // 읽고 나면 쿼리를 지운다.
  useEffect(() => {
    const campaignId = searchParams.get('campaign');
    if (campaignId) {
      openCampaignDrawer(campaignId);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 탭/필터가 바뀔 때마다 저장 — 다음 방문 시 마지막 화면을 그대로 이어서 본다.
  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify({ tab, groupValues, dateRange }));
    } catch {
      // localStorage 사용 불가 — 조용히 무시, 세션 내 상태는 계속 동작
    }
  }, [tab, groupValues, dateRange]);

  // 'N' → New Campaign — 입력 중인 필드에 포커스가 있거나 이미 다른 Dialog/
  // Drawer가 열려 있으면 무시한다(텍스트에 실제로 'n'을 타이핑하는 중일 수
  // 있고, 이미 열린 폼 위에 또 다른 폼을 여는 건 혼란만 준다).
  // MUI Select의 트리거는 <input>이 아니라 role="combobox"인 <div>라서 태그
  // 이름만으로는 못 걸러진다 — Select에 포커스된 상태에서 옵션을 찾으려고
  // 'n'을 눌렀는데 New Campaign이 열려버리는 충돌을 막기 위해 combobox/
  // listbox 역할도 함께 확인한다.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'n' && event.key !== 'N') return;
      const target = event.target;
      const tag = target.tagName;
      const isInteractiveWidget =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="combobox"], [role="listbox"], [role="searchbox"]');
      if (isInteractiveWidget) return;
      if (isFormOpen || selectedCampaignId || discardTarget) return;
      event.preventDefault();
      setIsFormOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen, selectedCampaignId, discardTarget]);

  const kpiItems = useMemo(() => {
    const activeCampaigns = campaignsWithStatus.filter((c) => c.effectiveStatus === 'active');
    // 대시보드에는 지금까지 캠페인 "개수"만 있고 금액 KPI가 하나도 없었다 —
    // "지금 얼마나 썼나"를 보려면 각 카드를 하나씩 열어야 했다. Active 캠페인
    // 기준으로 계획 예산/실집행 합계를 더해 바로 답할 수 있게 한다.
    const activeBudgetPlanned = activeCampaigns.reduce((sum, c) => sum + c.budgetPlanned, 0);
    const activeSpendReports = activeCampaigns.filter((c) =>
      performanceRecords.some((p) => p.campaignId === c.id && p.spend != null)
    );
    const activeSpend = activeSpendReports.reduce((sum, c) => {
      const record = performanceRecords.find((p) => p.campaignId === c.id);
      return sum + Number(record.spend);
    }, 0);
    // 성과를 보고한 캠페인이 일부뿐이면 합계 자체가 실제보다 작게 나온다 —
    // "$1,800"이 마치 진행중 캠페인 전체의 실집행액인 것처럼 보이면 안 되므로,
    // 몇 건 기준인지를 라벨에 항상 보이게 붙인다(hover에 의존하지 않음).
    const activeSpendLabel =
      activeSpendReports.length < activeCampaigns.length
        ? `Active Spend (${activeSpendReports.length}/${activeCampaigns.length} reported)`
        : 'Active Spend';

    // Active/Planned/Ended 개수는 KPI 타일로 따로 두지 않는다 — 바로 아래
    // 상태 탭(Active (n)/Planned (n)/Ended (n))이 같은 값을 이미 보여주면서
    // 실제 필터링 기능까지 있다. 클릭도 안 되는 KPI 타일에 똑같은 숫자를
    // 또 찍으면 순수 중복이라(전문가+실무자 리뷰로 확인됨), 여기서는 탭이
    // 보여줄 수 없는 금액 지표만 남긴다.
    return [
      { label: 'Active Budget', value: `$${activeBudgetPlanned.toLocaleString('en-US')}` },
      { label: activeSpendLabel, value: `$${activeSpend.toLocaleString('en-US')}` },
    ];
  }, [campaignsWithStatus, performanceRecords]);

  // 탭(상태) 자체를 뺀 나머지 필터(Platform/Store/Campaign Group/기간) — 리스트와
  // 탭 배지 숫자가 반드시 같은 기준으로 캠페인을 세야 한다. 예전엔 탭 배지가 이
  // 필터들을 전혀 반영하지 않고 항상 전체 캠페인 기준으로 고정돼서, By Store로
  // 매장을 좁혀도(리스트는 정확히 줄어드는데) "Active (6)"이 안 바뀌는 불일치가
  // 있었다 — 매장을 클릭한 사람 입장에선 배지 숫자와 실제로 보이는 행 수가
  // 달라서 데이터가 빠진 것처럼 보였다(실사용 버그 리포트로 발견).
  const matchesGroupFilters = (c) =>
    (!groupValues.platform || c.platform === groupValues.platform) &&
    (!groupValues.store || c.targetScope === TARGET_SCOPE.ALL_STORES || c.targetStoreIds.includes(groupValues.store)) &&
    (!groupValues.campaignGroup || campaignGroupKey(c) === groupValues.campaignGroup) &&
    campaignInDateRange(c, dateRange);

  // 상태 탭 라벨용 개수 — 위 필터를 그대로 적용해서, 탭을 눌렀을 때 실제로
  // 보일 행 수와 배지 숫자가 항상 일치하게 한다.
  const activeCount = campaignsWithStatus.filter((c) => c.effectiveStatus === 'active' && matchesGroupFilters(c)).length;
  const plannedCount = campaignsWithStatus.filter((c) => c.effectiveStatus === 'planned' && matchesGroupFilters(c)).length;
  const endedCount = campaignsWithStatus.filter((c) => TAB_GROUPS.ended.includes(c.effectiveStatus) && matchesGroupFilters(c)).length;
  const allCount = campaignsWithStatus.filter((c) => matchesGroupFilters(c)).length;

  const highSeverityAlerts = alerts.filter((a) => HIGH_SEVERITY_TYPES.includes(a.type));

  // 캠페인 하나에 고긴급 알림이 동시에 2개 이상 걸릴 수 있다(예: ending_soon +
  // budget_pacing). 예전엔 .find()로 하나만 골라 나머지를 조용히 숨겼는데,
  // 그러면 상단 배너엔 2줄이 보이는데 테이블 행에는 1개만 표시되는 정보
  // 불일치가 생긴다 — 전부 반환해서 CampaignTable이 개수까지 보여주게 한다.
  // filteredCampaigns 정렬(바로 아래)도 이 배지의 severity를 그대로 기준으로
  // 쓴다 — 정렬 기준과 화면에 보이는 배지가 다른 개념이면 "왜 이 순서지?"를
  // 설명할 수 없다.
  const alertBadgesFor = (campaignId) =>
    alerts
      .filter((a) => a.campaignId === campaignId && HIGH_SEVERITY_TYPES.includes(a.type))
      .map((a) => ({ text: a.message, severity: ALERT_SEVERITY[a.type] }));

  const SEVERITY_SORT_WEIGHT = { error: 0, warning: 1 };
  // 정렬 기준 없이 데이터 저장 순서(목데이터 원본 배열 순서, 신규 등록은 항상
  // 맨 끝에 추가)로만 나열되고 있었다 — Action Required가 우연히 위에 보이는
  // 건 실제로 급해서가 아니라 그 캠페인이 먼저 만들어졌기 때문이었다(실사용
  // 리뷰로 발견). 알림 배지가 이미 severity를 매기고 있으니 그 기준을 그대로
  // 정렬에 쓴다 — Action Required(error) → Needs Attention(warning) → 알림 없음
  // 순, 동순위는 종료일이 가까운 순으로 다음에 처리할 것부터 보이게 한다.
  const campaignSortWeight = (c) =>
    alertBadgesFor(c.id).reduce((min, badge) => Math.min(min, SEVERITY_SORT_WEIGHT[badge.severity] ?? 2), 2);

  const filteredCampaigns = campaignsWithStatus
    .filter((c) => {
      if (!TAB_GROUPS[tab].includes(c.effectiveStatus)) return false;
      if (!matchesGroupFilters(c)) return false;
      return true;
    })
    .sort((a, b) => {
      const groupDiff = (STATUS_GROUP_ORDER[a.effectiveStatus] ?? 3) - (STATUS_GROUP_ORDER[b.effectiveStatus] ?? 3);
      if (groupDiff !== 0) return groupDiff;
      const severityDiff = campaignSortWeight(a) - campaignSortWeight(b);
      if (severityDiff !== 0) return severityDiff;
      return new Date(a.endDate) - new Date(b.endDate);
    });

  // 캠페인 1개는 플랫폼 1개라, 같은 마케팅 이니셔티브를 메타·틱톡에 나눠
  // 돌리거나 여러 단계(phase)로 나눠 등록하면 캠페인이 여러 개로 쪼개진다 —
  // "이 이니셔티브 전체 예산이 얼마야?"에 답하려면 지금까지는 행을 일일이
  // 더해야 했다. 탭(상태)과 무관하게 그룹 전체를 센다 — filteredCampaigns로
  // 계산하면 지금 보고 있는 탭 안의 캠페인만 잡혀서, 그랜드 오프닝처럼 일부
  // 단계는 이미 끝나고 일부는 아직 진행 중인 이니셔티브의 합계를 Active/Ended
  // 탭에 따라 다르게(쪼개서) 보여주는 문제가 있었다(실사용 시나리오 검토로
  // 발견 — "전체 얼마 썼지?"에 답하려면 탭을 오가며 직접 더해야 했음).
  const campaignsInGroup = groupValues.campaignGroup
    ? campaignsWithStatus.filter((c) => matchesGroupFilters(c))
    : [];
  const groupBudgetPlanned = campaignsInGroup.reduce((sum, c) => sum + c.budgetPlanned, 0);
  const groupSpend = campaignsInGroup.reduce((sum, c) => {
    const record = performanceRecords.find((p) => p.campaignId === c.id);
    return sum + (record?.spend != null ? Number(record.spend) : 0);
  }, 0);

  // FilterBar의 Campaign Group 드롭다운 옵션. 두 가지 출처를 다르게 취급한다:
  // - 이름만 우연히 겹치는 경우(campaignGroup 미입력, name으로 대체) — 2개
  //   이상 겹칠 때만 옵션으로 보여준다. 캠페인 하나뿐인 이름을 "그룹"으로
  //   보여줘봤자 의미가 없다.
  // - campaignGroup을 명시적으로 입력한 경우 — 지금 1개뿐이어도 옵션으로
  //   보여준다. 사용자가 "이 캠페인은 Raffle 이벤트용이다"처럼 목적/카테고리를
  //   태그해둔 것 자체가 의미 있는 선언이라, 짝이 아직 없다고 숨기면 태그를
  //   걸어놓고도 찾을 방법이 없어진다(실사용 피드백으로 발견 — "raffle이라고
  //   저장했는데 리스트에도 필터에도 안 보인다").
  const explicitGroups = new Set(campaigns.filter((c) => c.campaignGroup).map((c) => c.campaignGroup));
  const nameCounts = campaigns.reduce((counts, c) => {
    const key = campaignGroupKey(c);
    return { ...counts, [key]: (counts[key] ?? 0) + 1 };
  }, {});
  const campaignGroupOptions = Object.keys(nameCounts)
    .filter((key) => explicitGroups.has(key) || nameCounts[key] > 1)
    .map((key) => ({ value: key, label: key }));

  const lastUpdatedAt = campaigns.length
    ? campaigns.reduce((latest, c) => (c.updatedAt > latest ? c.updatedAt : latest), campaigns[0].updatedAt)
    : null;

  // 카드 그리드에서 실집행 예산을 보려면 지금까지는 Drawer를 열어야 했다 —
  // performanceRecords에 이미 있는 값을 카드에도 그대로 넘긴다.
  const spendFor = (campaignId) => {
    const record = performanceRecords.find((p) => p.campaignId === campaignId);
    return record?.spend != null ? Number(record.spend) : undefined;
  };

  // overlap_target은 저긴급이라 별도 뱃지 대신 카드에 Tooltip으로만 노출한다.
  // 이미 계산된 alert.message에 상대 캠페인명이 들어있으니 그대로 재사용한다.
  const overlapNoteFor = (campaignId) => alerts.find((a) => a.campaignId === campaignId && a.type === 'overlap_target')?.message;

  const selectedCampaign = campaignsWithStatus.find((c) => c.id === selectedCampaignId);

  const canSaveCampaign = isCampaignFormValid(newCampaignValues);
  const canSaveCampaignEdit = isCampaignFormValid(editCampaignValues);

  // 닫기(배경 클릭·Escape·Cancel/Close 버튼)를 눌렀을 때 입력한 내용을 그냥
  // 버리지 않는다 — Enterprise UX 리뷰(Fiori/Carbon의 unsaved-changes guard)
  // 기준. 문자열 비교라 타입이 완전히 같지 않으면(예: 필드를 건드렸다가 원래
  // 값으로 되돌린 경우) dirty로 오탐할 수 있지만, 그 방향의 오탐(불필요한 확인
  // 한 번 더)이 반대 방향(무음 데이터 손실)보다 훨씬 안전하다.
  const isNewCampaignDirty = () => JSON.stringify(newCampaignValues) !== JSON.stringify(emptyCampaignValues);

  const isDrawerDirty = () =>
    JSON.stringify(editCampaignValues) !== JSON.stringify(originalCampaignSnapshot) ||
    JSON.stringify(performanceValues) !== JSON.stringify(originalPerformanceSnapshot);

  const requestCloseNewCampaignForm = () => {
    if (isNewCampaignDirty()) {
      setDiscardTarget('newCampaign');
    } else {
      setIsFormOpen(false);
    }
  };

  const requestCloseDrawer = () => {
    if (isDrawerDirty()) {
      setDiscardTarget('drawer');
    } else {
      setSelectedCampaignId(null);
    }
  };

  const handleConfirmDiscard = () => {
    if (discardTarget === 'newCampaign') {
      setIsFormOpen(false);
      setNewCampaignValues(emptyCampaignValues);
    } else if (discardTarget === 'drawer') {
      setSelectedCampaignId(null);
    }
    setDiscardTarget(null);
  };

  const handleSaveCampaign = () => {
    const now = new Date().toISOString();
    addCampaign({
      ...newCampaignValues,
      id: generateId('camp'),
      budgetPlanned: Number(newCampaignValues.budgetPlanned),
      manualStatus: null,
      createdAt: now,
      updatedAt: now,
    });
    setIsFormOpen(false);
    setNewCampaignValues(emptyCampaignValues);
  };

  // 캠페인 자체 필드(이름/예산/기간/타겟/goal) 저장 — 성과 입력 저장과는
  // 완전히 분리된 별도 버튼/핸들러다. 하나가 둘 다 저장하면 사용자가
  // 성과만 입력하려다 캠페인 정보까지 의도치 않게 바꿀 수 있다.
  // 저장 후에도 Drawer를 닫지 않는다(handleSavePerformance와 동일하게) — 저장
  // 버튼 하나가 "다른 쪽 폼의 미저장 변경까지 조용히 버리는" 경로가 되지 않게
  // 하기 위함. 닫는 것은 항상 requestCloseDrawer를 거친다.
  const handleSaveCampaignEdit = () => {
    const saved = {
      ...editCampaignValues,
      budgetPlanned: Number(editCampaignValues.budgetPlanned),
      updatedAt: new Date().toISOString(),
    };
    updateCampaign(selectedCampaignId, saved);
    setEditCampaignValues(saved);
    setOriginalCampaignSnapshot(saved);
    notify('Campaign details saved');
  };

  const handleConfirmDelete = () => {
    deleteCampaign(selectedCampaignId);
    setDeleteConfirmOpen(false);
    setSelectedCampaignId(null);
    notify('Campaign deleted');
  };

  // 같은 아이디어를 메타·틱톡 둘 다 돌릴 때, 매번 이름·기간·매장·예산·goal을
  // 처음부터 다시 입력하는 대신 지금 보고 있는 캠페인을 복제해서 플랫폼만
  // 바꾸면 되게 한다 — Campaign Name을 그대로 유지하므로(campaignGroupKey가
  // campaignGroup 없으면 name으로 대체) 복제만 해도 자동으로 같은 그룹으로
  // 묶인다. Platform은 자동으로 반대쪽으로 뒤집어서 정확히 "이것만 바꾸면
  // 되는" 상태로 New Campaign 다이얼로그를 연다. Account는 플랫폼이 바뀌면
  // 이전 계정이 더 이상 유효하지 않으므로 비워서 다시 고르게 한다(플랫폼 변경
  // 시 항상 하던 것과 동일 규칙). Ad Link는 플랫폼마다 별도 광고 관리자 링크라
  // 그대로 넘기면 틀린 링크가 되므로 비운다 — 나머지(이름·매장·기간·예산·goal·
  // 썸네일)는 보통 그대로 재사용되므로 유지한다. 저장 전까지는 원본 캠페인에
  // 아무 영향도 없다(지금 화면의 값을 그대로 복사만 할 뿐).
  const handleDuplicateForOtherPlatform = () => {
    const otherPlatform = editCampaignValues.platform === PLATFORM.META ? PLATFORM.TIKTOK : PLATFORM.META;
    setNewCampaignValues({
      ...editCampaignValues,
      platform: otherPlatform,
      accountId: '',
      creativeUrl: '',
      manualStatus: null,
    });
    setSelectedCampaignId(null);
    setIsFormOpen(true);
  };

  const handleSavePerformance = () => {
    const saved = {
      ...performanceValues,
      campaignId: selectedCampaignId,
      id: performanceValues.id ?? generateId('perf'),
    };
    upsertPerformanceRecord(saved);
    setPerformanceValues(saved);
    setOriginalPerformanceSnapshot(saved);
    notify('Performance saved');
  };


  return (
    <Box>
      {/* 페이지 툴바 — 본문 스크롤 컨테이너 최상단에 sticky.
          KPI/알림/등록 버튼은 페이지마다 달라서 글로벌 셸이 아니라 여기 속한다. */}
      <Box
        sx={{
          position: 'sticky',
          // top:0 — 셸이 상단 GNB 대신 좌측 레일을 쓰면서 위에 깔릴 헤더가 없어졌다.
          // 스크롤 주체도 문서가 아니라 셸의 main이라, 이 sticky는 그 컨테이너
          // 기준으로 붙는다(예전 top:56은 GNB 높이를 피하려던 값이었다).
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          // 모든 화면이 공유하는 기준선 — 툴바의 KPI 라벨과 본문 좌측이 어긋나면
          // 한 화면이 두 개의 열처럼 보인다.
          px: PAGE_GUTTER_X,
          // py:2.5(20px) — KPI 라벨-위/숫자-아래 배치로 바뀌면서 콘텐츠가
          // 2줄(약 40px)이 됐는데, 예전 1줄 시절 고정값이던 height:56이
          // 그대로 남아있어 위아래 여백이 실제 Influencer 레퍼런스(live,
          // /beautymaster 실측: 콘텐츠 위아래 20px씩, 총 81px)보다 훨씬
          // 빡빡했다. 고정 height 대신 py로 바꿔 레퍼런스와 동일한 여백을 준다.
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.default',
        }}
      >
        {/* minWidth:0 없이는 flex item의 기본 min-width:auto 때문에 내용이
            넘쳐도 줄어들지 않고 우측 클러스터(Last updated/벨/New Campaign)와
            그냥 겹쳐버린다 — KpiBar 내부의 overflowX:auto가 실제로 작동하려면
            여기서 먼저 줄어들 수 있어야 한다. */}
        <KpiBar items={kpiItems} sx={{ minWidth: 0, flex: '1 1 auto' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <LastUpdatedBar lastUpdatedAt={lastUpdatedAt} />
          <IconButton
            size="small"
            onClick={(event) => setBellAnchorEl(event.currentTarget)}
            aria-label="Show alerts"
          >
            <Badge badgeContent={highSeverityAlerts.length} color="error">
              <NotificationsOutlinedIcon fontSize="small" />
            </Badge>
          </IconButton>
          <Popover
            open={Boolean(bellAnchorEl)}
            anchorEl={bellAnchorEl}
            onClose={() => setBellAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ p: 2, width: 360 }}>
              <Typography variant="overline" sx={{ display: 'block', mb: 1, color: 'text.secondary', letterSpacing: '0.08em' }}>
                Alerts
              </Typography>
              {highSeverityAlerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No alerts right now.
                </Typography>
              ) : (
                // 벨이 유일한 알림 진입점이다 — 대시보드 상단 배너는 벨 배지와
                // 정확히 같은 개수를 중복 노출해서 없앴다.
                <AlertBanner alerts={highSeverityAlerts} onAlertClick={(alert) => openCampaignDrawer(alert.campaignId)} />
              )}
            </Box>
          </Popover>
          <Button variant="contained" size="small" onClick={() => setIsFormOpen(true)} sx={{ gap: 0.75, boxShadow: 'none' }}>
            New Campaign
            {/* 'N' 단축키 힌트 — 단축키가 있다는 걸 알 방법이 없으면 아무도 안 쓴다 */}
            <Box
              component="span"
              sx={theme => ({
                fontSize: 11,
                lineHeight: 1,
                px: 0.5,
                py: 0.25,
                // 버튼 *안에* 들어가는 미세 요소 → inlay radius
                borderRadius: `${theme.shape.radius.inlay}px`,
                border: '1px solid',
                borderColor: 'rgba(255,255,255,0.5)',
                opacity: 0.85,
              })}
            >
              N
            </Box>
          </Button>
        </Box>
      </Box>

      {/* maxWidth={false} — 기본 xl(1536px) 제한을 두면 본문만 넓은 모니터에서
          중앙 정렬되면서 양옆에 빈 여백이 생겨 툴바와 어긋나 보였다. 인플루언서
          대시보드도 좌우 여백 없이 꽉 차는 구조라 툴바와 통일한다. px는 위
          KPI 툴바와 동일값 — 예전엔 좌측 사이드바 패널의 자체 padding만큼
          미리 빼는 계산이 필요했는데, 사이드바를 없애면서(아래 참고) 그
          보정도 같이 필요 없어졌다. */}
      <PageContainer maxWidth={false} sx={{ py: 3, px: PAGE_GUTTER_X }}>
        {/* 예전엔 Platform·Event·기간 필터(FilterBar)를 좌측 280px 고정
            사이드바에, 상태(Active/Planned/Ended) 필터는 상단 탭에 따로
            뒀었다 — 근데 그러면 "이 리스트를 좁히는 컨트롤"이 물리적으로
            서로 다른 두 구역(왼쪽 컬럼 vs 위쪽 탭바)에 나뉘어 있어서 하나의
            필터링 파이프라인이 아니라 두 개의 분리된 시스템처럼 보였다(실사용
            피드백으로 발견). 상태(탭)가 1순위 탐색 축이고 Platform/Event/
            Store/기간은 그 안에서 좁히는 2순위 축이라는 위계 자체는 맞으니,
            사이드바를 없애고 전부 같은 세로열(탭 → FilterBar → 리스트)에
            배치해 하나의 흐름으로 통일한다. By Store(매장별 훑어보기 카운트
            패널)는 캠페인 리스트 필터링에서는 부차적인 정보라는 피드백으로,
            전용 리스트 패널 대신 다른 필터와 동급인 평범한 드롭다운
            하나로 격하했다 — 대신 Event(campaignGroup)는 "이 이벤트에 어떤
            광고가 있나"가 이 대시보드에서 더 중요하다는 피드백으로 필터
            줄에서 그대로 1급 필터로 유지하고, 아래 그룹 요약 박스도 그대로
            둔다. */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={(e, next) => setTab(next)}
            sx={{ borderBottom: 'none' }}
          >
            <Tab label={`All (${allCount})`} value="all" sx={{ textTransform: 'none' }} />
            <Tab label={`Active (${activeCount})`} value="active" sx={{ textTransform: 'none' }} />
            <Tab label={`Planned (${plannedCount})`} value="planned" sx={{ textTransform: 'none' }} />
            <Tab label={`Ended (${endedCount})`} value="ended" sx={{ textTransform: 'none' }} />
          </Tabs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Platform/Event/Store/기간이 전부 바로 아래 FilterBar 한 줄에
                이미 선택값으로 보이는데(세그먼트 버튼 눌림, 드롭다운 선택값
                표시), 그 위에 같은 값을 칩으로 또 나열하면 같은 상태를 두 번
                보여주는 순수 중복이라는 피드백으로 없앴다(사이드바-메인 분리
                문제를 고치려고 얹었던 패치였는데, 이번에 사이드바 자체를
                없애면서 원인이 사라짐). Clear all만 남긴다 — 초기화는 각
                컨트롤을 하나씩 되돌리는 것보다 여전히 값어치가 있는 기능. */}
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={handleClearAllFilters}
                sx={{ textTransform: 'none', minWidth: 0, px: 0.75, color: 'text.secondary' }}
              >
                Clear all
              </Button>
            )}
          </Box>
        </Box>

        <FilterBar
          showSearch={false}
          searchValue=""
          onSearchChange={() => {}}
          filterGroups={[
            {
              key: 'platform',
              label: 'Platform',
              variant: 'segmented',
              options: [
                { value: PLATFORM.META, label: 'Meta' },
                { value: PLATFORM.TIKTOK, label: 'TikTok' },
              ],
            },
            ...(campaignGroupOptions.length > 0
              ? [{ key: 'campaignGroup', label: 'Event', options: campaignGroupOptions }]
              : []),
            { key: 'store', label: 'Store', options: stores.map((s) => ({ value: s.id, label: s.id })) },
          ]}
          groupValues={groupValues}
          onGroupChange={(key, value) => setGroupValues((v) => ({ ...v, [key]: value }))}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          sx={{ mb: 3 }}
        />

        {/* Campaign Group(Event)으로 필터링 중일 때만 합산 예산/집행액을
            보여준다 — 평소(그룹 필터 없음)에는 위 KpiBar의 Active Budget/
            Spend와 내용이 겹쳐서 잡음만 된다. campaignsInGroup은 탭(상태)과
            무관하게 그룹 전체를 세므로, 지금 Active 탭을 보고 있어도 이미
            끝난 단계의 예산까지 포함한 진짜 전체 합계가 뜬다. */}
        {groupValues.campaignGroup && (
          // 얕은 배경색의 상태 요약 줄(Alert 배너에 가까운 정보 스트립) → control radius
          <Box sx={theme => ({ display: 'flex', gap: 3, mb: 2, py: 1, px: 1.5, backgroundColor: 'surface.sunken', borderRadius: `${theme.shape.radius.control}px` })}>
            <Typography variant="body2" color="text.secondary">
              <strong>{campaignsInGroup.length}</strong> campaign{campaignsInGroup.length === 1 ? '' : 's'} in "{groupValues.campaignGroup}"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total planned: <strong>${groupBudgetPlanned.toLocaleString('en-US')}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total spend: <strong>${groupSpend.toLocaleString('en-US')}</strong>
            </Typography>
          </Box>
        )}

        {/* 아바타 없는 2줄 리스트 — 실제 Influencer Tracking Dashboard 레퍼런스
            기준(CampaignTable 자체 주석 참고). CampaignCard 그리드는 삭제하지
            않고 재사용 후보로 남겨뒀다. */}
        <CampaignTable
          rows={filteredCampaigns.map((c) => ({
            id: c.id,
            name: c.name,
            campaignGroup: c.campaignGroup,
            platform: c.platform,
            accountLabel: accountLabelFor(c.accountId),
            targetScope: c.targetScope,
            targetStoreIds: c.targetStoreIds,
            startDate: c.startDate,
            endDate: c.endDate,
            budgetPlanned: c.budgetPlanned,
            budgetDaily: c.budgetDaily,
            spend: spendFor(c.id),
            status: c.effectiveStatus,
            alertBadges: alertBadgesFor(c.id),
            overlapNote: overlapNoteFor(c.id),
            thumbnailUrl: c.thumbnailUrl,
            creativeUrl: c.creativeUrl,
          }))}
          allCampaigns={campaigns}
          onRowClick={openCampaignDrawer}
        />
      </PageContainer>

      {/* 캠페인 등록 Dialog — form으로 감싸서 Enter가 Save를 트리거하게 한다.
          Cancel은 type="button"으로 명시 — form 안의 버튼은 type을 안 주면
          기본이 submit이라, 안 붙이면 Cancel도 저장을 시도한다. */}
      <Dialog open={isFormOpen} onClose={requestCloseNewCampaignForm} maxWidth="sm" fullWidth>
        <form onSubmit={(e) => { e.preventDefault(); if (canSaveCampaign) handleSaveCampaign(); }}>
          <DialogTitle>New Campaign</DialogTitle>
          <DialogContent>
            <CampaignForm
              stores={stores}
              accounts={adAccounts}
              values={newCampaignValues}
              onChange={(field, value) => setNewCampaignValues((v) => ({ ...v, [field]: value }))}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={requestCloseNewCampaignForm}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!canSaveCampaign} sx={{ boxShadow: 'none' }}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 미저장 변경 확인 — New Campaign/Drawer 닫기 두 경로가 공유한다. */}
      <Dialog open={Boolean(discardTarget)} onClose={() => setDiscardTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You have unsaved changes that will be lost if you close this now.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardTarget(null)}>Keep editing</Button>
          <Button color="error" onClick={handleConfirmDiscard}>
            Discard changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* 캠페인 삭제 확인 — 수정과 달리 되돌릴 방법이 없어서(Discard처럼 "그냥
          닫으면 원래 저장값이 남아있는" 게 아니라 데이터 자체가 사라짐) 별도
          Dialog로 한 번 더 확인한다. */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this campaign?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {selectedCampaign?.name} and its performance data will be permanently deleted. This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Delete Campaign
          </Button>
        </DialogActions>
      </Dialog>

      {/* 캠페인 상세 Drawer */}
      <Drawer anchor="right" open={Boolean(selectedCampaign)} onClose={requestCloseDrawer}>
        {selectedCampaign && (
          <Box sx={{ p: 3, width: 440, boxSizing: 'border-box' }}>
            {/* 썸네일/이름/View Ad 링크는 저장된 selectedCampaign이 아니라 지금 폼에서
                편집 중인 editCampaignValues를 그대로 보여준다 — CampaignForm 안의
                미리보기는 이미 실시간인데 여기만 저장 전까지 안 바뀌면, 방금 입력한
                값이 "반영이 안 됐다"는 착각을 준다. thumbnailUrl(업로드 전용
                이미지)과 creativeUrl(View Ad 링크)은 서로 다른 필드다. */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CampaignThumbnail
                thumbnailUrl={editCampaignValues.thumbnailUrl}
                name={editCampaignValues.name}
                platform={editCampaignValues.platform}
                size={56}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {editCampaignValues.name}
                </Typography>
                {editCampaignValues.creativeUrl && (
                  <Tooltip title={editCampaignValues.creativeUrl}>
                    <Button
                      component="a"
                      href={editCampaignValues.creativeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                      sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                    >
                      View Ad
                    </Button>
                  </Tooltip>
                )}
              </Box>
              {/* Duplicate·Delete 둘 다 Campaign Details 폼(아래)이 아니라
                  여기(캠페인 헤더)에 둔다 — 사용자 입장에서 둘 다 "이 폼의
                  필드 하나"가 아니라 "이 캠페인 자체"에 대한 액션으로
                  읽힌다는 피드백(Delete는 실제 삭제 범위도 폼 밖의 Budget
                  Pacing·Performance까지 포함해 스코프가 아예 다르고,
                  Duplicate는 데이터상 폼 필드만 복제하긴 하지만 개념적으로는
                  "이 캠페인을 복제"라는 같은 급의 레코드 액션이다). 캠페인
                  자체를 나타내는 헤더에 나란히 두면 엔터프라이즈 툴들의
                  "레코드 액션은 헤더/메뉴에" 관행과도 일치. 좁은 헤더 폭
                  안에서 텍스트 라벨까지 넣으면 이름이 더 잘리므로
                  아이콘+Tooltip으로 대체 — CampaignTable의 View Ad
                  아이콘 버튼과 같은 패턴. */}
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, alignSelf: 'flex-start' }}>
                <Tooltip title="Duplicate for other platform">
                  <IconButton
                    size="small"
                    onClick={handleDuplicateForOtherPlatform}
                    aria-label="Duplicate for other platform"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Campaign">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteConfirmOpen(true)}
                    aria-label="Delete Campaign"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* 캠페인 자체 필드 편집 — 성과 입력(Performance)과 저장 버튼·form이
                분리되어 있다. 생성 폼과 동일한 CampaignForm/검증을 재사용한다.
                form으로 감싸서 Enter가 이 섹션의 저장만 트리거하게 한다. */}
            <form onSubmit={(e) => { e.preventDefault(); if (canSaveCampaignEdit) handleSaveCampaignEdit(); }}>
              {/* Drawer 안에 "Campaign Details"/"Performance" 두 개의 독립된 폼(저장
                  버튼도 따로)이 이어붙어 있는데, 이 레벨1 라벨과 그 아래 PerformanceForm의
                  Core Metrics/Video Metrics/Reporting Info(레벨2, SectionLabel) 컴포넌트가
                  둘 다 같은 overline 스타일이라 위계가 안 읽힌다는 피드백으로 레벨1은
                  bold+text.primary로 무게를 올려 구분한다. */}
              <Typography variant="overline" sx={{ display: 'block', mb: 1, fontWeight: 700, color: 'text.primary', letterSpacing: '0.08em' }}>
                Campaign Details
              </Typography>
              {/* key={selectedCampaignId} — 리스트의 다른 행이나 알림을 클릭하면
                  Drawer를 닫지 않고 같은 자리에서 selectedCampaignId만 바뀐다. key가
                  없으면 CampaignForm(과 그 안의 DateRangeField)이 리마운트되지 않고
                  props만 갱신되는데, DateRangeField는 캘린더에 지금 보여줄 달을
                  useState(initial)로 마운트 시점에만 잡기 때문에 다음 캠페인 날짜로
                  안 따라가고 이전 캠페인의 달을 계속 보여주는 버그가 있었다. key를
                  주면 캠페인이 바뀔 때마다 완전히 새로 마운트돼서 항상 그 캠페인의
                  달로 정확히 시작한다. */}
              <CampaignForm
                key={selectedCampaignId}
                stores={stores}
                accounts={adAccounts}
                values={editCampaignValues}
                onChange={(field, value) => setEditCampaignValues((v) => ({ ...v, [field]: value }))}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2, mb: 3 }}>
                <Button type="submit" size="small" variant="contained" disabled={!canSaveCampaignEdit} sx={{ boxShadow: 'none' }}>
                  Save Campaign Details
                </Button>
              </Box>
            </form>

            {/* Campaign Details(설정 폼)와 Budget Pacing+Performance(추적 데이터)는
                서로 다른 저장 버튼을 가진 별개의 정보 묶음인데 경계가 없어 하나로
                이어붙어 보인다는 피드백 — Divider로 그 경계를 명시한다. */}
            <Divider sx={{ mb: 3, borderColor: 'divider' }} />

            {selectedCampaign.effectiveStatus === 'active' && (
              <PacingIndicator
                {...calcBudgetPacing(selectedCampaign, Number(performanceValues.spend) || 0, TODAY)}
                budgetPlanned={selectedCampaign.budgetPlanned}
                budgetDaily={selectedCampaign.budgetDaily}
                spend={Number(performanceValues.spend) || 0}
                sx={{ mb: 3 }}
              />
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSavePerformance(); }}>
              <Typography variant="overline" sx={{ display: 'block', mb: 1, fontWeight: 700, color: 'text.primary', letterSpacing: '0.08em' }}>
                Performance
              </Typography>
              <PerformanceForm
                goal={selectedCampaign.goal}
                values={performanceValues}
                onChange={(field, value) => setPerformanceValues((v) => ({ ...v, [field]: value }))}
              />
              {/* 플랫폼이 자동 수집한 지표. 입력 폼 바로 아래 두되 form 안에 남긴다 —
                  같은 "이 캠페인의 성과"라는 묶음이고, 위는 사람이 넣는 값, 아래는
                  고칠 수 없는 값이라는 대비가 붙어 있을 때 가장 잘 읽힌다.
                  수집된 지표가 하나도 없으면 컴포넌트가 스스로 아무것도 안 그린다. */}
              <PlatformMetricList metrics={performanceValues} sx={{ mt: 3 }} />
              {/* Campaign Details의 Save 버튼과 크기를 맞춘다(size="small") — 같은
                  Drawer 안에서 "저장" 역할을 하는 버튼끼리 높이가 다르면 안 된다. */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                <Button type="button" size="small" onClick={requestCloseDrawer}>Close</Button>
                <Button type="submit" size="small" variant="contained" sx={{ boxShadow: 'none' }}>
                  Save Performance
                </Button>
              </Box>
            </form>
          </Box>
        )}
      </Drawer>

      <SnackbarComponent />
    </Box>
  );
}
