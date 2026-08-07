import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
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
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RestoreIcon from '@mui/icons-material/Restore';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';

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

import { getEffectiveStatus, calcBudgetPacing, budgetPaceRatio, effectiveBudgetPlanned, calcAutoBudgetPlanned, campaignGroupKey, daysSince, effectiveEndDate, hasAnyMetricValue, ALERT_SEVERITY, ALERT_TYPE, MANUAL_STATUS, TARGET_SCOPE, PLATFORM, GOAL } from '../../data/schema';
import { usePaidAdsStore, PaidAdsStoreContext } from './usePaidAdsStore';
import { useSyncRuns } from './useSyncRuns';
import { PAGE_GUTTER_X, campaignInDateRange, generateId, inferStoreIdFromName, adsManagerUrl } from './paidAdsPageUtils';
import { useSnackbar } from '../../hooks/useSnackbar';

const TAB_GROUPS = {
  all: ['active', 'planned', 'ended', 'ended_early', 'archived'],
  active: ['active'],
  planned: ['planned'],
  ended: ['ended', 'ended_early', 'archived'],
};

/**
 * "Now" 뷰(기본 탭)의 시간 창. 실데이터 기준 전체 137건 중 130건이 종료
 * 캠페인이라, 전체 목록이 기본이면 첫 화면의 95%가 아카이브다 — 운영자의
 * 아침 질문("뭐 터졌나 → 지금 몇 개 도나 → 곧 시작/막 끝난 건 뭐가 있나")에
 * 맞는 조각만 기본 시야에 둔다. 값은 그룹 헤더 라벨에도 그대로 노출한다 —
 * 암묵적 컷오프는 "데이터가 사라졌다"는 오해로 돌아온다.
 */
const STARTING_SOON_DAYS = 7;
const RECENTLY_ENDED_DAYS = 14;

/** today(스토어 소유 — 실 스토어는 실제 오늘, 목 스토어는 시나리오 기준일)
    기준 부호 있는 날짜 차이(일). 미래면 양수. */
const daysFromToday = (iso, today) => Math.round((new Date(iso) - today) / 86400000);

const isStartingSoon = (c, today) =>
  c.effectiveStatus === 'planned' &&
  daysFromToday(c.startDate, today) >= 0 &&
  daysFromToday(c.startDate, today) <= STARTING_SOON_DAYS;

/**
 * 최근 종료 = 성과 입력이 아직 남아있을 수 있는 캠페인. archived는 의도적으로
 * 치운 것이라 제외한다. ended_early는 계획 종료일이 아직 미래일 수 있어서
 * (조기 종료 시점은 따로 저장하지 않음) 계획 endDate 기준으로 판정하면 계획
 * 종료일이 14일 이상 남은 캠페인을 오늘 조기 종료했을 때 active도 planned도
 * recentlyEnded도 아니게 돼 Now 뷰에서 즉시 증발한다 — "방금 끝나서 성과 입력이
 * 남은 것"이 정확히 빠지는 구멍. 수동 종료 시각의 근사치인 updatedAt을 쓴다
 * (End early 액션이 updatedAt을 갱신하므로 근사가 실제와 거의 일치한다).
 */
const isRecentlyEnded = (c, today) => {
  if (c.effectiveStatus !== 'ended' && c.effectiveStatus !== 'ended_early') return false;
  // effectiveEndDate가 조기 종료의 실제 종료일(계획 종료일 상한)을 돌려주고,
  // daysSince가 양쪽을 로컬 자정으로 맞춰 센다 — 직접 빼면 date-only 문자열이
  // UTC로 파싱돼 KST 같은 지역에서 하루가 밀린다(schema.js 주석 참고).
  return Math.abs(daysSince(effectiveEndDate(c), today)) <= RECENTLY_ENDED_DAYS;
};

const isInNowView = (c, today) =>
  c.effectiveStatus === 'active' || isStartingSoon(c, today) || isRecentlyEnded(c, today);

/**
 * Event 필터의 "태그 없음" 센티널. Event를 1급 필터로 올리면 태그 안 된
 * 캠페인(주로 동기화로 들어온 것)이 어떤 옵션에도 안 걸리는 사각이 생기는데,
 * 그건 숨길 버그가 아니라 드러나야 할 운영 부채라 옵션으로 받아준다.
 */
const NO_EVENT = '(no-event)';

// All 탭 안에서 상태가 뒤섞여 보이지 않도록(예: 알림 없는 Ended가 알림 없는
// Active보다 위로 올라오는 것 방지) 정렬 1순위로 쓴다 — 개별 상태 탭에서는
// 한 그룹만 걸러진 상태라 이 값이 전부 같아서 기존 정렬(severity→종료일)
// 결과에 영향을 주지 않는다.
const STATUS_GROUP_ORDER = { active: 0, planned: 1, ended: 2, ended_early: 2, archived: 2 };

const HIGH_SEVERITY_TYPES = ['ending_soon', 'budget_pacing', 'missing_performance', 'no_results'];

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

/**
 * 생성 폼(New Campaign Dialog)과 수정 폼(캠페인 Drawer)이 같은 필수 필드 규칙을 쓴다.
 * Event(campaignGroup)는 모든 캠페인이 어떤 상위 이벤트에 속하는지 태깅되어야
 * 한다는 운영 방침이라 optional이 아니라 필수다.
 *
 * 통과/실패가 아니라 "무엇이 비었는지"를 돌려준다 — 예전엔 boolean만 주고 Save
 * 버튼을 disabled로 잠갔는데, 동기화로 들어온 캠페인은 Event가 없고 매장도 못
 * 붙은 경우가 있어서 무엇을 고치든 버튼이 영원히 잠겨 있었다(실사용 버그 리포트:
 * "썸네일을 올려도, 아무 필드를 고쳐도 저장이 안 된다"). 이유를 말하지 않는
 * 비활성 버튼은 고장과 구분되지 않는다.
 */
function missingRequiredFields(values, { isNew = true } = {}) {
  const missing = [];
  if (!values.name) missing.push('Campaign Name');
  /* Event는 **생성할 때만** 필수다.
   *
   * 편집에서도 막았더니, 썸네일 하나 올리려는 사람이 Event를 분류하는 게 아니라
   * 저장을 통과시킬 아무 문자열을 넣게 된다("misc", "-", 캠페인 이름 복사). 그러면
   * Event 필터에 의미 없는 그룹이 생기는데, 빈 값은 "아직 태그 안 됨"이라고 정직하게
   * 말하지만 억지로 채운 값은 태그된 척한다 — 이 규칙이 지키려던 축을 오히려 망친다.
   *
   * 게다가 동기화(sync-campaigns의 resolveEventGroup)는 이벤트를 못 뽑으면 그냥
   * null로 저장한다. 기계는 태그 없는 캠페인을 자유롭게 만드는데 사람만 손을 못 대는
   * 모순이었다. 태그 없는 캠페인을 드러내는 장치는 이미 따로 있다 — Event 필터의
   * "No Event" 옵션. 막는 대신 보이게 하는 쪽이 이 프로젝트가 이미 고른 답이다.
   * 저작 시점(생성)에는 비용이 거의 없으므로 거기서만 부채를 막는다.
   */
  if (isNew && !values.campaignGroup) missing.push('Event');
  if (!values.accountId) missing.push('Account');
  if (!values.startDate) missing.push('Start Date');
  if (!values.endDate) missing.push('End Date');
  // 0은 비어 있는 게 아니라 유효한 값이다 — 일일 예산만 쓰는 캠페인은 총액이
  // 안 와서 0으로 저장된다(sync-campaigns가 lifetime_budget 없으면 0을 넣는다).
  // truthy 검사로 두면 그런 캠페인이 통째로 저장 불가가 된다.
  if (values.budgetPlanned === '' || values.budgetPlanned == null) missing.push('Planned Budget');
  if (values.targetScope !== TARGET_SCOPE.ALL_STORES && (values.targetStoreIds ?? []).length === 0) {
    missing.push('Target Stores');
  }
  return missing;
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
    today,
    isLoading,
    error,
    refresh,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    upsertPerformanceRecord,
  } = usePaidAdsStore();

  // 동기화 상태를 매일 진입점인 이 화면까지 끌어올린다 — cron이 하루 1회라
  // 실패하면 그날 데이터가 통째로 비는데, 그 신호가 Settings(가끔 가는
  // 유틸리티 화면)에만 격리돼 있으면 낡은 spend로 pacing을 판단하게 된다.
  // 스토어가 주입된 환경(Storybook)에서는 백엔드가 없으므로 조회하지 않는다.
  const injectedStore = useContext(PaidAdsStoreContext);
  const { lastSuccessAt, recentFailures } = useSyncRuns(!injectedStore);

  const [tab, setTab] = useState(() => loadLastView()?.tab ?? 'now');
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
  // 쓰기 진행 중 재진입 가드 — 저장/삭제가 도는 동안 같은 요청이 두 번 나가는 것을 막는다.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
    () => campaigns.map((c) => ({ ...c, effectiveStatus: getEffectiveStatus(c, today) })),
    [campaigns, today]
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

  /**
   * Reports 페이지 등 외부에서 /dashboard?campaign=ID로 들어왔을 때 딥링크를 한 번만
   * 소비한다 — 이후로는 selectedCampaignId(로컬 state)가 유일한 소스다. URL과 state를
   * 둘 다 진실 소스로 두면 동기화 버그가 생기므로 읽고 나면 쿼리를 지운다.
   *
   * 마운트 즉시가 아니라 **데이터가 도착한 뒤에** 연다. 예전엔 deps []로 마운트에서
   * 바로 소비했는데, 그 시점의 campaigns는 아직 빈 배열(Supabase 응답 전)이라
   * openCampaignDrawer가 캠페인을 못 찾고 빈 폼을 채웠다 — Reports에서 행을 클릭하면
   * 필드가 전부 비고 썸네일에 '?'만 뜨는 버그로 나타났다(실사용 리포트). 소비 여부는
   * ref로 잠가서, 로딩이 끝난 뒤 campaigns가 갱신돼도 다시 열리지 않게 한다.
   */
  const deepLinkCampaignId = searchParams.get('campaign');
  const hasConsumedDeepLink = useRef(false);

  useEffect(() => {
    if (!deepLinkCampaignId || hasConsumedDeepLink.current || isLoading) return;
    // 조회가 실패하면 스토어는 빈 배열 그대로 로딩만 끝난다. 그 상태에서 소비하면
    // 백엔드 오류를 "삭제된 캠페인"으로 오진하고, 딥링크까지 지워서 상단 배너의
    // Retry로 데이터를 되살려도 Drawer가 영영 안 열린다. 오류일 때는 건드리지 않고
    // 링크를 남겨둔다 — 재조회가 성공하면 그때 열린다.
    if (error) return;

    hasConsumedDeepLink.current = true;
    if (campaigns.some((c) => c.id === deepLinkCampaignId)) {
      openCampaignDrawer(deepLinkCampaignId);
    } else {
      // 삭제된 id — 빈 Drawer를 여는 대신 사실을 말한다.
      notify('That campaign could not be found.', 'error');
    }
    // campaign 파라미터만 지운다 — setSearchParams({})는 다른 쿼리까지 날린다.
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('campaign');
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkCampaignId, isLoading, error, campaigns]);

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

  // 탭(상태) 자체를 뺀 나머지 필터(Platform/Store/Campaign Group/기간) — 리스트와
  // 탭 배지 숫자가 반드시 같은 기준으로 캠페인을 세야 한다. 예전엔 탭 배지가 이
  // 필터들을 전혀 반영하지 않고 항상 전체 캠페인 기준으로 고정돼서, By Store로
  // 매장을 좁혀도(리스트는 정확히 줄어드는데) "Active (6)"이 안 바뀌는 불일치가
  // 있었다 — 매장을 클릭한 사람 입장에선 배지 숫자와 실제로 보이는 행 수가
  // 달라서 데이터가 빠진 것처럼 보였다(실사용 버그 리포트로 발견).
  const matchesGroupFilters = (c) =>
    (!groupValues.platform || c.platform === groupValues.platform) &&
    (!groupValues.store || c.targetScope === TARGET_SCOPE.ALL_STORES || c.targetStoreIds.includes(groupValues.store)) &&
    (!groupValues.campaignGroup ||
      (groupValues.campaignGroup === NO_EVENT
        ? !c.campaignGroup
        : campaignGroupKey(c) === groupValues.campaignGroup)) &&
    campaignInDateRange(c, dateRange);

  // 상태 탭 라벨용 개수 — 위 필터를 그대로 적용해서, 탭을 눌렀을 때 실제로
  // 보일 행 수와 배지 숫자가 항상 일치하게 한다.
  const nowCount = campaignsWithStatus.filter((c) => isInNowView(c, today) && matchesGroupFilters(c)).length;
  const activeCount = campaignsWithStatus.filter((c) => c.effectiveStatus === 'active' && matchesGroupFilters(c)).length;
  const plannedCount = campaignsWithStatus.filter((c) => c.effectiveStatus === 'planned' && matchesGroupFilters(c)).length;
  const endedCount = campaignsWithStatus.filter((c) => TAB_GROUPS.ended.includes(c.effectiveStatus) && matchesGroupFilters(c)).length;
  const allCount = campaignsWithStatus.filter((c) => matchesGroupFilters(c)).length;

  /**
   * KPI는 금액이 아니라 라이프사이클 카운트다. 이 결정은 두 번 뒤집혔으므로
   * 근거를 남긴다:
   *
   * 1차 — 개수만 있던 시절, "지금 얼마나 썼나를 보려면 카드를 일일이 열어야
   * 한다"는 이유로 Active Budget/Active Spend 금액 KPI를 넣었다.
   *
   * 2차 — 그 금액을 실무에서 아무도 안 봤다. Active Budget이 $0으로
   * 깨진 채 떠 있어도 아무도 신고하지 않은 것이 그 증거다(깨진 숫자를 계속
   * 노출하면 대시보드 전체의 신뢰가 같이 무너진다). 이 팀의 실제 질문은
   * "지금 몇 개가 돌고, 곧 뭐가 시작되고, 방금 뭐가 끝났나"다. 금액은
   * Reports(합계·CPM)와 pacing 알림(초과 집행 예외)이라는 제자리가 있다.
   *
   * 3차(현재) — 전역 카운트에서 필터 반영 카운트로. "KPI는 필터와 무관한
   * 전역 값"으로 뒀었는데, 클릭 목적지인 탭 배지는 필터를 반영하므로
   * "Starting Soon 3"을 클릭하면 "Planned (9)"에 도착하는 불일치가 생겼고,
   * 세션 간 저장되는 필터가 이 어긋남을 증폭했다(어제 걸어둔 필터를 잊은 채
   * 오늘 숫자를 클릭하는 경우). 탭 배지 정합성을 고치며 세운 원칙 —
   * "클릭한 숫자와 도착한 행 수는 일치해야 한다" — 을 KPI에도 적용한다.
   * 클릭 목적지도 같은 이유로 조정: Starting Soon/Recently Ended는 상태
   * 탭(Planned/Ended 전체)이 아니라 Now 탭의 같은 이름 그룹(동일한 시간 창
   * 조각)으로 보내서, 클릭한 숫자가 그룹 헤더에 그대로 다시 보이게 한다.
   */
  const recentlyEndedCount = campaignsWithStatus.filter((c) => isRecentlyEnded(c, today) && matchesGroupFilters(c)).length;
  // 값이 0이면 클릭을 떼어낸다(KpiBar는 onClick 있는 항목만 클릭 가능) —
  // "Starting Soon 0"을 눌렀는데 Now 탭의 다른 그룹들(Live·Recently Ended)이
  // 나오면 0이라던 숫자에서 뭔가가 나온 것처럼 보인다(실사용 피드백).
  // 0개짜리 목적지로 보내는 클릭은 어디로 보내든 정답이 없으므로 비활성이 맞다.
  const countKpi = (label, value, target, sub) => ({
    label,
    value,
    sub,
    onClick: value > 0 ? () => setTab(target) : undefined,
  });
  /* 캠페인 단위 고긴급 알림. Needs Attention KPI와 Action Required 그룹이 이걸
     쓴다 — 둘 다 "행"으로 이어지는 자리라, 클릭한 숫자와 도착한 행 수가 맞아야
     한다는 이 화면의 원칙이 여기 걸려 있다. */
  const highSeverityAlerts = alerts.filter((a) => HIGH_SEVERITY_TYPES.includes(a.type));

  /* 벨은 다르다. 계정 단위 알림(청구 문턱)은 캠페인 행이 없어서 KPI에 넣으면
     "1을 눌렀는데 해당하는 행이 없는" 상태가 된다. 대신 벨에는 넣는다 — 어딘가
     한 곳에서는 반드시 보여야 하고, 벨은 목록이 아니라 알림함이라 행이 없어도
     된다. 클릭하면 캠페인 드로어가 아니라 Settings로 보낸다. */
  const accountAlerts = alerts.filter((a) => a.accountId && !a.campaignId);
  const bellAlerts = [...highSeverityAlerts, ...accountAlerts];

  /* 4차 — 첫 자리를 "손댈 것이 있나"로 바꾼다. Starting Soon은 이 계정에서
     사실상 항상 0인데(광고를 미리 등록하지 않고 플랫폼에서 만든 뒤 동기화되는
     운영 방식이라 planned 상태 자체가 안 생긴다) 화면 최상단 3분의 1을 차지하고
     있었고, 0은 어떤 결정도 바꾸지 못한다(실사용 피드백으로 두 번 지적됨).
     대신 알림 건수를 올린다 — 이 대시보드를 여는 세 질문("무슨 일인가 / 왜 /
     뭘 해야 하나") 중 마지막에 답하는 유일한 숫자이고, 0일 때조차 "확인했고
     이상 없다"는 정보를 준다(아래 all-clear 줄과 짝). 클릭하면 그 캠페인들이
     모인 Now 탭으로 간다. */
  /* sub는 값에 상관없이 항상 "무엇을 검사한 결과인가"를 말한다. 0일 때는 그것만으로
     "확인했고 아무것도 안 걸렸다"가 되고(예전엔 목록 위에 따로 문장을 띄웠는데,
     그 문장은 0일 때만 존재하고 스크롤과 함께 사라지는 반면 이 툴바는 sticky라
     어느 위치에서든 같은 답을 준다), 0이 아닐 때는 그 숫자가 어느 범위의 문제를
     세는지 말해준다. 검사 범위는 HIGH_SEVERITY_TYPES 세 가지다 — 예전 문장은
     "budgets are pacing within range"라고만 해서 나머지 둘을 빠뜨렸다. */
  const kpiItems = [
    countKpi('Needs Attention', highSeverityAlerts.length, 'now', 'budget · timing · reporting'),
    countKpi('Live Now', activeCount, 'active'),
    countKpi('Recently Ended', recentlyEndedCount, 'now', `last ${RECENTLY_ENDED_DAYS} days`),
  ];

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
      .map((a) => ({ type: a.type, text: a.message, severity: ALERT_SEVERITY[a.type] }));

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
      // 'now'는 상태 집합이 아니라 시간 창 조각이라 TAB_GROUPS로 표현이 안 된다
      if (tab === 'now' ? !isInNowView(c, today) : !TAB_GROUPS[tab].includes(c.effectiveStatus)) return false;
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
  // 사람이 입력한 링크가 없을 때 쓰는 대체 링크(광고 관리자). 저장값 기준이라
  // 편집 중인 폼 값이 아니라 selectedCampaign을 본다.
  const selectedCampaignAdsManagerUrl = adsManagerUrl(
    selectedCampaign,
    adAccounts.find((a) => a.id === selectedCampaign?.accountId)
  );

  // Save & Next의 목적지 — 지금 보고 있는 리스트(filteredCampaigns) 순서에서
  // 성과 레코드가 아직 없는 다음 캠페인. 성과 입력은 이 앱의 일일 핵심 반복
  // 작업인데 캠페인마다 행 클릭→Drawer→저장→닫기를 왕복해야 했다(엔터프라이즈
  // 리뷰) — 저장 직후 같은 Drawer에서 다음 미입력 캠페인으로 바로 넘어가면
  // 왕복이 사라진다. 현재 위치 뒤쪽을 먼저 찾고 없으면 앞쪽으로 감는다.
  const nextMissingPerformanceId = (() => {
    if (!selectedCampaignId) return null;
    const hasRecord = (id) => performanceRecords.some((p) => p.campaignId === id);
    const currentIndex = filteredCampaigns.findIndex((c) => c.id === selectedCampaignId);
    const ordered = [...filteredCampaigns.slice(currentIndex + 1), ...filteredCampaigns.slice(0, Math.max(currentIndex, 0))];
    return ordered.find((c) => c.id !== selectedCampaignId && !hasRecord(c.id))?.id ?? null;
  })();

  const newCampaignMissing = missingRequiredFields(newCampaignValues);
  const editCampaignMissing = missingRequiredFields(editCampaignValues, { isNew: false });
  // 저장을 막지는 않되, 태그가 없으면 그 사실과 결과를 말해준다.
  const isEditedCampaignUntagged = Boolean(selectedCampaignId) && !editCampaignValues.campaignGroup;
  const canSaveCampaign = newCampaignMissing.length === 0;
  // 빈 폼 저장이 미보고 알림을 데이터 없이 해제하는 것을 막는다(handleSavePerformance 참고).
  const canSavePerformance = hasAnyMetricValue(performanceValues);
  const canSaveCampaignEdit = editCampaignMissing.length === 0;

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

  // 쓰기 핸들러 공통 규칙 — 스토어의 쓰기 함수는 실패 시 falsy를 돌려준다.
  // 예전엔 결과를 await하지 않고 무조건 폼을 닫고 성공 스낵바를 띄웠는데,
  // 그러면 insert가 실패해도 "저장됨"이라는 거짓 확인과 함께 입력값이 통째로
  // 유실된다(엔터프라이즈 리뷰 — Fiori 메시지 핸들링: 성공 확인은 실제 커밋
  // 후에만, 실패는 반드시 드러나야 한다). 실패 시 폼을 그대로 열어 둔다.
  const handleSaveCampaign = async () => {
    // 저장이 도는 동안 버튼과 Enter가 계속 살아 있어서, 연타하면 insert가 두 번
    // 나가고 id를 DB가 발급하므로 충돌로 막히지도 않는다 — 같은 캠페인이 2건 생긴다.
    if (isSubmitting) return;
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const saved = await addCampaign({
      ...newCampaignValues,
      id: generateId('camp'),
      budgetPlanned: Number(newCampaignValues.budgetPlanned),
      manualStatus: null,
      createdAt: now,
      updatedAt: now,
    });
    setIsSubmitting(false);
    if (!saved) {
      notify('Save failed — the campaign was not created. Your input is kept, try again.', 'error');
      return;
    }
    setIsFormOpen(false);
    setNewCampaignValues(emptyCampaignValues);
    // 나머지 쓰기 핸들러는 전부 성공을 알리는데 생성만 조용했다.
    notify('Campaign created');
  };

  // 캠페인 자체 필드(이름/예산/기간/타겟/goal) 저장 — 성과 입력 저장과는
  // 완전히 분리된 별도 버튼/핸들러다. 하나가 둘 다 저장하면 사용자가
  // 성과만 입력하려다 캠페인 정보까지 의도치 않게 바꿀 수 있다.
  // 저장 후에도 Drawer를 닫지 않는다(handleSavePerformance와 동일하게) — 저장
  // 버튼 하나가 "다른 쪽 폼의 미저장 변경까지 조용히 버리는" 경로가 되지 않게
  // 하기 위함. 닫는 것은 항상 requestCloseDrawer를 거친다.
  const handleSaveCampaignEdit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const saved = {
      ...editCampaignValues,
      budgetPlanned: Number(editCampaignValues.budgetPlanned),
      updatedAt: new Date().toISOString(),
    };
    const result = await updateCampaign(selectedCampaignId, saved);
    setIsSubmitting(false);
    if (!result) {
      notify('Save failed — your changes were not stored. Try again.', 'error');
      return;
    }
    setEditCampaignValues(saved);
    setOriginalCampaignSnapshot(saved);
    notify('Campaign details saved');
  };

  const handleConfirmDelete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    // 확인 다이얼로그를 먼저 닫는다 — await 뒤에 닫으면 열린 채로 남아 두 번째
    // 클릭이 그대로 나가고, 두 번째 삭제도 "성공"으로 판정돼 스낵바가 두 번 뜬다.
    setDeleteConfirmOpen(false);
    const isDeleted = await deleteCampaign(selectedCampaignId);
    setIsSubmitting(false);
    if (!isDeleted) {
      notify('Delete failed — the campaign is unchanged.', 'error');
      return;
    }
    setSelectedCampaignId(null);
    notify('Campaign deleted');
  };

  /**
   * End early / Archive / 복귀 — manualStatus(status SSOT의 유일한 수동
   * override)를 실제로 설정하는 UI 경로. 지금까지 표시·탭 분류·알림은 이
   * 상태를 아는데 설정할 방법이 없어서, budget_pacing 알림("지금도 돈이
   * 나가는 중")을 보고 Drawer를 열어도 할 수 있는 조치가 없었다 — 개념
   * 모델에만 있는 동사였다. 삭제와 달리 manualStatus를 비우면(Restore)
   * 되돌아가므로 확인 Dialog 없이 스낵바로만 알린다.
   *
   * 저장 성공 시 편집 폼과 스냅샷의 manualStatus도 같이 맞춘다 — 안 맞추면
   * 이후 "Save Campaign Details"가 폼에 남은 옛 manualStatus로 방금 바꾼
   * 상태를 조용히 되돌린다(예: End early 직후 이름을 고쳐 저장하면 캠페인이
   * 다시 active가 되는 버그).
   */
  const handleSetManualStatus = async (manualStatus) => {
    const result = await updateCampaign(selectedCampaignId, { manualStatus });
    if (!result) {
      notify('Update failed — campaign status is unchanged.', 'error');
      return;
    }
    setEditCampaignValues((v) => ({ ...v, manualStatus }));
    setOriginalCampaignSnapshot((s) => (s ? { ...s, manualStatus } : s));
    if (manualStatus === MANUAL_STATUS.ENDED_EARLY) notify('Campaign ended early — it stays under Recently Ended for performance entry');
    else if (manualStatus === MANUAL_STATUS.ARCHIVED) notify('Campaign archived');
    else notify('Manual status cleared — schedule dates decide the status again');
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

  // 성공 여부를 반환한다 — Save & Next(아래)가 저장이 실제로 된 경우에만
  // 다음 캠페인으로 이동해야 하기 때문. 실패했는데 이동하면 실패한 입력이
  // Drawer 전환과 함께 조용히 사라진다.
  const handleSavePerformance = async () => {
    if (isSubmitting) return false;
    // 값이 하나도 없는 폼을 저장하면 전 필드 null인 레코드가 생기고, 그 순간
    // "성과 미보고" 알림이 데이터 없이 해제된다. Save & Next 연타로 대량 재현되는
    // 경로라 저장 자체를 막는다(버튼도 같은 조건으로 비활성).
    if (!hasAnyMetricValue(performanceValues)) {
      notify('Enter at least one metric before saving.', 'error');
      return false;
    }
    setIsSubmitting(true);
    const saved = {
      ...performanceValues,
      campaignId: selectedCampaignId,
      id: performanceValues.id ?? generateId('perf'),
    };
    const result = await upsertPerformanceRecord(saved);
    setIsSubmitting(false);
    if (!result) {
      notify('Save failed — performance was not stored. Try again.', 'error');
      return false;
    }
    setPerformanceValues(saved);
    setOriginalPerformanceSnapshot(saved);
    notify('Performance saved');
    return true;
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
          {/* 마지막 성공 이후의 동기화 실패 — Settings에만 있으면 실패한 날
              아침에 낡은 숫자를 믿고 판단하게 된다. 상세·재시도는 Settings 몫. */}
          {recentFailures.length > 0 && (
            <Chip
              component={RouterLink}
              to="/settings"
              clickable
              size="small"
              color="error"
              variant="outlined"
              label={`Sync failed (${recentFailures.length})`}
            />
          )}
          {/* 기준 시각은 동기화 성공 시각(lastSuccessAt)이 우선 — 예전엔 캠페인
              updatedAt 최댓값이라, 동기화가 죽어도 캠페인을 편집만 하면 갱신돼
              오히려 신선해 보였다. 동기화 기록이 없는 환경(Storybook, 연결 전)
              에서만 기존 값으로 대체한다. */}
          <LastUpdatedBar
            label={lastSuccessAt ? 'Last synced' : 'Last updated'}
            lastUpdatedAt={lastSuccessAt ?? lastUpdatedAt}
          />
          <IconButton
            size="small"
            onClick={(event) => setBellAnchorEl(event.currentTarget)}
            aria-label="Show alerts"
          >
            <Badge badgeContent={bellAlerts.length} color="error">
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
                <AlertBanner
                  alerts={bellAlerts}
                  onAlertClick={(alert) => {
                    // 계정 알림은 열 드로어가 없다 — 그 계정을 손볼 수 있는 곳으로 보낸다.
                    if (!alert.campaignId) { navigate('/settings'); return; }
                    openCampaignDrawer(alert.campaignId);
                  }}
                />
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
                // 흰색을 직접 쓰지 않고 버튼 대비색에서 파생시킨다(반투명 contrastText 토큰이 없어 alpha로 만든다).
                borderColor: alpha(theme.palette.primary.contrastText, 0.5),
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
            {/* Now가 기본이고 All은 맨 뒤 — 실데이터 기준 All의 95%가 종료
                캠페인이라, 전체 목록은 기본 시야가 아니라 아카이브 조회다.
                데이터를 숨기는 게 아니라 기본값만 좁힌다(All은 항상 한 번의
                클릭 거리에 있다). */}
            {/* "Now"였는데 이 탭은 2주 전에 끝난 캠페인까지 담는다 —
                이름이 내용을 배신했다("지금"이 왜 2주 전을 포함하는지 첫
                사용자가 알아낼 방법이 없다). 담고 있는 게 실제로 무엇인지
                (오늘 기준 시간 창)를 이름으로 말한다.

                값이 0인 탭은 비활성으로 둔다 — 눌러도 빈 화면이 나오는 선택지는
                제약(constraint)으로 막는 게 맞다. 배지 숫자는 남으므로 "없다"는
                정보 자체는 그대로 읽힌다. */}
            <Tab label={`This Period (${nowCount})`} value="now" sx={{ textTransform: 'none' }} />
            <Tab label={`Active (${activeCount})`} value="active" disabled={activeCount === 0} sx={{ textTransform: 'none' }} />
            <Tab label={`Planned (${plannedCount})`} value="planned" disabled={plannedCount === 0} sx={{ textTransform: 'none' }} />
            <Tab label={`Ended (${endedCount})`} value="ended" disabled={endedCount === 0} sx={{ textTransform: 'none' }} />
            <Tab label={`All (${allCount})`} value="all" sx={{ textTransform: 'none' }} />
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
            /* Event가 맨 앞 — 이 팀의 1차 질문은 "어느 이벤트의 캠페인인가"고
               (Reports가 Store 필터를 뺄 때 이미 확정한 위계), Platform-first는
               데이터 소스(Meta/TikTok API) 구조가 UI에 새어 나온 순서였다.
               같은 이벤트의 Meta·TikTok 형제를 플랫폼으로 먼저 가르면 어차피
               다시 합쳐 봐야 한다. "No Event"는 태그 안 된 캠페인(주로 동기화
               유입)을 드러내는 옵션 — 태그가 없는 것도 조회돼야 채워진다. */
            ...(campaignGroupOptions.length > 0
              ? [{
                  key: 'campaignGroup',
                  label: 'Event',
                  options: [
                    ...campaignGroupOptions,
                    ...(campaigns.some((c) => !c.campaignGroup)
                      ? [{ value: NO_EVENT, label: 'No Event' }]
                      : []),
                  ],
                }]
              : []),
            {
              key: 'platform',
              label: 'Platform',
              variant: 'segmented',
              options: [
                { value: PLATFORM.META, label: 'Meta' },
                { value: PLATFORM.TIKTOK, label: 'TikTok' },
              ],
            },
            { key: 'store', label: 'Store', options: stores.map((s) => ({ value: s.id, label: s.id })) },
          ]}
          groupValues={groupValues}
          onGroupChange={(key, value) => setGroupValues((v) => ({ ...v, [key]: value }))}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          sx={{ mb: 3 }}
        />

        {/* Campaign Group(Event)으로 필터링 중일 때만 합산 예산/집행액을
            보여준다. 상단 KPI에서 금액을 뺀 뒤로 대시보드에서 돈이 보이는
            자리는 여기뿐인데, 이건 의도다 — 항상 떠 있는 전역 합계는 아무도
            안 봤지만, "이 이벤트에 얼마 쓰고 있나"는 이벤트를 고른 사람이
            바로 다음에 묻는 질문이다. campaignsInGroup은 탭(상태)과 무관하게
            그룹 전체를 세므로, 지금 Active 탭을 보고 있어도 이미 끝난 단계의
            예산까지 포함한 진짜 전체 합계가 뜬다. */}
        {/* NO_EVENT는 진짜 그룹이 아니라 "태그 없음" 조회라 합산 요약이 무의미하다 */}
        {groupValues.campaignGroup && groupValues.campaignGroup !== NO_EVENT && (
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

        {/* 백엔드 오류는 반드시 화면에 드러낸다 — 조회 실패 시 스토어가 빈
            배열로 남아, 배너 없이는 "Now (0) · No campaigns match"라는 건강한
            빈 화면으로 위장된다(캠페인 없음/백엔드 다운/로딩 중을 구분 불가 —
            운영 대시보드에서 가장 위험한 무음 실패). 쓰기 실패도 같은 error에
            잡히므로 문구는 조회에 한정하지 않는다. */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={refresh}>
                Retry
              </Button>
            }
          >
            Something went wrong talking to the backend — data shown may be incomplete or stale. ({error})
          </Alert>
        )}

        {/* 로딩과 "결과 없음"을 구분한다 — 로드가 끝나기 전에는 빈 상태 문구
            대신 스켈레톤. 행 높이는 CampaignTable 2줄 행 실측(~72px) 근사. */}
        {isLoading && (
          <Box aria-label="Loading campaigns" role="status">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1 }} />
            ))}
          </Box>
        )}

        {/* 아바타 없는 2줄 리스트 — 실제 Influencer Tracking Dashboard 레퍼런스
            기준(CampaignTable 자체 주석 참고). CampaignCard 그리드는 삭제하지
            않고 재사용 후보로 남겨뒀다.

            알림 걸린 캠페인은 그룹 헤더("Action Required (N)")로 묶는다 —
            정렬이 이미 알림을 맨 위로 올리고 있었지만(severity → 종료일),
            어디까지가 알림 클러스터인지 경계가 없어서 "위에 있는 게 우연히
            급한 것"인지 "급한 것만 모아둔 것"인지 화면만 봐서는 구분이 안
            됐다. 레퍼런스의 ACTION REQUIRED 10 / UPCOMING 8 구조와 같은
            판단이되, 접기·그룹 내 로컬 필터까지는 안 간다 — 캠페인 10여 개
            규모에서는 접힌 그룹이 오히려 "안 보이는 데이터"를 만든다.
            알림이 하나도 없으면 헤더 없이 예전처럼 평평한 리스트다. */}
        {!isLoading && (() => {
          const campaignRows = filteredCampaigns.map((c) => ({
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
            /* 페이스는 여기서 계산해 행에 실어준다 — 알림(15% 초과)과 같은 근거를
               쓰되, 알림은 임계를 넘을 때만 말하고 이 값은 항상 말한다. "괜찮다"를
               확인하려고 사용자가 기간·일예산·지출로 암산하던 걸 없애는 게 목적이라,
               정상 범위일 때 보이는 게 핵심이다.

               dailyBudgetRatio만 쓰면 안 된다 — 일일 예산이 있는 캠페인에만 붙어서
               Meta 쪽 상당수가 아무 신호도 못 받는다(플랫폼이 총액으로만 설정한
               캠페인). budgetPaceRatio가 알림과 같은 우선순위로 총예산 기준 대체
               경로까지 포함한다. */
            paceRatio: budgetPaceRatio(c, spendFor(c.id), today),
            status: c.effectiveStatus,
            alertBadges: alertBadgesFor(c.id),
            overlapNote: overlapNoteFor(c.id),
            thumbnailUrl: c.thumbnailUrl,
            creativeUrl: c.creativeUrl,
          }));
          /* Now 탭에서 Action Required로 끌어올릴 알림은 "지금 손대야 하는" 것만이다.
             missing_performance는 제외한다 — Recently Ended 그룹의 존재 이유가 바로
             "성과 입력이 남은 캠페인"이라 그 그룹 안에서는 중복 신호이고, 더 심각하게는
             KPI와 그룹 헤더의 숫자를 어긋나게 만든다: 미보고 창(30일)이 Recently
             Ended 창(14일)을 덮으므로 성과 미입력 최근 종료 캠페인이 100% 위로 빠져
             "Recently Ended 6"을 눌렀는데 그 그룹이 (1)이거나 아예 사라진다. 배지
             자체는 행에 그대로 보이므로 신호가 사라지는 것은 아니다.
             Now 탭이 아닌 곳에서는 종료 캠페인만 모아 보는 화면이라 미보고가
             1급 액션이 맞으므로 기존대로 전부 끌어올린다. */
          const isTriageAlert = (badge) => badge.type !== ALERT_TYPE.MISSING_PERFORMANCE;
          const actionRows = campaignRows.filter((r) =>
            tab === 'now' ? r.alertBadges.some(isTriageAlert) : r.alertBadges.length > 0
          );
          const restRows = campaignRows.filter((r) => !actionRows.includes(r));
          const groupHeaderSx = { display: 'block', mb: 0.5, color: 'text.secondary', letterSpacing: '0.08em' };

          /* Now 탭은 라이프사이클 순서로 4그룹 — 아침에 읽는 순서 그대로다
             (터진 것 → 도는 것 → 곧 시작 → 막 끝나서 성과 입력 남은 것).
             컷오프(7d/14d)는 헤더에 그대로 적는다. 다른 탭은 기존 2그룹
             (Action Required / Other) 유지 — 한 상태만 걸러진 탭에서
             라이프사이클 분할은 전부 같은 그룹이라 의미가 없다. */
          const sections =
            tab === 'now'
              ? [
                  { label: 'Action Required', rows: actionRows },
                  { label: 'Live', rows: restRows.filter((r) => r.status === 'active') },
                  {
                    label: `Starting Soon (next ${STARTING_SOON_DAYS} days)`,
                    rows: restRows.filter((r) => r.status === 'planned'),
                  },
                  {
                    label: `Recently Ended (last ${RECENTLY_ENDED_DAYS} days)`,
                    rows: restRows.filter((r) => r.status === 'ended' || r.status === 'ended_early'),
                  },
                ].filter((s) => s.rows.length > 0)
              : actionRows.length > 0
                ? [
                    { label: 'Action Required', rows: actionRows },
                    { label: 'Other Campaigns', rows: restRows },
                  ].filter((s) => s.rows.length > 0)
                : [];

          if (sections.length === 0) {
            return <CampaignTable rows={campaignRows} allCampaigns={campaigns} onRowClick={openCampaignDrawer} />;
          }
          /* "손댈 게 없다"는 여기가 아니라 상단 KPI(Needs Attention 0 +
             "budget · timing · reporting")가 말한다 — 한때 이 자리에 문장을 띄웠는데
             그 문장은 0일 때만 존재해서 스크롤과 함께 사라지는 반면 툴바는 sticky라
             어느 위치에서든 같은 답을 준다. 같은 말을 두 곳에서 하지 않는다. */
          return sections.map((section, i) => (
            <Box key={section.label} sx={{ mt: i === 0 ? 0 : 3 }}>
              <Typography variant="overline" sx={groupHeaderSx}>
                {section.label} ({section.rows.length})
              </Typography>
              <CampaignTable rows={section.rows} allCampaigns={campaigns} onRowClick={openCampaignDrawer} />
            </Box>
          ));
        })()}
      </PageContainer>

      {/* 캠페인 등록 Dialog — form으로 감싸서 Enter가 Save를 트리거하게 한다.
          Cancel은 type="button"으로 명시 — form 안의 버튼은 type을 안 주면
          기본이 submit이라, 안 붙이면 Cancel도 저장을 시도한다. */}
      <Dialog open={isFormOpen} onClose={requestCloseNewCampaignForm} maxWidth="sm" fullWidth>
        <form onSubmit={(e) => { e.preventDefault(); if (canSaveCampaign) handleSaveCampaign(); }}>
          <DialogTitle>New Campaign</DialogTitle>
          <DialogContent>
            {/* 이름에 매장 코드가 있으면 Target Store를 미리 채운다 — 서버
                (sync-campaigns)가 동기화 캠페인에 이미 적용하는 규칙과 같은
                것을 수기 등록에도 준다. 두 가지 조건을 건다: 신규 등록에서만,
                그리고 매장이 아직 비어 있을 때만. 사용자가 이미 고른 값을 이름
                수정 때문에 덮어쓰면 "내가 안 한 일을 시스템이 한" 것이 되고,
                그건 성과가 조용히 엉뚱한 매장에 귀속되는 사고로 이어진다. */}
            <CampaignForm
              stores={stores}
              accounts={adAccounts}
              values={newCampaignValues}
              onChange={(field, value) =>
                setNewCampaignValues((v) => {
                  const next = { ...v, [field]: value };
                  if (
                    field === 'name' &&
                    next.targetScope === TARGET_SCOPE.SINGLE_STORE &&
                    next.targetStoreIds.length === 0
                  ) {
                    const inferred = inferStoreIdFromName(value, stores);
                    if (inferred) next.targetStoreIds = [inferred];
                  }
                  return next;
                })
              }
              sx={{ mt: 1 }}
            />
          </DialogContent>
          {/* 무엇이 비어서 저장이 막혔는지 버튼 옆에 말한다 — 이유 없는 비활성
              버튼은 고장과 구분되지 않는다. */}
          <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {canSaveCampaign ? '' : `Required: ${newCampaignMissing.join(', ')}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button type="button" onClick={requestCloseNewCampaignForm}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={!canSaveCampaign || isSubmitting} sx={{ boxShadow: 'none' }}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </Box>
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
                {/* View Ad는 사람이 입력한 실제 게시물 링크다. 그게 없을 때는
                    저장된 외부 id로 만든 광고 관리자 링크로 대체한다 — 동기화가
                    creative_url을 못 채우는 이유(캠페인 하나에 소재가 여러 개라
                    "그 캠페인의 광고 링크"가 하나로 정해지지 않는다)는 구조적이라
                    자동 입력이 불가능하지만, 캠페인 자체를 플랫폼에서 여는 것은
                    항상 가능하다. 라벨을 달리해서 둘을 섞지 않는다 — "광고를 본다"와
                    "관리자에서 캠페인을 연다"는 다른 일이다. */}
                {editCampaignValues.creativeUrl ? (
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
                ) : (
                  selectedCampaignAdsManagerUrl && (
                    <Tooltip title="No creative link saved — opens this campaign in Meta Ads Manager">
                      <Button
                        component="a"
                        href={selectedCampaignAdsManagerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                      >
                        Open in Ads Manager
                      </Button>
                    </Tooltip>
                  )
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
                {/* 상태 전환도 Duplicate/Delete와 같은 "이 캠페인 자체"에 대한
                    레코드 액션이라 여기(헤더)에 둔다. 상태별로 지금 가능한
                    전환만 보여준다 — active는 조기 종료, 끝난 것은 아카이브,
                    수동 상태가 걸린 것은 해제(날짜 계산으로 복귀). */}
                {selectedCampaign.effectiveStatus === 'active' && (
                  <Tooltip title="End campaign early">
                    <IconButton
                      size="small"
                      onClick={() => handleSetManualStatus(MANUAL_STATUS.ENDED_EARLY)}
                      aria-label="End campaign early"
                    >
                      <StopCircleOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {(selectedCampaign.effectiveStatus === 'ended' || selectedCampaign.effectiveStatus === 'ended_early') && (
                  <Tooltip title="Archive campaign">
                    <IconButton
                      size="small"
                      onClick={() => handleSetManualStatus(MANUAL_STATUS.ARCHIVED)}
                      aria-label="Archive campaign"
                    >
                      <ArchiveOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {selectedCampaign.manualStatus && (
                  <Tooltip title="Clear manual status — let schedule dates decide">
                    <IconButton
                      size="small"
                      onClick={() => handleSetManualStatus(null)}
                      aria-label="Clear manual status"
                    >
                      <RestoreIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
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
              {/* 무엇이 비어서 저장이 막혔는지 말해준다. 저장을 막지 않는 Event는
                  대신 "태그가 없으면 어떤 일이 생기는지"를 알려준다 — 막는 대신
                  보이게 하는 쪽이 이 프로젝트가 고른 답이다(missingRequiredFields 주석). */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mt: 2, mb: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  {!canSaveCampaignEdit
                    ? `Required: ${editCampaignMissing.join(', ')}`
                    : isEditedCampaignUntagged
                      ? 'No Event tag — this campaign only shows under the "No Event" filter'
                      : ''}
                </Typography>
                <Button type="submit" size="small" variant="contained" disabled={!canSaveCampaignEdit || isSubmitting} sx={{ boxShadow: 'none' }}>
                  Save Campaign Details
                </Button>
              </Box>
            </form>

            {/* Campaign Details(설정 폼)와 Budget Pacing+Performance(추적 데이터)는
                서로 다른 저장 버튼을 가진 별개의 정보 묶음인데 경계가 없어 하나로
                이어붙어 보인다는 피드백 — Divider로 그 경계를 명시한다. */}
            <Divider sx={{ mb: 3, borderColor: 'divider' }} />

            {/* 예산이 하나도 없으면(동기화 캠페인) pacing 자체를 그리지 않는다 —
                비교할 분모가 없는데 렌더하면 "No data"라면서 바로 아래
                "($639.39 / $0)"와 "Time Elapsed 97%"를 보여주는 자기모순이
                된다(실데이터 스크린샷 리뷰로 발견). 소진 속도는 "계획 대비"
                개념이라 계획이 없으면 보여줄 것이 없다. */}
            {selectedCampaign.effectiveStatus === 'active' &&
              (selectedCampaign.budgetPlanned > 0 || selectedCampaign.budgetDaily != null) && (
              <PacingIndicator
                {...calcBudgetPacing(selectedCampaign, Number(performanceValues.spend) || 0, today)}
                // 표시용 분모도 같은 규칙 — 저장된 0을 그대로 넘기면 "$514.49 / $0"
                // 이 다시 나온다(calcBudgetPacing과 짝을 맞춘다).
                budgetPlanned={effectiveBudgetPlanned(selectedCampaign)}
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
                {/* 미입력 캠페인이 리스트에 더 남아 있을 때만 — 저장 성공 시
                    Drawer를 닫지 않고 다음 미입력 캠페인으로 바로 전환해
                    "N건 입력"의 행 클릭 왕복을 없앤다. */}
                {nextMissingPerformanceId && (
                  <Button
                    type="button"
                    size="small"
                    variant="outlined"
                    disabled={!canSavePerformance || isSubmitting}
                    onClick={async () => {
                      if (await handleSavePerformance()) openCampaignDrawer(nextMissingPerformanceId);
                    }}
                  >
                    Save & Next
                  </Button>
                )}
                <Button type="submit" size="small" variant="contained" disabled={!canSavePerformance || isSubmitting} sx={{ boxShadow: 'none' }}>
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
