import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

import { StoreTable } from '../../components/data-display/StoreTable';
import { StoreForm } from '../../components/templates/StoreForm';
import { REGION, STORE_STATUS, TARGET_SCOPE, getEffectiveStatus } from '../../data/schema';
import { BackendErrorBanner } from '../../components/data-display/BackendErrorBanner';

const emptyStoreValues = { id: '', name: '', region: REGION.GA, status: STORE_STATUS.PLANNED };

/**
 * StoreListSection
 *
 * /stores 페이지를 구성하는 섹션. 매장 목록(StoreTable) + 추가/수정 폼(StoreForm,
 * Dialog 하나를 공유) 조합. 이 화면 하나만을 위한 조합이라 재사용 설계보다 이
 * 페이지의 요구에 맞춘 얇은 조립을 우선했다 — 검증(중복 코드 등)은 이 섹션이
 * 소유한다 (CampaignForm/PerformanceForm과 달리, 여긴 아래 usePaidAdsStore의
 * addStore/updateStore를 직접 호출하는 상태 소유자라서 폼 자체보다 한 단계
 * 위 책임을 진다).
 *
 * 추가와 수정은 editingStoreId(null이면 추가 모드)로 같은 Dialog/폼을 분기한다.
 * 수정 모드에서는 매장 코드(PK)가 다른 테이블(Campaign.targetStoreIds 등)이
 * 참조하는 값이라 바꾸면 참조가 깨지므로 StoreForm의 isIdLocked로 잠근다.
 *
 * 매장별 캠페인 수는 Dashboard 사이드바(StoreBreakdown)가 이미 쓰는
 * Campaigns 컬럼은 매장 **전용** 캠페인만 센다(전 매장 대상은 각주로 분리).
 *
 * Props:
 * @param {Store[]} stores - 매장 목록 [Required]
 * @param {Campaign[]} campaigns - 캠페인 목록. 매장별 캠페인 수 계산용 [Required]
 * @param {Date} today - 진행중 판정 기준일. 스토어가 소유한 시계를 그대로 받는다 [Optional, 기본값: new Date()]
 * @param {function} onAddStore - 매장 추가 핸들러. async, 실패 시 falsy 반환 (store) => saved|null [Required]
 * @param {function} onUpdateStore - 매장 수정 핸들러. async, 실패 시 falsy 반환 (storeId, patch) => saved|null [Required]
 * @param {boolean} isLoading - 데이터 로드 중 여부. true면 표 대신 스켈레톤 [Optional, 기본값: false]
 * @param {string|null} loadError - 백엔드 오류 메시지. 있으면 상단에 오류 배너 [Optional, 기본값: null]
 * @param {function} onRetry - 오류 배너의 Retry 클릭 시 실행할 함수 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <StoreListSection stores={stores} campaigns={campaigns} onAddStore={addStore} onUpdateStore={updateStore} />
 */
export function StoreListSection({ stores, campaigns, today = new Date(), onAddStore, onUpdateStore, isLoading = false, loadError = null, onRetry, sx }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [values, setValues] = useState(emptyStoreValues);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingStoreId(null);
    setValues(emptyStoreValues);
    setError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;
    setEditingStoreId(storeId);
    setValues({ id: store.id, name: store.name, region: store.region, status: store.status });
    setError(null);
    setIsFormOpen(true);
  };

  /* 전용 캠페인 수만 센다. 예전엔 getStoreBreakdown이 주는 전체(= 전 매장 대상
     캠페인 + 이 매장 전용)를 그대로 썼는데, 전 매장 대상이 15개 매장 모두에
     각각 세어져서 어느 매장이든 87~100으로 찍혔다 — 차이(13)가 공통값(약 85)에
     묻혀 "어느 매장에 광고를 많이 돌렸나"라는 이 컬럼의 유일한 용도를 못 했다
     (전체 캠페인은 170개인데 15개 매장 합이 1,350이 되는 것도 오해를 부른다).
     공통분은 표 아래 각주로 한 번만 말하고, 컬럼은 매장끼리 실제로 다른 값만
     보여준다. */
  const sharedCampaignCount = campaigns.filter((c) => c.targetScope === TARGET_SCOPE.ALL_STORES).length;
  /* 지금 도는 수와 역대 수를 함께 넘긴다. 예전엔 역대 수 하나만 보내서, 바로
     왼쪽 Status의 초록 Active 칩과 눈으로 묶여 "지금 도는 광고 수"로 읽혔다 —
     전체 170건 중 166건이 이미 끝난 캠페인이라 사실상 98%가 과거 기록인 숫자를
     현재 상태처럼 보여준 셈이다(실사용 신고).

     대부분의 매장이 active 0으로 나올 것이다(지금 활성 4건이 전부 G10). 휑해
     보이지만 그게 사실이고, "14개 매장이 지금 광고를 안 돌리고 있다"는 화면에
     없던 정보다. */
  const campaignCounts = Object.fromEntries(
    stores.map((store) => {
      const forStore = campaigns.filter(
        (c) => c.targetScope !== TARGET_SCOPE.ALL_STORES && c.targetStoreIds.includes(store.id)
      );
      return [
        store.id,
        {
          active: forStore.filter((c) => getEffectiveStatus(c, today) === 'active').length,
          total: forStore.length,
        },
      ];
    })
  );

  // 쓰기 결과를 확인한다 — 스토어의 쓰기 함수는 실패 시 falsy를 돌려주는데,
  // 결과를 안 보고 Dialog를 닫으면 insert가 실패해도 입력값이 조용히 사라진다
  // (DashboardPage의 캠페인 저장과 같은 규칙).
  const handleSave = async () => {
    // 저장이 도는 동안 Save가 계속 눌리면 insert가 두 번 나간다. 첫 요청은
    // 성공하고 두 번째가 PK 중복으로 실패해서, 성공한 저장이 실패로 보고된다.
    if (isSaving) return;

    const code = values.id.trim();
    const name = values.name.trim();
    if (!code || !name) {
      setError('Store code and name are required.');
      return;
    }
    if (!editingStoreId && stores.some((s) => s.id === code)) {
      setError(`Store code "${code}" already exists.`);
      return;
    }

    setIsSaving(true);
    // 앞뒤 공백은 추가·수정 양쪽에서 똑같이 턴다 — 추가할 때만 원본을 넣으면
    // "  Savannah  "로 저장됐다가 나중에 편집만 해도 이름이 조용히 바뀐다.
    const result = editingStoreId
      ? await onUpdateStore(editingStoreId, { name, region: values.region, status: values.status })
      : await onAddStore({ ...values, id: code, name, createdAt: new Date().toISOString() });
    setIsSaving(false);

    if (!result) {
      setError(editingStoreId ? 'Save failed — the store was not updated. Try again.' : 'Save failed — the store was not created. Try again.');
      return;
    }
    setIsFormOpen(false);
  };

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        {/* 섹션 제목은 크기 스케일(h6)이 아니라 역할 토큰(title, 18px)을 쓴다 — design-system.md */}
        <Typography variant="title" sx={{ fontWeight: 700 }}>
          Stores ({stores.length})
        </Typography>
        <Button variant="contained" size="small" onClick={handleOpenAdd} sx={{ boxShadow: 'none' }}>
          Add Store
        </Button>
      </Box>

      {/* Dashboard/Reports와 같은 규칙 — 백엔드 오류는 배너로 드러내고,
          로딩과 "매장 없음"을 구분한다. */}
      {loadError && (
        <BackendErrorBanner error={ loadError } onRetry={ onRetry } sx={{ mb: 2 }} />
      )}

      {isLoading ? (
        <Box aria-label="Loading stores" role="status">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={40} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : (
        <>
          <StoreTable stores={stores} campaignCounts={campaignCounts} onRowClick={handleOpenEdit} />
          {/* 공통분은 여기서 한 번만 말한다 — 매장마다 같은 수를 더해 보여주면
              컬럼이 비교 불가능해진다. */}
          {sharedCampaignCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Campaigns counts store-specific campaigns only. {sharedCampaignCount} all-store campaigns run across every location.
            </Typography>
          )}
        </>
      )}

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStoreId ? 'Edit Store' : 'Add Store'}</DialogTitle>
        <DialogContent>
          <StoreForm
            values={values}
            // 입력을 고치면 낡은 에러 메시지는 지운다 — 안 지우면 이미 고친
            // 필드 아래에 예전 실패 문구가 계속 붙어 있다.
            onChange={(field, value) => {
              setError(null);
              setValues((v) => ({ ...v, [field]: value }));
            }}
            isIdLocked={Boolean(editingStoreId)}
            sx={{ mt: 1 }}
          />
          {/* 에러를 StoreForm의 id 필드 helperText로 넘기지 않는다 — 수정 모드에서는
              그 필드가 비활성이라, 저장 실패나 "이름이 비었다" 같은 메시지가 손댈 수
              없는 칸 아래에 붙어 엉뚱한 곳을 지목했다. */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ boxShadow: 'none' }}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
