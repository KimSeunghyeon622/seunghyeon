-- ============================================
-- 마이그레이션: create_reservation_status_rpc
-- 목적: 예약 상태 변경 RPC 함수 생성 (권한 검증 + 유효한 상태 전이만 허용)
-- 작성일: 2026-02-12
-- ============================================

-- ============================================
-- PART 1: 예약 상태 변경 RPC 함수 생성
-- ============================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.update_reservation_status(UUID, TEXT, TEXT);

-- 예약 상태 변경 함수
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
  -- 1. 현재 사용자 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, '인증되지 않은 사용자입니다'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- 2. 예약 정보 조회 (행 잠금)
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

  -- 3. 권한 확인 (소비자 또는 업주)
  v_is_consumer := (v_user_id = v_consumer_user_id);
  v_is_store_owner := (v_user_id = v_store_user_id);

  IF NOT (v_is_consumer OR v_is_store_owner) THEN
    RETURN QUERY SELECT false, '이 예약을 수정할 권한이 없습니다'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- 4. 상태 전이 유효성 검증
  -- 유효한 상태 전이 정의
  CASE v_reservation.status
    WHEN 'pending' THEN
      -- pending -> confirmed (업주), cancelled (소비자/업주)
      IF v_is_store_owner THEN
        v_valid_transitions := ARRAY['confirmed', 'cancelled'];
      ELSE
        v_valid_transitions := ARRAY['cancelled'];
      END IF;

    WHEN 'confirmed' THEN
      -- confirmed -> completed (업주), cancelled (소비자/업주), no_show (업주)
      IF v_is_store_owner THEN
        v_valid_transitions := ARRAY['completed', 'cancelled', 'no_show'];
      ELSE
        v_valid_transitions := ARRAY['cancelled'];
      END IF;

    WHEN 'completed' THEN
      -- completed -> 변경 불가
      v_valid_transitions := ARRAY[]::TEXT[];

    WHEN 'cancelled' THEN
      -- cancelled -> 변경 불가
      v_valid_transitions := ARRAY[]::TEXT[];

    WHEN 'no_show' THEN
      -- no_show -> 변경 불가
      v_valid_transitions := ARRAY[]::TEXT[];

    ELSE
      v_valid_transitions := ARRAY[]::TEXT[];
  END CASE;

  -- 5. 상태 전이 허용 여부 확인
  IF NOT (p_new_status = ANY(v_valid_transitions)) THEN
    RETURN QUERY SELECT
      false,
      format('현재 상태(%s)에서 %s 상태로 변경할 수 없습니다. 허용: %s',
        v_reservation.status, p_new_status, array_to_string(v_valid_transitions, ', '))::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- 6. 취소 시 취소 사유 필수 (선택적)
  -- IF p_new_status = 'cancelled' AND (p_cancel_reason IS NULL OR p_cancel_reason = '') THEN
  --   RETURN QUERY SELECT false, '취소 사유를 입력해주세요'::TEXT, NULL::TEXT;
  --   RETURN;
  -- END IF;

  -- 7. 예약 상태 업데이트
  UPDATE reservations
  SET
    status = p_new_status,
    cancel_reason = CASE
      WHEN p_new_status = 'cancelled' THEN COALESCE(p_cancel_reason, cancel_reason)
      ELSE cancel_reason
    END,
    picked_up = CASE
      WHEN p_new_status = 'completed' THEN true
      ELSE picked_up
    END,
    picked_up_at = CASE
      WHEN p_new_status = 'completed' THEN NOW()
      ELSE picked_up_at
    END,
    updated_at = NOW()
  WHERE id = p_reservation_id;

  -- 8. 취소 시 재고 복구 (reserved_quantity 감소)
  IF p_new_status = 'cancelled' THEN
    UPDATE products
    SET
      reserved_quantity = GREATEST(0, reserved_quantity - v_reservation.quantity),
      updated_at = NOW()
    WHERE id = v_reservation.product_id;
  END IF;

  -- 9. no_show 시에도 재고 복구
  IF p_new_status = 'no_show' THEN
    UPDATE products
    SET
      reserved_quantity = GREATEST(0, reserved_quantity - v_reservation.quantity),
      updated_at = NOW()
    WHERE id = v_reservation.product_id;
  END IF;

  -- 10. 완료 시 재고 확정 차감 (stock_quantity 감소, reserved_quantity 감소)
  IF p_new_status = 'completed' THEN
    UPDATE products
    SET
      stock_quantity = GREATEST(0, stock_quantity - v_reservation.quantity),
      reserved_quantity = GREATEST(0, reserved_quantity - v_reservation.quantity),
      updated_at = NOW()
    WHERE id = v_reservation.product_id;
  END IF;

  -- 11. 성공 반환
  RETURN QUERY SELECT true, '예약 상태가 변경되었습니다'::TEXT, p_new_status;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::TEXT, NULL::TEXT;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.update_reservation_status(UUID, TEXT, TEXT) TO authenticated;

-- ============================================
-- PART 2: reservations 테이블 직접 UPDATE 제한 (선택적)
-- RPC 함수를 통해서만 상태 변경하도록 권장
-- ============================================

-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "reservations_update_own_consumer" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own_store" ON public.reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Store owners can update reservations" ON public.reservations;

-- RLS 활성화 확인
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 소비자: 자신의 예약 조회만 가능 (업데이트는 RPC 통해서만)
DROP POLICY IF EXISTS "reservations_select_consumer" ON public.reservations;
CREATE POLICY "reservations_select_consumer" ON public.reservations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM consumers
    WHERE consumers.id = reservations.consumer_id
    AND consumers.user_id = auth.uid()
  )
);

-- 업주: 자신의 업체 예약 조회만 가능 (업데이트는 RPC 통해서만)
DROP POLICY IF EXISTS "reservations_select_store" ON public.reservations;
CREATE POLICY "reservations_select_store" ON public.reservations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = reservations.store_id
    AND stores.user_id = auth.uid()
  )
);

-- 참고: UPDATE 정책을 아예 제거하면 직접 UPDATE 불가
-- 필요시 제한된 UPDATE 정책 추가 가능

-- 제한된 UPDATE 정책 (status 외 필드만 허용) - 선택적
-- CREATE POLICY "reservations_update_limited" ON public.reservations
-- FOR UPDATE USING (
--   EXISTS (
--     SELECT 1 FROM consumers c WHERE c.id = consumer_id AND c.user_id = auth.uid()
--   ) OR EXISTS (
--     SELECT 1 FROM stores s WHERE s.id = store_id AND s.user_id = auth.uid()
--   )
-- )
-- WITH CHECK (
--   -- status 필드는 변경 불가 (OLD 값과 동일해야 함)
--   -- PostgreSQL에서는 이런 조건을 CHECK에서 직접 적용하기 어려움
--   true
-- );

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT * FROM pg_proc WHERE proname = 'update_reservation_status';
--
-- 테스트 (실제 reservation_id 사용):
-- SELECT * FROM update_reservation_status('reservation-uuid', 'confirmed', NULL);
