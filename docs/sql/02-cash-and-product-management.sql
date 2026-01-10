-- ========================================
-- 캐시 관리 및 상품 관리 시스템
-- ========================================

-- 1. stores 테이블에 캐시 잔액 컬럼 추가
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS cash_balance DECIMAL(10, 2) DEFAULT 0.00;

-- 2. 캐시 거래 내역 테이블 생성
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('charge', 'fee', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cash_transactions_store ON cash_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(created_at DESC);

-- 3. products 테이블에 필요한 컬럼 추가 (없으면)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 4. 예약 완료 시 자동으로 수수료 차감하는 트리거 함수
CREATE OR REPLACE FUNCTION deduct_commission_fee()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
  v_total_amount DECIMAL(10, 2);
  v_commission_rate DECIMAL(5, 4) := 0.15; -- 15% 수수료
  v_commission_amount DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
BEGIN
  -- 예약 상태가 'confirmed'로 변경될 때만 실행
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN

    -- 예약의 업체 ID와 총액 가져오기
    v_store_id := NEW.store_id;
    v_total_amount := NEW.total_amount;

    -- 수수료 계산
    v_commission_amount := v_total_amount * v_commission_rate;

    -- 업체의 캐시 잔액에서 차감
    UPDATE stores
    SET cash_balance = cash_balance - v_commission_amount
    WHERE id = v_store_id
    RETURNING cash_balance INTO v_new_balance;

    -- 거래 내역 기록
    INSERT INTO cash_transactions (
      store_id,
      transaction_type,
      amount,
      balance_after,
      reservation_id,
      description
    ) VALUES (
      v_store_id,
      'fee',
      -v_commission_amount,
      v_new_balance,
      NEW.id,
      '예약 수수료 (15%): 예약번호 ' || NEW.reservation_number
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성 (이미 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS trigger_deduct_commission ON reservations;
CREATE TRIGGER trigger_deduct_commission
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION deduct_commission_fee();

-- 6. 캐시 충전 함수 (업체가 캐시를 충전할 때 사용)
CREATE OR REPLACE FUNCTION charge_store_cash(
  p_store_id UUID,
  p_amount DECIMAL(10, 2),
  p_description TEXT DEFAULT '캐시 충전'
)
RETURNS JSON AS $$
DECLARE
  v_new_balance DECIMAL(10, 2);
  v_transaction_id UUID;
BEGIN
  -- 금액이 0보다 커야 함
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '충전 금액은 0보다 커야 합니다';
  END IF;

  -- 캐시 잔액 업데이트
  UPDATE stores
  SET cash_balance = cash_balance + p_amount
  WHERE id = p_store_id
  RETURNING cash_balance INTO v_new_balance;

  -- 거래 내역 기록
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
  )
  RETURNING id INTO v_transaction_id;

  -- 결과 반환
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- 7. RLS (Row Level Security) 정책 설정
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

-- 업체는 자신의 거래 내역만 볼 수 있음
CREATE POLICY "stores_view_own_transactions" ON cash_transactions
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- 8. 상품 활성화/비활성화 함수
CREATE OR REPLACE FUNCTION toggle_product_status(
  p_product_id UUID,
  p_is_active BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE products
  SET is_active = p_is_active,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 9. 테스트 데이터: 업체에 초기 캐시 충전 (선택사항)
-- 실제로는 토스페이먼츠를 통해 충전
/*
SELECT charge_store_cash(
  (SELECT id FROM stores WHERE name = '투굿투고 강남점'),
  1000000.00,
  '초기 캐시 충전'
);
*/

-- 10. 유용한 뷰: 업체별 캐시 통계
CREATE OR REPLACE VIEW store_cash_summary AS
SELECT
  s.id AS store_id,
  s.name AS store_name,
  s.cash_balance,
  COUNT(ct.id) FILTER (WHERE ct.transaction_type = 'charge') AS total_charges,
  COUNT(ct.id) FILTER (WHERE ct.transaction_type = 'fee') AS total_fees,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.transaction_type = 'charge'), 0) AS total_charged_amount,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.transaction_type = 'fee'), 0) AS total_fee_amount
FROM stores s
LEFT JOIN cash_transactions ct ON s.id = ct.store_id
GROUP BY s.id, s.name, s.cash_balance;

COMMENT ON TABLE cash_transactions IS '업체 캐시 거래 내역';
COMMENT ON COLUMN cash_transactions.transaction_type IS 'charge: 충전, fee: 수수료 차감, refund: 환불';
COMMENT ON FUNCTION deduct_commission_fee() IS '예약 확정 시 자동으로 15% 수수료 차감';
COMMENT ON FUNCTION charge_store_cash IS '업체 캐시 충전 함수';
