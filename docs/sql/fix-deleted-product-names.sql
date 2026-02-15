-- ============================================
-- 마이그레이션: 상품명에서 [삭제됨] 접두어 제거
-- 실행일: 2026-02-02
-- 목적: 기존 소프트 삭제 로직에서 남겨진 [삭제됨] 접두어 정리
-- ============================================

-- 1. 먼저 영향받는 레코드 확인
SELECT id, name
FROM products
WHERE name LIKE '[삭제됨]%';

-- 2. [삭제됨] 접두어 제거 (중첩된 경우도 모두 제거)
-- PostgreSQL의 REGEXP_REPLACE 사용
UPDATE products
SET name = REGEXP_REPLACE(name, '^\[삭제됨\]\s*', '', 'g')
WHERE name LIKE '[삭제됨]%';

-- 3. 수정 후 확인 (혹시 남아있는 것이 있는지)
SELECT id, name
FROM products
WHERE name LIKE '[삭제됨]%';
