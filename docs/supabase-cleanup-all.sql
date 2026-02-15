-- ============================================
-- Supabase 전체 정리 및 최적화 SQL
-- 작성일: 2026-01-18
-- 실행 방법: Supabase SQL Editor에서 전체 복사 후 실행
-- ============================================

-- ============================================
-- PART 1: 불필요한 뷰 삭제
-- ============================================
DROP VIEW IF EXISTS public.store_cash_summary CASCADE;
DROP VIEW IF EXISTS public.stores_with_status CASCADE;
DROP VIEW IF EXISTS public.reservation_stats CASCADE;

-- ============================================
-- PART 2: 불필요한 테이블 삭제
-- ============================================
DROP TABLE IF EXISTS public.review_rights CASCADE;
-- DROP TABLE IF EXISTS public.user_profiles CASCADE; -- 필요시 주석 해제

-- ============================================
-- PART 3: 함수 보안 수정 (search_path 설정)
-- ============================================

-- handle_reservation_refund
CREATE OR REPLACE FUNCTION public.handle_reservation_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE products
    SET reserved_quantity = reserved_quantity - OLD.quantity
    WHERE id = OLD.product_id;

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

-- handle_inventory_restoration
CREATE OR REPLACE FUNCTION public.handle_inventory_restoration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET reserved_quantity = reserved_quantity - OLD.quantity
  WHERE id = OLD.product_id;
  RETURN OLD;
END;
$$;

-- check_reservation_available
CREATE OR REPLACE FUNCTION public.check_reservation_available(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_stock INT;
BEGIN
  SELECT (stock_quantity - reserved_quantity) INTO available_stock
  FROM products
  WHERE id = p_product_id AND is_active = true;
  IF available_stock IS NULL THEN RETURN false; END IF;
  RETURN available_stock >= p_quantity;
END;
$$;

-- toggle_product_status
CREATE OR REPLACE FUNCTION public.toggle_product_status(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status BOOLEAN;
BEGIN
  UPDATE products
  SET is_active = NOT is_active, updated_at = NOW()
  WHERE id = p_product_id
  RETURNING is_active INTO new_status;
  RETURN new_status;
END;
$$;

-- ============================================
-- PART 4: 기존 RLS 정책 삭제
-- ============================================

-- consumers
DROP POLICY IF EXISTS "consumers_select_policy" ON public.consumers;
DROP POLICY IF EXISTS "consumers_insert_policy" ON public.consumers;
DROP POLICY IF EXISTS "consumers_update_policy" ON public.consumers;
DROP POLICY IF EXISTS "consumers_delete_policy" ON public.consumers;
DROP POLICY IF EXISTS "소비자는 자신의 정보만 조회 가능" ON public.consumers;
DROP POLICY IF EXISTS "소비자는 자신의 정보만 수정 가능" ON public.consumers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.consumers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.consumers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.consumers;
DROP POLICY IF EXISTS "consumers_select_own" ON public.consumers;
DROP POLICY IF EXISTS "consumers_insert_own" ON public.consumers;
DROP POLICY IF EXISTS "consumers_update_own" ON public.consumers;

-- stores
DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_update_policy" ON public.stores;
DROP POLICY IF EXISTS "모든 사용자가 업체 정보 조회 가능" ON public.stores;
DROP POLICY IF EXISTS "업체는 자신의 정보만 수정 가능" ON public.stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;
DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_own" ON public.stores;
DROP POLICY IF EXISTS "stores_update_own" ON public.stores;

-- products
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "활성 상품 조회 가능" ON public.products;
DROP POLICY IF EXISTS "업체는 자신의 상품만 관리 가능" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "products_manage_own" ON public.products;

-- reservations
DROP POLICY IF EXISTS "reservations_select_policy" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_policy" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_policy" ON public.reservations;
DROP POLICY IF EXISTS "소비자는 자신의 예약만 조회" ON public.reservations;
DROP POLICY IF EXISTS "업체는 자신의 예약만 조회" ON public.reservations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_consumer" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON public.reservations;

-- reviews
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON public.reviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;

-- cash_transactions
DROP POLICY IF EXISTS "cash_transactions_select_policy" ON public.cash_transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_select_own" ON public.cash_transactions;

-- favorites
DROP POLICY IF EXISTS "favorites_select_policy" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_policy" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_policy" ON public.favorites;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

-- store_operating_hours
DROP POLICY IF EXISTS "store_operating_hours_select_policy" ON public.store_operating_hours;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.store_operating_hours;
DROP POLICY IF EXISTS "operating_hours_select_all" ON public.store_operating_hours;
DROP POLICY IF EXISTS "operating_hours_manage_own" ON public.store_operating_hours;

-- ============================================
-- PART 5: 새로운 최적화된 RLS 정책 생성
-- ============================================

-- consumers
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consumers_select_own" ON public.consumers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consumers_insert_own" ON public.consumers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consumers_update_own" ON public.consumers FOR UPDATE USING (auth.uid() = user_id);

-- stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_select_all" ON public.stores FOR SELECT USING (true);
CREATE POLICY "stores_insert_own" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stores_update_own" ON public.stores FOR UPDATE USING (auth.uid() = user_id);

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_active" ON public.products FOR SELECT USING (
  is_active = true OR EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "products_manage_own" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
);

-- reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT USING (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = reservations.consumer_id AND consumers.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM stores WHERE stores.id = reservations.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "reservations_insert_consumer" ON public.reservations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = consumer_id AND consumers.user_id = auth.uid())
);
CREATE POLICY "reservations_update_own" ON public.reservations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = reservations.consumer_id AND consumers.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM stores WHERE stores.id = reservations.store_id AND stores.user_id = auth.uid())
);

-- reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (is_deleted = false);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = consumer_id AND consumers.user_id = auth.uid())
);
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = reviews.consumer_id AND consumers.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM stores WHERE stores.id = reviews.store_id AND stores.user_id = auth.uid())
);

-- cash_transactions
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_transactions_select_own" ON public.cash_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = cash_transactions.store_id AND stores.user_id = auth.uid())
);

-- favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = favorites.consumer_id AND consumers.user_id = auth.uid())
);
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = consumer_id AND consumers.user_id = auth.uid())
);
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (
  EXISTS (SELECT 1 FROM consumers WHERE consumers.id = favorites.consumer_id AND consumers.user_id = auth.uid())
);

-- store_operating_hours
ALTER TABLE public.store_operating_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operating_hours_select_all" ON public.store_operating_hours FOR SELECT USING (true);
CREATE POLICY "operating_hours_manage_own" ON public.store_operating_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_operating_hours.store_id AND stores.user_id = auth.uid())
);

-- ============================================
-- PART 6: 인덱스 최적화
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consumers_user_id ON public.consumers(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reservations_consumer ON public.reservations(consumer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_store ON public.reservations(store_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reviews_store ON public.reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_store ON public.cash_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_favorites_consumer ON public.favorites(consumer_id);

-- ============================================
-- 완료!
-- ============================================
SELECT '정리 완료! Security Advisor를 새로고침하여 확인하세요.' as result;
