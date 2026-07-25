import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

import { StoreTable } from '../../components/data-display/StoreTable';
import { StoreForm } from '../../components/templates/StoreForm';
import { REGION, STORE_STATUS, getStoreBreakdown } from '../../data/schema';

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
 * getStoreBreakdown()을 그대로 재사용해서 계산한다 — 새 집계 로직을 만들지 않는다.
 *
 * Props:
 * @param {Store[]} stores - 매장 목록 [Required]
 * @param {Campaign[]} campaigns - 캠페인 목록. 매장별 캠페인 수 계산용 [Required]
 * @param {function} onAddStore - 매장 추가 핸들러 (store) => void [Required]
 * @param {function} onUpdateStore - 매장 수정 핸들러 (storeId, patch) => void [Required]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <StoreListSection stores={stores} campaigns={campaigns} onAddStore={addStore} onUpdateStore={updateStore} />
 */
export function StoreListSection({ stores, campaigns, onAddStore, onUpdateStore, sx }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [values, setValues] = useState(emptyStoreValues);
  const [error, setError] = useState(null);

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

  const campaignCounts = Object.fromEntries(
    getStoreBreakdown(stores, campaigns).map((row) => [row.storeId, row.campaigns.length])
  );

  const handleSave = () => {
    const code = values.id.trim();
    if (!code || !values.name.trim()) {
      setError('Store code and name are required.');
      return;
    }

    if (editingStoreId) {
      onUpdateStore(editingStoreId, { name: values.name.trim(), region: values.region, status: values.status });
      setIsFormOpen(false);
      return;
    }

    if (stores.some((s) => s.id === code)) {
      setError(`Store code "${code}" already exists.`);
      return;
    }
    onAddStore({ ...values, id: code, createdAt: new Date().toISOString() });
    setIsFormOpen(false);
  };

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Stores ({stores.length})
        </Typography>
        <Button variant="contained" size="small" onClick={handleOpenAdd} sx={{ boxShadow: 'none' }}>
          Add Store
        </Button>
      </Box>

      <StoreTable stores={stores} campaignCounts={campaignCounts} onRowClick={handleOpenEdit} />

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStoreId ? 'Edit Store' : 'Add Store'}</DialogTitle>
        <DialogContent>
          <StoreForm
            values={values}
            onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
            isIdLocked={Boolean(editingStoreId)}
            errors={error ? { id: error } : {}}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ boxShadow: 'none' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
