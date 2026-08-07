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
 * 초 단위 시간(평균 시청 시간 등). 소수 2자리 — 영상 지표는 0.1초 차이가
 * 의미를 갖는 자리라 반올림하지 않는다.
 * seconds(2.4)  // '2.40s'
 */
export function seconds(value) {
  if (isBlank(value)) return EMPTY;
  return `${Number(value).toFixed(2)}s`;
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
