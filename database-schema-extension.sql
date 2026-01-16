-- =====================================================
-- 투굿투고 플랫폼 - 데이터베이스 스키마 확장
-- 작성일: 2026-01-16
-- 목적: 부족한 기능 10개 구현을 위한 스키마 확장
-- =====================================================

-- =====================================================
-- 1. 즐겨찾기 테이블 (favorites)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 같은 소비자가 같은 업체를 중복 즐겨찾기 방지
  UNIQUE(consumer_id, store_id)
);

-- 인덱스 추가 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_favorites_consumer ON favorites(consumer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_store ON favorites(store_id);

-- RLS 정책
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 소비자는 자신의 즐겨찾기만 조회 가능
CREATE POLICY "소비자는 자신의 즐겨찾기 조회 가능"
  ON favorites FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM consumers WHERE id = consumer_id));

-- 소비자는 자신의 즐겨찾기만 추가 가능
CREATE POLICY "소비자는 즐겨찾기 추가 가능"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM consumers WHERE id = consumer_id));

-- 소비자는 자신의 즐겨찾기만 삭제 가능
CREATE POLICY "소비자는 자신의 즐겨찾기 삭제 가능"
  ON favorites FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM consumers WHERE id = consumer_id));


-- =====================================================
-- 2. products 테이블에 카테고리 컬럼 추가
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category VARCHAR(50) DEFAULT '기타';
  END IF;
END $$;

-- 카테고리 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);


-- =====================================================
-- 3. 영업시간 테이블 (store_operating_hours)
-- =====================================================
CREATE TABLE IF NOT EXISTS store_operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=일요일, 6=토요일
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE, -- 해당 요일 휴무 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 같은 업체의 같은 요일은 하나만 존재
  UNIQUE(store_id, day_of_week)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_store_hours_store ON store_operating_hours(store_id);

-- RLS 정책
ALTER TABLE store_operating_hours ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 영업시간 조회 가능
CREATE POLICY "누구나 영업시간 조회 가능"
  ON store_operating_hours FOR SELECT
  USING (true);

-- 업주는 자신의 업체 영업시간만 수정 가능
CREATE POLICY "업주는 자신의 영업시간 수정 가능"
  ON store_operating_hours FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM stores WHERE id = store_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM stores WHERE id = store_id));


-- =====================================================
-- 4. 예약 취소 환불 처리 함수
-- =====================================================
-- 기존 함수 삭제 (있을 경우)
DROP FUNCTION IF EXISTS cancel_reservation_with_refund(UUID);

-- 예약 취소 및 환불 처리 함수
CREATE OR REPLACE FUNCTION cancel_reservation_with_refund(reservation_id_param UUID)
RETURNS JSON AS $$
DECLARE
  v_reservation RECORD;
  v_now TIMESTAMP;
  v_hours_until_pickup INTEGER;
  v_refund_amount DECIMAL(10, 2);
BEGIN
  -- 현재 시간
  v_now := NOW();

  -- 예약 정보 조회
  SELECT * INTO v_reservation
  FROM reservations
  WHERE id = reservation_id_param
    AND status IN ('pending', 'confirmed');

  -- 예약이 없거나 이미 완료/취소된 경우
  IF v_reservation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '취소할 수 없는 예약입니다.'
    );
  END IF;

  -- 픽업 시간까지 남은 시간 계산 (시간 단위)
  v_hours_until_pickup := EXTRACT(EPOCH FROM (v_reservation.pickup_time - v_now)) / 3600;

  -- 픽업 시간이 1시간 미만 남았으면 취소 불가
  IF v_hours_until_pickup < 1 THEN
    RETURN json_build_object(
      'success', false,
      'message', '픽업 시간 1시간 전부터는 취소할 수 없습니다.'
    );
  END IF;

  -- 환불 금액 계산 (수수료 15%는 환불 안 됨)
  -- total_amount에서 이미 수수료가 차감되었으므로, 그 금액을 환불
  v_refund_amount := v_reservation.total_amount * 0.15; -- 수수료 15%

  -- 예약 상태를 'cancelled'로 변경
  UPDATE reservations
  SET status = 'cancelled',
      updated_at = v_now
  WHERE id = reservation_id_param;

  -- 재고 복구
  UPDATE products
  SET stock_quantity = stock_quantity + v_reservation.quantity
  WHERE id = v_reservation.product_id;

  -- 업체 캐시 환불 (수수료 환불)
  UPDATE stores
  SET cash_balance = cash_balance + v_refund_amount
  WHERE id = v_reservation.store_id;

  -- 거래 내역 추가
  INSERT INTO cash_transactions (
    store_id,
    transaction_type,
    amount,
    balance_after,
    reservation_id,
    description
  )
  SELECT
    v_reservation.store_id,
    'refund',
    v_refund_amount,
    (SELECT cash_balance FROM stores WHERE id = v_reservation.store_id),
    reservation_id_param,
    '예약 취소 환불 (수수료 환불)'
  ;

  RETURN json_build_object(
    'success', true,
    'message', '예약이 취소되었습니다.',
    'refund_amount', v_refund_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 5. 재고 자동 관리 트리거
-- =====================================================
-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_stock_on_reservation ON reservations;
DROP FUNCTION IF EXISTS update_stock_on_reservation();

-- 예약 상태 변경 시 재고 차감/복구 함수
CREATE OR REPLACE FUNCTION update_stock_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- 예약이 confirmed로 변경되면 재고 차감
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;

    -- 재고가 음수가 되면 오류 발생
    IF (SELECT stock_quantity FROM products WHERE id = NEW.product_id) < 0 THEN
      RAISE EXCEPTION '재고가 부족합니다.';
    END IF;
  END IF;

  -- 예약이 cancelled로 변경되면 재고 복구
  IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed') THEN
    UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.product_id;
  END IF;

  -- 예약이 completed로 변경되면 재고 유지 (이미 차감됨)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_stock_on_reservation
  AFTER UPDATE ON reservations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_stock_on_reservation();


-- =====================================================
-- 6. 검색 성능 향상을 위한 인덱스
-- =====================================================
-- 업체명 검색 인덱스 (대소문자 구분 없이)
CREATE INDEX IF NOT EXISTS idx_stores_name_lower ON stores(LOWER(name));

-- 상품명 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products(LOWER(name));

-- 업체 주소 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_stores_address_lower ON stores(LOWER(address));


-- =====================================================
-- 7. stores 테이블에 review_count 컬럼 추가 (있으면 스킵)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE stores ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;


-- =====================================================
-- 8. 리뷰 작성 시 review_count 자동 업데이트 트리거
-- =====================================================
-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_review_count ON reviews;
DROP FUNCTION IF EXISTS update_review_count();

-- 리뷰 작성/삭제 시 업체의 리뷰 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_review_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 리뷰 추가 시
    UPDATE stores
    SET review_count = review_count + 1
    WHERE id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- 리뷰 삭제 시
    UPDATE stores
    SET review_count = GREATEST(review_count - 1, 0)
    WHERE id = OLD.store_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_review_count
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_count();


-- =====================================================
-- 9. consumers 테이블에 phone, address 컬럼 추가 (프로필 편집용)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consumers' AND column_name = 'phone'
  ) THEN
    ALTER TABLE consumers ADD COLUMN phone VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consumers' AND column_name = 'address'
  ) THEN
    ALTER TABLE consumers ADD COLUMN address TEXT;
  END IF;
END $$;


-- =====================================================
-- 10. 예약 가능 여부 확인 함수
-- =====================================================
-- 기존 함수 삭제
DROP FUNCTION IF EXISTS check_reservation_available(UUID, TIMESTAMP, INTEGER);

-- 예약 가능 여부 확인 함수
CREATE OR REPLACE FUNCTION check_reservation_available(
  product_id_param UUID,
  pickup_time_param TIMESTAMP,
  quantity_param INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_store RECORD;
  v_day_of_week INTEGER;
  v_operating_hours RECORD;
  v_pickup_time_only TIME;
BEGIN
  -- 상품 정보 조회
  SELECT * INTO v_product
  FROM products
  WHERE id = product_id_param AND is_active = true;

  IF v_product IS NULL THEN
    RETURN json_build_object(
      'available', false,
      'message', '상품을 찾을 수 없거나 판매 중단되었습니다.'
    );
  END IF;

  -- 재고 확인
  IF v_product.stock_quantity < quantity_param THEN
    RETURN json_build_object(
      'available', false,
      'message', '재고가 부족합니다. (남은 재고: ' || v_product.stock_quantity || '개)'
    );
  END IF;

  -- 과거 시간 확인
  IF pickup_time_param < NOW() THEN
    RETURN json_build_object(
      'available', false,
      'message', '과거 시간으로는 예약할 수 없습니다.'
    );
  END IF;

  -- 업체 정보 조회
  SELECT * INTO v_store
  FROM stores
  WHERE id = v_product.store_id;

  -- 업체 영업 여부 확인
  IF v_store.is_open = false THEN
    RETURN json_build_object(
      'available', false,
      'message', '현재 영업 중이 아닙니다.'
    );
  END IF;

  -- 캐시 잔액 확인
  IF v_store.cash_balance <= 10000 THEN
    RETURN json_build_object(
      'available', false,
      'message', '업체 캐시가 부족하여 예약할 수 없습니다.'
    );
  END IF;

  -- 요일 및 시간 확인
  v_day_of_week := EXTRACT(DOW FROM pickup_time_param); -- 0=일요일, 6=토요일
  v_pickup_time_only := pickup_time_param::TIME;

  -- 영업시간 조회
  SELECT * INTO v_operating_hours
  FROM store_operating_hours
  WHERE store_id = v_product.store_id
    AND day_of_week = v_day_of_week;

  -- 영업시간 정보가 있는 경우 확인
  IF v_operating_hours IS NOT NULL THEN
    -- 휴무일 확인
    IF v_operating_hours.is_closed = true THEN
      RETURN json_build_object(
        'available', false,
        'message', '선택하신 날짜는 휴무일입니다.'
      );
    END IF;

    -- 영업시간 내 확인
    IF v_pickup_time_only < v_operating_hours.open_time
       OR v_pickup_time_only > v_operating_hours.close_time THEN
      RETURN json_build_object(
        'available', false,
        'message', '영업시간 내에만 픽업 가능합니다. (' ||
                   v_operating_hours.open_time || ' ~ ' ||
                   v_operating_hours.close_time || ')'
      );
    END IF;
  END IF;

  -- 모든 검증 통과
  RETURN json_build_object(
    'available', true,
    'message', '예약 가능합니다.'
  );
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '데이터베이스 스키마 확장이 완료되었습니다!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - favorites (즐겨찾기)';
  RAISE NOTICE '  - store_operating_hours (영업시간)';
  RAISE NOTICE '';
  RAISE NOTICE '추가된 컬럼:';
  RAISE NOTICE '  - products.category';
  RAISE NOTICE '  - stores.review_count';
  RAISE NOTICE '  - consumers.phone';
  RAISE NOTICE '  - consumers.address';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 함수:';
  RAISE NOTICE '  - cancel_reservation_with_refund()';
  RAISE NOTICE '  - check_reservation_available()';
  RAISE NOTICE '  - update_stock_on_reservation()';
  RAISE NOTICE '  - update_review_count()';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 트리거:';
  RAISE NOTICE '  - trigger_update_stock_on_reservation';
  RAISE NOTICE '  - trigger_update_review_count';
  RAISE NOTICE '========================================';
END $$;
