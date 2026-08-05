import { PageContainer } from '../../components/layout/PageContainer';
import { usePaidAdsStore } from './usePaidAdsStore';
import { PAGE_GUTTER_X } from './paidAdsPageUtils';
import { ReportSummarySection } from './ReportSummarySection';

/**
 * ReportsPage
 *
 * 성과 보고서 화면(/reports). 기간·Event·플랫폼으로 캠페인을 좁혀서 요약
 * 통계와 캠페인별 지표를 확인하고 CSV로 내보낼 수 있다. 타이틀+네비는
 * PaidAdsShell(글로벌 셸)이 그린다.
 */
export function ReportsPage() {
  const { campaigns, performanceRecords } = usePaidAdsStore();

  return (
    <PageContainer maxWidth={false} sx={{ py: 3, px: PAGE_GUTTER_X }}>
      <ReportSummarySection campaigns={campaigns} performanceRecords={performanceRecords} />
    </PageContainer>
  );
}
