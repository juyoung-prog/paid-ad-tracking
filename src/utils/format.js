/**
 * 표기 포맷터 — 이 앱에서 숫자와 날짜를 화면에 쓰는 **유일한** 통로.
 *
 * ## 왜 파일로 모으나
 *
 * 예전에는 화면마다 `toLocaleString('en-US')`를 직접 불렀다. 옵션을 붙인 곳과
 * 안 붙인 곳이 섞여서, 같은 열에 `$2,261.5`(소수 1자리)와 `$514.49`(2자리)가
 * 나란히 찍혔다 — 자릿수가 흔들리면 `tabular-nums`를 걸어도 숫자가 정렬돼
 * 보이지 않는다(실화면 리뷰로 발견). 날짜는 더 심해서 같은 캠페인의 같은
 * 기간이 화면을 옮길 때마다 `07.10–08.31` / `7/6–8/1` / `07/10/2026 – 08/31/2026`
 * / `Aug 6, 2026, 10:45 PM` 네 가지로 보였다.
 *
 * 표기 규칙은 컴포넌트의 재량이 아니다. 호출부는 **무엇을** 보여줄지만 고르고,
 * **어떻게** 보일지는 여기서만 정한다.
 *
 * ## 모르는 값과 0을 구분한다 (앱 전역 원칙)
 *
 * 모든 함수는 `null`/`undefined`/`NaN`을 받으면 `EMPTY`(—)를 돌려준다. 모르는
 * 값을 0으로 찍으면 "측정했더니 0이었다"로 읽혀서, 동기화가 안 된 캠페인이
 * "성과 없음"으로 보인다. 0은 0으로만 찍힌다.
 */

/** 값이 없을 때의 표기. 0과 구분하기 위해 빈 문자열이 아니라 em dash를 쓴다. */
export const EMPTY = '—';

/** null/undefined/NaN/Infinity 판정 — 0과 빈 문자열('')은 값으로 인정한다. */
function isBlank(value) {
  return value == null || value === '' || !Number.isFinite(Number(value));
}

// ============================================================
// 금액
// ============================================================

/**
 * 실제로 측정된 금액 — **항상 소수 2자리**. 지출·잔액·청구액처럼 센트가 실재하는
 * 값에 쓴다. 이 앱의 기본 금액 표기다.
 *
 * money(2261.5)  // '$2,261.50'
 * money(514.49)  // '$514.49'
 * money(null)    // '—'
 */
export function money(amount) {
  if (isBlank(amount)) return EMPTY;
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 계획된 금액 — **소수 없음**. 예산은 사람이 정수 달러로 입력하고 일수를 곱해
 * 만들어지므로 센트가 구조적으로 존재하지 않는다. `$3,130.00`은 있지도 않은
 * 정밀도를 주장하는 표기라 쓰지 않는다.
 *
 * 같은 열 안에서는 둘을 섞지 않는다 — 계획 열은 전부 moneyWhole, 실적 열은
 * 전부 money다. 한 줄에 나란히 놓이는 경우(`$20/day · $514.49 spent`)는 서로
 * 다른 양이고 라벨이 붙어 있어 섞여도 읽힌다.
 *
 * moneyWhole(3130)  // '$3,130'
 */
export function moneyWhole(amount) {
  if (isBlank(amount)) return EMPTY;
  return `$${Math.round(Number(amount)).toLocaleString('en-US')}`;
}

/**
 * 자리가 부족한 곳(KPI 값·차트 막대 라벨) 전용 축약 표기. 표나 목록에는 쓰지
 * 않는다 — 축약은 자릿수를 지워서 값끼리 비교가 안 된다.
 *
 * moneyCompact(93276.65)  // '$93.3K'
 * moneyCompact(842)       // '$842'
 */
export function moneyCompact(amount) {
  if (isBlank(amount)) return EMPTY;
  const n = Number(amount);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
}

// ============================================================
// 수량·비율
// ============================================================

/**
 * 세는 값(노출·도달·클릭·재생). 소수가 없다.
 * count(120000)  // '120,000'
 */
export function count(value) {
  if (isBlank(value)) return EMPTY;
  return Math.round(Number(value)).toLocaleString('en-US');
}

/**
 * 비율 -> 퍼센트. 입력은 0~1의 비(0.42)이지 42가 아니다.
 * percent(0.4237)            // '42%'
 * percent(0.4237, { digits: 1 })  // '42.4%'
 */
export function percent(ratio, { digits = 0 } = {}) {
  if (isBlank(ratio)) return EMPTY;
  return `${(Number(ratio) * 100).toFixed(digits)}%`;
}

/**
 * 초 단위 시간(평균 시청 시간 등).
 *
 * **값이 가진 만큼만 쓴다** — 최대 2자리로 반올림하고 뒤따르는 0은 떼어낸다.
 *
 * 2자리 고정이었을 때 Meta 행이 전부 `2.00s`·`11.00s`로 찍혔다. Meta는 캠페인
 * 레벨 평균 시청 시간을 **정수 초로만** 주기 때문인데(TikTok은 `2.95s`처럼
 * 실수를 준다), `2.00s`는 있지도 않은 백분의 일 초 정밀도를 주장하는 표기다.
 *
 * 그렇다고 1자리로 깎아서도 안 된다 — `2.95s`가 `3s`가 되고 `0.98s`가 `1s`가
 * 되면서 **TikTok의 진짜 소수와 Meta의 정수가 같은 표기로 충돌한다.** 구분하려던
 * 목적이 정확히 무너진다. 자릿수 자체가 "플랫폼이 그만큼 알려줬다"는 정보다.
 *
 * seconds(2)     // '2s'      ← Meta: 정수만 주므로 소수점 없음
 * seconds(11)    // '11s'
 * seconds(2.95)  // '2.95s'   ← TikTok: 준 만큼 그대로
 * seconds(1.1)   // '1.1s'
 */
export function seconds(value) {
  if (isBlank(value)) return EMPTY;
  const rounded = Math.round(Number(value) * 100) / 100;
  // toFixed로 자리를 채운 뒤 뒤따르는 0과 남은 소수점을 떼어낸다.
  return `${rounded.toFixed(2).replace(/\.?0+$/, '')}s`;
}

// ============================================================
// 날짜
// ============================================================

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * 'YYYY-MM-DD'를 문자열로 쪼갠다. `new Date(iso)`를 쓰지 않는 이유: 날짜만 있는
 * ISO 문자열은 UTC 자정으로 파싱돼서, KST에서 하루가 밀려 표시된다.
 */
function parts(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** 'YYYY-MM-DD' -> '8/4'. 차트 축·막대 라벨처럼 폭이 극도로 좁은 자리 전용. */
export function dateShort(iso) {
  const p = parts(iso);
  return p ? `${p.m}/${p.d}` : EMPTY;
}

/** 'YYYY-MM-DD' -> 'Aug 4'. 표·목록의 기본 날짜 표기. */
export function dateMed(iso) {
  const p = parts(iso);
  return p ? `${MONTHS[p.m - 1]} ${p.d}` : EMPTY;
}

/** 'YYYY-MM-DD' -> 'Aug 4, 2026'. 연도가 실제로 필요한 폼·상세 화면 전용. */
export function dateLong(iso) {
  const p = parts(iso);
  return p ? `${MONTHS[p.m - 1]} ${p.d}, ${p.y}` : EMPTY;
}

/**
 * 기간 표기. 같은 해면 연도를 한 번도 쓰지 않는다 — 이 앱의 캠페인은 대부분
 * 한 해 안에서 끝나고, 양쪽에 2026을 반복하면 정작 중요한 월·일이 묻힌다.
 *
 * dateRange('2026-08-04', '2026-08-14')  // 'Aug 4 – Aug 14'
 * dateRange('2025-12-20', '2026-01-10')  // 'Dec 20, 2025 – Jan 10, 2026'
 */
export function dateRange(startIso, endIso) {
  const a = parts(startIso);
  const b = parts(endIso);
  if (!a && !b) return EMPTY;
  if (!a) return dateMed(endIso);
  if (!b) return dateMed(startIso);
  return a.y === b.y
    ? `${dateMed(startIso)} – ${dateMed(endIso)}`
    : `${dateLong(startIso)} – ${dateLong(endIso)}`;
}

/**
 * 기간의 진행 일수 — **양끝 포함**. 캠페인은 시작일과 종료일 모두 집행되는
 * 날이므로 8/1–8/3은 2일이 아니라 3일이다(일일예산 × 일수 계산과 일치).
 *
 * rangeDays('2026-08-01', '2026-08-03')  // '3 days'
 * rangeDays('2026-08-01', '2026-08-01')  // '1 day'
 */
export function rangeDays(startIso, endIso) {
  const a = parts(startIso);
  const b = parts(endIso);
  if (!a || !b) return EMPTY;
  // Date.UTC로 계산해 DST·타임존과 무관하게 정확한 일수를 얻는다.
  const days = Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000) + 1;
  if (days < 1) return EMPTY;
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * 기간 + 진행 일수를 한 번에. 기간을 보는 사람은 결국 "며칠짜리인가"를 암산
 * 하게 되므로, 캠페인 기간 표기 자리에서는 이 함수를 기본으로 쓴다.
 *
 * dateRangeWithDays('2026-08-04', '2026-08-14')  // 'Aug 4 – Aug 14 (11 days)'
 */
export function dateRangeWithDays(startIso, endIso) {
  const range = dateRange(startIso, endIso);
  const days = rangeDays(startIso, endIso);
  return days === EMPTY ? range : `${range} (${days})`;
}

/**
 * 타임스탬프(ISO datetime) -> 'Aug 6, 2026, 10:45 PM'. 동기화 시각처럼 시·분이
 * 의미를 갖는 자리에만 쓴다. 여기는 시각까지 있는 값이라 Date 파싱이 안전하다.
 */
export function dateTime(value) {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
