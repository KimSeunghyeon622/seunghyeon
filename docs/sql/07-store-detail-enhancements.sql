-- =====================================================
-- 업체 상세 페이지 개선을 위한 테이블 수정
-- =====================================================
-- 이 스크립트는 StoreDetail 페이지에 다음 기능을 추가합니다:
-- 1. 업체 커버 이미지
-- 2. 업체 로고/프로필 이미지
-- 3. 업체 상세 설명
-- 4. 카테고리 (베이커리, 카페, 레스토랑 등)
-- 5. 영업시간
-- 6. 픽업 가능 시간
-- 7. 환불 정책
-- 8. 노쇼 정책
-- 9. 리뷰 개수 (자동 계산)
-- =====================================================

-- 1단계: stores 테이블에 새로운 컬럼 추가
-- =====================================================

-- 업체 커버 이미지 (큰 배너 이미지)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 업체 로고/프로필 이미지 (작은 원형 이미지)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 업체 상세 설명
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS description TEXT;

-- 카테고리 (베이커리, 카페, 레스토랑 등)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '기타';

-- 영업시간 (JSON 형식: {"mon": "09:00-18:00", "tue": "09:00-18:00", ...})
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- 간단한 영업시간 텍스트 (예: "매일 09:00 - 21:00")
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS opening_hours_text TEXT;

-- 픽업 시작 시간
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS pickup_start_time TIME DEFAULT '09:00:00';

-- 픽업 종료 시간
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS pickup_end_time TIME DEFAULT '21:00:00';

-- 환불 정책
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT '픽업 1시간 전까지 취소 가능하며, 전액 환불됩니다.';

-- 노쇼 정책
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS no_show_policy TEXT DEFAULT '노쇼 시 다음 예약이 제한될 수 있습니다.';

-- 리뷰 개수 (자동 계산됨)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 2단계: 기존 데이터에 기본값 설정
-- =====================================================

-- 기존 업체에 기본 카테고리 설정
UPDATE stores
SET category = '기타'
WHERE category IS NULL;

-- 기존 업체에 기본 영업시간 텍스트 설정
UPDATE stores
SET opening_hours_text = '매일 09:00 - 21:00'
WHERE opening_hours_text IS NULL;

-- 기존 업체의 리뷰 개수 계산
UPDATE stores s
SET review_count = (
  SELECT COUNT(*)
  FROM reviews r
  WHERE r.store_id = s.id
)
WHERE review_count = 0;

-- 3단계: 리뷰 개수 자동 업데이트 트리거 생성
-- =====================================================

-- 리뷰가 추가/삭제될 때 자동으로 stores.review_count 업데이트
CREATE OR REPLACE FUNCTION update_store_review_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 리뷰 추가 시 review_count 증가
    UPDATE stores
    SET review_count = review_count + 1
    WHERE id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- 리뷰 삭제 시 review_count 감소
    UPDATE stores
    SET review_count = GREATEST(review_count - 1, 0)
    WHERE id = OLD.store_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_update_review_count ON reviews;
CREATE TRIGGER trigger_update_review_count
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_store_review_count();

-- 4단계: 코멘트 추가 (문서화)
-- =====================================================

COMMENT ON COLUMN stores.cover_image_url IS '업체 커버 이미지 URL (배너)';
COMMENT ON COLUMN stores.logo_url IS '업체 로고 이미지 URL (프로필)';
COMMENT ON COLUMN stores.description IS '업체 상세 설명';
COMMENT ON COLUMN stores.category IS '카테고리 (베이커리, 카페, 레스토랑, 편의점 등)';
COMMENT ON COLUMN stores.opening_hours IS '영업시간 (JSON 형식)';
COMMENT ON COLUMN stores.opening_hours_text IS '영업시간 간단 텍스트';
COMMENT ON COLUMN stores.pickup_start_time IS '픽업 시작 시간';
COMMENT ON COLUMN stores.pickup_end_time IS '픽업 종료 시간';
COMMENT ON COLUMN stores.refund_policy IS '환불 정책';
COMMENT ON COLUMN stores.no_show_policy IS '노쇼 정책';
COMMENT ON COLUMN stores.review_count IS '리뷰 개수 (자동 계산)';

-- 5단계: 테스트 데이터 업데이트 (선택사항)
-- =====================================================

/*
-- 예시: 기존 업체 데이터 업데이트
UPDATE stores
SET
  category = '베이커리',
  description = '신선한 빵을 매일 아침 직접 구워내는 동네 베이커리입니다. 마감 시간 전 남은 빵을 할인된 가격으로 제공합니다.',
  opening_hours_text = '매일 07:00 - 22:00',
  pickup_start_time = '19:00:00',
  pickup_end_time = '21:30:00',
  refund_policy = '픽업 2시간 전까지 취소 가능하며, 전액 환불됩니다.',
  no_show_policy = '노쇼 3회 누적 시 예약이 제한됩니다.'
WHERE name = '테스트 베이커리';
*/

-- =====================================================
-- 완료!
-- =====================================================
-- 이제 stores 테이블에 다음 정보가 추가되었습니다:
-- - cover_image_url: 업체 커버 이미지
-- - logo_url: 업체 로고
-- - description: 상세 설명
-- - category: 카테고리
-- - opening_hours_text: 영업시간
-- - pickup_start_time/pickup_end_time: 픽업 가능 시간
-- - refund_policy: 환불 정책
-- - no_show_policy: 노쇼 정책
-- - review_count: 리뷰 개수 (자동 업데이트)
-- =====================================================
