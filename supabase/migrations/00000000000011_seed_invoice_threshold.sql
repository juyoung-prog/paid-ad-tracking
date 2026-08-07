-- Meta 계정의 청구 문턱 초기값. 플랫폼이 API로 알려주지 않아 사람이 정해야 하는
-- 값인데, 이 계정군은 운영자가 "$400에서 인보이스가 나온다"고 확인해줬다.
-- 계정마다 다를 수 있으므로 컬럼으로 두고 여기서는 초기값만 심는다.
-- TikTok은 선불 방식이라 문턱 개념이 없어 null로 남긴다.
update ad_accounts set invoice_threshold = 400 where platform = 'meta';
