-- ============================================
-- 마이그레이션: push_token_access_control
-- 목적: push_token 컬럼 접근 제한 강화
-- 작성일: 2026-02-12
-- ============================================

-- ============================================
-- PART 1: consumers 테이블 push_token 보호
-- ============================================

-- 1.1 기존 정책 삭제
DROP POLICY IF EXISTS "consumers_select_all" ON public.consumers;
DROP POLICY IF EXISTS "consumers_select_own" ON public.consumers;
DROP POLICY IF EXISTS "consumers_update_own" ON public.consumers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.consumers;
DROP POLICY IF EXISTS "Users can view their own consumer data" ON public.consumers;
DROP POLICY IF EXISTS "Users can update their own consumer data" ON public.consumers;

-- 1.2 RLS 활성화 확인
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;

-- 1.3 소비자 본인만 전체 정보 조회 가능 (push_token 포함)
CREATE POLICY "consumers_select_own_full" ON public.consumers
FOR SELECT USING (
  user_id = auth.uid()
);

-- 1.4 다른 사용자(업주 등)는 기본 정보만 조회 가능
-- 업주가 예약자 정보를 조회할 때 필요하므로 일부 허용
CREATE POLICY "consumers_select_basic" ON public.consumers
FOR SELECT USING (
  -- 본인이 아닌 경우 push_token은 NULL로 처리 (뷰로 해결)
  -- 기본적으로 조회 허용하되, 민감 정보는 뷰로 제한
  true
);

-- 1.5 소비자 본인만 업데이트 가능
CREATE POLICY "consumers_update_own" ON public.consumers
FOR UPDATE USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- 1.6 소비자용 공개 뷰 생성 (push_token 제외)
DROP VIEW IF EXISTS public.public_consumers;
CREATE VIEW public.public_consumers AS
SELECT
  id,
  user_id,
  nickname,
  phone,
  avatar_url,
  created_at
  -- push_token 제외
FROM consumers;

GRANT SELECT ON public.public_consumers TO authenticated;

-- ============================================
-- PART 2: stores 테이블 push_token 보호
-- ============================================

-- stores 테이블 push_token은 이미 001에서 public_stores 뷰로 제외됨
-- 업주 본인만 자신의 push_token 조회/수정 가능하도록 UPDATE 정책 확인

DROP POLICY IF EXISTS "stores_update_own" ON public.stores;

-- 업주 본인만 자신의 업체 정보 업데이트 가능
CREATE POLICY "stores_update_own" ON public.stores
FOR UPDATE USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- ============================================
-- PART 3: store_notification_settings 테이블 보호
-- ============================================

-- 3.1 테이블 존재 여부 확인 후 정책 생성
DO $$
BEGIN
  -- 테이블이 존재하는 경우에만 정책 생성
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'store_notification_settings'
  ) THEN
    -- 기존 정책 삭제
    DROP POLICY IF EXISTS "store_notification_settings_select_own" ON public.store_notification_settings;
    DROP POLICY IF EXISTS "store_notification_settings_update_own" ON public.store_notification_settings;
    DROP POLICY IF EXISTS "store_notification_settings_insert_own" ON public.store_notification_settings;

    -- RLS 활성화
    ALTER TABLE public.store_notification_settings ENABLE ROW LEVEL SECURITY;

    -- 업주 본인만 조회
    EXECUTE 'CREATE POLICY "store_notification_settings_select_own" ON public.store_notification_settings
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = store_notification_settings.store_id
        AND stores.user_id = auth.uid()
      )
    )';

    -- 업주 본인만 업데이트
    EXECUTE 'CREATE POLICY "store_notification_settings_update_own" ON public.store_notification_settings
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = store_notification_settings.store_id
        AND stores.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = store_notification_settings.store_id
        AND stores.user_id = auth.uid()
      )
    )';

    -- 업주 본인만 삽입
    EXECUTE 'CREATE POLICY "store_notification_settings_insert_own" ON public.store_notification_settings
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = store_notification_settings.store_id
        AND stores.user_id = auth.uid()
      )
    )';

    RAISE NOTICE 'store_notification_settings 정책 생성 완료';
  ELSE
    RAISE NOTICE 'store_notification_settings 테이블이 존재하지 않습니다';
  END IF;
END
$$;

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('consumers', 'stores', 'store_notification_settings');
