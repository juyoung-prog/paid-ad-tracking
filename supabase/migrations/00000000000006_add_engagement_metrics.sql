-- 성과 지표 확장. 지금까지 좋아요/댓글/공유는 engagements 하나로 합쳐서만 저장했고,
-- 전체 재생수·팔로우·프로필 방문·평균 시청 시간은 아예 받지 않았다.
-- 실계정에 직접 물어 지원이 확인된 항목만 추가한다(05-api-integration.md 매핑 표 참고).
--
-- 파생 지표(ctr/cpc/cpm/frequency/cost_per_*)는 일부러 넣지 않는다. 플랫폼이 주긴 하지만
-- spend/impressions/clicks에서 계산되는 값이라, 저장해두면 원본과 어긋났을 때 어느 쪽이
-- 맞는지 알 수 없게 된다. 화면은 schema.js의 calcCPM() 등으로 계산한다.

-- 전체 재생수. hook_views(2초)/held_views(완전 시청)와 달리 시청 조건이 없는 총합이다.
alter table performance_records add column video_plays bigint;

-- engagements(합산)는 그대로 두고 구성 요소를 따로 보관한다. 합산만으로는
-- "공유가 많은 캠페인"과 "좋아요만 많은 캠페인"을 구분할 수 없다.
alter table performance_records add column likes bigint;
alter table performance_records add column comments bigint;
alter table performance_records add column shares bigint;

-- 광고비로 자산이 남는 지표. 미용실처럼 재방문이 중요한 업종에서
-- 단발성 노출보다 의미가 큰 신호다.
alter table performance_records add column follows bigint;
alter table performance_records add column profile_visits bigint;

-- 평균 재생 시간(초). 노출당 얼마나 붙잡았는지 = 소재 품질 신호.
-- 다른 컬럼에서 계산할 수 없어(총 시청 시간을 저장하지 않는다) 별도로 받는다.
alter table performance_records add column avg_watch_seconds numeric(6, 2);

-- held_views 의미 통일에 대한 기록:
-- 이 컬럼은 스키마상 "완전 시청"인데 TikTok 매핑만 video_watched_6s(6초 시청)를
-- 넣고 있었다. Meta는 video_p100_watched_actions(완전 시청)를 넣는다. 같은 컬럼에
-- 플랫폼마다 다른 의미가 들어가 플랫폼 간 비교가 조용히 틀렸다(실측: 6초 2,119 vs
-- 완전 시청 484로 4배 이상 차이). sync-performance에서 TikTok도 video_views_p100을
-- 쓰도록 고쳤다. 기존 행은 전부 오늘 날짜라 다음 동기화가 덮어쓴다.
comment on column performance_records.held_views is '완전 시청 수. Meta: video_p100_watched_actions, TikTok: video_views_p100';
comment on column performance_records.hook_views is '초반 시청 수. Meta: video_p25_watched_actions, TikTok: video_watched_2s';
