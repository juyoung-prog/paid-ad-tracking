import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { StoreMultiSelect } from '../input/StoreMultiSelect';
import { DateRangeField } from '../input/DateRangeField';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
import { PLATFORM, GOAL, calcAutoBudgetPlanned } from '../../data/schema';

const PLATFORM_OPTIONS = [
  { value: PLATFORM.META, label: 'Meta' },
  { value: PLATFORM.TIKTOK, label: 'TikTok' },
];

const GOAL_OPTIONS = [
  { value: GOAL.AWARENESS, label: 'Awareness' },
  { value: GOAL.TRAFFIC, label: 'Traffic' },
  { value: GOAL.ENGAGEMENT, label: 'Engagement' },
  { value: GOAL.CONVERSION, label: 'Conversion' },
  { value: GOAL.STORE_VISIT, label: 'Store Visit' },
];

function FieldLabel({ children }) {
  // 한때 minHeight: '2.5rem'(2줄 분량)을 줬었다 — Campaign Group(optional)
  // 라벨이 좁은 컬럼에서 2줄로 줄바꿈되면서 옆의 1줄짜리 Campaign Name과
  // 입력창 시작 위치가 어긋나 보였기 때문(실사용 피드백으로 발견). 그 필드가
  // "Event"로 이름이 바뀌면서 항상 1줄이 됐고, 이 폼의 다른 라벨 쌍도 전부
  // 1줄이라 2줄을 미리 예약해둘 이유가 없어졌다 — 라벨과 입력창 사이에
  // 불필요하게 넓은 빈 공간만 남기고 있어서(실사용 피드백으로 발견) 없앴다.
  // 라벨 줄 수가 실제로 다시 달라지는 쌍이 생기면(PerformanceForm의
  // Recorded/Reported Date처럼) 그때 다시 필요한 만큼만 준다.
  //
  // 이 컴포넌트는 순전히 시각적인 캡션이다 — <label htmlFor>도 아니고
  // TextField/Select의 label prop도 아니라서, 입력창과 프로그램적으로
  // 연결되지 않는다. 그래서 이 폼의 모든 TextField/Select에 별도로
  // `slotProps={{ htmlInput/input: { 'aria-label': ... } }}`를 줘서
  // 스크린리더가 이름을 읽을 수 있게 한다(접근성 리뷰로 발견 — 시각적으로는
  // 라벨이 완벽해 보이지만 스크린리더에는 이름 없는 입력창으로 들렸다).
  return (
    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

/**
 * CampaignForm 컴포넌트
 *
 * 캠페인 등록/수정 폼. 관련 필드를 2열로 그룹핑해 세로 길이와 유휴 공간을
 * 줄인다(플랫폼+계정, Daily/Planned Budget, 매장 선택·비고는 전체 폭).
 * 좁은 화면(xs)에서는 모든 그룹이 1열로 쌓인다. 기간(Campaign Dates)은
 * 시작일/종료일을 따로 타이핑하던 것(LocalizedDateField 2개)을 DateRangeField
 * 캘린더 팝오버 하나로 합쳤다 — 클릭 한 번으로 범위를 다 고를 수 있다.
 *
 * 캠페인 1개 = 플랫폼 1개라, "같은 마케팅 아이디어를 메타·틱톡 동시에 돌린다"는
 * 캠페인을 2개 따로 만들어야 한다. 단순히 플랫폼만 다른 경우엔 이름을 완전히
 * 똑같이 지으면 그룹으로 묶인다(schema.js의 campaignGroupKey()가 campaignGroup이
 * 없으면 name을 그대로 그룹 키로 씀) — Platform 칩만으로도 형제 캠페인이 서로
 * 구분되니 이름을 굳이 다르게 지을 필요가 없다. 하지만 같은 이니셔티브를 여러
 * "단계"로 나눠 등록할 때(예: 그랜드 오프닝의 Coming Soon/Now Open/Grand
 * Opening/1 Month Deals)는 각 단계가 리스트에서 서로 구분되는 이름이 있어야
 * 하는데, 그러면 이름만으로는 더 이상 그룹으로 안 묶인다 — 이 경우를 위해
 * campaignGroup 필드를 쓴다(이름은 달라도 이 값이 같으면 그룹으로 인식). UI
 * 라벨은 "Event"(캠페인 하나하나가 속한 상위 이벤트/이니셔티브를 태깅한다는
 * 의미가 더 잘 전달됨, "Campaign Group"은 뜻이 바로 안 와닿는다는 피드백) —
 * 모든 캠페인이 어떤 이벤트에 속하는지 태깅되어야 한다는 게 실제 운영 방침이라
 * optional이 아니라 필수 필드다.
 * 한때 이 필드(당시 이름 groupName)를 만들었다가 "이름 통일로 완전히 대체된다"며
 * 없앤 적이 있는데, 그건 형제가 Platform 칩만으로 구분되는 단순 케이스에서만
 * 맞는 얘기였다 — 구분해줄 다른 필드가 없는 케이스(같은 플랫폼·같은 매장,
 * 단계만 다름)가 실제로 있어서 다시 만들었다. (한 다이얼로그에서 메타·틱톡을
 * 동시에 입력받는 방식도 시도해봤는데, 모든 필드가 통째로 두 벌이 되어 오히려
 * 복잡해져서 되돌렸다.)
 *
 * Daily Budget과 기간(양쪽 날짜)이 다 채워지면 Planned Budget을 "Daily Budget ×
 * 일수"로 자동 계산해서 채우고, 그동안 Planned Budget 입력창은 비활성화된다
 * (직접 타이핑할 필요가 없다는 뜻 — Daily Budget을 지우면 다시 수동 입력으로
 * 돌아감). 날짜는 시작일·종료일을 둘 다 포함해서 센다(8/1~8/31 = 31일). Daily
 * Budget을 Planned Budget보다 왼쪽(먼저)에 배치했다 — Planned Budget이 먼저
 * 보이면 그것부터 채워야 할 것 같은 착시가 생겨서, "여기 입력 → 저게 자동으로
 * 나온다"는 흐름이 읽는 순서와 일치하도록 순서를 바꿨다.
 *
 * Ad Link(creativeUrl)와 Thumbnail(thumbnailUrl)은 별개 필드다 — 한때 하나로
 * 합쳤었는데("View Ad" 링크와 썸네일이 URL 하나를 공유), 텍스트 입력을 아예
 * 없애고 업로드 전용으로 만들고 나니 실제 영상/게시물 링크를 입력할 방법이
 * 사라져 "View Ad"가 실제 링크로 안 가는 문제가 생겼다 — 링크와 썸네일 이미지는
 * 서로 다른 값일 수 있어 애초에 합칠 수 없는 개념이었다. Ad Link는 사람이
 * 타이핑하는 순수 텍스트 필드(View Ad 외부 링크로만 쓰임), Thumbnail은 업로드
 * 버튼을 누르면 뜨는 팝오버(dropzone)에서 파일 선택과 붙여넣기(Cmd+V) 중
 * 아무거나로만 채우는 업로드 전용 필드(목록/헤더 미리보기로만 쓰임, 성공
 * 여부는 "Uploaded"/"Not uploaded" 상태 텍스트로 표시).
 *
 * 값/에러는 모두 props로만 받는다 — 폼 자체는 검증 로직을 갖지 않는다.
 *
 * Props:
 * @param {object} values - 폼 값 { name, campaignGroup, platform, accountId, targetScope, targetStoreIds, startDate, endDate, budgetPlanned, budgetDaily, goal, creativeUrl, thumbnailUrl } [Required]
 * @param {function} onChange - 필드 변경 핸들러 (field, value) => void [Required]
 * @param {Array<{id: string, name: string}>} stores - StoreMultiSelect에 전달할 매장 목록 [Required]
 * @param {Array<{id: string, platform: string, label: string}>} accounts - 광고 계정 목록 (선택된 platform으로 내부 필터링) [Required]
 * @param {object} errors - 필드별 에러 메시지 { field: message } [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <CampaignForm
 *   values={values}
 *   onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
 *   stores={mockStores}
 *   accounts={mockAdAccounts}
 * />
 */
export function CampaignForm({ values, onChange, stores, accounts, errors = {}, sx }) {
  const availableAccounts = accounts.filter((a) => a.platform === values.platform);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const [uploadAnchorEl, setUploadAnchorEl] = useState(null);
  const isUploadedImage = Boolean(values.thumbnailUrl);

  // Daily Budget과 기간(양쪽 날짜)이 다 있으면 Planned Budget을 "Daily Budget ×
  // 일수"로 자동 계산해서 직접 타이핑할 필요를 없앤다. Daily Budget을 지우면
  // Planned Budget은 다시 수동 입력으로 돌아간다. schema.js의 calcAutoBudgetPlanned()를
  // DashboardPage(Drawer를 열 때 스냅샷 정규화)와 공유한다 — 공식이 두 곳에서
  // 어긋나면, 이 공식 도입 전에 저장된 캠페인을 열었을 때 여기서 계산한 값이
  // 저장된 값과 달라서 아무것도 안 건드렸는데 "미저장 변경"으로 오탐된다.
  const autoBudget = calcAutoBudgetPlanned(values.budgetDaily, values.startDate, values.endDate);
  const autoBudgetPlanned = autoBudget?.amount ?? null;

  useEffect(() => {
    if (autoBudgetPlanned != null && values.budgetPlanned !== autoBudgetPlanned) {
      onChange('budgetPlanned', autoBudgetPlanned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBudgetPlanned]);

  // 로컬 이미지 파일을 data URI로 읽어 thumbnailUrl에 그대로 넣는다
  // (별도 업로드 서버 없이 동작). Ad Link(creativeUrl)와는 별개 필드다.
  function readImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange('thumbnailUrl', reader.result);
    reader.readAsDataURL(file);
  }

  function handleFileSelect(e) {
    readImageFile(e.target.files?.[0]);
    e.target.value = '';
    setUploadAnchorEl(null);
  }

  // 업로드 팝오버의 dropzone에서 Cmd+V로 붙여넣기도 지원한다.
  function handlePaste(e) {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    readImageFile(item.getAsFile());
    setUploadAnchorEl(null);
  }

  return (
    <Box sx={sx}>
      <Grid container spacing={2}>
        {/* 이름은 전체 폭을 준다. 7/12 컬럼에서는 동기화된 실제 이름
            ("G10_1_Month Deals_0710~0831")이 입력창 안에서 잘려서, 이름을
            고치는 화면인데 정작 이름이 안 보였다(실사용 리뷰로 발견). Event는
            아래 줄로 내린다 — 짧은 값이라 좁은 컬럼에서도 온전히 보인다. */}
        <Grid size={12}>
          <FieldLabel>Campaign Name</FieldLabel>
          <TextField
            fullWidth
            size="small"
            value={values.name ?? ''}
            onChange={(e) => onChange('name', e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            slotProps={{ htmlInput: { 'aria-label': 'Campaign Name' } }}
          />
        </Grid>

        {/* 캠페인 1개=플랫폼 1개라 "메타+틱톡 동시 진행"처럼 이름만 통일해도 되는
            단순한 경우는 이 필드 없이 이름만 같게 지으면 여전히 그룹으로 묶인다
            (campaignGroupKey가 없으면 name으로 대체). 근데 같은 이니셔티브를
            여러 "단계"로 나눠 등록할 때(예: 그랜드 오프닝의 Coming Soon/Now
            Open/Grand Opening/1 Month Deals)는 각 단계가 리스트에서 구분되는
            이름이 있어야 하는데, 그러면 이름만으로는 더 이상 그룹으로 안 묶인다
            — 이럴 때 여기에 같은 값("BF4 Grand Opening")을 넣으면 이름이 달라도
            같은 이니셔티브로 묶인다(형제 표시·합계 요약·중복 타겟팅 경고 억제
            전부 이 값을 기준으로 판단). 예전엔 이 설명을 helperText로 매번
            보여줬는데, 두 줄짜리 필드명(Campaign Name)과 다섯 줄짜리 설명이
            나란히 있으면 세로로 너무 길어진다는 피드백으로 없앴다 — placeholder
            예시 하나로 충분히 짐작 가능하고, 자세한 설명은 이 주석에만 남긴다. */}
        <Grid size={{ xs: 12, md: 5 }}>
          <FieldLabel>Event</FieldLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. BF4 Grand Opening"
            value={values.campaignGroup ?? ''}
            onChange={(e) => onChange('campaignGroup', e.target.value)}
            error={Boolean(errors.campaignGroup)}
            helperText={errors.campaignGroup}
            slotProps={{ htmlInput: { 'aria-label': 'Event' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Platform</FieldLabel>
          <Select
            fullWidth
            size="small"
            value={values.platform ?? ''}
            onChange={(e) => {
              onChange('platform', e.target.value);
              onChange('accountId', '');
            }}
            slotProps={{ input: { 'aria-label': 'Platform' } }}
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Account</FieldLabel>
          <Select
            fullWidth
            size="small"
            value={values.accountId ?? ''}
            onChange={(e) => onChange('accountId', e.target.value)}
            disabled={!values.platform}
            displayEmpty
            slotProps={{ input: { 'aria-label': 'Account' } }}
          >
            {availableAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>{account.label}</MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <StoreMultiSelect
            label="Target Store(s)"
            stores={stores}
            scope={values.targetScope}
            selectedStoreIds={values.targetStoreIds ?? []}
            onScopeChange={(scope) => {
              onChange('targetScope', scope);
              onChange('targetStoreIds', []);
            }}
            onSelectionChange={(ids) => onChange('targetStoreIds', ids)}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FieldLabel>Campaign Dates</FieldLabel>
          <DateRangeField
            value={{ start: values.startDate ?? '', end: values.endDate ?? '' }}
            onChange={({ start, end }) => {
              onChange('startDate', start);
              onChange('endDate', end);
            }}
            error={Boolean(errors.startDate || errors.endDate)}
            helperText={errors.startDate || errors.endDate}
            label="Campaign Dates"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Daily Budget (USD, optional)</FieldLabel>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={values.budgetDaily ?? ''}
            onChange={(e) => onChange('budgetDaily', e.target.value === '' ? null : Number(e.target.value))}
            slotProps={{ htmlInput: { 'aria-label': 'Daily Budget (USD, optional)' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Planned Budget (USD)</FieldLabel>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={(autoBudgetPlanned ?? values.budgetPlanned) ?? ''}
            onChange={(e) => onChange('budgetPlanned', Number(e.target.value))}
            disabled={autoBudgetPlanned != null}
            error={Boolean(errors.budgetPlanned)}
            helperText={errors.budgetPlanned}
            slotProps={{ htmlInput: { 'aria-label': 'Planned Budget (USD)' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Goal</FieldLabel>
          <Select
            fullWidth
            size="small"
            value={values.goal ?? ''}
            onChange={(e) => onChange('goal', e.target.value)}
            slotProps={{ input: { 'aria-label': 'Goal' } }}
          >
            {GOAL_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FieldLabel>Ad Link (optional)</FieldLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="https://business.facebook.com/adsmanager/... or a video/post URL"
            value={values.creativeUrl ?? ''}
            onChange={(e) => onChange('creativeUrl', e.target.value)}
            slotProps={{ htmlInput: { 'aria-label': 'Ad Link (optional)' } }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FieldLabel>Thumbnail</FieldLabel>
          {/* URL을 타이핑하는 입력창은 두지 않는다 — 업로드/붙여넣기로만 채운다.
              성공 여부는 상태 텍스트(Uploaded/Not uploaded)로만 보여준다. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CampaignThumbnail
              thumbnailUrl={values.thumbnailUrl}
              name={values.name || '?'}
              platform={values.platform}
              size={56}
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UploadFileIcon fontSize="small" />}
                  onClick={(e) => setUploadAnchorEl(e.currentTarget)}
                  sx={{ textTransform: 'none' }}
                >
                  Upload
                </Button>
                {/* variant="text"(기본값)는 테두리·배경이 없어 브라우저 기본 링크처럼
                    보인다 — 바로 옆 Upload(outlined)와 나란히 있으면 무게가 안 맞아
                    더 도드라진다(Duplicate/Delete에서 같은 이유로 이미 고친 문제와
                    동일 케이스). Remove는 재업로드로 바로 되돌릴 수 있는 가벼운
                    동작이라 error 색은 안 쓰고 outlined만 맞춘다. */}
                {isUploadedImage && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CloseIcon sx={(theme) => ({ fontSize: theme.iconSize.inline })} />}
                    onClick={() => onChange('thumbnailUrl', '')}
                    sx={{ textTransform: 'none' }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color={isUploadedImage ? 'success.main' : 'text.secondary'} sx={{ display: 'block', mt: 0.5 }}>
                {isUploadedImage ? 'Uploaded' : 'Not uploaded'}
              </Typography>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelect}
            />
          </Box>

          <Popover
            open={Boolean(uploadAnchorEl)}
            anchorEl={uploadAnchorEl}
            onClose={() => setUploadAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            disableAutoFocus
            disableEnforceFocus
            slotProps={{ transition: { onEntered: () => dropzoneRef.current?.focus() } }}
          >
            {/* 파일 선택과 붙여넣기를 한 표면에서 다 할 수 있는 dropzone —
                열리자마자 포커스를 받아서 클릭 없이 바로 Cmd+V 가능. mount 시점
                useEffect로 포커스를 주면, Popover가 위치 계산 때문에 내부적으로
                한 프레임 더 리렌더해서 dropzoneRef가 아직 null인 채로 실행되고,
                그 뒤엔 Popover 자체의 포커스 트랩이 Paper로 포커스를 되가져가
                버리는 버그가 있었다 — 트랜지션이 완전히 끝난 뒤(onEntered)에
                포커스를 주고, 기본 포커스 트랩은 꺼서 다시 뺏기지 않게 한다. */}
            <Box
              ref={dropzoneRef}
              tabIndex={-1}
              role="button"
              onClick={() => fileInputRef.current?.click()}
              onPaste={handlePaste}
              sx={{
                width: 260,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: (theme) => `${theme.shape.radius.control}px`,
                outline: 'none',
                // hover/focus 강조는 accent — 파랑 단일화(테마 accent 주석) 적용
                '&:hover, &:focus-visible': { borderColor: 'accent.main', backgroundColor: 'action.hover' },
              }}
            >
              <UploadFileIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2">Click to choose a file</Typography>
              <Typography variant="caption" color="text.secondary">
                or paste an image (⌘V)
              </Typography>
            </Box>
          </Popover>
        </Grid>
      </Grid>
    </Box>
  );
}
