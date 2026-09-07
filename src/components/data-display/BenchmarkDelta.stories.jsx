import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { BenchmarkDelta } from './BenchmarkDelta';
import { money, percent } from '../../utils/format';

const pct = (v) => percent(v, { digits: 2 });

/** benchmarkStat() 결과 모양 그대로 — 스토리는 계산하지 않고 결과만 넘긴다 */
const STATS = {
  top: { metricKey: 'hookRate', value: 0.37, median: 0.2851, percentile: 75, sampleSize: 4, lowerIsBetter: false, peerScope: 'phase', band: 'top' },
  mid: { metricKey: 'cpm', value: 2.56, median: 2.49, percentile: 33, sampleSize: 3, lowerIsBetter: true, peerScope: 'phase', band: 'mid' },
  bottom: { metricKey: 'holdRate', value: 0.2092, median: 0.2357, percentile: 0, sampleSize: 3, lowerIsBetter: false, peerScope: 'phase', band: 'bottom' },
  cheapCpm: { metricKey: 'cpm', value: 3.07, median: 3.59, percentile: 100, sampleSize: 4, lowerIsBetter: true, peerScope: 'phase', band: 'top' },
  goalScope: { metricKey: 'ctr', value: 0.0136, median: 0.0114, percentile: 67, sampleSize: 5, lowerIsBetter: false, peerScope: 'goal', band: 'mid' },
  notEnough: { metricKey: 'cpa', value: 17.49, median: null, percentile: null, sampleSize: 1, lowerIsBetter: true, peerScope: 'none', band: null },
  noValue: { metricKey: 'cpa', value: null, median: null, percentile: null, sampleSize: 0, lowerIsBetter: true, peerScope: 'none', band: null },
};

export default {
  title: 'Paid Ads Dashboard/Data Display/BenchmarkDelta',
  component: BenchmarkDelta,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## BenchmarkDelta

지표 값 하나 + 그 아래 "비슷한 캠페인 대비 어디쯤인가" 한 줄. Recap 표의 비율
지표 셀에 들어간다(Build Plan Phase 2).

### 기호는 높낮이가 아니라 좋고 나쁨
얇은 선 대각 화살표(Lucide arrow-up-right/down-right 기하를 svg로) — ↗는 "비교군보다
낫다", ↘는 "못하다", mid는 기호 없음. CPM처럼 낮을수록 좋은 지표는 값이 중앙값보다
**낮아도 ↗**다(CheapCpm 스토리). 시간 추세가 아니라 상대 위치라 trending 아이콘은
쓰지 않는다. 위계는 값(13px/600) → 비교 글자(500) → 화살표(11~12px, stroke 1.5). 색만으로
구분하지 않는 이유는 색각 이상 사용자에게 증감이 사라지기 때문.

### 계산은 여기서 하지 않는다
중앙값·백분위·구간(band)은 \`schema.js\`의 \`benchmarkStat()\`이 정해서 \`stat\`으로
넘긴다. 이 컴포넌트는 그 결과를 문장으로 바꿀 뿐이고, 문장 자체도 \`recapStrings\`
에서 꺼낸다(컴포넌트 안에 영어 리터럴 없음 — 언어를 늘릴 때 이 파일을 열지 않는다).

### 비교군이 부족하면
\`peerScope\`가 \`none\`이면 값만 보통 글자로 두고 아래에 "not enough data"를
흐리게 적는다. 없는 비교를 지어내지 않는다.
        `,
      },
    },
  },
  argTypes: {
    stat: { control: 'object', description: 'schema.js benchmarkStat() 결과 — value · median · percentile · sampleSize · peerScope · band' },
    format: { control: false, description: '숫자 → 표시 문자열. utils/format의 money·percent 등. 값과 중앙값에 같이 쓴다' },
    label: { control: 'text', description: '지표 이름(툴팁 문장용)' },
    peerLabel: { control: 'text', description: '비교군 이름(툴팁용, 예: Grand Opening)' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어. 1단계는 en만 채워져 있어 다른 언어도 en으로 나온다' },
    size: { control: 'radio', options: ['sm', 'md'], description: '글자 크기 단계 — 표 셀은 sm' },
    hasValue: { control: 'boolean', description: 'false면 값 줄을 생략하고 비교 줄만' },
    hasMedian: { control: 'boolean', description: 'false면 "· median" 부분을 툴팁에만 남긴다 — 표 셀' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/** 상위 구간 — Hook 37% (중앙값 28.5%, 상위 25%) */
export const Default = {
  args: {
    stat: STATS.top,
    format: pct,
    label: 'Hook',
    peerLabel: 'Grand Opening',
    size: 'md',
    hasValue: true,
  },
};

/**
 * 세 구간 + 비교군 부족 + 값 없음. 확인 포인트:
 * - top은 ↗ 초록, bottom은 ↘ 주황(warning), mid는 기호 없이 회색
 * - not enough data는 값은 보통 글자, 아래 줄만 흐림(text.disabled)
 * - 값이 없으면 "—"
 */
export const Bands = {
  render: () => (
    <Stack direction="row" spacing={5} alignItems="flex-start">
      {[
        ['top', STATS.top, pct, 'Hook'],
        ['mid', STATS.mid, money, 'CPM'],
        ['bottom', STATS.bottom, pct, 'Hold'],
        ['not enough data', STATS.notEnough, money, 'CPA'],
        ['no value', STATS.noValue, money, 'CPA'],
      ].map(([title, stat, format, label]) => (
        <Box key={title}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{title}</Typography>
          <BenchmarkDelta stat={stat} format={format} label={label} peerLabel="Grand Opening" />
        </Box>
      ))}
    </Stack>
  ),
};

/**
 * 낮을수록 좋은 지표 — CPM $3.07이 중앙값 $3.59보다 **낮은데 ↗**다.
 * 기호가 값의 방향이 아니라 좋고 나쁨을 말한다는 것을 보여주는 스토리.
 */
export const CheapCpm = {
  args: { stat: STATS.cheapCpm, format: money, label: 'CPM', peerLabel: 'Grand Opening' },
};

/** 같은 goal로 물러난 비교군(peerScope 'goal') — 툴팁 문장이 "vs 5 awareness campaigns"로 바뀐다 */
export const GoalScope = {
  args: { stat: STATS.goalScope, format: pct, label: 'CTR', peerLabel: 'awareness' },
};

/** 표 셀 크기(sm)와 값 줄 없이 비교 줄만(hasValue=false) */
export const Sizes = {
  render: () => (
    <Stack direction="row" spacing={5} alignItems="flex-start">
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>md</Typography>
        <BenchmarkDelta stat={STATS.top} format={pct} label="Hook" />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>sm</Typography>
        <BenchmarkDelta stat={STATS.top} format={pct} label="Hook" size="sm" />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>hasValue=false</Typography>
        <BenchmarkDelta stat={STATS.top} format={pct} label="Hook" size="sm" hasValue={false} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>hasMedian=false (표 셀)</Typography>
        <BenchmarkDelta stat={STATS.top} format={pct} label="Hook" size="sm" hasMedian={false} />
      </Box>
    </Stack>
  ),
};
