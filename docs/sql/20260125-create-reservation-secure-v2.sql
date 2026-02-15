-- ============================================
-- 마이그레이션: create_reservation_secure 함수 업데이트
-- 실행일: 2026-01-25
-- 목적: reserved_quantity 대신 stock_quantity 직접 차감
-- ============================================

-- 기존 함수 삭제 (있을 경우)
DROP FUNCTION IF EXISTS public.create_reservation_secure(UUID, INT, TEXT);

-- 수정된 안전한 예약 생성 함수
-- 변경사항: reserved_quantity 참조 제거, stock_quantity 직접 차감
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
  -- reserved_quantity 대신 stock_quantity만 사용
  SELECT
    p.id,
    p.store_id,
    p.discounted_price,
    p.stock_quantity,
    p.is_active
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

  -- 5. 재고 확인 (서버에서 검증) - stock_quantity만 사용
  IF v_product.stock_quantity < p_quantity THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC,
      '재고가 부족합니다. 남은 수량: ' || v_product.stock_quantity::TEXT;
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

  -- 10. 재고 즉시 차감 (stock_quantity 감소)
  UPDATE products
  SET stock_quantity = stock_quantity - p_quantity,
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

-- 확인
SELECT 'create_reservation_secure updated: stock_quantity direct deduction on reservation' as result;
