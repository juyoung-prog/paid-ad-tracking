import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AlertBanner } from './AlertBanner';
import { mockAlerts } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Data Display/AlertBanner',
  component: AlertBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## AlertBanner

종료 임박(ending_soon)·예산 pacing(budget_pacing)·성과 미보고
(missing_performance)를 고긴급으로 노출한다. overlap_target(저긴급)과
new_store_reminder(Alert 시스템 밖)는 컴포넌트 내부에서 자동으로 걸러진다 —
알림 피로를 만들지 않기 위한 설계. missing_performance는 한 번 삭제됐다가
재도입됨 — 예전엔 reportedAt 필드가 트리거 근거였는데 그 필드가 사라지며
유형째 지웠다. 지금은 schema.js가 "종료 + 성과 레코드 부재"를 근거로 다시
생성한다(레코드가 저장되면 자연 해제되므로 예전처럼 영원히 미보고로 고정되지
않고, 종료 후 30일 창 안에서만 발생해 오래된 캠페인이 쏟아지지도 않는다).

### 기능
- 알림 유형별 컬러+아이콘 매핑(schema.js의 ALERT_SEVERITY 하나만 참조 — budget_pacing이 error, ending_soon이 warning: 활성 캠페인이 실시간으로 예산을 초과 집행 중인 게 실무상 더 급하다는 피드백으로 이렇게 배치함). 색만으로 구분하면 색맹 사용자가 못 갈라서 아이콘도 같이 붙임
- 알림을 한 줄씩 나열 — onAlertClick이 있으면 우측에 chevron(›)이 붙어 클릭 가능함을 명시(Tab+Enter/Space로도 활성화)
- onDismiss 버튼은 알림 줄과 분리된 자체 줄에 있음 — 첫 알림과 겹쳐 보여서 "그 알림 하나만 닫는 버튼"처럼 오해되던 문제를 고침
- 해제된(resolvedAt 있음) 알림은 자동 숨김
- 표시할 알림이 없으면 아무것도 렌더링하지 않음
- 대시보드 상단에 별도 "N alerts need attention" 요약 배너로도 노출했었는데, 알림 벨 배지와 정확히 같은 개수를 동시에 보여주는 순수 중복이라 없앰(collapsed 모드 제거) — 알림 벨 Popover가 이 컴포넌트의 유일한 사용처
        `,
      },
    },
  },
  argTypes: {
    alerts: { control: 'object', description: 'Alert 배열 (필터링 전 전체를 그대로 넘겨도 됨)' },
    onAlertClick: { action: 'alertClicked' },
    onDismiss: { action: 'dismissed' },
  },
};

/**
 * AlertBanner 기본 사용 예시
 */
export const Default = {
  args: {
    alerts: [
      { id: 'a1', type: 'ending_soon', message: 'D-3 — Ending Soon Campaign 종료 임박', resolvedAt: null },
      { id: 'a2', type: 'budget_pacing', message: 'Summer Sale Traffic — 예산 소진 속도가 빠릅니다', resolvedAt: null },
    ],
  },
};

/**
 * no_results — 돈은 나가는데 목표 지표가 0인 캠페인.
 *
 * 예산 페이싱만 보면 "계획대로 쓰는 중"이라 목록에서 `on budget pace`(회색)로
 * 표시된다. 실제로는 계획대로 태워서 아무것도 못 얻는 상태라, 그 문구만 보면
 * 괜찮은 것으로 읽힌다 — 실사용 리뷰에서 Traffic 목표에 클릭 0인 캠페인이
 * 그렇게 보이던 것이 이 유형을 만든 계기다.
 *
 * 확인 포인트: budget_pacing과 같은 error 등급(빨강+ErrorOutline)으로 뜨는가.
 *
 * 발생 조건이 두 겹이다 — 목표 지표가 **확인된 0**이고(미보고 null은 침묵),
 * 동시에 클릭·참여·전환·팔로우 등 **어느 축으로도 반응이 없어야** 한다.
 * 처음엔 목표 지표만 봤다가 실제 오탐이 났다: 클릭 0이라 알림이 떴는데 같은
 * 캠페인이 좋아요 391·팔로우 148·프로필 방문 178을 만들고 있었다. goal이
 * 플랫폼 objective를 우리 분류로 옮긴 값이라 틀릴 수 있는데(모르는 objective를
 * 한 분류로 몰아넣는다), 반응 전무 조건은 그 라벨이 틀려도 틀리지 않는다.
 */
export const NoResults = {
  args: {
    alerts: [
      {
        id: 'a1',
        type: 'no_results',
        message: 'G10_1_Month Deals_0710~0831 — $514.49 spent with 0 clicks on a traffic campaign — check targeting or creative',
        resolvedAt: null,
      },
      { id: 'a2', type: 'budget_pacing', message: 'Summer Sale Traffic — 예산 소진 속도가 빠릅니다', resolvedAt: null },
    ],
  },
};

/**
 * invoice_due — 이 앱에서 유일하게 **계정**에 붙는 알림.
 *
 * 다른 알림은 전부 캠페인 단위인데, 미납액은 그 계정의 모든 캠페인이 함께 만든
 * 값이라 캠페인 지출을 아무리 더해도 나오지 않는다(Meta는 문턱에 닿을 때마다
 * 청구하고 누적을 0으로 되돌리는데 우리는 그 리셋을 볼 수 없다). 그래서
 * 플랫폼이 주는 balance를 그대로 읽어 쓴다.
 *
 * 확인 포인트: campaignId가 null이라 클릭하면 캠페인 드로어가 아니라 Settings로
 * 가야 한다. 그리고 Needs Attention KPI에는 **안 들어간다** — 그 숫자는 클릭하면
 * 행으로 이어지는 자리인데 계정 알림은 해당하는 행이 없다. 벨에만 들어간다.
 */
export const InvoiceDue = {
  args: {
    alerts: [
      {
        id: 'a1',
        campaignId: null,
        accountId: 'meta-bm',
        type: 'invoice_due',
        message: 'Meta — Beauty Master — $387.52 of the $400 billing threshold — an invoice is due soon',
        resolvedAt: null,
      },
    ],
  },
};

/**
 * overlap_target·new_store_reminder는 섞여 들어와도 자동으로 걸러짐
 */
export const FiltersLowPriorityTypes = {
  args: {
    alerts: [
      { id: 'a1', type: 'overlap_target', message: '이 메시지는 보이지 않아야 한다', resolvedAt: null },
      { id: 'a2', type: 'budget_pacing', message: 'Summer Sale Traffic — 예산 소진 속도가 빠릅니다', resolvedAt: null },
    ],
  },
};

/**
 * 해제된 알림은 표시되지 않음 → 표시할 알림이 없으면 배너 자체가 렌더링되지 않음
 */
export const AllResolved = {
  args: {
    alerts: [{ id: 'a1', type: 'ending_soon', message: '해제된 알림', resolvedAt: '2026-07-19T00:00:00Z' }],
  },
  render: (args) => (
    <Box sx={{ color: 'text.disabled', fontSize: 13 }}>
      (빈 화면이 정상입니다 — 아래 AlertBanner는 아무것도 렌더링하지 않습니다)
      <AlertBanner {...args} />
    </Box>
  ),
};

/**
 * mockAlerts 전체 (new_store_reminder는 애초에 mockAlerts에 없음).
 * onAlertClick을 넘겨서 우측 chevron이 보이는 상태로 보여준다.
 */
export const WithMockData = {
  render: () => (
    <Box sx={{ maxWidth: 600 }}>
      <AlertBanner alerts={mockAlerts} onAlertClick={() => {}} />
    </Box>
  ),
};

/**
 * onDismiss가 있으면 알림 줄과 분리된 자체 줄에 닫기 버튼이 뜬다(첫 알림과
 * 겹쳐 보이던 예전 배치를 고쳐 "전체를 닫는다"는 게 명확해짐). 알림 벨
 * Popover와 배너가 같은 목록을 상시 중복 노출하지 않도록, 배너를 닫으면
 * 벨이 유일한 재접근 경로가 되는 설계다(DashboardPage의 alertsDismissed
 * 상태로 구현).
 */
function DismissibleDemo() {
  const [dismissed, setDismissed] = useState(false);
  return (
    <Box sx={{ maxWidth: 600 }}>
      {dismissed ? (
        <Typography variant="body2" color="text.secondary">
          배너를 닫았습니다 — 이제 알림 벨을 통해서만 접근할 수 있습니다 (데모용 문구).
        </Typography>
      ) : (
        <AlertBanner alerts={mockAlerts} onDismiss={() => setDismissed(true)} />
      )}
    </Box>
  );
}

export const WithDismiss = {
  render: DismissibleDemo,
};
