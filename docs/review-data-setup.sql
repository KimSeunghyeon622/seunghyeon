-- ============================================
-- 리뷰 데이터 설정 SQL
-- 작성일: 2026-01-22
-- 목적: 업체별로 1-2개의 리뷰를 실제 사용자 계정으로 생성
-- ============================================

-- ============================================
-- 주의사항:
-- 1. 이 스크립트는 Supabase SQL Editor에서 실행하세요.
-- 2. 기존 리뷰를 삭제하고 새로 생성합니다.
-- 3. 실제 사용자 계정의 consumer_id를 사용합니다.
-- ============================================

DO $$
DECLARE
  -- 업체 ID (실제 업체 ID로 교체 필요)
  v_store1_id UUID; -- 엄마손 반찬집
  v_store2_id UUID; -- 달콤 베이커리
  v_store3_id UUID; -- 프레시 밀키트

  -- 소비자 ID (실제 consumer_id로 교체 필요)
  -- 업주들도 소비자이므로, 업주 계정의 consumer_id도 사용 가능
  v_consumer1_id UUID; -- consumer@test.com의 consumer_id
  v_consumer2_id UUID; -- owner1@test.com의 consumer_id (업주이지만 소비자이기도 함)
  v_consumer3_id UUID; -- owner2@test.com의 consumer_id
  v_consumer4_id UUID; -- owner3@test.com의 consumer_id

  -- 예약 ID (리뷰 작성용 - 실제 예약 ID 사용)
  v_reservation1_id UUID;
  v_reservation2_id UUID;
  v_reservation3_id UUID;
  v_reservation4_id UUID;
  v_reservation5_id UUID;

BEGIN
  -- ============================================
  -- STEP 1: 업체 ID 조회 (이름으로 찾기)
  -- ============================================
  SELECT id INTO v_store1_id FROM stores WHERE name = '엄마손 반찬집' LIMIT 1;
  SELECT id INTO v_store2_id FROM stores WHERE name = '달콤 베이커리' LIMIT 1;
  SELECT id INTO v_store3_id FROM stores WHERE name = '프레시 밀키트' LIMIT 1;

  -- 업체가 없으면 종료
  IF v_store1_id IS NULL OR v_store2_id IS NULL OR v_store3_id IS NULL THEN
    RAISE EXCEPTION '업체를 찾을 수 없습니다. test-data-setup.sql을 먼저 실행하세요.';
  END IF;

  -- ============================================
  -- STEP 2: 소비자 ID 조회
  -- ============================================
  -- consumer@test.com의 consumer_id
  SELECT c.id INTO v_consumer1_id
  FROM consumers c
  JOIN auth.users u ON c.user_id = u.id
  WHERE u.email = 'consumer@test.com'
  LIMIT 1;

  -- owner1@test.com의 consumer_id (업주이지만 소비자이기도 함)
  SELECT c.id INTO v_consumer2_id
  FROM consumers c
  JOIN auth.users u ON c.user_id = u.id
  WHERE u.email = 'owner1@test.com'
  LIMIT 1;

  -- owner2@test.com의 consumer_id
  SELECT c.id INTO v_consumer3_id
  FROM consumers c
  JOIN auth.users u ON c.user_id = u.id
  WHERE u.email = 'owner2@test.com'
  LIMIT 1;

  -- owner3@test.com의 consumer_id
  SELECT c.id INTO v_consumer4_id
  FROM consumers c
  JOIN auth.users u ON c.user_id = u.id
  WHERE u.email = 'owner3@test.com'
  LIMIT 1;

  -- 소비자가 없으면 consumer 생성 (업주 계정의 경우 consumer가 없을 수 있음)
  -- 이 경우 consumer 생성은 수동으로 해야 함

  -- ============================================
  -- STEP 3: 기존 리뷰 삭제 (해당 업체의 리뷰만)
  -- ============================================
  DELETE FROM reviews
  WHERE store_id IN (v_store1_id, v_store2_id, v_store3_id);

  -- ============================================
  -- STEP 4: 예약 ID 조회 (리뷰 작성용)
  -- ============================================
  -- 각 업체의 완료된 예약 중 하나씩 선택
  SELECT id INTO v_reservation1_id
  FROM reservations
  WHERE store_id = v_store1_id
    AND status = 'completed'
    AND picked_up = true
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT id INTO v_reservation2_id
  FROM reservations
  WHERE store_id = v_store2_id
    AND status = 'completed'
    AND picked_up = true
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT id INTO v_reservation3_id
  FROM reservations
  WHERE store_id = v_store3_id
    AND status = 'completed'
    AND picked_up = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- 예약이 없으면 더미 예약 ID 생성 (실제로는 예약이 있어야 함)
  IF v_reservation1_id IS NULL THEN
    v_reservation1_id := gen_random_uuid();
  END IF;
  IF v_reservation2_id IS NULL THEN
    v_reservation2_id := gen_random_uuid();
  END IF;
  IF v_reservation3_id IS NULL THEN
    v_reservation3_id := gen_random_uuid();
  END IF;

  -- ============================================
  -- STEP 5: 리뷰 생성 (업체별 1-2개씩)
  -- ============================================

  -- 엄마손 반찬집 - 리뷰 1개
  IF v_consumer1_id IS NOT NULL THEN
    INSERT INTO reviews (id, consumer_id, store_id, reservation_id, rating, content, created_at)
    VALUES (
      gen_random_uuid(),
      v_consumer1_id,
      v_store1_id,
      v_reservation1_id,
      5,
      '정말 맛있어요! 어머니 반찬 생각나는 맛이에요. 양도 푸짐하고 다음에 또 주문할게요 ㅎㅎ',
      NOW() - INTERVAL '6 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- 달콤 베이커리 - 리뷰 2개
  IF v_consumer1_id IS NOT NULL THEN
    INSERT INTO reviews (id, consumer_id, store_id, reservation_id, rating, content, reply, created_at, reply_at)
    VALUES (
      gen_random_uuid(),
      v_consumer1_id,
      v_store2_id,
      v_reservation2_id,
      5,
      '빵이 정말 신선하고 맛있었습니다. 특히 크루아상이 최고예요! 가격 대비 양도 많고 강추합니다.',
      '좋은 리뷰 감사합니다! 더 맛있는 빵으로 보답하겠습니다 :)',
      NOW() - INTERVAL '4 days 12 hours',
      NOW() - INTERVAL '4 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- 달콤 베이커리 - 리뷰 2개 (업주가 다른 업체에 작성)
  IF v_consumer2_id IS NOT NULL THEN
    INSERT INTO reviews (id, consumer_id, store_id, rating, content, created_at)
    VALUES (
      gen_random_uuid(),
      v_consumer2_id,
      v_store2_id,
      4,
      '빵집 사장으로서 다른 빵집도 자주 가봅니다. 여기는 정말 품질이 좋아요!',
      NOW() - INTERVAL '10 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- 프레시 밀키트 - 리뷰 1개
  IF v_consumer3_id IS NOT NULL THEN
    INSERT INTO reviews (id, consumer_id, store_id, reservation_id, rating, content, created_at)
    VALUES (
      gen_random_uuid(),
      v_consumer3_id,
      v_store3_id,
      v_reservation3_id,
      4,
      '밀키트 퀄리티가 좋아요. 스테이크가 특히 맛있었습니다. 재구매 의사 있어요!',
      NOW() - INTERVAL '8 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- STEP 6: 업체 평균 평점 및 리뷰 수 업데이트
  -- ============================================
  -- 엄마손 반찬집
  UPDATE stores
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM reviews
      WHERE store_id = v_store1_id AND is_deleted = false
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE store_id = v_store1_id AND is_deleted = false
    )
  WHERE id = v_store1_id;

  -- 달콤 베이커리
  UPDATE stores
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM reviews
      WHERE store_id = v_store2_id AND is_deleted = false
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE store_id = v_store2_id AND is_deleted = false
    )
  WHERE id = v_store2_id;

  -- 프레시 밀키트
  UPDATE stores
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM reviews
      WHERE store_id = v_store3_id AND is_deleted = false
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE store_id = v_store3_id AND is_deleted = false
    )
  WHERE id = v_store3_id;

  RAISE NOTICE '리뷰 데이터 생성 완료!';
  RAISE NOTICE '엄마손 반찬집: 1개 리뷰';
  RAISE NOTICE '달콤 베이커리: 2개 리뷰';
  RAISE NOTICE '프레시 밀키트: 1개 리뷰';

END $$;
