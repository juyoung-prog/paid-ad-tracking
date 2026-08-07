import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ALERT_SEVERITY, ALERT_TYPE } from '../../data/schema';

// 배너에 노출할 고긴급 알림 유형만 골라낸다 (Visual Direction 알림 긴급도 매핑).
// overlap_target(저긴급)은 카드 인라인 표시로만 처리하고, new_store_reminder는
// 캠페인에 종속된 알림이 아니라서 애초에 Alert 시스템 밖(/stores 안내 문구)이다.
// 둘 다 이 컴포넌트에서는 의도적으로 제외한다 — 알림 피로 방지.
// missing_performance는 재도입 — 한때 트리거 근거(reportedAt 필드)가 사라지며
// 유형째 삭제했는데, schema.js가 "종료 + 성과 레코드 부재"라는 필드 없는
// 근거로 다시 생성한다(레코드가 저장되는 순간 자연 해제되므로 "영원히 미보고로
// 고정"되던 예전 고장은 재발하지 않는다). Visual Direction의 원래 분류대로
// 고긴급(error)이라 배너 대상이다.
// no_results도 고긴급이다 — 예산 페이싱은 "쓰는 속도"만 보므로 계획대로 태워서
// 성과 0인 상태를 잡지 못한다. 실제로 그 캠페인이 "on pace"로 표시됐다.
const BANNERABLE_TYPES = new Set([
  ALERT_TYPE.ENDING_SOON,
  ALERT_TYPE.BUDGET_PACING,
  ALERT_TYPE.MISSING_PERFORMANCE,
  ALERT_TYPE.NO_RESULTS,
  ALERT_TYPE.INVOICE_DUE,
]);

const SEVERITY_COLOR = {
  warning: 'warning.main',
  error: 'error.main',
};

// 색(테두리) 하나로만 심각도를 구분하면 색맹 사용자가 error/warning을 못
// 가른다 — 아이콘을 같이 붙여서 색 없이도 구분되게 한다.
const SEVERITY_ICON = {
  warning: WarningAmberIcon,
  error: ErrorOutlineIcon,
};

/**
 * AlertBanner 컴포넌트
 *
 * 종료 임박·예산 pacing·성과 미보고 등 고긴급 알림을 한 줄씩 나열해 보여준다.
 * overlap_target, new_store_reminder는 이 컴포넌트에서 자동으로 걸러진다 —
 * 호출부에서 미리 필터링할 필요가 없다. 알림 벨 Popover가 이 컴포넌트의
 * 유일한 사용처다 — 대시보드 상단에 별도 배너로도 노출했었는데, 벨 배지와
 * 정확히 같은 개수를 동시에 보여주는 순수 중복이라 배너는 없앴다(벨이
 * 유일한 알림 진입점).
 *
 * 각 줄은 왼쪽 테두리 색뿐 아니라 심각도 아이콘(⚠/⛔)도 같이 보여준다(색만으로
 * 구분하면 색맹 사용자가 못 가른다) — 색/아이콘은 schema.js의 ALERT_SEVERITY
 * 하나만 참조한다(예전엔 이 파일과 DashboardPage가 각자 하드코딩해서 서로
 * 어긋날 수 있었다). onAlertClick이 있으면 우측에 chevron(›)이 붙어 클릭
 * 가능함을 명시하고, Tab+Enter/Space로도 활성화된다(CampaignTable·StoreTable과
 * 동일 패턴).
 *
 * Props:
 * @param {Array<{id: string, type: string, message: string}>} alerts - 알림 목록 (필터링 전 전체 목록을 그대로 넘겨도 됨) [Required]
 * @param {function} onAlertClick - 알림 클릭 핸들러 (alert) => void [Optional]
 * @param {function} onDismiss - 배너 전체를 닫는 핸들러. 있을 때만 닫기 버튼 노출 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <AlertBanner alerts={mockAlerts} onAlertClick={(alert) => openCampaignDrawer(alert.campaignId)} />
 */
export function AlertBanner({ alerts, onAlertClick, onDismiss, sx }) {
  const visibleAlerts = alerts.filter((alert) => BANNERABLE_TYPES.has(alert.type) && !alert.resolvedAt);

  if (visibleAlerts.length === 0) return null;

  return (
    <Box sx={sx}>
      {onDismiss && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
          <IconButton size="small" onClick={onDismiss} aria-label="Dismiss all alerts">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {visibleAlerts.map((alert) => {
          const severity = ALERT_SEVERITY[alert.type];
          const color = SEVERITY_COLOR[severity];
          const SeverityIcon = SEVERITY_ICON[severity];

          return (
            <Box
              key={alert.id}
              onClick={onAlertClick ? () => onAlertClick(alert) : undefined}
              role={onAlertClick ? 'button' : undefined}
              tabIndex={onAlertClick ? 0 : undefined}
              onKeyDown={
                onAlertClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onAlertClick(alert);
                      }
                    }
                  : undefined
              }
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.75,
                px: 1.5,
                borderLeft: '3px solid',
                borderColor: color,
                backgroundColor: 'grey.50',
                // 상태 표시 배너 — mui-theme.md 역할표의 4px 행(Alert 배너)과
                // 같은 분류. DashboardPage의 Event 요약 스트립과 같은 값.
                borderRadius: (theme) => `${theme.shape.radius.control}px`,
                cursor: onAlertClick ? 'pointer' : 'default',
                ...(onAlertClick && {
                  '&:hover': { backgroundColor: 'action.hover' },
                  // 포커스는 앱 공통 문법(테마 MuiOutlinedInput과 동일) — 1px
                  // accent 테두리 + 옅은 ring. 2px 순수 primary 아웃라인은 같은
                  // 앱 안에서 포커스가 두 가지 시각 언어를 갖게 했다.
                  '&:focus-visible': {
                    outline: '1px solid',
                    outlineColor: 'accent.main',
                    outlineOffset: -1,
                    boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                  },
                }),
              }}
            >
              <SeverityIcon sx={{ fontSize: 18, color, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, color, flex: 1 }}>
                {alert.message}
              </Typography>
              {onAlertClick && <ChevronRightIcon sx={{ color: 'text.disabled', flexShrink: 0 }} fontSize="small" />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
