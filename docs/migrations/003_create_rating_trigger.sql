-- ============================================
-- 마이그레이션: create_rating_trigger
-- 목적: reviews 테이블 변경 시 stores.average_rating, review_count 자동 업데이트
-- 작성일: 2026-02-12
-- ============================================

-- ============================================
-- PART 1: 평점 계산 함수 생성
-- ============================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.update_store_rating() CASCADE;

-- 평점 업데이트 함수 생성
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
  -- 영향받는 store_id 결정
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
  ELSE
    v_store_id := NEW.store_id;
  END IF;

  -- 해당 업체의 평균 평점 및 리뷰 수 계산
  -- is_deleted가 false인 리뷰만 계산
  SELECT
    COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM reviews
  WHERE store_id = v_store_id
    AND is_deleted = false;

  -- stores 테이블 업데이트
  UPDATE stores
  SET
    average_rating = v_avg_rating,
    review_count = v_review_count,
    updated_at = NOW()
  WHERE id = v_store_id;

  -- 트리거 완료
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================
-- PART 2: 트리거 생성
-- ============================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_store_rating_insert ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_store_rating_update ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_store_rating_delete ON public.reviews;

-- INSERT 트리거
CREATE TRIGGER trigger_update_store_rating_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

-- UPDATE 트리거 (rating 또는 is_deleted 변경 시)
CREATE TRIGGER trigger_update_store_rating_update
  AFTER UPDATE OF rating, is_deleted ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

-- DELETE 트리거
CREATE TRIGGER trigger_update_store_rating_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

-- ============================================
-- PART 3: stores 테이블 average_rating, review_count UPDATE 정책
-- 클라이언트에서 직접 수정 불가하도록 제한
-- ============================================

-- 기존 정책에서 rating 컬럼 직접 수정 방지
-- stores_update_own 정책은 이미 있으므로, 추가 제한은 애플리케이션 레벨에서 처리
-- 참고: PostgreSQL RLS는 컬럼 단위 제한이 어려우므로,
--       average_rating/review_count는 트리거에서만 수정되도록 함

-- 대안: 업데이트 시 해당 컬럼 변경을 막는 트리거 추가
DROP FUNCTION IF EXISTS public.prevent_rating_direct_update() CASCADE;

CREATE OR REPLACE FUNCTION public.prevent_rating_direct_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 평점 관련 컬럼이 직접 변경되면 원래 값 유지
  -- (트리거에서 변경하는 것은 SECURITY DEFINER로 처리)
  IF NEW.average_rating IS DISTINCT FROM OLD.average_rating AND
     current_setting('session.update_store_rating', true) IS NULL THEN
    NEW.average_rating := OLD.average_rating;
  END IF;

  IF NEW.review_count IS DISTINCT FROM OLD.review_count AND
     current_setting('session.update_store_rating', true) IS NULL THEN
    NEW.review_count := OLD.review_count;
  END IF;

  RETURN NEW;
END;
$$;

-- 참고: 위 방식은 복잡하므로 실제로는
-- API 레벨에서 average_rating, review_count 업데이트를 차단하는 것이 더 간단함

-- ============================================
-- PART 4: 기존 데이터 평점 재계산 (옵션)
-- 초기 실행 시 한 번만 수행
-- ============================================

-- 모든 업체의 평점 재계산
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

-- 리뷰가 없는 업체는 0으로 설정
UPDATE stores
SET average_rating = 0, review_count = 0
WHERE id NOT IN (
  SELECT DISTINCT store_id FROM reviews WHERE is_deleted = false
);

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'reviews';
--
-- SELECT id, name, average_rating, review_count FROM stores LIMIT 10;
