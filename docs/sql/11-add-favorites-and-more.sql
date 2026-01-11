-- 단골 고객 및 알림 설정 테이블
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  notification_type TEXT DEFAULT 'all', -- 'all' or 'specific'
  product_names TEXT[], -- 특정 상품명 배열
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consumer_id, store_id)
);

-- 픽업 완료 상태 추가
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS picked_up BOOLEAN DEFAULT false;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;

-- 리뷰 답글 컬럼 확인 (이미 있음)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- 주소 컬럼 확인 (이미 있음)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_favorites_store ON favorites(store_id);
CREATE INDEX IF NOT EXISTS idx_favorites_consumer ON favorites(consumer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_picked_up ON reservations(picked_up);
