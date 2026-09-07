import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { alpha } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import Tooltip from '@mui/material/Tooltip';
import { PageContainer } from '../../components/layout/PageContainer';
import { BackendErrorBanner } from '../../components/data-display/BackendErrorBanner';
import { RecapHeader } from '../../components/data-display/RecapHeader';
import { RecapCampaignTable } from '../../components/data-display/RecapCampaignTable';
import { RecapTakeaways } from '../../components/data-display/RecapTakeaways';
import { RecapCampaignInsightPanel } from '../../components/data-display/RecapCampaignInsightPanel';
import { RecapPatterns } from '../../components/data-display/RecapPatterns';
import { RecapNoteEditor } from '../../components/templates/RecapNoteEditor';
import { RecapLearningsEditor } from '../../components/templates/RecapLearningsEditor';
import { SignInDialog } from '../../components/templates/SignInDialog';
import { LanguageSwitch } from '../../components/input/LanguageSwitch';
import { ExportMenu } from '../../components/input/ExportMenu';
import { PeerCompareDialog } from '../../components/templates/PeerCompareDialog';
import { supabase } from '../../lib/supabase';
import { copyRecapForGoogleSheets } from '../../utils/recapSheets';
import { PhaseTimelineChart } from './PhaseTimelineChart';
import { usePaidAdsStore } from './usePaidAdsStore';
import { useSupabaseSession } from '../../lib/useSupabaseSession';
import { useSnackbar } from '../../hooks/useSnackbar';
import { PAGE_GUTTER_X, SECTION_CARD_SX, PLATFORM_LABEL, buildPhaseTimeline, adsManagerUrl, billingUrl } from './paidAdsPageUtils';
import { CampaignDetailPanel } from '../../components/templates/CampaignDetailPanel';
import {
  buildRecapRows,
  buildRecapHeadline,
  buildPeerComparison,
  buildRecapExecutiveSummary,
  buildCampaignInsight,
  buildRecapPlaybook,
  localizedText,
  campaignNameKey,
  effectiveBudgetPlanned,
  planTotal,
  RECAP_DEFAULT_LANG,
  RECAP_LANG,
  BENCHMARK_METRICS,
} from '../../data/schema';
import { t } from '../../data/recapStrings';
import { money } from '../../utils/format';

/** "1 phase" / "3 phases" — 단수·복수 문구는 문자열 표에서 */
const countScope = (n, key, lang) => t(n === 1 ? `recap.scope.${key}` : `recap.scope.${key}s`, lang, { n });

const LANGS = Object.values(RECAP_LANG);
const OTHER_LANGS = LANGS.filter((l) => l !== RECAP_DEFAULT_LANG);

/** LocalizedText의 빈 언어 칸만 채운다 — 사람이 쓴 글은 절대 덮지 않는다 */
const fillEmpty = (text, lang, value) => {
  if (!value) return text ?? null;
  const current = text?.[lang];
  if (current && current.trim()) return text;
  return { en: '', ko: null, 'zh-Hant': null, ...(text ?? {}), [lang]: value };
};

/** AI에 보낼 숫자 요약 — 표 한 행을 지표·벤치마크 문장으로 줄인다 */
const rowForAi = (row, platformLabel) => ({
  campaignId: row.campaignId,
  phase: row.phaseName,
  platform: platformLabel[row.platform] ?? row.platform,
  goal: row.goal,
  period: `${row.startDate} – ${row.endDate}`,
  rank: row.rank,
  suggestedVerdict: row.suggestedVerdict,
  spend: row.spend,
  reach: row.reach,
  impressions: row.impressions,
  clicks: row.clicks,
  videoPlays: row.videoPlays,
  likes: row.likes,
  comments: row.comments,
  shares: row.shares,
  conversions: row.conversions,
  metrics: Object.fromEntries(BENCHMARK_METRICS.map((m) => {
    const b = row.benchmarks?.[m.key];
    return [m.key, b?.peerScope === 'none' || b?.percentile == null
      ? { value: b?.value ?? null, benchmark: 'not enough data' }
      : { value: b.value, median: b.median, percentile: b.percentile, peers: b.sampleSize, scope: b.peerScope }];
  })),
});

/** 빈 코멘트 — 편집을 시작할 때 캠페인마다 하나씩 만든다 */
const emptyNote = (campaignId, recapId) => ({
  id: null, recapId, campaignId, verdict: null, strength: null, weakness: null, reason: null, organicViews: null, organicEngagements: null,
});

/** 저장할 가치가 있는 코멘트인가 — 판정·문장·오가닉 중 하나라도 있거나, 이미 저장된 행이면 */
const hasNoteContent = (note) =>
  Boolean(note.id) || note.verdict != null || note.organicViews != null || note.organicEngagements != null
  || ['strength', 'weakness', 'reason'].some((key) => Object.values(note[key] ?? {}).some((v) => (v ?? '').trim()));

/** 카드 제목 행 — Dashboard 목록 카드·Reports SectionHeader와 같은 자리(px 2, 아래 1px 선) */
function SectionHeader({ title, scope, hint }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="title" component="h2" sx={{ minWidth: 0, color: 'text.primary' }}>
        {title}
        {/* 방법론 설명은 본문이 아니라 제목 옆 ⓘ 툴팁에 — 결과와 경쟁하지 않게 */}
        {hint && (
          <Tooltip title={hint} arrow enterTouchDelay={0}>
            <InfoOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.disabled', verticalAlign: 'middle', ml: 0.75, cursor: 'help' })} />
          </Tooltip>
        )}
        {scope && (
          <Typography component="span" variant="body2" sx={{ ml: 1.5, fontWeight: 400, color: 'text.secondary' }}>{scope}</Typography>
        )}
      </Typography>
    </Box>
  );
}

/** 언어별 문장 한 단락 — 요청 언어가 비어 en으로 대체됐으면 "(English)"를 붙인다 */
function LocalizedParagraph({ text, lang, sx }) {
  const { value, isFallback } = localizedText(text, lang);
  if (!value) return null;
  return (
    <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, ...sx }}>
      {value}
      {isFallback && <Box component="span" sx={{ ml: 0.75, fontSize: 11, color: 'text.secondary' }}>{t('lang.fallback', lang)}</Box>}
    </Typography>
  );
}

/**
 * RecapDetailPage
 *
 * 이벤트 하나의 결과 보고서(/recap/:event) — 02-ux-flow 시나리오 7. 머리글(순위
 * 한 줄 포함) → 요약 → Key takeaways → 단계 타임라인 → 플랫폼별 캠페인 표(벤치마크
 * 포함, 줄을 펼치면 그 캠페인의 What worked·What could improve·Why·Recommendation) →
 * Learnings(배운 점·다음 제언·데이터에서 본 패턴). 캠페인별 코멘트 편집(Notes) 카드는
 * 편집 모드에서만 나온다.
 *
 * **읽기는 누구나, 쓰기는 로그인.** Edit를 누르면 세션이 없을 때만 SignInDialog가
 * 뜬다(앱 전체 로그인 게이트는 꺼져 있다 — App.jsx). 편집은 로컬 draft에 쌓였다가
 * Save에서 saveEventRecap → saveRecapCampaignNotes 순으로 한 번에 저장된다.
 * 편집 중에는 표의 판정 칩도 draft를 따라 바뀐다(buildRecapRows에 draft의
 * notesById를 넘긴다).
 *
 * 계산은 전부 schema.js(buildRecapRows · buildRecapHeadline · localizedText)와
 * paidAdsPageUtils(buildPhaseTimeline)가 한다. 인쇄(브라우저 인쇄 = PDF)는
 * PaidAdsShell의 @media print 규칙이 레일·버튼을 숨긴다. 언어는 URL ?lang=이 소유한다(3단계).
 */
export function RecapDetailPage() {
  const { event: eventParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventName = decodeURIComponent(eventParam ?? '');
  // 언어는 URL이 소유한다(?lang=ko) — 링크를 받은 사람이 그 언어로 연다. 모르는 값은 en.
  const langParam = searchParams.get('lang');
  const lang = LANGS.includes(langParam) ? langParam : RECAP_DEFAULT_LANG;
  const setLang = (next) => setSearchParams((prev) => {
    const params = new URLSearchParams(prev);
    if (next === RECAP_DEFAULT_LANG) params.delete('lang'); else params.set('lang', next);
    return params;
  }, { replace: true });
  const {
    campaigns, performanceRecords, performanceDaily, plans, adAccounts, eventRecaps, recapCampaignNotes, today, isLoading, error, refresh,
    saveEventRecap, saveRecapCampaignNotes,
  } = usePaidAdsStore();
  const navigate = useNavigate();
  /* 캠페인 상세 드로어 — Performance와 **같은** CampaignDetailPanel을 같은 데이터로 연다(소재·링크·
     예산·페이싱·일별 지출). 보고서를 읽다가 Performance로 건너가 같은 캠페인을 다시 찾지 않게. */
  const [detailCampaignId, setDetailCampaignId] = useState(null);
  const { session } = useSupabaseSession();
  const { notify, SnackbarComponent } = useSnackbar();

  const [isEditing, setIsEditing] = useState(false);
  /* 타임라인 행을 누르면 그 단계의 캠페인 줄을 표에서 펼치고 거기로 스크롤한다 — 플랫폼
     표마다 한 줄씩(Meta·TikTok에 같은 단계가 있으면 둘 다). 표의 화살표로 바꾼 값도 여기로 온다. */
  const [expandedByPlatform, setExpandedByPlatform] = useState({});
  const [focusedPhaseKey, setFocusedPhaseKey] = useState(null);
  /* 타임라인에서 찾아온 캠페인 — 표의 그 줄에 선택 표시(옅은 accent 면 + 왼쪽 선). 펼침과는 별개 상태:
     빈 곳·다른 캠페인을 누르면 표시만 사라지고 해석은 그대로 열려 있다. 시간이 지나도 저절로 안 사라진다. */
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  useEffect(() => {
    if (!selectedCampaignId) return undefined;
    const onDocumentClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      // 선택된 줄 안(화살표·이름 포함), 타임라인(새 선택으로 바뀐다), 드로어·대화상자·메뉴 같은 포털은 "다른 곳"이 아니다
      if (target.closest(`#recap-row-${CSS.escape(selectedCampaignId)}`)) return;
      if (target.closest('[data-recap-timeline]')) return;
      if (target.closest('.MuiDrawer-root, .MuiDialog-root, .MuiPopover-root, .MuiMenu-root, .MuiTooltip-popper, .MuiSnackbar-root')) return;
      setSelectedCampaignId(null);
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, [selectedCampaignId]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiMode, setAiMode] = useState(null); // 'draft' | 'translate' | null — 진행 중인 AI 작업
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  // 벤치마크 글자를 눌러 연 비교 대화상자 — { campaignId, metricKey } 또는 null
  const [compareTarget, setCompareTarget] = useState(null);

  const recap = useMemo(
    () => (eventRecaps ?? []).find((r) => campaignNameKey(r.eventName) === campaignNameKey(eventName)) ?? null,
    [eventRecaps, eventName]
  );
  const storedNotesById = useMemo(
    () => Object.fromEntries((recapCampaignNotes ?? []).filter((n) => recap && n.recapId === recap.id).map((n) => [n.campaignId, n])),
    [recapCampaignNotes, recap]
  );
  const notesById = isEditing && draft ? draft.notesById : storedNotesById;
  const accountRegionById = useMemo(
    () => Object.fromEntries((adAccounts ?? []).map((a) => [a.id, a.region])),
    [adAccounts]
  );

  const { byPlatform, campaigns: eventCampaigns } = useMemo(
    () => buildRecapRows(eventName, campaigns, performanceRecords, { notesById, accountRegionById }),
    [eventName, campaigns, performanceRecords, notesById, accountRegionById]
  );
  const headline = useMemo(
    () => buildRecapHeadline(eventName, campaigns, performanceRecords),
    [eventName, campaigns, performanceRecords]
  );

  const allRows = useMemo(() => Object.values(byPlatform).flat(), [byPlatform]);
  const executiveSummary = useMemo(() => buildRecapExecutiveSummary(byPlatform), [byPlatform]);
  const playbook = useMemo(() => buildRecapPlaybook(byPlatform), [byPlatform]);

  const startEditing = () => {
    setDraft({
      recap: recap
        ? { ...recap, learnings: (recap.learnings ?? []).map((l) => ({ ...l })) }
        : { id: null, eventName, status: 'draft', summary: null, learnings: [], nextSteps: null },
      notesById: Object.fromEntries(allRows.map((r) => [r.campaignId, storedNotesById[r.campaignId] ?? emptyNote(r.campaignId, recap?.id ?? null)])),
    });
    setIsEditing(true);
  };

  const handleEditClick = () => {
    if (!session) { setIsSignInOpen(true); return; }
    startEditing();
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    const savedRecap = await saveEventRecap(draft.recap);
    if (!savedRecap) {
      setIsSaving(false);
      notify(t('recap.edit.failed', lang), 'error');
      return;
    }
    const notes = Object.values(draft.notesById)
      .filter(hasNoteContent)
      .map((n) => ({ ...n, recapId: savedRecap.id }));
    const savedNotes = await saveRecapCampaignNotes(notes);
    setIsSaving(false);
    if (savedNotes === null) {
      notify(t('recap.edit.failed', lang), 'error');
      return;
    }
    notify(t('recap.edit.saved', lang), 'success');
    setIsEditing(false);
    setDraft(null);
  };

  const updateDraftRecap = (patch) => setDraft((d) => ({ ...d, recap: { ...d.recap, ...patch } }));
  const updateDraftNote = (campaignId, patch) =>
    setDraft((d) => ({ ...d, notesById: { ...d.notesById, [campaignId]: { ...d.notesById[campaignId], ...patch } } }));

  if (isLoading) {
    return (
      <PageContainer maxWidth={false} sx={{ py: 3, px: PAGE_GUTTER_X }}>
        <Box aria-label="Loading recap" role="status">
          <Skeleton variant="text" width={280} height={36} />
          <Skeleton variant="rounded" height={64} sx={{ my: 2 }} />
          <Skeleton variant="rounded" height={240} />
        </Box>
      </PageContainer>
    );
  }

  const backLink = (
    <Link component={RouterLink} to="/recap" underline="hover" sx={{ fontSize: 13, color: 'text.secondary' }} data-print="hide">
      ← {t('recap.detail.back', lang)}
    </Link>
  );

  if (eventCampaigns.length === 0) {
    return (
      <PageContainer maxWidth={false} sx={{ py: 3, px: PAGE_GUTTER_X }}>
        {backLink}
        {error && <BackendErrorBanner error={error} onRetry={refresh} sx={{ my: 2 }} />}
        <Typography variant="display" component="h1" sx={{ mt: 2 }}>{eventName}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('recap.detail.notFound', lang)}</Typography>
      </PageContainer>
    );
  }

  // 머리글 합계 — 표 행(레코드 최신값 기준)에서 더한다. 계획 예산은 계획 문서가 있으면 그 값.
  const spendValues = allRows.map((r) => r.spend).filter((v) => v != null);
  const spend = spendValues.length > 0 ? spendValues.reduce((a, b) => a + b, 0) : null;
  const plan = (plans ?? []).find((p) => campaignNameKey(p.name) === campaignNameKey(eventName)) ?? null;
  const plannedBudget = plan ? planTotal(plan) : eventCampaigns.reduce((sum, c) => sum + (effectiveBudgetPlanned(c) ?? 0), 0) || null;
  const startDate = eventCampaigns.reduce((min, c) => (c.startDate < min ? c.startDate : min), eventCampaigns[0].startDate);
  const endDate = eventCampaigns.reduce((max, c) => (c.endDate > max ? c.endDate : max), eventCampaigns[0].endDate);
  const stores = [...new Set(eventCampaigns.flatMap((c) => c.targetStoreIds ?? []))].sort();
  const platformOrder = Object.keys(PLATFORM_LABEL).filter((p) => byPlatform[p]);
  const platforms = platformOrder.map((p) => PLATFORM_LABEL[p]);
  const phases = buildPhaseTimeline(eventCampaigns);
  const spendByPhaseKey = allRows.reduce((acc, r) => {
    const key = campaignNameKey(r.name);
    if (r.spend != null) acc[key] = (acc[key] ?? 0) + r.spend;
    return acc;
  }, {});
  const shownRecap = isEditing && draft ? draft.recap : recap;
  const editRows = platformOrder.flatMap((p) => byPlatform[p]);
  /* 캠페인 해석은 표의 줄을 펼치면 그 자리에 — 사람이 쓴 글이 있으면 그것, 없으면 데이터
     해석(원인은 지어내지 않는다). 계획 예산은 캠페인 단위 값(effectiveBudgetPlanned)으로
     초과 지출 판정에만 쓴다. 편집 중에는 draft의 코멘트가 바로 반영된다. */
  const insightById = Object.fromEntries(editRows.map((r) => {
    const campaign = eventCampaigns.find((c) => c.id === r.campaignId);
    return [r.campaignId, { ...r, insight: buildCampaignInsight(r, { plannedBudget: campaign ? effectiveBudgetPlanned(campaign) : null }) }];
  }));
  const localize = (text) => localizedText(text, lang);
  const hasWrittenLearnings = Boolean(recap?.learnings?.length);
  const hasWrittenNextSteps = Boolean(localize(recap?.nextSteps).value);
  const headlineTextForAi = headline
    ? `${t(headline.rank === 1 ? 'recap.headline.best' : 'recap.headline.rank', 'en', { rank: headline.rank, total: headline.total, metric: headline.metricKey })} (${headline.peerEvents.join(' > ')})`
    : null;

  /* AI 초안·번역 — Edge Function이 문장만 돌려주고, 여기서 **빈 칸에만** 채운다.
     사람이 이미 쓴 글은 어떤 경우에도 덮지 않는다. 저장은 여전히 Save가 한다. */
  const runAi = async (mode) => {
    if (!draft) return;
    setAiMode(mode);
    const rows = editRows.map((r) => rowForAi(r, PLATFORM_LABEL));
    const { data, error: fnError } = await supabase.functions.invoke('recap-draft', {
      body: {
        mode,
        lang,
        targets: OTHER_LANGS,
        event: { name: eventName, period: `${startDate} – ${endDate}`, stores, platforms, headline: headlineTextForAi },
        rows,
        recap: draft.recap,
        notes: draft.notesById,
      },
    });
    setAiMode(null);
    const languages = data?.languages;
    if (fnError || !Array.isArray(languages)) {
      notify(data?.error ?? t('recap.edit.aiFailed', lang), 'error');
      return;
    }
    setDraft((d) => {
      let recapNext = { ...d.recap };
      const notesNext = { ...d.notesById };
      languages.forEach((block) => {
        const target = block.lang;
        if (!LANGS.includes(target)) return;
        recapNext = {
          ...recapNext,
          summary: fillEmpty(recapNext.summary, target, block.summary),
          nextSteps: fillEmpty(recapNext.nextSteps, target, block.nextSteps),
          learnings: (block.learnings ?? []).length > 0 && (recapNext.learnings ?? []).every((l) => !(l.title?.[target] ?? '').trim() && !(l.body?.[target] ?? '').trim())
            ? (recapNext.learnings?.length > 0
              ? recapNext.learnings.map((l, i) => ({ title: fillEmpty(l.title, target, block.learnings[i]?.title), body: fillEmpty(l.body, target, block.learnings[i]?.body) }))
              : block.learnings.map((l) => ({ title: fillEmpty(null, target, l.title), body: fillEmpty(null, target, l.body) })))
            : recapNext.learnings,
        };
        (block.notes ?? []).forEach((n) => {
          const existing = notesNext[n.campaignId];
          if (!existing) return;
          notesNext[n.campaignId] = {
            ...existing,
            strength: fillEmpty(existing.strength, target, n.strength),
            weakness: fillEmpty(existing.weakness, target, n.weakness),
            reason: fillEmpty(existing.reason, target, n.reason),
          };
        });
      });
      return { ...d, recap: recapNext, notesById: notesNext };
    });
    notify(t('recap.edit.aiDone', lang), 'success');
  };

  const handleSheets = async () => {
    const ok = await copyRecapForGoogleSheets({ eventName, byPlatform, platformLabel: PLATFORM_LABEL, recap: shownRecap, headline, lang });
    notify(t(ok ? 'recap.export.sheetsDone' : 'recap.export.sheetsFailed', lang), ok ? 'success' : 'error');
  };
  const exportItems = [
    { key: 'sheets', label: t('recap.export.sheets', lang), hint: t('recap.export.sheetsHint', lang), icon: <TableChartOutlinedIcon />, onSelect: handleSheets },
    { key: 'pdf', label: t('recap.export.pdf', lang), hint: t('recap.export.pdfHint', lang), icon: <PictureAsPdfOutlinedIcon />, onSelect: () => window.print() },
  ];
  /* 비교 대화상자 데이터 — 열 때만 계산한다(schema.js buildPeerComparison). */
  const compareCampaign = compareTarget ? eventCampaigns.find((c) => c.id === compareTarget.campaignId) ?? null : null;
  const comparison = compareCampaign
    ? buildPeerComparison(compareCampaign, campaigns, performanceRecords, { metricKey: compareTarget.metricKey, accountRegionById })
    : null;


  const isBusy = isSaving || Boolean(aiMode);
  const actions = isEditing ? (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }} data-print="hide">
      <LanguageSwitch value={lang} onChange={setLang} />
      <Tooltip title={t('recap.edit.aiDraftHint', lang)}>
        <span>
          <Button variant="outlined" size="small" startIcon={<AutoAwesomeOutlinedIcon />} disabled={isBusy} onClick={() => runAi('draft')}>
            {aiMode === 'draft' ? t('recap.edit.aiWorking', lang) : t('recap.edit.aiDraft', lang)}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title={t('recap.edit.aiTranslateHint', lang)}>
        <span>
          <Button variant="outlined" size="small" startIcon={<TranslateOutlinedIcon />} disabled={isBusy} onClick={() => runAi('translate')}>
            {aiMode === 'translate' ? t('recap.edit.aiWorking', lang) : t('recap.edit.aiTranslate', lang)}
          </Button>
        </span>
      </Tooltip>
      <Button variant="text" size="small" disabled={isBusy} onClick={() => { setIsEditing(false); setDraft(null); }}>
        {t('recap.edit.cancel', lang)}
      </Button>
      <Button variant="contained" size="small" disabled={isBusy} onClick={handleSave}>
        {isSaving ? t('recap.edit.saving', lang) : t('recap.edit.save', lang)}
      </Button>
    </Box>
  ) : (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }} data-print="hide">
      <LanguageSwitch value={lang} onChange={setLang} />
      <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} onClick={handleEditClick}>
        {t(session ? 'recap.edit.start' : 'recap.edit.signIn', lang)}
      </Button>
      <ExportMenu items={exportItems} label={t('recap.export', lang)} />
    </Box>
  );

  return (
    <PageContainer maxWidth={false} sx={{ py: 3, px: PAGE_GUTTER_X }}>
      <Box sx={{ mb: 2 }}>{backLink}</Box>
      {error && <BackendErrorBanner error={error} onRetry={refresh} sx={{ mb: 2 }} />}

      <RecapHeader
        eventName={eventName}
        startDate={startDate}
        endDate={endDate}
        campaignCount={eventCampaigns.length}
        spend={spend}
        plannedBudget={plannedBudget}
        stores={stores}
        platforms={platforms}
        headline={headline}
        status={shownRecap?.status ?? null}
        lang={lang}
        actions={actions}
        sx={{ mb: 3 }}
      />

      {!isEditing && recap?.summary && (
        <LocalizedParagraph text={recap.summary} lang={lang} sx={{ mb: 3, maxWidth: 880, fontSize: 14 }} />
      )}

      {/* 핵심 요약 — 표가 증거, 이 카드가 해석. KPI를 더 늘리지 않고 이 칸이 "그래서 어땠나"를 말한다. */}
      <Box sx={SECTION_CARD_SX} data-print="card">
        <SectionHeader title={t('recap.takeaways.title', lang)} />
        <RecapTakeaways summary={executiveSummary} platformLabel={PLATFORM_LABEL} lang={lang} />
      </Box>

      <Box sx={SECTION_CARD_SX} data-print="card" data-recap-timeline>
        <SectionHeader title={t('recap.section.timeline', lang)} scope={countScope(phases.length, 'phase', lang)} />
        <PhaseTimelineChart
          phases={phases}
          today={today}
          emphasizedKey={focusedPhaseKey ?? undefined}
          barSuffix={(phase) => (spendByPhaseKey[phase.key] != null ? `${money(spendByPhaseKey[phase.key])} spent` : null)}
          onPhaseClick={(phase) => {
            const next = {};
            let firstId = null;
            platformOrder.forEach((p) => {
              const hit = byPlatform[p].find((r) => campaignNameKey(r.name) === phase.key);
              next[p] = hit?.campaignId ?? null;
              if (hit && !firstId) firstId = hit.campaignId;
            });
            setExpandedByPlatform(next);
            setFocusedPhaseKey(phase.key);
            // 선택 표시는 스크롤 목적지 한 줄에만 — 여러 줄을 동시에 칠하지 않는다
            setSelectedCampaignId(firstId);
            // 펼침이 그려진 다음 프레임에 첫 줄로 — 줄 위쪽이 화면 중간쯤 오게
            if (firstId) requestAnimationFrame(() => document.getElementById(`recap-row-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
          }}
        />
      </Box>

      {platformOrder.map((platform) => (
        <Box key={platform} sx={SECTION_CARD_SX} data-print="card">
          <SectionHeader
            title={t('recap.section.campaigns', lang, { platform: PLATFORM_LABEL[platform] })}
            scope={countScope(byPlatform[platform].length, 'campaign', lang)}
          />
          <RecapCampaignTable
            rows={byPlatform[platform]}
            lang={lang}
            label={`${PLATFORM_LABEL[platform]} recap table`}
            /* 줄 클릭은 해석 펼침(표 기본 동작) — 보고서를 읽다가 대시보드로 튕기지 않는다 */
            onBenchmarkClick={(campaignId, metricKey) => setCompareTarget({ campaignId, metricKey })}
            /* 다른 캠페인을 건드리면(이름·썸네일·화살표) 선택 표시는 풀린다 — 이 클릭들은 stopPropagation이라
               document 리스너에 안 닿아서 여기서 직접 처리한다. 같은 줄이면 그대로 */
            onCampaignClick={(campaignId) => { setDetailCampaignId(campaignId); if (campaignId !== selectedCampaignId) setSelectedCampaignId(null); }}
            selectedId={selectedCampaignId}
            expandedId={expandedByPlatform[platform] ?? null}
            onExpandedChange={(campaignId) => {
              setExpandedByPlatform((prev) => ({ ...prev, [platform]: campaignId }));
              const touched = campaignId ?? expandedByPlatform[platform];
              if (touched && touched !== selectedCampaignId) setSelectedCampaignId(null);
            }}
            renderDetail={(row) => (
              <RecapCampaignInsightPanel row={insightById[row.campaignId] ?? row} platformLabel={PLATFORM_LABEL} localize={localize} lang={lang} />
            )}
          />
        </Box>
      ))}

      {/* 코멘트 편집은 편집 모드에서만 별도 카드 — 읽을 때는 표의 줄을 펼쳐서 본다 */}
      {isEditing && draft && (
        <Box sx={SECTION_CARD_SX} data-print="card">
          <SectionHeader
            title={t('recap.section.notes', lang)}
            scope={countScope(editRows.length, 'campaign', lang)}
          />
          <Box>
            {editRows.map((r, i) => (
              <RecapNoteEditor
                key={r.campaignId}
                note={draft.notesById[r.campaignId]}
                campaignLabel={`${r.phaseName} · ${PLATFORM_LABEL[r.platform] ?? r.platform}`}
                suggestedVerdict={r.suggestedVerdict}
                hint={t('recap.edit.insightHint', lang)}
                onChange={(patch) => updateDraftNote(r.campaignId, patch)}
                lang={lang}
                isDisabled={isBusy}
                sx={{ px: 2, py: 2, borderBottom: i < editRows.length - 1 ? '1px solid' : 0, borderColor: 'divider' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {isEditing && draft ? (
        <Box sx={SECTION_CARD_SX} data-print="card">
          <SectionHeader title={t('recap.section.learnings', lang)} />
          <RecapLearningsEditor recap={draft.recap} onChange={updateDraftRecap} lang={lang} isDisabled={isBusy} sx={{ p: 2 }} />
        </Box>
      ) : (
        <Box sx={SECTION_CARD_SX} data-print="card">
          <SectionHeader title={t('recap.section.learnings', lang)} scope={hasWrittenLearnings ? countScope(recap.learnings.length, 'lesson', lang) : null} hint={t('learn.hint', lang)} />
          {hasWrittenLearnings && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2, p: 2, pb: hasWrittenNextSteps ? 0 : 2 }}>
              {recap.learnings.map((item, i) => (
                <Box key={i} sx={(theme) => ({ p: 2, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.6), borderRadius: `${theme.shape.radius.control}px` })}>
                  <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 0.75 }}>
                    {i + 1}. {localizedText(item.title, lang).value}
                  </Typography>
                  <LocalizedParagraph text={item.body} lang={lang} />
                </Box>
              ))}
            </Box>
          )}
          {hasWrittenNextSteps && (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 0.5 }}>{t('recap.section.nextSteps', lang)}</Typography>
              <LocalizedParagraph text={recap.nextSteps} lang={lang} />
            </Box>
          )}
          {/* 데이터에서 본 패턴은 사람 글과 섞지 않고 그 아래 따로 — 근거 수준이 다르다 */}
          <RecapPatterns
            playbook={playbook}
            platformLabel={PLATFORM_LABEL}
            hasWrittenLearnings={hasWrittenLearnings}
            hasWrittenNextSteps={hasWrittenNextSteps}
            lang={lang}
            sx={hasWrittenLearnings || hasWrittenNextSteps ? { borderTop: '1px solid', borderColor: 'divider' } : undefined}
          />
        </Box>
      )}

      {detailCampaignId && (() => {
        const detailCampaign = campaigns.find((c) => c.id === detailCampaignId);
        if (!detailCampaign) return null;
        const detailAccount = adAccounts.find((a) => a.id === detailCampaign.accountId);
        return (
          <CampaignDetailPanel
            campaign={detailCampaign}
            performance={performanceRecords.find((r) => r.campaignId === detailCampaign.id)}
            dailyRows={(performanceDaily ?? []).filter((r) => r.campaignId === detailCampaign.id)}
            accountLabel={detailAccount?.label}
            adsManagerHref={adsManagerUrl(detailCampaign, detailAccount)}
            billingHref={billingUrl(detailAccount)}
            today={today}
            onClose={() => setDetailCampaignId(null)}
            onEdit={(id) => navigate(`/dashboard?campaign=${id}`)}
          />
        );
      })()}

      {comparison && (
        <PeerCompareDialog
          isOpen
          onClose={() => setCompareTarget(null)}
          rows={comparison.rows}
          scope={comparison.scope}
          metricKeys={BENCHMARK_METRICS.map((m) => m.key)}
          initialMetricKey={compareTarget.metricKey}
          lang={lang}
        />
      )}
      <SignInDialog
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSignedIn={() => { setIsSignInOpen(false); startEditing(); }}
        title={t('recap.edit.signIn', lang)}
        description={t('recap.edit.signInHint', lang)}
      />
      <SnackbarComponent />
    </PageContainer>
  );
}
