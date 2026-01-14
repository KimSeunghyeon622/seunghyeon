-- ========================================
-- 예약 취소 시 환불 및 재고 복구 시스템
-- ========================================

-- 1. 예약 취소 시 자동 환불 처리 함수
CREATE OR REPLACE FUNCTION handle_reservation_refund()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_amount DECIMAL(10, 2);
  v_transaction_id UUID;
BEGIN
  -- 업주가 취소하거나 소비자가 취소한 경우만 환불 처리
  IF (NEW.status = 'cancelled_by_store' OR NEW.status = 'cancelled_by_consumer')
     AND OLD.status = 'confirmed' THEN

    -- 차감된 수수료 계산 (15%)
    v_commission_amount := NEW.total_amount * 0.15;

    -- 환불 거래 기록 생성
    INSERT INTO cash_transactions (
      store_id,
      transaction_type,
      amount,
      balance_after,
      reservation_id,
      description
    )
    VALUES (
      NEW.store_id,
      'refund',
      v_commission_amount,
      (SELECT cash_balance + v_commission_amount FROM stores WHERE id = NEW.store_id),
      NEW.id,
      CASE
        WHEN NEW.status = 'cancelled_by_store' THEN '업체 취소 - 수수료 환불'
        WHEN NEW.status = 'cancelled_by_consumer' THEN '소비자 취소 - 수수료 환불'
      END
    )
    RETURNING id INTO v_transaction_id;

    -- 업체 캐시 잔액 복구
    UPDATE stores
    SET cash_balance = cash_balance + v_commission_amount
    WHERE id = NEW.store_id;

    -- 로그 출력
    RAISE NOTICE '환불 완료: 예약 ID %, 금액 %', NEW.id, v_commission_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 예약 취소 시 재고 복구 함수
CREATE OR REPLACE FUNCTION handle_inventory_restoration()
RETURNS TRIGGER AS $$
BEGIN
  -- 취소된 예약의 재고 복구
  IF (NEW.status = 'cancelled_by_store' OR NEW.status = 'cancelled_by_consumer' OR NEW.status = 'no_show')
     AND OLD.status IN ('confirmed', 'pending') THEN

    -- 상품 재고 복구
    UPDATE products
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE id = NEW.product_id;

    -- 로그 출력
    RAISE NOTICE '재고 복구: 상품 ID %, 수량 +%', NEW.product_id, OLD.quantity;
  END IF;

  -- 픽업 완료 시 재고 차감 (만약 예약 시 차감하지 않았다면)
  IF NEW.status = 'completed' AND OLD.status = 'confirmed' AND NEW.picked_up = TRUE THEN
    -- 이미 예약 시 재고 차감이 되었다면 이 부분은 불필요
    -- 재고 차감이 픽업 완료 시점에 이루어진다면 여기서 처리
    NULL; -- 현재는 예약 시 이미 차감되므로 아무것도 하지 않음
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성 (기존 트리거 삭제 후 재생성)

-- 기존 환불 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS trigger_reservation_refund ON reservations;

-- 새 환불 트리거 생성
CREATE TRIGGER trigger_reservation_refund
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION handle_reservation_refund();

-- 기존 재고 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS trigger_inventory_restoration ON reservations;

-- 새 재고 트리거 생성
CREATE TRIGGER trigger_inventory_restoration
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION handle_inventory_restoration();

-- ========================================
-- 테스트 쿼리 (선택사항)
-- ========================================

-- 특정 예약을 취소하여 환불/재고 복구 테스트
-- UPDATE reservations
-- SET status = 'cancelled_by_store', cancel_reason = '테스트 취소'
-- WHERE id = 'YOUR_RESERVATION_ID';

-- 환불 내역 확인
-- SELECT * FROM cash_transactions
-- WHERE transaction_type = 'refund'
-- ORDER BY created_at DESC LIMIT 5;

-- 재고 확인
-- SELECT id, name, stock_quantity FROM products
-- WHERE id = 'YOUR_PRODUCT_ID';

-- ========================================
-- 주의사항
-- ========================================

-- 1. 이 트리거는 status가 'confirmed' → 'cancelled_*'로 변경될 때만 실행됩니다.
-- 2. 'pending' 상태에서 취소하면 수수료가 차감되지 않았으므로 환불도 발생하지 않습니다.
-- 3. 노쇼('no_show') 시에는 재고만 복구되고 수수료는 환불되지 않습니다.
-- 4. 트리거 실행 로그는 Supabase Dashboard의 Logs에서 확인할 수 있습니다.
