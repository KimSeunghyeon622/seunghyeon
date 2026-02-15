-- ============================================
-- 테스트 데이터 설정 SQL
-- 작성일: 2026-01-19
-- 목적: 소비자 앱 테스트를 위한 업주/가게/상품/예약/리뷰 데이터
-- ============================================

-- ============================================
-- 주의사항:
-- 1. 이 스크립트는 Supabase SQL Editor에서 실행하세요.
-- 2. auth.users 생성은 별도 단계로 진행됩니다 (아래 STEP 0 참조)
-- 3. 실행 전 기존 테스트 데이터가 있다면 STEP 0.5로 삭제하세요.
-- ============================================

-- ============================================
-- STEP 0: Auth 사용자 생성 (Supabase Dashboard에서 수동 생성 필요)
-- ============================================
-- Supabase Dashboard > Authentication > Users > Add User 에서 다음 계정 생성:
--
-- 업주 계정 1: owner1@test.com / test1234
-- 업주 계정 2: owner2@test.com / test1234
-- 업주 계정 3: owner3@test.com / test1234
-- 소비자 계정: consumer@test.com / test1234
--
-- 생성 후 아래 변수에 실제 user_id(UUID)를 넣어주세요.

-- ============================================
-- STEP 0.5: 기존 테스트 데이터 삭제 (선택적)
-- ============================================
-- 주의: 운영 데이터가 있다면 실행하지 마세요!
/*
DELETE FROM reviews WHERE store_id IN (SELECT id FROM stores WHERE name LIKE '%테스트%' OR name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM reservations WHERE store_id IN (SELECT id FROM stores WHERE name LIKE '%테스트%' OR name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM cash_transactions WHERE store_id IN (SELECT id FROM stores WHERE name LIKE '%테스트%' OR name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM favorites WHERE store_id IN (SELECT id FROM stores WHERE name LIKE '%테스트%' OR name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE name LIKE '%테스트%' OR name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM store_operating_hours WHERE store_id IN (SELECT id FROM stores WHERE name LIKE '%테스트%' OR name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM stores WHERE name LIKE '%테스트%' OR name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트');
DELETE FROM consumers WHERE nickname LIKE '%테스트%' OR nickname = '테스트소비자';
*/

-- ============================================
-- STEP 1: 변수 설정 (실제 user_id로 교체 필요!)
-- ============================================
DO $$
DECLARE
  -- 아래 UUID를 Supabase에서 생성한 실제 user_id로 교체하세요
  v_owner1_user_id UUID := 'd99b3b18-7705-4b8e-81eb-e4ef5c6b31d1';  -- owner1@test.com
  v_owner2_user_id UUID := '719020b0-5288-4d1a-a27f-6d54d8fbf5a0';  -- owner2@test.com
  v_owner3_user_id UUID := 'd074177b-5b99-42e4-9c55-8a1f1980b83a';  -- owner3@test.com
  v_consumer_user_id UUID := '945f7fda-5e42-4105-8a37-567b7f1a5809'; -- consumer@test.com

  -- 자동 생성될 ID들
  v_store1_id UUID := gen_random_uuid();
  v_store2_id UUID := gen_random_uuid();
  v_store3_id UUID := gen_random_uuid();
  v_consumer_id UUID := gen_random_uuid();

  -- 상품 ID
  v_product1_1 UUID := gen_random_uuid();
  v_product1_2 UUID := gen_random_uuid();
  v_product1_3 UUID := gen_random_uuid();
  v_product1_4 UUID := gen_random_uuid(); -- 과거 상품

  v_product2_1 UUID := gen_random_uuid();
  v_product2_2 UUID := gen_random_uuid();
  v_product2_3 UUID := gen_random_uuid();
  v_product2_4 UUID := gen_random_uuid(); -- 과거 상품

  v_product3_1 UUID := gen_random_uuid();
  v_product3_2 UUID := gen_random_uuid();
  v_product3_3 UUID := gen_random_uuid();
  v_product3_4 UUID := gen_random_uuid(); -- 과거 상품

  -- 예약 ID
  v_reservation1 UUID := gen_random_uuid();
  v_reservation2 UUID := gen_random_uuid();
  v_reservation3 UUID := gen_random_uuid();
  v_reservation4 UUID := gen_random_uuid();
  v_reservation5 UUID := gen_random_uuid();
  v_reservation6 UUID := gen_random_uuid();

BEGIN
  -- ============================================
  -- STEP 2: 소비자 데이터 생성
  -- ============================================
  INSERT INTO consumers (id, user_id, nickname, phone, created_at)
  VALUES (
    v_consumer_id,
    v_consumer_user_id,
    '테스트소비자',
    '010-1234-5678',
    NOW() - INTERVAL '30 days'
  )
  ON CONFLICT (user_id) DO UPDATE SET nickname = EXCLUDED.nickname;

  -- ============================================
  -- STEP 3: 가게 1 - 엄마손 반찬집 (반찬)
  -- ============================================
  INSERT INTO stores (
    id, user_id, name, category, description, address, phone,
    cover_image_url, average_rating, review_count, cash_balance,
    is_open, is_approved, pickup_start_time, pickup_end_time,
    refund_policy, no_show_policy, business_number, latitude, longitude, created_at
  ) VALUES (
    v_store1_id,
    v_owner1_user_id,
    '엄마손 반찬집',
    '반찬',
    '30년 전통의 손맛! 매일 아침 신선한 재료로 정성껏 만드는 건강한 반찬입니다. 어머니의 손맛 그대로 가정에 전해드립니다.',
    '서울시 강남구 테헤란로 123',
    '02-1234-5678',
    'https://images.unsplash.com/photo-1547424850-73f7a9f32d4c?w=800',
    4.5,
    15,
    150000,
    true,
    true,
    '17:00',
    '20:00',
    '픽업 1시간 전까지 100% 환불 가능합니다.',
    '노쇼 2회 시 이용이 제한될 수 있습니다.',
    '123-45-67890',
    37.5012,
    127.0396,
    NOW() - INTERVAL '90 days'
  ) ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    cash_balance = EXCLUDED.cash_balance;

  -- 가게 1 영업시간
  INSERT INTO store_operating_hours (store_id, day_of_week, is_closed, open_time, close_time)
  SELECT v_store1_id, d,
    CASE WHEN d = 0 THEN true ELSE false END,
    '09:00'::TIME,
    '20:00'::TIME
  FROM generate_series(0, 6) AS d
  ON CONFLICT (store_id, day_of_week) DO UPDATE SET
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time;

  -- 가게 1 상품 (현재)
  INSERT INTO products (id, store_id, name, category, original_price, discounted_price, stock_quantity, is_active, expiry_date, created_at)
  VALUES
    (v_product1_1, v_store1_id, '오늘의 반찬 세트', '반찬', 15000, 9900, 10, true, CURRENT_DATE + 1, NOW()),
    (v_product1_2, v_store1_id, '명절 특선 반찬', '반찬', 35000, 19900, 5, true, CURRENT_DATE + 1, NOW()),
    (v_product1_3, v_store1_id, '건강 나물 세트', '반찬', 12000, 7500, 8, true, CURRENT_DATE + 1, NOW()),
    -- 과거 상품 (비활성)
    (v_product1_4, v_store1_id, '설날 특선 세트', '반찬', 50000, 29900, 0, false, CURRENT_DATE - 30, NOW() - INTERVAL '35 days')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- STEP 4: 가게 2 - 달콤 베이커리 (제과)
  -- ============================================
  INSERT INTO stores (
    id, user_id, name, category, description, address, phone,
    cover_image_url, average_rating, review_count, cash_balance,
    is_open, is_approved, pickup_start_time, pickup_end_time,
    refund_policy, no_show_policy, business_number, latitude, longitude, created_at
  ) VALUES (
    v_store2_id,
    v_owner2_user_id,
    '달콤 베이커리',
    '제과',
    '매일 새벽 4시부터 굽는 신선한 빵! 천연발효종과 유기농 밀가루로 건강하고 맛있는 빵을 만듭니다. 마감 할인으로 더 맛있게 즐기세요.',
    '서울시 마포구 홍대입구역 인근 456',
    '02-9876-5432',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    4.8,
    42,
    280000,
    true,
    true,
    '19:00',
    '21:00',
    '픽업 2시간 전까지 전액 환불됩니다.',
    '노쇼 시 다음 이용이 제한됩니다.',
    '234-56-78901',
    37.5563,
    126.9220,
    NOW() - INTERVAL '180 days'
  ) ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    cash_balance = EXCLUDED.cash_balance;

  -- 가게 2 영업시간 (월~토 영업, 일요일 휴무)
  INSERT INTO store_operating_hours (store_id, day_of_week, is_closed, open_time, close_time)
  SELECT v_store2_id, d,
    CASE WHEN d = 0 THEN true ELSE false END,
    '07:00'::TIME,
    '21:00'::TIME
  FROM generate_series(0, 6) AS d
  ON CONFLICT (store_id, day_of_week) DO UPDATE SET
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time;

  -- 가게 2 상품 (현재)
  INSERT INTO products (id, store_id, name, category, original_price, discounted_price, stock_quantity, is_active, expiry_date, created_at)
  VALUES
    (v_product2_1, v_store2_id, '오늘의 빵 세트', '빵', 18000, 9900, 15, true, CURRENT_DATE + 1, NOW()),
    (v_product2_2, v_store2_id, '케이크 조각 2+1', '빵', 15000, 8900, 8, true, CURRENT_DATE + 1, NOW()),
    (v_product2_3, v_store2_id, '수제 쿠키 박스', '빵', 22000, 12000, 6, true, CURRENT_DATE + 1, NOW()),
    -- 과거 상품 (비활성)
    (v_product2_4, v_store2_id, '크리스마스 슈톨렌', '빵', 35000, 19900, 0, false, CURRENT_DATE - 25, NOW() - INTERVAL '30 days')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- STEP 5: 가게 3 - 프레시 밀키트 (밀키트)
  -- ============================================
  INSERT INTO stores (
    id, user_id, name, category, description, address, phone,
    cover_image_url, average_rating, review_count, cash_balance,
    is_open, is_approved, pickup_start_time, pickup_end_time,
    refund_policy, no_show_policy, business_number, latitude, longitude, created_at
  ) VALUES (
    v_store3_id,
    v_owner3_user_id,
    '프레시 밀키트',
    '밀키트',
    '신선한 재료로 만드는 프리미엄 밀키트! 10분 만에 셰프의 요리를 집에서 즐기세요. 당일 제조, 당일 판매 원칙으로 신선함을 보장합니다.',
    '서울시 서초구 반포대로 789',
    '02-5555-1234',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    4.3,
    28,
    95000,
    true,
    true,
    '18:00',
    '20:30',
    '픽업 당일 오전까지 취소 시 100% 환불',
    '연속 노쇼 시 계정이 정지될 수 있습니다.',
    '345-67-89012',
    37.5045,
    127.0047,
    NOW() - INTERVAL '60 days'
  ) ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    cash_balance = EXCLUDED.cash_balance;

  -- 가게 3 영업시간 (매일 영업)
  INSERT INTO store_operating_hours (store_id, day_of_week, is_closed, open_time, close_time)
  SELECT v_store3_id, d, false, '10:00'::TIME, '21:00'::TIME
  FROM generate_series(0, 6) AS d
  ON CONFLICT (store_id, day_of_week) DO UPDATE SET
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time;

  -- 가게 3 상품 (현재)
  INSERT INTO products (id, store_id, name, category, original_price, discounted_price, stock_quantity, is_active, expiry_date, created_at)
  VALUES
    (v_product3_1, v_store3_id, '스테이크 밀키트', '밀키트', 32000, 18900, 7, true, CURRENT_DATE + 1, NOW()),
    (v_product3_2, v_store3_id, '파스타 밀키트', '밀키트', 18000, 11900, 12, true, CURRENT_DATE + 1, NOW()),
    (v_product3_3, v_store3_id, '샤브샤브 세트', '밀키트', 45000, 27900, 4, true, CURRENT_DATE + 1, NOW()),
    -- 과거 상품 (비활성)
    (v_product3_4, v_store3_id, '크리스마스 디너 세트', '밀키트', 55000, 32000, 0, false, CURRENT_DATE - 20, NOW() - INTERVAL '25 days')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- STEP 6: 과거 예약 이력 생성 (완료된 예약 - 리뷰 작성 가능)
  -- ============================================

  -- 예약 1: 반찬집 - 완료됨
  INSERT INTO reservations (
    id, reservation_number, consumer_id, store_id, product_id,
    quantity, total_amount, status, pickup_time, picked_up, picked_up_at, created_at
  ) VALUES (
    v_reservation1,
    'RES' || TO_CHAR(NOW() - INTERVAL '7 days', 'YYYYMMDD') || '001',
    v_consumer_id,
    v_store1_id,
    v_product1_1,
    2,
    19800,
    'completed',
    (NOW() - INTERVAL '7 days')::timestamp + TIME '18:00',
    true,
    NOW() - INTERVAL '7 days' + INTERVAL '18 hours',
    NOW() - INTERVAL '7 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- 예약 2: 베이커리 - 완료됨
  INSERT INTO reservations (
    id, reservation_number, consumer_id, store_id, product_id,
    quantity, total_amount, status, pickup_time, picked_up, picked_up_at, created_at
  ) VALUES (
    v_reservation2,
    'RES' || TO_CHAR(NOW() - INTERVAL '5 days', 'YYYYMMDD') || '002',
    v_consumer_id,
    v_store2_id,
    v_product2_1,
    1,
    9900,
    'completed',
    (NOW() - INTERVAL '5 days')::timestamp + TIME '19:30',
    true,
    NOW() - INTERVAL '5 days' + INTERVAL '19 hours 30 minutes',
    NOW() - INTERVAL '5 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- 예약 3: 밀키트 - 완료됨 (리뷰 없음 - 테스트용)
  INSERT INTO reservations (
    id, reservation_number, consumer_id, store_id, product_id,
    quantity, total_amount, status, pickup_time, picked_up, picked_up_at, created_at
  ) VALUES (
    v_reservation3,
    'RES' || TO_CHAR(NOW() - INTERVAL '3 days', 'YYYYMMDD') || '003',
    v_consumer_id,
    v_store3_id,
    v_product3_1,
    1,
    18900,
    'completed',
    (NOW() - INTERVAL '3 days')::timestamp + TIME '18:30',
    true,
    NOW() - INTERVAL '3 days' + INTERVAL '18 hours 30 minutes',
    NOW() - INTERVAL '3 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- 예약 4: 반찬집 - 확정됨 (진행중)
  INSERT INTO reservations (
    id, reservation_number, consumer_id, store_id, product_id,
    quantity, total_amount, status, pickup_time, picked_up, created_at
  ) VALUES (
    v_reservation4,
    'RES' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '004',
    v_consumer_id,
    v_store1_id,
    v_product1_2,
    1,
    19900,
    'confirmed',
    CURRENT_DATE::timestamp + TIME '18:00',
    false,
    NOW() - INTERVAL '2 hours'
  ) ON CONFLICT (id) DO NOTHING;

  -- 예약 5: 취소된 예약
  INSERT INTO reservations (
    id, reservation_number, consumer_id, store_id, product_id,
    quantity, total_amount, status, pickup_time, picked_up,
    cancel_reason, created_at
  ) VALUES (
    v_reservation5,
    'RES' || TO_CHAR(NOW() - INTERVAL '10 days', 'YYYYMMDD') || '005',
    v_consumer_id,
    v_store2_id,
    v_product2_2,
    1,
    8900,
    'cancelled',
    (NOW() - INTERVAL '10 days')::timestamp + TIME '19:00',
    false,
    '개인 사정으로 취소합니다.',
    NOW() - INTERVAL '10 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- 예약 6: 노쇼 (테스트용)
  INSERT INTO reservations (
    id, reservation_number, consumer_id, store_id, product_id,
    quantity, total_amount, status, pickup_time, picked_up, created_at
  ) VALUES (
    v_reservation6,
    'RES' || TO_CHAR(NOW() - INTERVAL '15 days', 'YYYYMMDD') || '006',
    v_consumer_id,
    v_store3_id,
    v_product3_2,
    1,
    11900,
    'no_show',
    (NOW() - INTERVAL '15 days')::timestamp + TIME '18:00',
    false,
    NOW() - INTERVAL '15 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- STEP 7: 리뷰 데이터 생성
  -- ============================================

  -- 리뷰 1: 반찬집 (내가 쓴 리뷰)
  INSERT INTO reviews (id, consumer_id, store_id, reservation_id, rating, content, created_at)
  VALUES (
    gen_random_uuid(),
    v_consumer_id,
    v_store1_id,
    v_reservation1,
    5,
    '정말 맛있어요! 어머니 반찬 생각나는 맛이에요. 양도 푸짐하고 다음에 또 주문할게요 ㅎㅎ',
    NOW() - INTERVAL '6 days'
  ) ON CONFLICT DO NOTHING;

  -- 리뷰 2: 베이커리 (내가 쓴 리뷰 + 업주 답글)
  INSERT INTO reviews (id, consumer_id, store_id, reservation_id, rating, content, reply, created_at)
  VALUES (
    gen_random_uuid(),
    v_consumer_id,
    v_store2_id,
    v_reservation2,
    5,
    '빵이 정말 신선하고 맛있었습니다. 특히 크루아상이 최고예요! 가격 대비 양도 많고 강추합니다.',
    '좋은 리뷰 감사합니다! 더 맛있는 빵으로 보답하겠습니다 :)',
    NOW() - INTERVAL '4 days 12 hours'
  ) ON CONFLICT DO NOTHING;

  -- 다른 소비자들의 리뷰 (가게별 리뷰 목록 표시용)
  -- 반찬집 추가 리뷰
  INSERT INTO reviews (id, consumer_id, store_id, rating, content, created_at)
  SELECT
    gen_random_uuid(),
    v_consumer_id,  -- 실제로는 다른 소비자여야 하지만 테스트 편의상 동일 사용
    v_store1_id,
    4,
    '반찬 종류가 다양하고 맛도 좋아요. 다만 양이 조금 적었으면 좋겠어요.',
    NOW() - INTERVAL '20 days'
  WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE store_id = v_store1_id AND content LIKE '%종류가 다양%');

  -- 베이커리 추가 리뷰
  INSERT INTO reviews (id, consumer_id, store_id, rating, content, reply, created_at)
  SELECT
    gen_random_uuid(),
    v_consumer_id,
    v_store2_id,
    5,
    '매번 품질이 일정해서 좋아요. 믿고 구매합니다!',
    '항상 애용해 주셔서 감사합니다!',
    NOW() - INTERVAL '15 days'
  WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE store_id = v_store2_id AND content LIKE '%품질이 일정%');

  -- 밀키트 추가 리뷰
  INSERT INTO reviews (id, consumer_id, store_id, rating, content, created_at)
  SELECT
    gen_random_uuid(),
    v_consumer_id,
    v_store3_id,
    4,
    '밀키트 퀄리티가 좋아요. 스테이크가 특히 맛있었습니다. 재구매 의사 있어요!',
    NOW() - INTERVAL '25 days'
  WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE store_id = v_store3_id AND content LIKE '%스테이크가 특히%');

  -- ============================================
  -- STEP 8: 즐겨찾기 데이터
  -- ============================================
  INSERT INTO favorites (id, consumer_id, store_id, created_at)
  VALUES
    (gen_random_uuid(), v_consumer_id, v_store1_id, NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), v_consumer_id, v_store2_id, NOW() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- STEP 9: 캐시 거래 내역 (업주 화면 테스트용)
  -- ============================================
  -- 가게 1 캐시 내역
  INSERT INTO cash_transactions (id, store_id, transaction_type, amount, balance_after, description, created_at)
  VALUES
    (gen_random_uuid(), v_store1_id, 'charge', 100000, 100000, '초기 캐시 충전', NOW() - INTERVAL '85 days'),
    (gen_random_uuid(), v_store1_id, 'fee', -2970, 97030, '예약 수수료 차감', NOW() - INTERVAL '7 days'),
    (gen_random_uuid(), v_store1_id, 'charge', 50000, 147030, '캐시 추가 충전', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), v_store1_id, 'fee', -2985, 144045, '예약 수수료 차감', NOW() - INTERVAL '2 hours')
  ON CONFLICT DO NOTHING;

  -- 가게 2 캐시 내역
  INSERT INTO cash_transactions (id, store_id, transaction_type, amount, balance_after, description, created_at)
  VALUES
    (gen_random_uuid(), v_store2_id, 'charge', 200000, 200000, '초기 캐시 충전', NOW() - INTERVAL '175 days'),
    (gen_random_uuid(), v_store2_id, 'fee', -1485, 198515, '예약 수수료 차감', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), v_store2_id, 'charge', 80000, 278515, '캐시 추가 충전', NOW() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;

  -- 가게 3 캐시 내역
  INSERT INTO cash_transactions (id, store_id, transaction_type, amount, balance_after, description, created_at)
  VALUES
    (gen_random_uuid(), v_store3_id, 'charge', 100000, 100000, '초기 캐시 충전', NOW() - INTERVAL '55 days'),
    (gen_random_uuid(), v_store3_id, 'fee', -2835, 97165, '예약 수수료 차감', NOW() - INTERVAL '3 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '테스트 데이터 생성 완료!';
  RAISE NOTICE '생성된 가게: 엄마손 반찬집, 달콤 베이커리, 프레시 밀키트';
  RAISE NOTICE '생성된 예약: 6건 (완료 3건, 확정 1건, 취소 1건, 노쇼 1건)';

END $$;

-- ============================================
-- 확인 쿼리
-- ============================================
SELECT '=== 가게 목록 ===' as info;
SELECT id, name, category, cash_balance, is_open FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트');

SELECT '=== 상품 목록 ===' as info;
SELECT p.name, p.original_price, p.discounted_price, p.stock_quantity, p.is_active, s.name as store_name
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE s.name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트')
ORDER BY s.name, p.is_active DESC;

SELECT '=== 예약 목록 ===' as info;
SELECT r.reservation_number, r.status, r.total_amount, s.name as store_name, p.name as product_name
FROM reservations r
JOIN stores s ON r.store_id = s.id
JOIN products p ON r.product_id = p.id
WHERE s.name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트')
ORDER BY r.created_at DESC;

SELECT '=== 리뷰 목록 ===' as info;
SELECT rv.rating, rv.content, rv.reply, s.name as store_name
FROM reviews rv
JOIN stores s ON rv.store_id = s.id
WHERE s.name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트')
ORDER BY rv.created_at DESC;
