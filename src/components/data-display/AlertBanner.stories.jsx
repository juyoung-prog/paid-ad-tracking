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

종료 임박(ending_soon)·예산 pacing(budget_pacing)만 상단 배너로 노출한다.
overlap_target(저긴급)과 new_store_reminder(Alert 시스템 밖)는 컴포넌트
내부에서 자동으로 걸러진다 — 알림 피로를 만들지 않기 위한 설계. 성과 미보고
(missing_performance) 알림 유형은 삭제됨 — PerformanceForm의 Recorded/
Reported Date 필드가 없어지면서 이 알림을 트리거하던 근거(reportedAt) 자체가
사라져 함께 제거했다.

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
