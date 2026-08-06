import { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import InfluencerListRow from '../../data-display/InfluencerListRow';
import SaasKpiItem from './SaasKpiItem';
import SaasStoreSelect from './SaasStoreSelect';
import {
  ALERT_FLAGS,
  ALL_STORES,
  CONTACT_STATUSES,
  DEFAULT_INFLUENCER_FILTERS,
  PERFORMANCE_STATES,
  SCHEDULE_GROUPS,
  SHEET_STATUS,
  deriveKpiSummary,
  derivePerformanceStatus,
  deriveStores,
  isStaleVisit,
  toDisplayName,
} from '../../../data/beautymaster/schema.js';

const PLATFORM_OPTIONS = ['Instagram', 'TikTok'];
const TIER_OPTIONS = [
  { value: 'tier1', label: 'Tier 1' },
  { value: 'tier2', label: 'Tier 2' },
];
const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'kbeauty', label: 'K-Beauty' },
  { value: 'specific', label: 'Specific' },
];

/**
 * 레일 행의 시각.
 *
 * 날짜는 그룹 헤더가 말하므로 행에는 시각만 남긴다. 시트에 시각이 없으면 파싱
 * 결과가 자정이 되는데, 그걸 "12:00 AM"으로 보여주면 없는 정보를 만드는 것이라 비운다.
 *
 * @param {Influencer} inf
 * @returns {string} 예: "17:00" / "—"
 */
function formatVisitTime(inf) {
  if (!inf.scheduledTime || !inf.hasScheduledTimeOfDay) return '—';
  // 24시간제 — AM/PM이 빠져 폭이 절반으로 줄고, 자릿수가 고정돼 세로로 훑기 쉽다.
  // en-GB를 쓰는 이유는 en-US + hour12:false가 자정을 "24:00"으로 내는 엔진이 있어서다.
  return inf.scheduledTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * 좁은 레일에서 쓰는 이름 축약. "Kientazya Hawkins" → "Kientazya H."
 *
 * 표기가 정규화된 이름을 받는다 — 목록은 "Aurora Garcia"인데 레일만 "Aurora g."면
 * 같은 사람을 두 화면이 다르게 부르는 꼴이 된다.
 *
 * 말줄임("Kientazya H…")보다 성을 줄이는 쪽이 식별에 낫다 — 이름 앞부분이 온전히
 * 남기 때문이다. 전체 이름은 title로 남겨 마우스로 확인할 수 있게 한다.
 *
 * 마지막 토큰을 무조건 쓰면 괄호 같은 기호가 이니셜이 된다
 * ("Stephanie Gilliam (Robertson)" → "Stephanie (."). 그래서 뒤에서부터
 * **문자로 시작하는** 토큰을 찾는다 — 위 예는 "Stephanie G."가 된다.
 * 문자로 시작하는 토큰이 하나도 없으면 축약하지 않고 원본을 넘겨 말줄임에 맡긴다.
 *
 * @param {string} fullName
 * @returns {string}
 */
function abbreviateName(fullName) {
  const name = (fullName || '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] || '—';

  // \p{L}은 한글·라틴 등 모든 문자를 포함한다. 숫자·기호는 이니셜이 될 수 없다.
  const surname = [...parts].slice(1).reverse().find(t => /^\p{L}/u.test(t));
  if (!surname) return name;

  return `${parts[0]} ${surname[0].toUpperCase()}.`;
}

/**
 * 시트 상태 탭. 기존 InfluencerPanel의 TABS를 그대로 옮긴 것으로,
 * id는 Influencer.sheetStatus와 정확히 일치 비교한다('all'만 예외).
 */
const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: SHEET_STATUS.PROCESSING, label: 'Processing' },
  { id: SHEET_STATUS.DONE, label: 'Done' },
];

/**
 * main workspace 공통 가로 인셋 (theme.spacing 3 = 24px).
 * 필터 툴바 · 상태 탭 · 각 divider · 결과 섹션 컨테이너가 모두 이 하나의 값을 쓴다 —
 * 영역마다 제각각 padding을 두면 화면이 미묘하게 어긋나 보인다.
 */
const CONTENT_PX = 3;

/**
 * 콘텐츠 영역 폭 상한.
 *
 * 1440px 노트북을 기준으로 맞춘 값이다 — 그 화면에서는 상한에 닿지 않아 자연스럽게
 * 꽉 차고, 2560px에서는 남는 공간이 오른쪽 한 덩어리로 모인다.
 * 넓은 화면을 채우려고 폭을 늘리지 않는다: 행이 화면 전체로 늘어나면 이름과 상태
 * 사이가 1,000px 넘게 벌어져 같은 행인데 시각적으로 끊긴다.
 *
 * 레일 오른쪽 남은 공간 안에서 가운데로 놓는다 — 넓은 모니터에서 콘텐츠가
 * 왼쪽으로 쏠려 오른쪽에 큰 빈 덩어리가 생기는 것을 피한다.
 */
const CONTENT_MAX_WIDTH = 1500;

/**
 * 레일에서 쓰는 짧은 경보 라벨.
 * 이전에는 색 점(•) 하나로 "경보 있음"만 알렸는데, 어떤 문제인지 알 수 없고
 * 색·모양으로만 전달돼 텍스트 대체물이 없었다(WCAG 1.4.1).
 * 목록 쪽 상태 문구(Visit Unconfirmed 등)와 같은 어휘를 짧게 줄여 쓴다.
 */
const RAIL_ALERT_LABEL = {
  [ALERT_FLAGS.AGREEMENT_NO_ATTEND]: 'No visit',
  [ALERT_FLAGS.ATTEND_NO_COLLABO]: 'No upload',
  [ALERT_FLAGS.COLLABO_NO_CREDIT]: 'No credit',
  [ALERT_FLAGS.NO_SHOW_UNRESOLVED]: 'No-show',
  [ALERT_FLAGS.RESCHEDULE_PENDING]: 'Reschedule',
};

/**
 * 레일 행에 붙일 상태 문구. 경보가 없으면 null.
 * 여러 개면 첫 번째만 — 레일은 훑는 용도라 한 줄을 넘기지 않는다(상세는 목록·Drawer).
 *
 * @param {Influencer} inf
 * @returns {string|null}
 */
function railAlertLabel(inf) {
  const flag = inf.alertFlags.find(f => RAIL_ALERT_LABEL[f]);
  return flag ? RAIL_ALERT_LABEL[flag] : null;
}

/**
 * Action required 안의 "일 종류" 칩. 실무 리듬은 배칭이다 — "오늘은 업로드 리마인드만
 * 다 돌리자"를 지원하려면 같은 종류의 일을 골라 볼 수 있어야 한다.
 * 라벨은 행 상태 문구와 **정확히 같은 어휘**를 쓴다(행 라벨은 InfluencerListRow가 소유) —
 * 같은 것이 화면에서 두 이름으로 불리면 그때부터 학습 부담이 생긴다.
 * 순서는 긴급도: 돈(Credit) → 연락 대기 → 단계 지연 → 예정 루틴(성과 기록).
 *
 * 'perf'만 alertFlag가 아니라 D+14 파생 상태다. 처음에는 자기 섹션(Record performance)
 * 이었는데, 사용자 멘탈 모델은 "내 행동이 필요한 건 전부 Action required"였다
 * (2026-08-03 결정). 경보 채널 희석은 칩 순서와 중립 라벨 색으로 막는다.
 */
const ATTENTION_TYPES = [
  { key: 'credit', label: 'Credit Not Sent', flag: ALERT_FLAGS.COLLABO_NO_CREDIT },
  { key: 'noshow', label: 'No-show', flag: ALERT_FLAGS.NO_SHOW_UNRESOLVED },
  { key: 'reschedule', label: 'Reschedule', flag: ALERT_FLAGS.RESCHEDULE_PENDING },
  { key: 'upload', label: 'Awaiting Upload', flag: ALERT_FLAGS.ATTEND_NO_COLLABO },
  { key: 'visit', label: 'Visit Unconfirmed', flag: ALERT_FLAGS.AGREEMENT_NO_ATTEND },
  { key: 'perf', label: 'Record Performance' },
];

/**
 * 이 인플루언서의 일 종류 키. 판정 우선순위는 행 표시와 같다 —
 * 연락 경보(노쇼 > 일정변경)가 단계 라벨보다 먼저고, 경보가 하나라도 있으면
 * 성과 기록(perf)은 뒤로 밀린다(문제 해결이 루틴보다 먼저다).
 * 칩으로 골랐을 때 행에 다른 라벨이 보이면 필터를 불신하게 된다.
 */
const TYPE_PRECEDENCE = ['noshow', 'reschedule', 'credit', 'upload', 'visit'];
const TYPE_FLAG_BY_KEY = Object.fromEntries(ATTENTION_TYPES.filter(t => t.flag).map(t => [t.key, t.flag]));
function attentionTypeOf(inf) {
  const flagged = TYPE_PRECEDENCE.find(k => inf.alertFlags.includes(TYPE_FLAG_BY_KEY[k]));
  if (flagged) return flagged;
  return derivePerformanceStatus(inf)?.state === PERFORMANCE_STATES.DUE ? 'perf' : null;
}

/**
 * Visit schedule 레일 폭 — 화면 크기와 무관한 고정값.
 *
 * 레일은 콘텐츠가 아니라 인덱스다 — 어느 날 누가 있는지만 훑고, 자세한 내용은
 * 오른쪽 목록과 상세 패널이 맡는다. 날짜를 그룹 헤더로 올려 행을 한 줄로 줄였다.
 * 화면이 넓어져도 인덱스가 같이 넓어질 이유는 없으므로 고정한다.
 */
const RAIL_WIDTH = 250;

/**
 * 레일 시각 컬럼 폭. 24시간제라 "13:30" 다섯 글자가 최대치다 —
 * 접히면 행 높이가 달라지고 이름 시작 위치가 행마다 어긋난다.
 */
const TIME_COL_WIDTH = 36;

/**
 * 섹션 헤더(TODAY / PAST) 높이.
 * 날짜 헤더가 그 아래에 붙어 sticky되므로 높이를 값으로 고정해야 오프셋이 정확하다.
 * 내용에 따라 높이가 변하면 두 헤더가 겹치거나 벌어진다.
 */
const RAIL_SECTION_HEADER_HEIGHT = 28;

/**
 * 포커스 링이 요소 바깥으로 번지는 폭(accent.ring, 3px)에 1px 여유를 더한 값.
 * 링은 box-shadow라 레이아웃을 차지하지 않으므로, 조상이 overflow로 잘라내면
 * 소리 없이 사라진다. 잘릴 수 있는 컨테이너에 이만큼 자리를 만들어 둔다.
 */
const FOCUS_RING_PX = 4;

/**
 * 좌측 레일 구조 — 섹션(TODAY / UPCOMING / PAST) 안에 날짜 그룹.
 *
 * 날짜 그룹만 두면 "JUL 8"이 지난 날인지 예정인지 알 수 없다. 반대로 경과일을
 * 헤더마다 병기하면 인덱스에 같은 정보가 계속 반복된다. 그래서 방향은 섹션이
 * 한 번만 말하고, 그 아래에서 날짜가 반복 없이 묶인다.
 *
 * @param {Influencer[]} influencers
 * @returns {Array<{key,label,count,isToday,dates}>} dates는 [{key,label,items}]
 */
function buildScheduleSections(influencers) {
  const todayItems = [];
  const upcoming = {};
  const past = {};

  for (const inf of influencers) {
    const g = inf.scheduleGroup;
    if (g === 'today') {
      todayItems.push(inf);
      continue;
    }
    // 날짜가 없으면 인덱스에 놓을 자리가 없다 — 목록에서 "Date TBD"로 보인다
    if (!inf.scheduledTime || (g !== 'upcoming' && g !== 'past')) continue;

    const bucket = g === 'upcoming' ? upcoming : past;
    const t = inf.scheduledTime;
    const k = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
    if (!bucket[k]) {
      bucket[k] = {
        key: k,
        label: t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sortDate: t,
        items: [],
      };
    }
    bucket[k].items.push(inf);
  }

  const toDates = obj => Object.values(obj)
    .sort((a, b) => a.sortDate - b.sortDate)
    .map(d => ({ ...d, items: d.items.slice().sort(byScheduledTime) }));

  const sections = [
    // Today는 0건이어도 남긴다 — 빈 자리가 아니라 "오늘 없음"을 말해주기 위함
    { key: 'today', label: 'Today', isToday: true, count: todayItems.length,
      dates: [{ key: 'today-items', label: null, items: todayItems.slice().sort(byScheduledTime) }] },
    { key: 'upcoming', label: 'Upcoming', isToday: false, dates: toDates(upcoming) },
    { key: 'past', label: 'Past', isToday: false, dates: toDates(past) },
  ];

  return sections
    .map(sec => ({ ...sec, count: sec.dates.reduce((n, d) => n + d.items.length, 0) }))
    .filter(sec => sec.key === 'today' || sec.count > 0);
}

/** 시각 오름차순. 한쪽이라도 시각이 없으면 순서를 바꾸지 않는다 */
function byScheduledTime(a, b) {
  return a.scheduledTime && b.scheduledTime ? a.scheduledTime - b.scheduledTime : 0;
}

/**
 * SaasOperationsView component
 *
 * flat-SaaS 시안 Operations 뷰 — 기존 대시보드 Operations 탭(SchedulePanel + InfluencerPanel)과
 * 같은 구성: Visit schedule 레일과 인플루언서 목록이 한 화면에 나란히 있고, 각자 스크롤한다.
 * KPI 스트립은 목록 컬럼 안 최상단에 있다 — 레일 위에 걸치면 세로 경계선이
 * KPI 아래에서야 시작해 KPI만 떠 보인다.
 * 목록은 Action required / Upcoming / Completed 섹션으로 나뉘고, 각 섹션은 접을 수 있다.
 * 행은 컬럼으로 흩뿌리지 않고 InfluencerListRow의 요약 행(아바타+이름·시간·카테고리 /
 * 티어·플랫폼 / 상태·overdue·연락사유)으로 한 사람 정보를 한 덩어리로 읽게 한다.
 *
 * Props:
 * @param {Influencer[]} influencers - 전체 인플루언서 목록 (data/beautymaster/schema.js typedef) [Required]
 * @param {function} onSelect - 행 클릭 핸들러 (influencer) => void [Optional]
 * @param {string|null} selectedId - 현재 선택된 인플루언서 ID [Optional, 기본값: null]
 * @param {boolean} isLoading - 최초 로딩 여부 (목록이 비었을 때만 스켈레톤) [Optional, 기본값: false]
 * @param {Error|null} error - 시트 조회 실패 에러 (상단 배너로 표시) [Optional, 기본값: null]
 * @param {function} onRetry - 에러 배너의 Retry 핸들러 [Optional]
 * @param {object|null} filters - 플랫폼/티어/카테고리 필터 ({ platform, tier, category }).
 *   주면 controlled, 안 주면 내부 상태로 동작 [Optional, 기본값: null]
 * @param {function} onFiltersChange - 필터 변경 핸들러 (nextFilters) => void [Optional]
 * @param {string[]} stores - 스토어 선택 옵션 목록. 없으면 influencers에서 파생 [Optional]
 * @param {string} selectedStore - 선택된 스토어 ('all'이면 전체). 세 뷰가 공유 [Optional, 기본값: 'all']
 * @param {function} onStoreChange - 스토어 변경 핸들러 (store) => void [Optional]
 *   주지 않으면(좁은 화면) 그 자리는 그냥 여백으로 남는다 [Optional, 기본값: null]
 * @param {string} sheetUrl - Google Sheet 원본 링크. Action required의 Record Performance
 *   칩이 활성일 때 시트로 바로 안내한다(기록은 시트에만 — 진실은 시트 하나) [Optional, 기본값: '']
 *
 * Example usage:
 * <SaasOperationsView influencers={influencers} onSelect={handleSelect} />
 * <SaasOperationsView influencers={influencers} filters={filters} onFiltersChange={setFilters} />
 */
function SaasOperationsView({
  influencers,
  onSelect,
  selectedId = null,
  isLoading = false,
  error = null,
  onRetry,
  filters = null,
  onFiltersChange,
  stores = null,
  selectedStore = ALL_STORES,
  onStoreChange,
  sheetUrl = '',
}) {
  /** 검색어는 뷰 안에서만 쓰는 일시 상태라 승격하지 않는다 */
  /** 시트 상태 탭 — 기존 InfluencerPanel의 tab 상태를 그대로 복원한 것 */
  const [statusFilter, setStatusFilter] = useState('all');
  /**
   * 접힌 섹션 키. Action required만 펼친 채로 시작한다 — 손댈 게 있는 쪽이 먼저 보여야 하고,
   * 긴 섹션을 접어 아래 섹션으로 바로 갈 수 있어야 한다.
   */
  const [collapsedSections, setCollapsedSections] = useState(() => new Set(['upcoming', 'inProgress', 'stale', 'completed', 'dropped']));
  /** Action required 안의 일 종류 필터(배칭용) — 섹션 스코프 일시 상태라 승격하지 않는다 */
  const [attentionType, setAttentionType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalFilters, setInternalFilters] = useState(DEFAULT_INFLUENCER_FILTERS);

  /** filters를 주면 controlled, 안 주면 내부 상태 — 스토리·목업은 그대로 uncontrolled로 쓴다 */
  const isFiltersControlled = filters !== null;
  const activeFilters = isFiltersControlled ? filters : internalFilters;

  const setFilter = (key, value) => {
    const next = { ...activeFilters, [key]: value };
    if (!isFiltersControlled) setInternalFilters(next);
    onFiltersChange?.(next);
  };

  const derivedStores = useMemo(() => deriveStores(influencers), [influencers]);
  const storeOptions = stores ?? derivedStores;

  /**
   * KPI 모수 — 스토어/플랫폼/티어/카테고리까지만 적용한다.
   * 검색어와 상태 탭은 "무엇을 보느냐"가 아니라 "지금 화면에서 어디를 찾느냐"라
   * 모수에서 뺀다. 기존 대시보드의 filteredKpi와 같은 기준이다.
   */
  const scoped = useMemo(() => {
    const { platform, tier, category } = activeFilters;
    return influencers.filter(inf => {
      if (selectedStore !== ALL_STORES && inf.store !== selectedStore) return false;
      if (platform) {
        const platforms = inf.platform.split(',').map(p => p.trim().toLowerCase());
        if (!platforms.includes(platform.toLowerCase())) return false;
      }
      if (tier && inf.tier !== tier) return false;
      if (category && inf.category !== category) return false;
      return true;
    });
  }, [influencers, selectedStore, activeFilters]);

  const kpi = useMemo(() => deriveKpiSummary(scoped), [scoped]);

  const toggleSection = key => setCollapsedSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scoped.filter(inf => {
      // 기존 InfluencerPanel과 같은 판정 — sheetStatus 정확히 일치
      if (statusFilter !== 'all' && inf.sheetStatus !== statusFilter) return false;
      if (q && !inf.fullName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scoped, statusFilter, searchQuery]);

  const listScrollerRef = useRef(null);

  const isSearching = searchQuery.trim() !== '';

  const sections = useMemo(() => {
    const byTime = (a, b) => (a.scheduledTime && b.scheduledTime ? a.scheduledTime - b.scheduledTime : 0);
    /* "Credit Not Sent"는 어느 섹션에 있든 그 섹션 맨 위로 올린다.
       업로드까지 끝났는데 크레딧만 안 나간 건이고, 이 앱에서 우리가 실제로 해야 할
       유일한 행동이다 — 날짜순에 묻히면 유예 기간(7일)이 지나서야 눈에 띈다.
       판정 조건은 InfluencerListRow의 getCurrentStage와 같다(라벨과 순서가 어긋나면 안 된다). */
    const isCreditPending = inf => inf.collaboShared && !inf.creditShared;
    const byPriority = (a, b) => (isCreditPending(b) ? 1 : 0) - (isCreditPending(a) ? 1 : 0) || byTime(a, b);
    /* Dropped는 종결이라 경보가 전부 꺼진다 — 그대로 두면 "경보 없음 + 미완료" 조건에
       걸려 In progress/Stale로 흘러든다. 포기한 사람이 "진행 중"에 앉으면 섹션이라는
       약속이 깨지므로, 다른 모든 구간에서 명시적으로 빼고 맨 아래 자기 구간에 모은다. */
    const isDropped = inf => inf.contactStatus === CONTACT_STATUSES.DROPPED;
    /* D+14 성과 기록이 밀린 건 — Action required에 'Record Performance' 일 종류로 들어간다.
       판정은 행 표시(InfluencerListRow)와 같은 derivePerformanceStatus를 쓴다 —
       섹션에 있는데 행에 문구가 없으면 안 된다. 경보가 아니므로 alertFlags는 건드리지
       않는다(경보 카운트·레일 점·유예 로직에 새지 않게). */
    const isPerfDue = inf => derivePerformanceStatus(inf)?.state === PERFORMANCE_STATES.DUE;
    /* 일 종류 칩 — 카운트는 종류 필터 **이전**의 전체에서 센다(칩이 자기 분모를 지우면 안 된다).
       헤더 카운트도 전체를 유지한다 — Needs attention 배너와 같은 수여야 하고,
       칩은 "지금 무엇을 보느냐"지 "일이 몇 개냐"를 바꾸는 게 아니다. */
    /* 성과 기록(D+14 경과)도 여기 들어간다 — "내 행동이 필요한 건 전부 이 서랍"이
       사용자 멘탈 모델이다. dropped는 명시적으로 뺀다: 경보는 dropped에서 저절로
       꺼지지만 perf 판정은 contactStatus를 모른다. */
    const attentionAll = filtered.filter(i => !isDropped(i) && (i.alertFlags.length > 0 || isPerfDue(i))).sort(byPriority);
    const typeCounts = {};
    for (const inf of attentionAll) {
      const k = attentionTypeOf(inf);
      if (k) typeCounts[k] = (typeCounts[k] || 0) + 1;
    }
    /* 선택한 종류가 전역 필터 변경으로 사라지면 조용히 All로 돌아간다 (0건 화면 방지) */
    const activeType = typeCounts[attentionType] ? attentionType : null;
    const all = [
      {
        key: 'attention',
        label: 'Action required',
        items: activeType ? attentionAll.filter(i => attentionTypeOf(i) === activeType) : attentionAll,
        headerCount: attentionAll.length,
        types: ATTENTION_TYPES.filter(t => typeCounts[t.key]).map(t => ({ ...t, count: typeCounts[t.key] })),
        activeType,
        /* 시트 안내 줄은 성과 기록 맥락에서만 — perf 칩을 골랐거나, 섹션에 perf 일만 있을 때 */
        showPerfGuide: activeType === 'perf'
          || (activeType === null && typeCounts.perf > 0 && Object.keys(typeCounts).length === 1),
      },
      /* Upcoming은 "예정"이라는 뜻이어야 한다.
         예전에는 "경보 없음 + 미완료"였을 뿐이라 날짜 조건이 아예 없었고,
         90일이 지나 경보가 억제된 건들이 전부 여기로 흘러들었다
         (실제로 17건 중 15건이 과거 일정, 미래는 0건이었다). */
      {
        key: 'upcoming',
        label: 'Upcoming',
        items: filtered.filter(i => !isDropped(i) && !isPerfDue(i) && i.alertFlags.length === 0 && !i.creditShared
          && (i.scheduleGroup === SCHEDULE_GROUPS.TODAY || i.scheduleGroup === SCHEDULE_GROUPS.UPCOMING)).sort(byPriority),
      },
      /* 방문일은 지났지만 아직 유예 기간이라 경보가 없는 건 */
      {
        key: 'inProgress',
        label: 'In progress',
        items: filtered.filter(i => !isDropped(i) && !isPerfDue(i) && i.alertFlags.length === 0 && !i.creditShared
          && i.scheduleGroup !== SCHEDULE_GROUPS.TODAY && i.scheduleGroup !== SCHEDULE_GROUPS.UPCOMING
          && !isStaleVisit(i.scheduledTime)).sort(byPriority),
      },
      /* 90일이 넘어 경보가 억제된 건 — 지금까지 어느 구간에도 안 보였다.
         닫힌 것도 진행 중인 것도 아니므로 이름을 그대로 붙여 드러낸다. */
      {
        key: 'stale',
        label: 'Stale (90+ days)',
        items: filtered.filter(i => !isDropped(i) && !isPerfDue(i) && i.alertFlags.length === 0 && !i.creditShared
          && isStaleVisit(i.scheduledTime)).sort(byPriority),
      },
      /* Completed는 성과 기록까지 끝난(또는 아직 때가 안 된) 건만 — 기록이 밀린 건은
         위 Record performance 큐가 데려간다. 여기 두면 "완료"인데 할 일이 남은 셈이다. */
      {
        key: 'completed',
        label: 'Completed',
        items: filtered.filter(i => !isDropped(i) && !isPerfDue(i) && i.alertFlags.length === 0 && i.creditShared).sort(byPriority),
      },
      /* 성공 종결(Completed)과 실패 종결(Dropped)은 섞지 않는다 — 섞으면 Completed
         카운트가 의미를 잃는다. 평소엔 볼 일이 없고 다음 캠페인 초대 명단을 짤 때
         블랙리스트 참조로 펼쳐보는 구간이라 맨 아래 + 기본 접힘이다. */
      {
        key: 'dropped',
        label: 'Dropped',
        items: filtered.filter(isDropped).sort(byTime),
      },
    ];
    return all
      .filter(s => s.items.length > 0);
  }, [filtered, attentionType]);

  const scheduleSections = useMemo(() => buildScheduleSections(filtered), [filtered]);
  /** Today는 항상 들어 있으므로 그룹 개수가 아니라 실제 방문 유무로 빈 상태를 판정한다 */
  const hasScheduledVisit = scheduleSections.some(sec => sec.count > 0);
  /* 레일에서 고른 사람이 목록에서도 보이게 한다.
     선택하면 행이 강조되지만 목록이 수백 줄이라 화면 밖에 남는 경우가 많았다 —
     실측에서 강조된 행이 2429px 아래에 있었다. 드로어는 열리므로 누구인지는 알지만,
     닫고 나면 그 사람이 목록 어디에 있었는지 알 수 없다.

     접힌 구간에 있으면 먼저 펼치고, 펼쳐진 다음 렌더에서 스크롤한다. */
  useEffect(() => {
    if (!selectedId) return;

    const row = listScrollerRef.current?.querySelector(`[data-influencer-id="${CSS.escape(selectedId)}"]`);
    if (!row) return;

    // 이미 보이면 건드리지 않는다 — 목록에서 직접 고른 경우 화면이 튀면 안 된다
    const view = listScrollerRef.current.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    if (box.top >= view.top && box.bottom <= view.bottom) return;

    row.scrollIntoView({ block: 'center' });
  }, [selectedId, sections]);

  const hasFilter = statusFilter !== 'all'
    || selectedStore !== ALL_STORES
    || activeFilters.platform !== null
    || activeFilters.tier !== null
    || activeFilters.category !== null
    || searchQuery.trim() !== '';
  /** 최초 로딩만 스켈레톤 — 이미 데이터가 있으면 폴링 중에도 목록을 유지한다 */
  const showSkeleton = isLoading && influencers.length === 0;

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    if (!isFiltersControlled) setInternalFilters(DEFAULT_INFLUENCER_FILTERS);
    onFiltersChange?.(DEFAULT_INFLUENCER_FILTERS);
    onStoreChange?.(ALL_STORES);
  };

  /* 선택된 칩을 파랑으로 꽉 채우면 목록이 주인공인 화면에서 필터가 가장 강한
     요소가 된다. 틴트 + 파랑 글자 + 파랑 테두리로 "켜짐"만 알린다.
     포커스는 테두리를 굵히지 않고 바깥 링으로 구분한다 — 굵기가 바뀌면
     레이아웃이 흔들리고 선택과 포커스가 같은 신호로 보인다. */
  const chipSx = isOn => ({
    height: 32,
    fontSize: 12,
    fontWeight: 500,
    borderRadius: '6px',
    px: 1,
    '&.Mui-focusVisible': {
      boxShadow: theme => `0 0 0 3px ${theme.palette.accent.ring}`,
      backgroundColor: isOn ? 'accent.tint' : 'transparent',
    },
    ...(isOn
      ? {
        backgroundColor: 'accent.tint',
        color: 'accent.main',
        borderColor: 'accent.main',
        '&:hover': { backgroundColor: 'accent.tintHover' },
      }
      : { borderColor: 'divider', color: 'text.secondary', backgroundColor: 'transparent', '&:hover': { backgroundColor: 'action.hover' } }),
  });

  return (
    <>
      {/* 조회 실패 — 목록을 지우지 않고 상단 배너로만 알린다(직전 데이터 유지) */}
      {error && (
        <Alert
          severity="error"
          square
          sx={{ flexShrink: 0, fontSize: 13, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry} sx={{ textTransform: 'none', fontSize: 12 }}>
                Retry
              </Button>
            )
          }
        >
          Failed to load data — {error.message}
        </Alert>
      )}


      {/* 본문 — Visit schedule 레일 + 목록.
          md 이상은 좌우로 나란히, 미만은 위아래로 쌓는다. 좁은 화면에서 레일을 숨기면
          현장에서 오늘 방문자를 확인할 수단이 사라지므로 감추지 않고 접어 올린다.
          두 영역 구분은 레일 경계선과 목록 컬럼의 24px 인셋이 만든다(gap 없음). */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Visit schedule — 보조 패널, 자체 스크롤 */}
        <Box
          data-rail
          sx={{
            width: { xs: '100%', md: RAIL_WIDTH },
            // 좁은 화면에서는 화면을 다 먹지 않도록 높이를 제한하고 안에서 스크롤한다
            maxHeight: { xs: 240, md: 'none' },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            // shorthand(border-right: '1px solid')를 반응형으로 주면 색이 빠진 선언이라
            // border-color가 currentColor로 리셋돼 선이 거의 검정으로 나온다.
            // longhand로 나눠 굵기만 브레이크포인트별로 바꾸고 색은 divider로 고정한다.
            borderRightWidth: { xs: 0, md: '1px' },
            borderBottomWidth: { xs: '1px', md: 0 },
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            borderColor: 'divider',
            minHeight: 0,
          }}
        >
          <Typography
            sx={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: '0.04em',
              px: 2,
              pt: 2,
              pb: 1,
            }}
          >
            VISIT SCHEDULE
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 1, pb: 2 }}>
            {showSkeleton ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Box key={`rail-skeleton-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5 }}>
                  <Skeleton variant="text" width={44} />
                  <Skeleton variant="text" width={90} />
                </Box>
              ))
            ) : !hasScheduledVisit ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary', px: 1, py: 2 }}>
                No visits scheduled
              </Typography>
            ) : (
              scheduleSections.map(sec => (
                <Box key={sec.key} sx={{ mb: 1.5 }}>
                  {/* 섹션 헤더 — 방향(지난 것 / 오늘 / 예정)을 여기서 한 번만 말한다.
                      본 테이블의 섹션 헤더와 같은 표면·타이포를 쓴다. */}
                  <Box
                    data-rail-section={sec.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      // 스크롤 컨테이너의 px:1을 상쇄해 헤더가 레일 전체 폭을 쓰게 한다
                      mx: -1,
                      px: 2,
                      height: RAIL_SECTION_HEADER_HEIGHT,
                      // 스크롤해도 방향(지난 것/오늘/예정)을 잃지 않도록 위에 붙여둔다.
                      // 날짜 헤더보다 위층이라 z-index가 더 높다.
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      backgroundColor: 'surface.sunken',
                      borderTop: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {/* "PAST · 72"는 " · "가 라벨과 개수를 잇는 셈이라 범위로 읽힌다.
                        이 앱에서 " · "는 동등한 항목을 잇는 기호다(Jul 8 · 02:00 PM).
                        개수를 우측 끝에 두면 구분자 없이도 개수로 읽힌다. */}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: sec.isToday ? 'accent.main' : 'text.primary',
                      }}
                    >
                      {sec.label.toUpperCase()}
                    </Typography>
                    <Typography
                      component="span"
                      data-rail-count
                      sx={{
                        ml: 'auto',
                        fontSize: 11,
                        color: 'text.secondary',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {sec.count}
                    </Typography>
                  </Box>

                  {sec.count === 0 && (
                    <Typography sx={{ px: 0.75, pt: 0.75, fontSize: 11, color: 'text.secondary' }}>
                      No visits today
                    </Typography>
                  )}

                  {sec.dates.map(day => (
                    <Box key={day.key} sx={{ pt: 0.5 }}>
                      {/* 날짜 헤더 — 섹션보다 한 단 약하게. 두 층이 같은 무게면 위계가 사라진다 */}
                      {day.label && (
                        <Typography
                          data-rail-day={day.key}
                          sx={{
                            // 목록 중간에서도 지금 보는 행이 어느 날짜인지 알 수 있게 붙여둔다.
                            // 섹션 헤더 높이만큼 내려 두 헤더가 겹치지 않게 한다.
                            position: 'sticky',
                            top: `${RAIL_SECTION_HEADER_HEIGHT}px`,
                            zIndex: 1,
                            // 스크롤한 행이 비쳐 보이지 않도록 불투명한 면을 깐다.
                            // 폭을 레일 전체로 늘려야 행이 옆으로 새지 않는다.
                            backgroundColor: 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            mx: -1,
                            px: 2,
                            py: 0.25,
                            fontSize: 10,
                            lineHeight: 1.5,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {/* 날짜가 주인공, 개수는 보조 — 색과 굵기로 위계를 만든다.
                              개수를 더 흐리게 하려면 text.disabled(2.68:1)뿐인데 AA에 못 미친다.
                              그래서 개수를 내리는 대신 날짜를 올려 간격을 벌린다. */}
                          <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {day.label.toUpperCase()}
                          </Box>
                          <Box
                            component="span"
                            data-rail-count
                            sx={{ ml: 'auto', fontWeight: 400, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
                          >
                            {day.items.length}
                          </Box>
                        </Typography>
                      )}
                      {day.items.map(inf => {
                        const alert = railAlertLabel(inf);
                        return (
                          <Box
                            key={inf.id}
                            data-rail-row={inf.id}
                            onClick={() => onSelect?.(inf)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              px: 0.75,
                              // 인덱스라 촘촘해도 된다 — 한 화면에 더 많은 날이 들어온다
                              py: 0.125,
                              borderRadius: '4px',
                              cursor: onSelect ? 'pointer' : 'default',
                              backgroundColor: selectedId === inf.id ? 'action.selected' : 'transparent',
                              '&:hover': { backgroundColor: 'action.hover' },
                            }}
                          >
                            {/* 고정 폭 + nowrap — 접히면 행 높이가 달라지고 이름 시작 위치가 어긋난다 */}
                            <Typography
                              sx={{
                                width: TIME_COL_WIDTH,
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                fontSize: 11,
                                lineHeight: 1.5,
                                color: 'text.secondary',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {formatVisitTime(inf)}
                            </Typography>
                            <Typography
                              title={toDisplayName(inf.fullName) || undefined}
                              sx={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {abbreviateName(toDisplayName(inf.fullName))}
                            </Typography>
                            {/* 미해결 표시는 점 하나로 충분하다 — 구체적 상태는 오른쪽 목록과
                                상세 패널이 이미 말한다. 색·모양만으로 전달하지 않도록
                                상태 문구를 title/aria-label로 붙인다. */}
                            <Box sx={{ width: 6, height: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {alert && (
                                <Box
                                  role="img"
                                  aria-label={alert}
                                  title={alert}
                                  sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'warning.main' }}
                                />
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* 목록 — KPI + 툴바 + 탭 + 섹션. 좌우 인셋은 이 컨테이너 한 곳에서만 관리한다.
            자식들이 각자 padding을 두면 기준선이 갈라지므로 자식에는 가로 padding을 주지 않는다.

            폭 상한도 여기 한 곳에 건다 — 목록만 묶으면 KPI·툴바·탭이 전폭으로 남아
            섹션마다 끝나는 자리가 달라진다. 초과분은 mx:auto가 좌우로 반씩 나눈다. */}
        <Box data-content-column sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', px: CONTENT_PX, maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>
          {/* 상단 고정 묶음 — 스크롤하지 않지만 아래 목록과 같은 스크롤바 거터를 예약해
              좌우 기준선을 맞춘다. 예약하지 않으면 목록만 스크롤바 폭만큼 좁아진다.

              overflowY:hidden을 주면 CSS가 다른 축을 auto로 바꿔 클리핑 박스가 생긴다.
              그 경계가 검색창 좌측과 정확히 겹쳐서 포커스 링이 왼쪽만 잘렸다
              (오른쪽은 툴바에 여유가 있어 보였다).
              박스를 링 두께만큼 좌우로 넓히고 같은 양을 padding으로 되돌린다 —
              내용 위치는 그대로면서 링이 들어갈 자리가 클리핑 박스 안에 생긴다. */}
          <Box sx={{ flexShrink: 0, overflowY: 'hidden', scrollbarGutter: 'stable', mx: `-${FOCUS_RING_PX}px`, px: `${FOCUS_RING_PX}px` }}>
        {/* KPI 스트립 — 배경 위 직접 배치, 카드 없음 (Total 제외).
            목록 컬럼 안에 있으므로 툴바·탭·섹션과 같은 인셋을 쓴다.
            덕분에 레일과의 세로 경계선이 화면 위끝까지 끊기지 않고 이어진다. */}
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            rowGap: 2,
            /* 아래 padding만 작다 — 광학 보정이다.
               위쪽 마지막 잉크는 22px 숫자인데 그 글자 상자에 baseline 아래 여유가
               약 9px 붙어 있어서, pt·pb를 똑같이 16px로 주면 눈에는 26px 대 17px로
               보인다(구분선이 아래쪽에 붙어 보인다). 상자가 아니라 **글자 바닥**을
               기준으로 맞춰 아래 구분선 간격(17px)과 같게 만든다. */
            pt: 2,
            pb: 1.25,
          }}
        >
          <SaasKpiItem label="Agreement" value={kpi.agreementCount} total={kpi.total} isFirst />
          <SaasKpiItem label="Visit" value={kpi.attendCount} total={kpi.total} />
          <SaasKpiItem label="Upload" value={kpi.collaboSharedCount} total={kpi.total} />
          <SaasKpiItem label="Credit" value={kpi.creditSharedCount} total={kpi.total} />

        </Box>
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              py: 2,
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TextField
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: 200,
                '& .MuiInputBase-root': { borderRadius: '6px', fontSize: 12, height: 36, backgroundColor: 'background.paper' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                '& .MuiInputBase-input::placeholder': { color: 'text.secondary', opacity: 1 },
              }}
            />
            <SaasStoreSelect
              stores={storeOptions}
              value={selectedStore}
              onChange={onStoreChange}
            />
            <Divider orientation="vertical" flexItem />
            {PLATFORM_OPTIONS.map(p => (
              <Chip
                key={p}
                label={p}
                size="small"
                onClick={() => setFilter('platform', activeFilters.platform === p ? null : p)}
                variant={activeFilters.platform === p ? 'filled' : 'outlined'}
                sx={chipSx(activeFilters.platform === p)}
              />
            ))}
            <Divider orientation="vertical" flexItem />
            {TIER_OPTIONS.map(t => (
              <Chip
                key={t.value}
                label={t.label}
                size="small"
                onClick={() => setFilter('tier', activeFilters.tier === t.value ? null : t.value)}
                variant={activeFilters.tier === t.value ? 'filled' : 'outlined'}
                sx={chipSx(activeFilters.tier === t.value)}
              />
            ))}
            <Divider orientation="vertical" flexItem />
            {CATEGORY_OPTIONS.map(c => (
              <Chip
                key={c.value}
                label={c.label}
                size="small"
                onClick={() => setFilter('category', activeFilters.category === c.value ? null : c.value)}
                variant={activeFilters.category === c.value ? 'filled' : 'outlined'}
                sx={chipSx(activeFilters.category === c.value)}
              />
            ))}
            {hasFilter && (
              <Button
                size="small"
                onClick={resetFilters}
                sx={{ textTransform: 'none', fontSize: 12, fontWeight: 400, color: 'text.secondary', px: 0.75, py: 0.5, minWidth: 'auto', '&:hover': { color: 'text.primary', backgroundColor: 'transparent' } }}
              >
                Reset
              </Button>
            )}
          </Box>

          {/* 시트 상태 탭 — 필터 컨트롤과 결과 사이의 2차 내비게이션.
              pill/카드 없이 텍스트 + 2px 하단 인디케이터로만 표현한다.
              위쪽 여백(10px)으로 필터 툴바와 띄워 세 층(필터 → 상태 → 결과)을 갈라 보이게 한다. */}
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              mt: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {STATUS_TABS.map(t => {
              const isActive = statusFilter === t.id;
              return (
                <Box
                  key={t.id}
                  component="button"
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setStatusFilter(t.id)}
                  sx={{
                    border: 'none',
                    borderBottom: '2px solid',
                    borderBottomColor: isActive ? 'accent.main' : 'transparent',
                    // 컨테이너의 1px 보더 위에 인디케이터를 겹쳐 선이 두 줄로 보이지 않게 한다
                    mb: '-1px',
                    px: 0,
                    py: 1,
                    backgroundColor: 'transparent',
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'accent.main' : 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: isActive ? 'accent.main' : 'text.primary' },
                  }}
                >
                  {t.label}
                </Box>
              );
            })}
          </Box>
          </Box>

          <Box ref={ listScrollerRef } data-list-scroller sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable', pb: 2 }}>
            {showSkeleton && Array.from({ length: 8 }).map((_, i) => (
              <Box
                key={`skeleton-${i}`}
                sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, minHeight: 48, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Skeleton variant="circular" width={28} height={28} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton variant="text" width={140} />
                  <Skeleton variant="text" width={90} />
                </Box>
                <Skeleton variant="text" sx={{ flex: '0 0 100px' }} />
                <Skeleton variant="text" sx={{ flex: '0 0 140px' }} />
              </Box>
            ))}

            {!showSkeleton && sections.length === 0 && (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: hasFilter ? 1 : 0 }}>
                  {hasFilter ? 'No influencers match the current filters' : 'No influencers yet'}
                </Typography>
                {hasFilter && (
                  <Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', fontSize: 13, fontWeight: 500 }}>
                    Clear filters
                  </Button>
                )}
              </Box>
            )}

            {!showSkeleton && sections.map(section => {
              /* 검색 중이거나 그 구간에 선택된 사람이 있으면 접힘을 무시한다.
                 둘 다 "특정 인물을 보려는" 동작인데, 대상이 접힌 구간에 들어가면
                 "COMPLETED 1"만 보이고 행은 하나도 안 보인다 — 찾았는데 안 보인다.
                 접힘 상태 자체는 유지해서 검색어를 지우면 원래대로 돌아온다.
                 (이펙트에서 setState로 펼치면 렌더가 연쇄된다 — 여기서 계산한다.) */
              const holdsSelection = selectedId != null && section.items.some(inf => inf.id === selectedId);
              const isCollapsed = !isSearching && !holdsSelection && collapsedSections.has(section.key);
              return (
                <Box
                  key={section.key}
                  data-section={section.key}
                  sx={{
                    // 섹션 하나가 하나의 운영 단위로 읽히도록 테두리로 묶는다.
                    // 카드가 아니다 — 섀도 없음, radius 6px, 얇은 중립 보더.
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '6px',
                    mt: 2,
                    // 행이 자기 폭에 맞춰 접히도록 컨테이너 기준점을 준다.
                    // 창 크기가 아니라 이 컬럼의 폭이 행이 쓸 수 있는 실제 폭이다.
                    containerType: 'inline-size',
                    // 마지막 행의 하단 divider는 컨테이너 보더와 겹치므로 지운다
                    '& > [data-influencer-id]:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  {/* 섹션 헤더 — 스크롤해도 어느 구간인지 남도록 sticky. 컨테이너 안쪽이라 radius를 맞춘다 */}
                  <Box
                    component="button"
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    aria-expanded={!isCollapsed}
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      width: '100%',
                      px: 2,
                      py: 0.625,
                      border: 'none',
                      borderBottom: isCollapsed ? 'none' : '1px solid',
                      borderColor: 'divider',
                      borderRadius: isCollapsed ? '5px' : '5px 5px 0 0',
                      backgroundColor: 'surface.sunken',
                      font: 'inherit',
                      textAlign: 'left',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <ChevronRightIcon
                      sx={theme => ({
                        fontSize: 14,
                        flexShrink: 0,
                        color: 'text.secondary',
                        transform: isCollapsed ? 'none' : 'rotate(90deg)',
                        transition: theme.transitions.create('transform', { duration: 150 }),
                        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                      })}
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: section.key === 'attention' ? 'warning.main' : 'text.secondary',
                      }}
                    >
                      {section.label.toUpperCase()}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {section.headerCount ?? section.items.length}
                    </Typography>
                  </Box>

                  {/* 일 종류 칩 — Action required 전용. 종류가 하나뿐이면 칩이 정보가 아니라 소음이다.
                      헤더(접기 버튼) 안에 넣지 않는다 — button 안의 button은 무효 HTML이고,
                      접으면 칩도 함께 사라지는 게 맞다(접힌 섹션의 필터는 보이지 않는 상태다). */}
                  {!isCollapsed && section.key === 'attention' && section.types?.length > 1 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Chip
                        label={`All ${section.headerCount}`}
                        size="small"
                        onClick={() => setAttentionType(null)}
                        variant={section.activeType === null ? 'filled' : 'outlined'}
                        sx={{ ...chipSx(section.activeType === null), height: 24, fontSize: 11 }}
                      />
                      {section.types.map(t => (
                        <Chip
                          key={t.key}
                          label={`${t.label} ${t.count}`}
                          size="small"
                          onClick={() => setAttentionType(section.activeType === t.key ? null : t.key)}
                          variant={section.activeType === t.key ? 'filled' : 'outlined'}
                          sx={{ ...chipSx(section.activeType === t.key), height: 24, fontSize: 11 }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* 성과 기록 안내 줄 — perf 칩이 활성일 때만(또는 perf 일만 있을 때).
                      기록은 시트에만 한다(진실은 시트 하나, 대시보드는 폴링으로 따라온다).
                      "시트에 적으세요"로 끝나면 실행의 간극이 남으므로 링크를 바로 옆에 둔다.
                      헤더(접기 버튼) 안에 넣지 않는다 — button 안의 a는 무효 HTML이다. */}
                  {!isCollapsed && section.showPerfGuide && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', minWidth: 0 }}>
                        2 weeks since upload — record results in the sheet; the dashboard picks them up automatically.
                      </Typography>
                      {sheetUrl && (
                        <Link
                          href={sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ ml: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11, fontWeight: 500, color: 'accent.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          Open sheet <OpenInNewIcon sx={{ fontSize: 12 }} />
                        </Link>
                      )}
                    </Box>
                  )}

                  {!isCollapsed && section.items.map(inf => (
                    <InfluencerListRow
                      key={inf.id}
                      influencer={inf}
                      onClick={() => onSelect?.(inf)}
                      isSelected={selectedId === inf.id}
                    />
                  ))}
                </Box>
              );
            })}
          </Box>
        </Box>

      </Box>
    </>
  );
}

export default SaasOperationsView;
