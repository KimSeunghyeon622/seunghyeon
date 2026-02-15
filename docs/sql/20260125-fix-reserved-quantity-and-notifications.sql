-- ============================================
-- 마이그레이션: reserved_quantity 트리거 수정 및 notifications 테이블 생성
-- 실행일: 2026-01-25
-- 마이그레이션 이름: fix_reserved_quantity_trigger
-- ============================================

-- ============================================
-- PART 1: 트리거 함수 수정 (reserved_quantity 참조 제거)
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

-- ============================================
-- PART 2: notifications 테이블 생성
-- ============================================

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,  -- 'reservation_cancelled', 'reservation_new', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_reservation_id UUID,
  related_store_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 알림만 조회 가능
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책: 알림 생성 허용 (서비스 역할 또는 인증된 사용자)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 본인 알림 읽음 처리 허용
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================
-- 완료 확인
-- ============================================
SELECT 'Migration completed successfully' as status,
       'handle_reservation_refund, handle_inventory_restoration, check_reservation_available updated' as functions_updated,
       'notifications table created with RLS policies' as table_created;
