import { useMemo } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { PageContainer } from '../../components/layout/PageContainer';
import { BackendErrorBanner } from '../../components/data-display/BackendErrorBanner';
import { RecapHeader } from '../../components/data-display/RecapHeader';
import { RecapCampaignTable } from '../../components/data-display/RecapCampaignTable';
import { PhaseTimelineChart } from './PhaseTimelineChart';
import { usePaidAdsStore } from './usePaidAdsStore';
import { PAGE_GUTTER_X, SECTION_CARD_SX, PLATFORM_LABEL, buildPhaseTimeline } from './paidAdsPageUtils';
import {
  buildRecapRows,
  buildRecapHeadline,
  localizedText,
  campaignNameKey,
  effectiveBudgetPlanned,
  planTotal,
  RECAP_DEFAULT_LANG,
} from '../../data/schema';
import { t } from '../../data/recapStrings';
import { money } from '../../utils/format';

/** "1 phase" / "3 phases" — 단수·복수 문구는 문자열 표에서 */
const countScope = (n, key, lang) => t(n === 1 ? `recap.scope.${key}` : `recap.scope.${key}s`, lang, { n });

/** 카드 제목 행 — Dashboard 목록 카드·Reports SectionHeader와 같은 자리(px 2, 아래 1px 선) */
function SectionHeader({ title, scope }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="title" component="h2" sx={{ minWidth: 0, color: 'text.primary' }}>
        {title}
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
 * 한 줄 포함) → 단계 타임라인 → 플랫폼별 캠페인 표(벤치마크 포함) → 코멘트·배운
 * 점(저장된 게 있으면 읽기 전용, 없으면 2단계 안내). 인쇄(브라우저 인쇄 = PDF)는
 * PaidAdsShell의 @media print 규칙이 레일·버튼을 숨긴다.
 *
 * 계산은 전부 schema.js(buildRecapRows · buildRecapHeadline · localizedText)와
 * paidAdsPageUtils(buildPhaseTimeline)가 하고, 이 페이지는 합계 몇 개를 더해
 * 컴포넌트에 넘길 뿐이다. 언어는 1단계에서 en 고정 — 3단계에서 ?lang=으로 바뀐다.
 */
export function RecapDetailPage() {
  const { event: eventParam } = useParams();
  const navigate = useNavigate();
  const eventName = decodeURIComponent(eventParam ?? '');
  const lang = RECAP_DEFAULT_LANG;
  const {
    campaigns, performanceRecords, plans, adAccounts, eventRecaps, recapCampaignNotes, today, isLoading, error, refresh,
  } = usePaidAdsStore();

  const recap = useMemo(
    () => (eventRecaps ?? []).find((r) => campaignNameKey(r.eventName) === campaignNameKey(eventName)) ?? null,
    [eventRecaps, eventName]
  );
  const notesById = useMemo(
    () => Object.fromEntries((recapCampaignNotes ?? []).filter((n) => !recap || n.recapId === recap.id).map((n) => [n.campaignId, n])),
    [recapCampaignNotes, recap]
  );
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
  const allRows = Object.values(byPlatform).flat();
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
  const notedRows = allRows.filter((r) => r.note && (r.note.strength || r.note.weakness || r.note.reason));

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
        status={recap?.status ?? null}
        lang={lang}
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintOutlinedIcon />}
            onClick={() => window.print()}
            data-print="hide"
          >
            {t('recap.detail.print', lang)}
          </Button>
        }
        sx={{ mb: 3 }}
      />

      {recap?.summary && (
        <LocalizedParagraph text={recap.summary} lang={lang} sx={{ mb: 3, maxWidth: 880, fontSize: 14 }} />
      )}

      <Box sx={SECTION_CARD_SX} data-print="card">
        <SectionHeader title={t('recap.section.timeline', lang)} scope={countScope(phases.length, 'phase', lang)} />
        <PhaseTimelineChart
          phases={phases}
          today={today}
          barSuffix={(phase) => (spendByPhaseKey[phase.key] != null ? `${money(spendByPhaseKey[phase.key])} spent` : null)}
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
            onRowClick={(campaignId) => navigate(`/dashboard?campaign=${campaignId}`)}
          />
        </Box>
      ))}

      <Box sx={SECTION_CARD_SX} data-print="card">
        <SectionHeader title={t('recap.section.notes', lang)} scope={notedRows.length > 0 ? countScope(notedRows.length, 'campaign', lang) : null} />
        {notedRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>{t('recap.section.notesPlaceholder', lang)}</Typography>
        ) : (
          <Box>
            {notedRows.map((r, i) => (
              <Box key={r.campaignId} sx={{ px: 2, py: 1.5, borderBottom: i < notedRows.length - 1 ? '1px solid' : 0, borderColor: 'divider' }}>
                <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 0.75 }}>
                  {r.phaseName}
                  <Box component="span" sx={{ ml: 1, fontWeight: 400, color: 'text.secondary' }}>{PLATFORM_LABEL[r.platform] ?? r.platform}</Box>
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                  {['strength', 'weakness', 'reason'].map((key) => (
                    <Box key={key}>
                      <Typography component="span" sx={{ display: 'block', fontSize: 11, color: 'text.secondary', mb: 0.25 }}>{t(`recap.note.${key}`, lang)}</Typography>
                      <LocalizedParagraph text={r.note[key]} lang={lang} />
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {recap && (recap.learnings?.length > 0 || recap.nextSteps) && (
        <Box sx={SECTION_CARD_SX} data-print="card">
          <SectionHeader title={t('recap.section.learnings', lang)} scope={recap.learnings?.length ? countScope(recap.learnings.length, 'lesson', lang) : null} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2, p: 2 }}>
            {(recap.learnings ?? []).map((item, i) => (
              <Box key={i} sx={(theme) => ({ p: 2, backgroundColor: 'surface.sunken', borderRadius: `${theme.shape.radius.control}px` })}>
                <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 0.75 }}>
                  {i + 1}. {localizedText(item.title, lang).value}
                </Typography>
                <LocalizedParagraph text={item.body} lang={lang} />
              </Box>
            ))}
          </Box>
          {recap.nextSteps && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 0.5 }}>{t('recap.section.nextSteps', lang)}</Typography>
              <LocalizedParagraph text={recap.nextSteps} lang={lang} />
            </Box>
          )}
        </Box>
      )}
    </PageContainer>
  );
}
