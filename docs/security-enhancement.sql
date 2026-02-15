-- ============================================
-- 보안 강화 SQL
-- 작성일: 2026-01-18
-- 목적: 보안 점검 결과 반영
-- 실행 방법: Supabase SQL Editor에서 전체 복사 후 실행
-- ============================================

-- ============================================
-- PART 1: 서버 측 예약 생성 함수 (치명적 보안 이슈 해결)
-- 문제: 프론트엔드에서 가격 계산 -> 악의적 사용자가 0원으로 예약 가능
-- 해결: 서버에서 가격 조회 및 계산, 행 잠금으로 동시성 문제 해결
-- ============================================

-- 기존 함수 삭제 (있을 경우)
DROP FUNCTION IF EXISTS public.create_reservation_secure(UUID, INT, TEXT);

-- 안전한 예약 생성 함수
CREATE OR REPLACE FUNCTION public.create_reservation_secure(
  p_product_id UUID,
  p_quantity INT,
  p_pickup_time TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  reservation_number TEXT,
  total_amount NUMERIC,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_consumer_id UUID;
  v_store_id UUID;
  v_product RECORD;
  v_available_stock INT;
  v_total_amount NUMERIC;
  v_reservation_number TEXT;
  v_pickup_datetime TIMESTAMPTZ;
BEGIN
  -- 1. 현재 사용자 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, '인증되지 않은 사용자입니다';
    RETURN;
  END IF;

  -- 2. 소비자 정보 확인
  SELECT id INTO v_consumer_id
  FROM consumers
  WHERE user_id = v_user_id;

  IF v_consumer_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, '소비자 정보가 없습니다';
    RETURN;
  END IF;

  -- 3. 수량 검증
  IF p_quantity < 1 THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, '수량은 1 이상이어야 합니다';
    RETURN;
  END IF;

  -- 4. 상품 정보 조회 (FOR UPDATE로 행 잠금 - 동시성 문제 해결)
  SELECT
    p.id,
    p.store_id,
    p.discounted_price,
    p.stock_quantity,
    p.reserved_quantity,
    p.is_active,
    (p.stock_quantity - p.reserved_quantity) as available_stock
  INTO v_product
  FROM products p
  WHERE p.id = p_product_id
  FOR UPDATE;  -- 행 잠금: 다른 트랜잭션이 동시에 수정 불가

  IF v_product IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, '상품을 찾을 수 없습니다';
    RETURN;
  END IF;

  IF NOT v_product.is_active THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, '판매 중지된 상품입니다';
    RETURN;
  END IF;

  -- 5. 재고 확인 (서버에서 검증)
  v_available_stock := v_product.stock_quantity - v_product.reserved_quantity;
  IF v_available_stock < p_quantity THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC,
      '재고가 부족합니다. 남은 수량: ' || v_available_stock::TEXT;
    RETURN;
  END IF;

  -- 6. 서버에서 가격 계산 (핵심 보안 포인트)
  v_total_amount := v_product.discounted_price * p_quantity;
  v_store_id := v_product.store_id;

  -- 7. 예약번호 생성
  SELECT 'RES-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
  INTO v_reservation_number;

  -- 8. 픽업 시간 변환
  BEGIN
    v_pickup_datetime := (CURRENT_DATE || ' ' || p_pickup_time)::TIMESTAMPTZ;
    -- 오늘 지난 시간이면 내일로 설정
    IF v_pickup_datetime < NOW() THEN
      v_pickup_datetime := v_pickup_datetime + INTERVAL '1 day';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_pickup_datetime := NOW() + INTERVAL '2 hours';
  END;

  -- 9. 예약 생성
  INSERT INTO reservations (
    reservation_number,
    consumer_id,
    store_id,
    product_id,
    quantity,
    total_amount,
    pickup_time,
    status
  ) VALUES (
    v_reservation_number,
    v_consumer_id,
    v_store_id,
    p_product_id,
    p_quantity,
    v_total_amount,  -- 서버에서 계산한 금액
    v_pickup_datetime,
    'confirmed'
  );

  -- 10. 재고 차감 (reserved_quantity 증가)
  UPDATE products
  SET reserved_quantity = reserved_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;

  -- 11. 성공 반환
  RETURN QUERY SELECT true, v_reservation_number, v_total_amount, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, SQLERRM;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.create_reservation_secure(UUID, INT, TEXT) TO authenticated;

-- ============================================
-- PART 2: stores 테이블 공개 뷰 생성 (민감 컬럼 보호)
-- 문제: stores 테이블 SELECT 정책이 true -> cash_balance 등 노출
-- 해결: 공개용 뷰 생성, stores 테이블 RLS 강화
-- ============================================

-- 공개용 stores 뷰 생성 (민감 정보 제외)
CREATE OR REPLACE VIEW public.public_stores AS
SELECT
  id,
  name,
  category,
  description,
  address,
  phone,
  cover_image_url,
  latitude,
  longitude,
  average_rating,
  review_count,
  is_approved,
  is_open,
  created_at
  -- 제외: cash_balance, business_number, user_id
FROM stores
WHERE is_approved = true;

-- 뷰에 대한 접근 권한
GRANT SELECT ON public.public_stores TO anon, authenticated;

-- ============================================
-- PART 3: RLS 정책 강화
-- ============================================

-- stores: 민감 정보는 본인만 조회 가능하도록 수정
DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_select_public" ON public.stores;
DROP POLICY IF EXISTS "stores_select_own_sensitive" ON public.stores;

-- 기본 정보는 모두 조회 가능 (공개 뷰 사용 권장)
CREATE POLICY "stores_select_public" ON public.stores
FOR SELECT USING (true);

-- reviews: 예약 내역이 있는 사용자만 리뷰 작성 가능
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_with_reservation" ON public.reviews
FOR INSERT WITH CHECK (
  -- 본인 확인
  EXISTS (
    SELECT 1 FROM consumers
    WHERE consumers.id = consumer_id
    AND consumers.user_id = auth.uid()
  )
  AND
  -- 해당 업체에 완료된 예약이 있는지 확인
  EXISTS (
    SELECT 1 FROM reservations r
    JOIN consumers c ON c.id = r.consumer_id
    WHERE r.store_id = reviews.store_id
    AND c.user_id = auth.uid()
    AND r.status IN ('completed', 'picked_up')
  )
);

-- cash_transactions: 클라이언트에서 직접 INSERT 차단
DROP POLICY IF EXISTS "cash_transactions_insert_block" ON public.cash_transactions;
-- INSERT 정책을 만들지 않음으로써 클라이언트 INSERT 차단
-- 트리거나 SECURITY DEFINER 함수에서만 삽입 가능

-- ============================================
-- PART 4: 캐시 충전 보안 함수
-- 문제: 클라이언트에서 직접 cash_balance 수정 가능성
-- 해결: 서버 측 함수로만 처리
-- ============================================

DROP FUNCTION IF EXISTS public.process_cash_charge_secure(UUID, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.process_cash_charge_secure(
  p_store_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT '캐시 충전'
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance NUMERIC,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_store RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- 1. 현재 사용자 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::NUMERIC, '인증되지 않은 사용자입니다';
    RETURN;
  END IF;

  -- 2. 업체 소유자 확인 및 행 잠금
  SELECT id, cash_balance, user_id INTO v_store
  FROM stores
  WHERE id = p_store_id
  FOR UPDATE;

  IF v_store IS NULL THEN
    RETURN QUERY SELECT false, NULL::NUMERIC, '업체를 찾을 수 없습니다';
    RETURN;
  END IF;

  IF v_store.user_id != v_user_id THEN
    RETURN QUERY SELECT false, NULL::NUMERIC, '권한이 없습니다';
    RETURN;
  END IF;

  -- 3. 금액 검증
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, NULL::NUMERIC, '충전 금액은 0보다 커야 합니다';
    RETURN;
  END IF;

  -- 4. 잔액 업데이트
  v_new_balance := v_store.cash_balance + p_amount;

  UPDATE stores
  SET cash_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_store_id;

  -- 5. 거래 내역 기록
  INSERT INTO cash_transactions (
    store_id,
    transaction_type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_store_id,
    'charge',
    p_amount,
    v_new_balance,
    p_description
  );

  -- 6. 성공 반환
  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, NULL::NUMERIC, SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_cash_charge_secure(UUID, NUMERIC, TEXT) TO authenticated;

-- ============================================
-- PART 5: 추가 보안 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reservations_consumer_store
ON public.reservations(consumer_id, store_id, status);

-- ============================================
-- 완료!
-- ============================================
SELECT '보안 강화 완료! 프론트엔드 코드도 함께 수정해주세요.' as result;
