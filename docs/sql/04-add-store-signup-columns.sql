-- =====================================================
-- 사업자 회원가입 기능을 위한 테이블 수정
-- =====================================================

-- 1단계: stores 테이블에 새로운 컬럼 추가
-- =====================================================

-- 담당자명 (owner_name)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- 사업자번호 (business_number)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS business_number TEXT;

-- 사업자등록증 URL (business_registration_url)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS business_registration_url TEXT;

-- 관리자 승인 여부 (is_approved)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 2단계: 기존 데이터 업데이트 (기존 업체는 자동 승인)
-- =====================================================
UPDATE stores
SET is_approved = true
WHERE is_approved IS NULL;

-- 3단계: 코멘트 추가 (문서화)
-- =====================================================
COMMENT ON COLUMN stores.owner_name IS '담당자명 (대표자명)';
COMMENT ON COLUMN stores.business_number IS '사업자번호 (123-45-67890 형식)';
COMMENT ON COLUMN stores.business_registration_url IS '사업자등록증 이미지 URL (Supabase Storage)';
COMMENT ON COLUMN stores.is_approved IS '관리자 승인 여부 (true: 승인됨, false: 승인 대기)';

-- =====================================================
-- 완료!
-- =====================================================
-- 이제 사업자 회원가입 시 다음 정보가 저장됩니다:
-- - owner_name: 담당자명
-- - business_number: 사업자번호
-- - business_registration_url: 사업자등록증 이미지
-- - is_approved: 관리자 승인 여부 (기본값: false)
-- =====================================================
