-- =====================================================
-- Supabase Storage 정책 수정 (상품 이미지 업로드 오류 해결)
-- =====================================================

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- 1. 인증된 사용자 업로드 허용 (모든 폴더)
CREATE POLICY "Allow authenticated upload to store-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-documents');

-- 2. 인증된 사용자 업데이트 허용
CREATE POLICY "Allow authenticated update in store-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'store-documents')
WITH CHECK (bucket_id = 'store-documents');

-- 3. 모든 사용자 읽기 허용 (Public)
CREATE POLICY "Allow public read from store-documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-documents');

-- 4. 인증된 사용자 삭제 허용
CREATE POLICY "Allow authenticated delete from store-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'store-documents');

-- =====================================================
-- 완료!
-- =====================================================
-- 이제 상품 이미지 업로드가 정상 작동합니다.
-- =====================================================
