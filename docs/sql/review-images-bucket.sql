-- =====================================================
-- 리뷰 이미지 저장용 Supabase Storage 버킷 생성
-- =====================================================

-- 1. review-images 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images',
  true,  -- 공개 버킷
  5242880,  -- 5MB 파일 크기 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. RLS 정책: 누구나 조회 가능 (공개 이미지)
CREATE POLICY "review_images_select_policy" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'review-images');

-- 3. RLS 정책: 인증된 사용자만 업로드 가능
CREATE POLICY "review_images_insert_policy" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'review-images'
    AND auth.role() = 'authenticated'
  );

-- 4. RLS 정책: 자신이 업로드한 이미지만 삭제 가능
-- 파일명이 user_id/timestamp_random.jpg 형식이므로 폴더명으로 구분
CREATE POLICY "review_images_delete_policy" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- 5. RLS 정책: 자신이 업로드한 이미지만 수정 가능
CREATE POLICY "review_images_update_policy" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'review-images'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- =====================================================
-- 참고: 이 SQL은 Supabase Dashboard > SQL Editor에서 실행하거나
-- Supabase MCP를 통해 실행할 수 있습니다.
--
-- 또는 Supabase Dashboard > Storage에서 직접 버킷을 생성할 수 있습니다:
-- 1. Storage 메뉴 이동
-- 2. "New bucket" 클릭
-- 3. Name: review-images
-- 4. Public bucket: ON
-- 5. "Create bucket" 클릭
-- =====================================================
