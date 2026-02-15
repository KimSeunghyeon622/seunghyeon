-- ============================================================
-- 005_fix_consumers_rls_recursion.sql
-- consumers RLS 재귀 문제 해결
--
-- 문제: consumers_select_for_stores 정책이 reservations를 JOIN하고,
--       reservations_policy_select가 consumers를 참조하여 재귀 발생
--
-- 해결: SECURITY DEFINER 함수로 RLS 우회하여 재귀 방지
-- ============================================================

-- 1. 문제가 되는 기존 정책 삭제
DROP POLICY IF EXISTS "consumers_select_for_stores" ON consumers;

-- 2. SECURITY DEFINER 함수 생성 (RLS 우회)
CREATE OR REPLACE FUNCTION get_store_customer_ids(store_owner_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT r.consumer_id
  FROM reservations r
  INNER JOIN stores s ON s.id = r.store_id
  WHERE s.user_id = store_owner_id;
$$;

-- 3. 새로운 정책 생성 (재귀 없음)
CREATE POLICY "consumers_select_for_stores"
ON consumers FOR SELECT
TO authenticated
USING (
  id IN (SELECT get_store_customer_ids(auth.uid()))
);

-- ============================================================
-- 롤백 스크립트 (문제 발생 시)
-- ============================================================
-- DROP POLICY IF EXISTS "consumers_select_for_stores" ON consumers;
-- DROP FUNCTION IF EXISTS get_store_customer_ids(uuid);
--
-- -- 원래 정책 복원 (필요시)
-- CREATE POLICY "consumers_select_for_stores"
-- ON consumers FOR SELECT
-- TO authenticated
-- USING (
--   id IN (SELECT DISTINCT r.consumer_id
--          FROM reservations r
--          JOIN stores s ON s.id = r.store_id
--          WHERE s.user_id = auth.uid())
-- );
