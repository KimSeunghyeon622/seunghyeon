-- =====================================================
-- 테스트 업체 데이터 업데이트 (선택사항)
-- =====================================================
-- 이 스크립트는 기존 테스트 업체에 새로운 필드값을 추가합니다.
-- 실제 이미지는 나중에 업로드하고, 지금은 텍스트 정보만 업데이트합니다.
-- =====================================================

-- 테스트 베이커리 업체 업데이트
UPDATE stores
SET
  category = '베이커리',
  description = '신선한 빵을 매일 아침 직접 구워내는 동네 베이커리입니다. 마감 시간 전 남은 빵을 할인된 가격으로 제공하여 음식물 낭비를 줄이고 있습니다. 특히 바게트, 크로와상, 식빵이 인기 메뉴입니다.',
  opening_hours_text = '매일 07:00 - 22:00 (연중무휴)',
  pickup_start_time = '19:00:00',
  pickup_end_time = '21:30:00',
  refund_policy = '픽업 2시간 전까지 취소 가능하며, 전액 환불됩니다. 픽업 2시간 이내 취소 시 50% 환불됩니다.',
  no_show_policy = '노쇼 3회 누적 시 30일간 예약이 제한됩니다. 정당한 사유가 있는 경우 고객센터로 문의해주세요.'
WHERE name = '테스트 베이커리';

-- 만약 다른 이름의 테스트 업체가 있다면 아래 쿼리를 수정해서 사용하세요
/*
UPDATE stores
SET
  category = '카페',
  description = '프리미엄 커피와 디저트를 제공하는 카페입니다. 마감 전 남은 샌드위치, 케이크, 쿠키 등을 저렴하게 구매하실 수 있습니다.',
  opening_hours_text = '평일 08:00 - 22:00, 주말 09:00 - 23:00',
  pickup_start_time = '20:00:00',
  pickup_end_time = '21:45:00',
  refund_policy = '픽업 1시간 전까지 취소 가능하며, 전액 환불됩니다.',
  no_show_policy = '노쇼 2회 누적 시 예약이 제한됩니다.'
WHERE name = '여기에_업체명_입력';
*/

-- 업데이트 결과 확인
SELECT
  name,
  category,
  description,
  opening_hours_text,
  pickup_start_time,
  pickup_end_time,
  review_count,
  average_rating
FROM stores
WHERE name = '테스트 베이커리';

-- =====================================================
-- 참고: 이미지 업로드 방법
-- =====================================================
-- 1. Supabase Dashboard → Storage → store-documents 버킷
-- 2. Upload file 버튼 클릭
-- 3. 이미지 파일 업로드 (covers/store1-cover.jpg, logos/store1-logo.jpg)
-- 4. 업로드된 파일의 Public URL 복사
-- 5. 아래 SQL로 URL 업데이트:

/*
UPDATE stores
SET
  cover_image_url = 'https://qycwdncplofgzdrjtklb.supabase.co/storage/v1/object/public/store-documents/covers/store1-cover.jpg',
  logo_url = 'https://qycwdncplofgzdrjtklb.supabase.co/storage/v1/object/public/store-documents/logos/store1-logo.jpg'
WHERE name = '테스트 베이커리';
*/

-- =====================================================
-- 완료!
-- =====================================================
