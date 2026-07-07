# SQL 예약어 / 충돌 단어 사전

`supabase-integration` 스킬의 Phase 0에서 참조하는 SSOT. ux-flow의 Entity ID Dictionary에서 뽑은 "예상 테이블명/컬럼명"이 아래 목록과 충돌하면 **차단**하고 사용자에게 ux-flow 갱신(이름 변경)을 요청한다.

## 사용법 (검증 절차)

1. 사전의 각 "예상 테이블명"·주요 컬럼명을 소문자로 정규화한다.
2. 아래 §1 (PostgreSQL 예약어) 또는 §2 (흔한 충돌 단어)와 정확히 일치하면 → **차단**. §4의 안전한 대안을 제시한다.
3. 스키마 접두어가 있으면 §3 (Supabase 예약 스키마)를 확인한다. `auth.users` 외의 `auth.*` / `storage.*` / `realtime.*` 직접 사용은 차단한다.

큰따옴표로 감싸면(`"user"`) 예약어도 식별자로 쓸 수는 있으나, 이후 모든 쿼리에서 계속 따옴표를 강제하므로 **처음부터 피한다**.

## 1. PostgreSQL 예약어 (테이블/컬럼명 금지)

식별자로 쓰면 파싱 에러 또는 예기치 않은 동작을 유발하는 완전 예약어.

```
all, analyse, analyze, and, any, array, as, asc, asymmetric,
authorization, binary, both, case, cast, check, collate, column,
concurrently, constraint, create, cross, current_catalog, current_date,
current_role, current_schema, current_time, current_timestamp,
current_user, default, deferrable, desc, distinct, do, else, end,
except, false, fetch, for, foreign, freeze, from, full, grant, group,
having, ilike, in, initially, inner, intersect, into, is, isnull, join,
lateral, leading, left, like, limit, localtime, localtimestamp, natural,
not, notnull, null, offset, on, only, or, order, outer, overlaps,
placing, primary, references, returning, right, select, session_user,
similar, some, symmetric, table, tablesample, then, to, trailing, true,
union, unique, user, using, variadic, verbose, when, where, window, with
```

## 2. 흔한 충돌 단어 (예약어는 아니나 강력 권장 차단)

타입명·함수명·의미 혼동을 일으켜 실무에서 문제가 잦은 이름. 단수형·복수형 모두 검사한다.

```
type, name, value, key, index, level, position, path, role, roles,
status, state, comment, timestamp, date, time, text, number, count,
sum, avg, min, max, first, last, current, new, old, data, metadata,
owner, admin, public, private, default, temp, temporary, view, trigger,
function, procedure, schema, database, sequence, domain, collation
```

## 3. Supabase 예약 스키마

Supabase가 관리하는 스키마. 애플리케이션 테이블은 `public.*`(기본) 또는 커스텀 스키마에 만든다. 아래 스키마에 직접 테이블을 만들지 않는다.

| 스키마 | 용도 | 허용 |
|--------|------|------|
| `auth.*` | 인증(사용자·세션·토큰) | 읽기: `auth.users`만. 그 외 직접 생성/수정 금지 |
| `storage.*` | 파일 스토리지(buckets·objects) | 직접 테이블 생성 금지 |
| `realtime.*` | 실시간 구독 | 직접 테이블 생성 금지 |
| `supabase_*`, `pg_*`, `information_schema` | 시스템 내부 | 금지 |

`auth.users`를 참조하는 프로필 테이블은 `public.profiles`처럼 별도로 만들고 `id uuid references auth.users(id)`로 연결한다.

## 4. 안전한 대안 네이밍

충돌 시 아래 패턴으로 우회한다.

| 충돌 이름 | 대안 |
|-----------|------|
| `user` | `app_user`, `member`, `account`, `profile` |
| `order` | `purchase_order`, `sales_order`, `orders_tbl` |
| `group` | `user_group`, `team`, `cohort` |
| `references` | `citations`, `linked_refs`, `source_refs` |
| `role` | `member_role`, `access_role` |
| `type` | `category`, `kind`, `<domain>_type` (예: `product_type`) |
| `status` | `<domain>_status` (예: `order_status`) |
| `comment` | `comments` (복수형) 또는 `<domain>_comment` |

원칙: **도메인 접두어를 붙이면** 대부분의 충돌이 해소되고 의미도 명확해진다 (`order` → `sales_order`).
