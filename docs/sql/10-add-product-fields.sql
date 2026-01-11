-- =====================================================
-- 상품 등록 화면을 위한 테이블 수정
-- =====================================================
-- 이 스크립트는 products 테이블에 다음 필드를 추가합니다:
-- 1. 제조날짜 (manufactured_date)
-- 2. 소비기한 (expiry_date)
-- 3. 단골 알람 전송 여부 (send_notification)
-- =====================================================

-- 1단계: products 테이블에 새로운 컬럼 추가
-- =====================================================

-- 제조날짜
ALTER TABLE products
ADD COLUMN IF NOT EXISTS manufactured_date DATE;

-- 소비기한
ALTER TABLE products
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 단골 알람 전송 여부 (기본값: true)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS send_notification BOOLEAN DEFAULT true;

-- 2단계: 코멘트 추가 (문서화)
-- =====================================================

COMMENT ON COLUMN products.manufactured_date IS '제조날짜 (YYYY-MM-DD)';
COMMENT ON COLUMN products.expiry_date IS '소비기한 (YYYY-MM-DD)';
COMMENT ON COLUMN products.send_notification IS '단골 알람 전송 여부 (true: 알람 전송, false: 전송 안 함)';

-- 3단계: 기존 데이터 업데이트
-- =====================================================

-- 기존 상품은 알람 전송 ON으로 설정
UPDATE products
SET send_notification = true
WHERE send_notification IS NULL;

-- =====================================================
-- 완료!
-- =====================================================
-- 이제 products 테이블에 다음 정보가 추가되었습니다:
-- - manufactured_date: 제조날짜
-- - expiry_date: 소비기한
-- - send_notification: 단골 알람 전송 여부
-- =====================================================
