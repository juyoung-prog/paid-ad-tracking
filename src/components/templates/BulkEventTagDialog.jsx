import { useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PLATFORM } from '../../data/schema';
import { dateRange } from '../../utils/format';

const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

/**
 * 이름에서 매장 코드를 뽑는다(`G10_Grand Opening` → `G10`). 제안값을 고를 때만
 * 쓴다 — 서버의 정식 규칙(sync-campaigns의 resolveEventGroup)을 여기 옮겨오지
 * 않는다. 같은 규칙이 두 벌 있으면 한쪽만 고쳐지면서 조용히 갈라지는데, 이
 * 프로젝트는 이미 그 문제로 백필을 두 번 다시 짰다.
 */
function storeCodeOf(name) {
  return (String(name ?? '').match(/\b[A-Za-z]{1,2}\d{1,2}\b/) ?? [null])[0]?.toUpperCase() ?? null;
}

/**
 * BulkEventTagDialog 컴포넌트
 *
 * 태그가 없는 캠페인들에 Event를 **한 번에** 붙인다.
 *
 * ## 왜 필요한가
 *
 * Event(campaignGroup)는 이 앱의 핵심 추상화다 — 계획 대비, 이벤트 요약,
 * 타임라인이 전부 그 위에 있다. 그런데 태깅은 캠페인 하나씩 Drawer를 열어서
 * 해야 했다. 캠페인이 170건이고 동기화될 때마다 태그 없는 캠페인이 새로
 * 들어오므로 이 비용은 한 번이 아니라 **매번 반복된다.** 실제로는 태깅을
 * 포기하게 되고, 그러면 그 위에 쌓아 올린 나머지가 같이 무너진다.
 *
 * ## 왜 목록 전체에 체크박스를 달지 않았나
 *
 * 이 일의 실제 트리거는 "새 캠페인이 태그 없이 동기화됐다"는 순간이다. 목록
 * 전체를 선택 가능하게 만들면 매일 읽는 화면에 영구적인 시각 소음이 생기는데,
 * 정작 필요한 건 **태그 없는 것만 모아 보는 자리**다. 그래서 선택 모드를
 * 만들지 않고 이 대화상자 안에서만 고르게 한다.
 *
 * ## 제안값
 *
 * 매장 코드가 같은 기존 Event가 있으면 그걸 채워 둔다(`G10_...` → `G10 Opening`).
 * 맞히지 못해도 손해가 없고, 맞히면 클릭 한 번이 준다. 서버 규칙을 복제하지는
 * 않는다 — 위 storeCodeOf 주석 참고.
 *
 * ## 열려 있을 때만 마운트한다
 *
 * 호출부가 `{isOpen && <BulkEventTagDialog … />}`로 조건부 렌더한다. 그래서 이
 * 컴포넌트에는 `isOpen` prop이 없고, 선택 상태를 초기화하는 effect도 없다 —
 * 매번 새로 마운트되므로 useState 초기값이 곧 초기화다. 닫힌 채로 살아 있으면
 * 지난번 선택이 남고, 그 사이 목록이 바뀌었을 때 **보이지 않는 캠페인에 태그가
 * 붙는다.**
 *
 * Props:
 * @param {Array<{id: string, name: string, platform: string, startDate: string, endDate: string}>} campaigns - 태그가 없는 캠페인 목록 [Required]
 * @param {string[]} eventOptions - 기존 Event 이름(추천 목록) [Optional, 기본값: []]
 * @param {function} onApply - 적용 핸들러 `(ids, eventName) => Promise<number|null>` [Required]
 * @param {function} onClose - 닫기 핸들러 [Required]
 *
 * Example usage:
 * {isOpen && <BulkEventTagDialog campaigns={untagged} eventOptions={events} onApply={handleApply} onClose={close} />}
 */
export function BulkEventTagDialog({ campaigns, eventOptions = [], onApply, onClose }) {
  // 기본값은 전체 선택 — 이 대화상자에 들어온 목적이 "태그 없는 것들을 태그하기"라
  // 대부분의 경우 전부가 대상이다. 빼고 싶은 것만 체크를 풀게 한다.
  const [selectedIds, setSelectedIds] = useState(() => campaigns.map((c) => c.id));
  const [eventName, setEventName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  /** 선택된 캠페인들이 한 매장을 가리키면, 그 매장의 기존 Event를 제안한다. */
  const suggestion = useMemo(() => {
    const selected = campaigns.filter((c) => selectedIds.includes(c.id));
    if (selected.length === 0) return null;
    const codes = new Set(selected.map((c) => storeCodeOf(c.name)).filter(Boolean));
    if (codes.size !== 1) return null;
    const [code] = [...codes];
    return eventOptions.find((name) => storeCodeOf(name) === code) ?? null;
  }, [campaigns, selectedIds, eventOptions]);

  const toggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleApply = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const result = await onApply?.(selectedIds, eventName.trim());
    setIsSaving(false);
    if (result != null) onClose?.();
  };

  const allSelected = campaigns.length > 0 && selectedIds.length === campaigns.length;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tag campaigns with an Event</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These campaigns have no Event yet, so they are missing from event summaries and
          plan-vs-actual comparisons.
        </Typography>

        <Autocomplete
          freeSolo
          options={eventOptions}
          value={eventName}
          onInputChange={(_, next) => setEventName(next)}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Event"
              placeholder="e.g. G10 Opening"
              helperText={
                suggestion && !eventName.trim()
                  ? `Suggested from the campaign names: ${suggestion}`
                  : 'Pick an existing event, or type a new name'
              }
            />
          )}
        />
        {suggestion && !eventName.trim() && (
          <Button size="small" onClick={() => setEventName(suggestion)} sx={{ mt: 0.5 }}>
            {`Use "${suggestion}"`}
          </Button>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 0.5 }}>
          <Typography variant="label" sx={{ color: 'text.secondary' }}>
            {`Campaigns (${selectedIds.length}/${campaigns.length})`}
          </Typography>
          <Button
            size="small"
            onClick={() => setSelectedIds(allSelected ? [] : campaigns.map((c) => c.id))}
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </Button>
        </Box>

        <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
          {campaigns.map((campaign) => (
            <Box
              key={campaign.id}
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                cursor: 'pointer',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Checkbox
                size="small"
                checked={selectedIds.includes(campaign.id)}
                onChange={() => toggle(campaign.id)}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap title={campaign.name}>
                  {campaign.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`${PLATFORM_LABEL[campaign.platform] ?? campaign.platform} · ${dateRange(campaign.startDate, campaign.endDate)}`}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={isSaving || selectedIds.length === 0 || !eventName.trim()}
          sx={{ boxShadow: 'none' }}
        >
          {isSaving ? 'Tagging…' : `Tag ${selectedIds.length} campaign${selectedIds.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
