
  ———

  # 데이터 보관/분석 가이드

  픽업 완료된 예약 데이터는 **1년 보관 후 자동 삭제**됩니다.

  ---

  ## 데이터 확인(Supabase Dashboard)

  ### 1. Supabase Dashboard 접속
  - 프로젝트 Dashboard 접속
  - **Table Editor**에서 아래 뷰를 확인
  - 뷰 이름:
    - `analytics_store_completed_v`
  ### 2. 소비자 기준 데이터 확인

  - `consumer_id`: 소비자 ID
  - `consumer_phone`: 소비자 전화번호
  - `reserved_pickup_time`: 예약 시간
  - `pickup_completed_time`: 픽업 완료 시간
  - `product_price`: 제품 가격
  - `favorite_store_categories`: 관심 가게 카테고리 배열
  ### 3. 업체 기준 데이터 확인
  **Table Editor**에서 `analytics_store_completed_v` 선택 후 데이터 확인:

  필드 설명
  - `store_id`: 업체 ID
  - `store_owner_name`: 사장님 이름
  - `store_phone`: 업체 전화번호
  - `reserved_pickup_time`: 예약 시간
  - `pickup_completed_time`: 픽업 완료 시간

  ### 4. CSV 내보내기
  Table Editor 화면 우측 상단의 **Export** 버튼을 사용해 CSV로 내보낼 수 있습니다.
  ---

  ## SQL로 직접 조회하기
  ```sql
  order by pickup_completed_time desc
  limit 200;

  ### 업체 기준 조회

  select * from analytics_store_completed_v
  order by pickup_completed_time desc
  limit 200;

  ### 최근 30일 데이터만 보기

  select * from analytics_consumer_completed_v
  where pickup_completed_time >= now() - interval '30 days'
  order by pickup_completed_time desc;

  ———

  ## 자동 삭제 정책

  ### 정책 요약

  - 대상: 픽업 완료된 예약 데이터만
  - 기준: picked_up_at (픽업 완료 시간)
  - 보관 기간: 1년
  - 방식: 매일 자동 삭제

  ### 삭제 예정 건수 확인

  select count(*) as to_delete
  from reservations
  where picked_up = true
    and picked_up_at is not null
    and picked_up_at < (now() - interval '1 year');

  ### 크론 스케줄 확인

  select * from cron.job;

  ———

  ## 주의사항

  - 전화번호는 개인정보입니다. 외부 공유 금지 원칙을 지켜주세요.
  - 뷰는 삭제된 데이터는 자동으로 제외됩니다.
  - 픽업 완료 시간이 없는 예약은 분석 대상에 포함되지 않습니다.
