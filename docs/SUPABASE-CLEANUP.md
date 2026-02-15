# Supabase 정리 및 최적화 가이드

> **작성일**: 2026-01-18
> **목적**: Security Advisor 오류/경고 해결 및 DB 최적화

---

## 실행 방법

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴 → **SQL Editor** 클릭
4. **New Query** 클릭
5. 아래 SQL을 **순서대로** 복사하여 실행

---

## 1단계: 현재 상태 확인 (선택사항)

먼저 현재 DB에 어떤 것들이 있는지 확인합니다.

```sql
-- ============================================
-- 1단계: 현재 상태 확인 (읽기 전용)
-- ============================================

-- 1-1. 모든 테이블 목록
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 1-2. 모든 뷰 목록
SELECT table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 1-3. 모든 함수 목록
SELECT routine_name as function_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 1-4. RLS 정책 목록
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 2단계: 불필요한 뷰 삭제

Security Definer View 오류를 해결합니다.

```sql
-- ============================================
-- 2단계: 불필요한 뷰 삭제
-- ============================================

-- 문제가 되는 뷰들 삭제 (사용하지 않는 경우)
DROP VIEW IF EXISTS public.store_cash_summary CASCADE;
DROP VIEW IF EXISTS public.stores_with_status CASCADE;
DROP VIEW IF EXISTS public.reservation_stats CASCADE;

-- 확인
SELECT table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public';
```

---

## 3단계: 불필요한 테이블 정리

RLS가 비활성화된 테이블을 정리합니다.

```sql
-- ============================================
-- 3단계: 불필요한 테이블 정리
-- ============================================

-- review_rights 테이블이 사용되지 않는다면 삭제
DROP TABLE IF EXISTS public.review_rights CASCADE;

-- user_profiles 테이블이 사용되지 않는다면 삭제 (consumers와 중복될 수 있음)
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 확인: 남은 테이블 목록
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## 4단계: 함수 보안 수정

Function Search Path 경고를 해결합니다.

```sql
-- ============================================
-- 4단계: 함수 보안 수정 (search_path 설정)
-- ============================================

-- 4-1. handle_reservation_refund 함수 수정
CREATE OR REPLACE FUNCTION public.handle_reservation_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 예약 취소 시 재고 복구 및 수수료 환불 로직
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- 재고 복구
    UPDATE products
    SET reserved_quantity = reserved_quantity - OLD.quantity
    WHERE id = OLD.product_id;

    -- 수수료가 차감되었던 경우 환불 (confirmed 상태였던 경우)
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

-- 4-2. handle_inventory_restoration 함수 수정
CREATE OR REPLACE FUNCTION public.handle_inventory_restoration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 예약 삭제 시 재고 복구
  UPDATE products
  SET reserved_quantity = reserved_quantity - OLD.quantity
  WHERE id = OLD.product_id;

  RETURN OLD;
END;
$$;

-- 4-3. check_reservation_available 함수 수정
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

  IF available_stock IS NULL THEN
    RETURN false;
  END IF;

  RETURN available_stock >= p_quantity;
END;
$$;

-- 4-4. toggle_product_status 함수 수정
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
  SET is_active = NOT is_active,
      updated_at = NOW()
  WHERE id = p_product_id
  RETURNING is_active INTO new_status;

  RETURN new_status;
END;
$$;
```

---

## 5단계: RLS 정책 최적화

중복된 정책 제거 및 성능 최적화를 수행합니다.

```sql
-- ============================================
-- 5단계: RLS 정책 최적화
-- ============================================

-- 5-1. 기존 RLS 정책 모두 삭제 (테이블별)
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

-- stores
DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_update_policy" ON public.stores;
DROP POLICY IF EXISTS "모든 사용자가 업체 정보 조회 가능" ON public.stores;
DROP POLICY IF EXISTS "업체는 자신의 정보만 수정 가능" ON public.stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;

-- products
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "활성 상품 조회 가능" ON public.products;
DROP POLICY IF EXISTS "업체는 자신의 상품만 관리 가능" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;

-- reservations
DROP POLICY IF EXISTS "reservations_select_policy" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_policy" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_policy" ON public.reservations;
DROP POLICY IF EXISTS "소비자는 자신의 예약만 조회" ON public.reservations;
DROP POLICY IF EXISTS "업체는 자신의 예약만 조회" ON public.reservations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reservations;

-- reviews
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON public.reviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;

-- cash_transactions
DROP POLICY IF EXISTS "cash_transactions_select_policy" ON public.cash_transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cash_transactions;

-- favorites
DROP POLICY IF EXISTS "favorites_select_policy" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_policy" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_policy" ON public.favorites;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.favorites;

-- store_operating_hours
DROP POLICY IF EXISTS "store_operating_hours_select_policy" ON public.store_operating_hours;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.store_operating_hours;
```

---

## 6단계: 최적화된 RLS 정책 생성

성능을 고려한 새로운 RLS 정책을 생성합니다.

```sql
-- ============================================
-- 6단계: 최적화된 RLS 정책 생성
-- ============================================

-- 6-1. consumers 테이블
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consumers_select_own" ON public.consumers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "consumers_insert_own" ON public.consumers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consumers_update_own" ON public.consumers
  FOR UPDATE USING (auth.uid() = user_id);

-- 6-2. stores 테이블
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_select_all" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "stores_insert_own" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stores_update_own" ON public.stores
  FOR UPDATE USING (auth.uid() = user_id);

-- 6-3. products 테이블
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_active" ON public.products
  FOR SELECT USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
        AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "products_manage_own" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
        AND stores.user_id = auth.uid()
    )
  );

-- 6-4. reservations 테이블
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_select_own" ON public.reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = reservations.consumer_id
        AND consumers.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = reservations.store_id
        AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "reservations_insert_consumer" ON public.reservations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = consumer_id
        AND consumers.user_id = auth.uid()
    )
  );

CREATE POLICY "reservations_update_own" ON public.reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = reservations.consumer_id
        AND consumers.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = reservations.store_id
        AND stores.user_id = auth.uid()
    )
  );

-- 6-5. reviews 테이블
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = consumer_id
        AND consumers.user_id = auth.uid()
    )
  );

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = reviews.consumer_id
        AND consumers.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = reviews.store_id
        AND stores.user_id = auth.uid()
    )
  );

-- 6-6. cash_transactions 테이블
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_transactions_select_own" ON public.cash_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = cash_transactions.store_id
        AND stores.user_id = auth.uid()
    )
  );

-- 6-7. favorites 테이블
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = favorites.consumer_id
        AND consumers.user_id = auth.uid()
    )
  );

CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = consumer_id
        AND consumers.user_id = auth.uid()
    )
  );

CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = favorites.consumer_id
        AND consumers.user_id = auth.uid()
    )
  );

-- 6-8. store_operating_hours 테이블
ALTER TABLE public.store_operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operating_hours_select_all" ON public.store_operating_hours
  FOR SELECT USING (true);

CREATE POLICY "operating_hours_manage_own" ON public.store_operating_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_operating_hours.store_id
        AND stores.user_id = auth.uid()
    )
  );
```

---

## 7단계: 트리거 정리

중복되거나 불필요한 트리거를 정리합니다.

```sql
-- ============================================
-- 7단계: 트리거 정리
-- ============================================

-- 기존 트리거 확인
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 중복 트리거 삭제 (필요한 경우)
-- DROP TRIGGER IF EXISTS [트리거명] ON [테이블명];
```

---

## 8단계: 인덱스 최적화

성능을 위한 인덱스를 확인하고 추가합니다.

```sql
-- ============================================
-- 8단계: 인덱스 최적화
-- ============================================

-- 기존 인덱스 확인
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 필요한 인덱스 추가 (없는 경우에만 실행)
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
```

---

## 9단계: Auth 설정 (대시보드에서 수동 설정)

**Leaked Password Protection** 경고 해결:

1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Email** 섹션 클릭
3. **Leaked Password Protection** 토글 **활성화**

---

## 10단계: 최종 확인

모든 정리 후 경고가 해결되었는지 확인합니다.

```sql
-- ============================================
-- 10단계: 최종 확인
-- ============================================

-- 남은 테이블 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 남은 뷰 확인
SELECT table_name as view_name FROM information_schema.views
WHERE table_schema = 'public';

-- RLS 정책 확인
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 함수 확인
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

---

## 문제 해결 체크리스트

실행 후 Security Advisor에서 확인:

- [ ] Security Definer View 오류 0개
- [ ] RLS Disabled 오류 0개
- [ ] Function Search Path 경고 0개
- [ ] RLS Policy Always True 경고 0개
- [ ] Multiple Permissive Policies 경고 감소
- [ ] Leaked Password Protection 활성화

---

## 주의사항

1. **백업 권장**: 중요한 데이터가 있다면 실행 전 백업
2. **순서대로 실행**: 단계별로 순서대로 실행해야 오류 방지
3. **오류 발생 시**: 해당 객체가 이미 없거나 다른 이름일 수 있음 - 무시하고 진행

---

**문서 작성**: 팀장 에이전트
**작성일**: 2026-01-18
