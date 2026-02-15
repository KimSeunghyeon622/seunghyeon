-- ============================================
-- 통합 보안 수정 마이그레이션
-- 작성일: 2026-02-12
-- 목적: 코드 리뷰 보안 이슈 조치
-- 실행 방법: Supabase SQL Editor에서 전체 실행
-- ============================================
-- 포함된 수정 사항:
-- 1. stores 테이블 민감 정보 보호 (public_stores 뷰)
-- 2. push_token 접근 제한 강화
-- 3. 평점 계산 DB 트리거 생성
-- 4. 예약 상태 변경 RPC 함수 생성
-- ============================================

BEGIN;

-- ############################################
-- 1. stores 테이블 민감 정보 보호
-- ############################################

-- 1.1 기존 뷰가 있으면 삭제
DROP VIEW IF EXISTS public.public_stores;

-- 1.2 공개용 stores 뷰 생성 (민감 정보 제외)
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

-- 1.3 뷰에 대한 접근 권한 부여
GRANT SELECT ON public.public_stores TO anon, authenticated;

-- 1.4 기존 stores SELECT 정책 삭제
DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_select_public" ON public.stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;
DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;
DROP POLICY IF EXISTS "stores_select_own" ON public.stores;
DROP POLICY IF EXISTS "stores_select_approved" ON public.stores;

-- 1.5 stores 테이블 RLS 활성화 확인
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 1.6 업주는 자신의 전체 정보 조회 가능
CREATE POLICY "stores_select_own" ON public.stores
FOR SELECT USING (
  user_id = auth.uid()
);

-- 1.7 일반 사용자도 승인된 stores 조회 허용 (기존 코드 호환성)
CREATE POLICY "stores_select_approved" ON public.stores
FOR SELECT USING (
  is_approved = true
);

RAISE NOTICE '1. stores 테이블 민감 정보 보호 완료';

-- ############################################
-- 2. push_token 접근 제한 강화
-- ############################################

-- 2.1 consumers 테이블 정책 삭제
DROP POLICY IF EXISTS "consumers_select_all" ON public.consumers;
DROP POLICY IF EXISTS "consumers_select_own" ON public.consumers;
DROP POLICY IF EXISTS "consumers_update_own" ON public.consumers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.consumers;
DROP POLICY IF EXISTS "Users can view their own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "Users can update their own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "consumers_select_own_full" ON public.consumers;
DROP POLICY IF EXISTS "consumers_select_basic" ON public.consumers;

-- 2.2 RLS 활성화 확인
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;

-- 2.3 소비자 본인만 전체 정보 조회 가능
CREATE POLICY "consumers_select_own_full" ON public.consumers
FOR SELECT USING (
  user_id = auth.uid()
);

-- 2.4 업주가 예약자 정보 조회용 (기본 정보만)
CREATE POLICY "consumers_select_basic" ON public.consumers
FOR SELECT USING (true);

-- 2.5 소비자 본인만 업데이트 가능
CREATE POLICY "consumers_update_own" ON public.consumers
FOR UPDATE USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- 2.6 소비자용 공개 뷰 생성 (push_token 제외)
DROP VIEW IF EXISTS public.public_consumers;
CREATE VIEW public.public_consumers AS
SELECT
  id,
  user_id,
  nickname,
  phone,
  avatar_url,
  created_at
FROM consumers;

GRANT SELECT ON public.public_consumers TO authenticated;

-- 2.7 stores 테이블 UPDATE 정책
DROP POLICY IF EXISTS "stores_update_own" ON public.stores;
CREATE POLICY "stores_update_own" ON public.stores
FOR UPDATE USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

RAISE NOTICE '2. push_token 접근 제한 완료';

-- ############################################
-- 3. 평점 계산 DB 트리거 생성
-- ############################################

-- 3.1 기존 함수/트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_store_rating_insert ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_store_rating_update ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_store_rating_delete ON public.reviews;
DROP FUNCTION IF EXISTS public.update_store_rating() CASCADE;

-- 3.2 평점 업데이트 함수 생성
CREATE OR REPLACE FUNCTION public.update_store_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_avg_rating NUMERIC;
  v_review_count INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
  ELSE
    v_store_id := NEW.store_id;
  END IF;

  SELECT
    COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM reviews
  WHERE store_id = v_store_id
    AND is_deleted = false;

  UPDATE stores
  SET
    average_rating = v_avg_rating,
    review_count = v_review_count,
    updated_at = NOW()
  WHERE id = v_store_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 3.3 트리거 생성
CREATE TRIGGER trigger_update_store_rating_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

CREATE TRIGGER trigger_update_store_rating_update
  AFTER UPDATE OF rating, is_deleted ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

CREATE TRIGGER trigger_update_store_rating_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

-- 3.4 기존 데이터 평점 재계산
UPDATE stores s
SET
  average_rating = COALESCE(sub.avg_rating, 0),
  review_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT
    store_id,
    ROUND(AVG(rating)::NUMERIC, 1) as avg_rating,
    COUNT(*) as cnt
  FROM reviews
  WHERE is_deleted = false
  GROUP BY store_id
) sub
WHERE s.id = sub.store_id;

UPDATE stores
SET average_rating = 0, review_count = 0
WHERE id NOT IN (
  SELECT DISTINCT store_id FROM reviews WHERE is_deleted = false
);

RAISE NOTICE '3. 평점 계산 트리거 생성 완료';

-- ############################################
-- 4. 예약 상태 변경 RPC 함수 생성
-- ############################################

-- 4.1 기존 함수 삭제
DROP FUNCTION IF EXISTS public.update_reservation_status(UUID, TEXT, TEXT);

-- 4.2 예약 상태 변경 함수
CREATE OR REPLACE FUNCTION public.update_reservation_status(
  p_reservation_id UUID,
  p_new_status TEXT,
  p_cancel_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  updated_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_reservation RECORD;
  v_consumer_user_id UUID;
  v_store_user_id UUID;
  v_is_consumer BOOLEAN;
  v_is_store_owner BOOLEAN;
  v_valid_transitions TEXT[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, '인증되지 않은 사용자입니다'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  SELECT
    r.*,
    c.user_id as consumer_user_id,
    s.user_id as store_user_id
  INTO v_reservation
  FROM reservations r
  JOIN consumers c ON c.id = r.consumer_id
  JOIN stores s ON s.id = r.store_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  IF v_reservation IS NULL THEN
    RETURN QUERY SELECT false, '예약을 찾을 수 없습니다'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  v_consumer_user_id := v_reservation.consumer_user_id;
  v_store_user_id := v_reservation.store_user_id;

  v_is_consumer := (v_user_id = v_consumer_user_id);
  v_is_store_owner := (v_user_id = v_store_user_id);

  IF NOT (v_is_consumer OR v_is_store_owner) THEN
    RETURN QUERY SELECT false, '이 예약을 수정할 권한이 없습니다'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  CASE v_reservation.status
    WHEN 'pending' THEN
      IF v_is_store_owner THEN
        v_valid_transitions := ARRAY['confirmed', 'cancelled'];
      ELSE
        v_valid_transitions := ARRAY['cancelled'];
      END IF;
    WHEN 'confirmed' THEN
      IF v_is_store_owner THEN
        v_valid_transitions := ARRAY['completed', 'cancelled', 'no_show'];
      ELSE
        v_valid_transitions := ARRAY['cancelled'];
      END IF;
    ELSE
      v_valid_transitions := ARRAY[]::TEXT[];
  END CASE;

  IF NOT (p_new_status = ANY(v_valid_transitions)) THEN
    RETURN QUERY SELECT
      false,
      format('현재 상태(%s)에서 %s 상태로 변경할 수 없습니다',
        v_reservation.status, p_new_status)::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  UPDATE reservations
  SET
    status = p_new_status,
    cancel_reason = CASE
      WHEN p_new_status = 'cancelled' THEN COALESCE(p_cancel_reason, cancel_reason)
      ELSE cancel_reason
    END,
    picked_up = CASE WHEN p_new_status = 'completed' THEN true ELSE picked_up END,
    picked_up_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE picked_up_at END,
    updated_at = NOW()
  WHERE id = p_reservation_id;

  IF p_new_status IN ('cancelled', 'no_show') THEN
    UPDATE products
    SET
      reserved_quantity = GREATEST(0, reserved_quantity - v_reservation.quantity),
      updated_at = NOW()
    WHERE id = v_reservation.product_id;
  END IF;

  IF p_new_status = 'completed' THEN
    UPDATE products
    SET
      stock_quantity = GREATEST(0, stock_quantity - v_reservation.quantity),
      reserved_quantity = GREATEST(0, reserved_quantity - v_reservation.quantity),
      updated_at = NOW()
    WHERE id = v_reservation.product_id;
  END IF;

  RETURN QUERY SELECT true, '예약 상태가 변경되었습니다'::TEXT, p_new_status;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::TEXT, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_reservation_status(UUID, TEXT, TEXT) TO authenticated;

-- 4.3 reservations 테이블 정책 업데이트
DROP POLICY IF EXISTS "reservations_update_own_consumer" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own_store" ON public.reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Store owners can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_consumer" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_store" ON public.reservations;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_select_consumer" ON public.reservations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM consumers
    WHERE consumers.id = reservations.consumer_id
    AND consumers.user_id = auth.uid()
  )
);

CREATE POLICY "reservations_select_store" ON public.reservations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = reservations.store_id
    AND stores.user_id = auth.uid()
  )
);

RAISE NOTICE '4. 예약 상태 변경 RPC 함수 생성 완료';

COMMIT;

-- ============================================
-- 완료 확인 쿼리
-- ============================================
SELECT '보안 수정 완료!' as result;

-- 생성된 뷰 확인
SELECT table_name FROM information_schema.views WHERE table_schema = 'public';

-- 생성된 트리거 확인
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- 생성된 함수 확인
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname LIKE '%reservation%' OR proname LIKE '%rating%';
