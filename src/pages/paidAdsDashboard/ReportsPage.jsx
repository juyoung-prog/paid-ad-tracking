import { usePaidAdsStore } from './usePaidAdsStore';
import { ReportSummarySection } from './ReportSummarySection';

/**
 * ReportsPage
 *
 * 성과 보고서 화면(/reports). 기간·Event·플랫폼으로 캠페인을 좁혀서 요약
 * 통계와 캠페인별 지표를 확인하고 CSV로 내보낼 수 있다. 타이틀+네비는
 * PaidAdsShell(글로벌 셸)이 그린다.
 *
 * PageContainer로 감싸지 않는다 — ReportSummarySection이 Dashboard와 같은
 * sticky KPI 툴바를 가지려면 좌우 여백(PAGE_GUTTER_X)을 섹션이 직접 소유해야
 * 한다(여기서 py를 얹으면 sticky 툴바가 스크롤 컨테이너 상단에 안 붙는다).
 */
export function ReportsPage() {
  const { campaigns, performanceRecords, isLoading, error, refresh } = usePaidAdsStore();

  return (
    <ReportSummarySection
      campaigns={campaigns}
      performanceRecords={performanceRecords}
      isLoading={isLoading}
      error={error}
      onRetry={refresh}
    />
  );
}
