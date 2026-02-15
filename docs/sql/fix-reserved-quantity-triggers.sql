-- ============================================
-- 트리거 함수 수정: reserved_quantity 참조 제거
-- 작성일: 2026-01-24
-- 문제: 예약 취소 시 "column reserved_quantity does not exist" 오류 발생
-- 원인: handle_reservation_refund 트리거가 존재하지 않는 reserved_quantity 컬럼 참조
-- 해결: reserved_quantity 대신 stock_quantity만 사용하도록 수정
-- ============================================

-- 1. handle_reservation_refund 수정
-- 예약이 취소될 때 stock_quantity를 복구 (reserved_quantity 참조 제거)
CREATE OR REPLACE FUNCTION public.handle_reservation_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 상태가 cancelled로 변경된 경우 (cancelled_by_consumer 또는 cancelled_by_store 포함)
  IF OLD.status NOT LIKE 'cancelled%' AND (NEW.status LIKE 'cancelled%' OR NEW.status = 'cancelled') THEN
    -- 재고 복구: stock_quantity 증가
    UPDATE products
    SET stock_quantity = stock_quantity + OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;

    -- 확정된 예약이었고 수수료가 있었다면 환불 처리
    IF OLD.status = 'confirmed' AND OLD.commission_amount IS NOT NULL THEN
      UPDATE stores
      SET cash_balance = cash_balance + OLD.commission_amount
      WHERE id = OLD.store_id;

      INSERT INTO cash_transactions (store_id, transaction_type, amount, balance_after, reservation_id, description)
      SELECT OLD.store_id, 'refund', OLD.commission_amount, cash_balance, OLD.id, '예약 취소 수수료 환불'
      FROM stores WHERE id = OLD.store_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. handle_inventory_restoration 수정 (예약 삭제 시 재고 복구)
CREATE OR REPLACE FUNCTION public.handle_inventory_restoration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 재고 복구: stock_quantity 증가
  UPDATE products
  SET stock_quantity = stock_quantity + OLD.quantity,
      updated_at = NOW()
  WHERE id = OLD.product_id;
  RETURN OLD;
END;
$$;

-- 3. check_reservation_available 수정
-- stock_quantity만 사용하여 예약 가능 여부 확인
CREATE OR REPLACE FUNCTION public.check_reservation_available(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_stock INT;
BEGIN
  -- stock_quantity만 사용 (reserved_quantity 제거)
  SELECT stock_quantity INTO available_stock
  FROM products
  WHERE id = p_product_id AND is_active = true;

  IF available_stock IS NULL THEN
    RETURN false;
  END IF;

  RETURN available_stock >= p_quantity;
END;
$$;

-- 완료 확인
SELECT 'Trigger functions updated successfully (reserved_quantity removed)' as result;
