-- ============================================
-- Supabase 최종 정리 SQL (z6 분석 기반)
-- 작성일: 2026-01-18
-- 모든 중복 정책 삭제 후 최적화된 정책 재생성
-- ============================================

-- ============================================
-- STEP 1: 모든 기존 RLS 정책 삭제
-- ============================================

-- cash_transactions
DROP POLICY IF EXISTS "stores_view_own_transactions" ON public.cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_select_own" ON public.cash_transactions;

-- consumers (5개 중복)
DROP POLICY IF EXISTS "Users can insert their own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "Users can update their own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "Users can view their own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "authenticated_users_full_access" ON public.consumers;
DROP POLICY IF EXISTS "소비자는 자신의 정보만 조회" ON public.consumers;
DROP POLICY IF EXISTS "consumers_select_own" ON public.consumers;
DROP POLICY IF EXISTS "consumers_insert_own" ON public.consumers;
DROP POLICY IF EXISTS "consumers_update_own" ON public.consumers;

-- favorites
DROP POLICY IF EXISTS "소비자는 자신의 즐겨찾기 삭제 가능" ON public.favorites;
DROP POLICY IF EXISTS "소비자는 즐겨찾기 추가 가능" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

-- products
DROP POLICY IF EXISTS "products_read_all" ON public.products;
DROP POLICY IF EXISTS "products_modify_owner" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "products_manage_own" ON public.products;

-- reservations
DROP POLICY IF EXISTS "reservations_store_access" ON public.reservations;
DROP POLICY IF EXISTS "reservations_consumer_access" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_consumer" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON public.reservations;

-- reviews (6개 중복)
DROP POLICY IF EXISTS "reviews_read_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_store_reply" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_consumer_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;

-- store_operating_hours (4개 중복)
DROP POLICY IF EXISTS "operating_hours_read_all" ON public.store_operating_hours;
DROP POLICY IF EXISTS "누구나 영업시간 조회 가능" ON public.store_operating_hours;
DROP POLICY IF EXISTS "업주는 자신의 영업시간 수정 가능" ON public.store_operating_hours;
DROP POLICY IF EXISTS "operating_hours_modify_owner" ON public.store_operating_hours;
DROP POLICY IF EXISTS "operating_hours_select_all" ON public.store_operating_hours;
DROP POLICY IF EXISTS "operating_hours_manage_own" ON public.store_operating_hours;

-- stores
DROP POLICY IF EXISTS "모든 사용자가 업체 조회 가능" ON public.stores;
DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_own" ON public.stores;
DROP POLICY IF EXISTS "stores_update_own" ON public.stores;

-- user_profiles (문제의 테이블)
DROP POLICY IF EXISTS "authenticated_users_full_access" ON public.user_profiles;

-- ============================================
-- STEP 2: RLS 활성화 확인
-- ============================================

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- user_profiles가 존재하면 RLS 활성화
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- STEP 3: 최적화된 RLS 정책 생성 (중복 없이)
-- ============================================

-- ============================================
-- 3-1. consumers (소비자)
-- ============================================
CREATE POLICY "consumers_policy_select" ON public.consumers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "consumers_policy_insert" ON public.consumers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consumers_policy_update" ON public.consumers
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3-2. stores (업체)
-- ============================================
CREATE POLICY "stores_policy_select" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "stores_policy_insert" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stores_policy_update" ON public.stores
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3-3. products (상품)
-- ============================================
CREATE POLICY "products_policy_select" ON public.products
  FOR SELECT USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "products_policy_insert" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "products_policy_update" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "products_policy_delete" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

-- ============================================
-- 3-4. reservations (예약)
-- ============================================
CREATE POLICY "reservations_policy_select" ON public.reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = reservations.consumer_id AND consumers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM stores WHERE stores.id = reservations.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "reservations_policy_insert" ON public.reservations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = consumer_id AND consumers.user_id = auth.uid())
  );

CREATE POLICY "reservations_policy_update" ON public.reservations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = reservations.consumer_id AND consumers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM stores WHERE stores.id = reservations.store_id AND stores.user_id = auth.uid())
  );

-- ============================================
-- 3-5. reviews (리뷰)
-- ============================================
CREATE POLICY "reviews_policy_select" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_policy_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = consumer_id AND consumers.user_id = auth.uid())
  );

CREATE POLICY "reviews_policy_update" ON public.reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = reviews.consumer_id AND consumers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM stores WHERE stores.id = reviews.store_id AND stores.user_id = auth.uid())
  );

-- ============================================
-- 3-6. cash_transactions (캐시 거래)
-- ============================================
CREATE POLICY "cash_transactions_policy_select" ON public.cash_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = cash_transactions.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "cash_transactions_policy_insert" ON public.cash_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );

-- ============================================
-- 3-7. favorites (즐겨찾기)
-- ============================================
CREATE POLICY "favorites_policy_select" ON public.favorites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = favorites.consumer_id AND consumers.user_id = auth.uid())
  );

CREATE POLICY "favorites_policy_insert" ON public.favorites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = consumer_id AND consumers.user_id = auth.uid())
  );

CREATE POLICY "favorites_policy_delete" ON public.favorites
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = favorites.consumer_id AND consumers.user_id = auth.uid())
  );

-- ============================================
-- 3-8. store_operating_hours (영업시간)
-- ============================================
CREATE POLICY "operating_hours_policy_select" ON public.store_operating_hours
  FOR SELECT USING (true);

CREATE POLICY "operating_hours_policy_insert" ON public.store_operating_hours
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "operating_hours_policy_update" ON public.store_operating_hours
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_operating_hours.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "operating_hours_policy_delete" ON public.store_operating_hours
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_operating_hours.store_id AND stores.user_id = auth.uid())
  );

-- ============================================
-- 3-9. user_profiles (존재하면 처리)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "user_profiles_policy_select" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "user_profiles_policy_update" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================
-- STEP 4: 불필요한 뷰 삭제 (Security Definer View 오류 해결)
-- ============================================
DROP VIEW IF EXISTS public.store_cash_summary CASCADE;
DROP VIEW IF EXISTS public.stores_with_status CASCADE;
DROP VIEW IF EXISTS public.reservation_stats CASCADE;

-- ============================================
-- STEP 5: 함수 search_path 수정
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
    UPDATE products SET reserved_quantity = reserved_quantity - OLD.quantity WHERE id = OLD.product_id;
    IF OLD.status = 'confirmed' AND OLD.commission_amount IS NOT NULL THEN
      UPDATE stores SET cash_balance = cash_balance + OLD.commission_amount WHERE id = OLD.store_id;
      INSERT INTO cash_transactions (store_id, transaction_type, amount, balance_after, reservation_id, description)
      SELECT OLD.store_id, 'refund', OLD.commission_amount, cash_balance, OLD.id, '예약 취소 수수료 환불' FROM stores WHERE id = OLD.store_id;
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
  UPDATE products SET reserved_quantity = reserved_quantity - OLD.quantity WHERE id = OLD.product_id;
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
  SELECT (stock_quantity - reserved_quantity) INTO available_stock FROM products WHERE id = p_product_id AND is_active = true;
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
  UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id = p_product_id RETURNING is_active INTO new_status;
  RETURN new_status;
END;
$$;

-- ============================================
-- 완료 확인
-- ============================================
SELECT 'RLS 정책 최적화 완료!' as result;

-- 정책 개수 확인
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
