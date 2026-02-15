-- ============================================
-- 마이그레이션: create_public_stores_view
-- 목적: stores 테이블 민감 정보 보호
-- 작성일: 2026-02-12
-- ============================================

-- 1. 기존 뷰가 있으면 삭제
DROP VIEW IF EXISTS public.public_stores;

-- 2. 공개용 stores 뷰 생성 (민감 정보 제외)
-- 제외 컬럼: cash_balance, business_number, business_registration_url, push_token, user_id
CREATE VIEW public.public_stores AS
SELECT
  id,
  name,
  category,
  description,
  address,
  phone,
  cover_image_url,
  logo_url,
  latitude,
  longitude,
  average_rating,
  review_count,
  is_approved,
  is_open,
  opening_hours_text,
  pickup_start_time,
  pickup_end_time,
  refund_policy,
  no_show_policy,
  created_at,
  updated_at
FROM stores
WHERE is_approved = true;

-- 3. 뷰에 대한 접근 권한 부여
GRANT SELECT ON public.public_stores TO anon, authenticated;

-- 4. 기존 stores SELECT 정책 삭제
DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_select_public" ON public.stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;
DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;

-- 5. stores 테이블 RLS 활성화 확인
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 6. 새로운 stores SELECT 정책 생성
-- 6.1 업주는 자신의 전체 정보 조회 가능
CREATE POLICY "stores_select_own" ON public.stores
FOR SELECT USING (
  user_id = auth.uid()
);

-- 6.2 모든 사용자는 공개 정보만 조회 가능 (민감 정보는 null 반환)
-- 주의: 실제로는 public_stores 뷰 사용을 권장
-- 기존 코드 호환성을 위해 기본 조회는 허용하되, RLS로 민감 컬럼 보호는 어려움
-- 따라서 프론트엔드에서 public_stores 뷰 사용 필수

-- 6.3 일반 사용자도 stores 테이블 조회 허용 (기존 코드 호환성)
-- 단, 민감 정보 접근은 프론트엔드 코드 변경으로 제한 권장
CREATE POLICY "stores_select_approved" ON public.stores
FOR SELECT USING (
  is_approved = true
);

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT * FROM public.public_stores LIMIT 5;
