-- 예약 취소 사유 컬럼 추가
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 취소 사유 관련 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_cancel_reason ON reservations(cancel_reason) WHERE cancel_reason IS NOT NULL;

-- 예약 상태별 카운트를 위한 뷰 (선택사항)
CREATE OR REPLACE VIEW reservation_stats AS
SELECT
  store_id,
  status,
  COUNT(*) as count
FROM reservations
GROUP BY store_id, status;
