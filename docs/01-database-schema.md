# 데이터베이스 스키마 설계

> **재고 할인 중개 플랫폼 - Database Schema Design**
>
> - **DBMS**: PostgreSQL (Supabase)
> - **ORM**: Supabase Client + Row Level Security (RLS)
> - **Version**: 1.0.0
> - **Last Updated**: 2026-01-10

---

## 📋 목차

1. [ERD 개요](#erd-개요)
2. [테이블 상세 설계](#테이블-상세-설계)
3. [인덱스 전략](#인덱스-전략)
4. [RLS 정책](#rls-정책)
5. [트리거 및 함수](#트리거-및-함수)
6. [데이터 보관 정책](#데이터-보관-정책)

---

## ERD 개요

```
┌─────────────┐
│   users     │ (Supabase Auth)
│             │
│ - id        │
│ - email     │
│ - phone     │
└──────┬──────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌─────────────┐                   ┌──────────────┐
│   consumers │                   │    stores    │
│             │                   │              │
│ - user_id   │                   │ - user_id    │
│ - nickname  │                   │ - name       │
│ - savings   │◄──────┐           │ - address    │
└──────┬──────┘       │           │ - lat/lng    │
       │              │           └───────┬──────┘
       │              │                   │
       │              │                   ├──────────┐
       │              │                   │          │
       ▼              │                   ▼          ▼
┌──────────────┐      │            ┌───────────┐ ┌────────────┐
│ reservations │──────┘            │ products  │ │ store_cash │
│              │                   │           │ │            │
│ - id         │───────┐           │ - id      │ │ - store_id │
│ - consumer   │       │           │ - store   │ │ - balance  │
│ - product    │       │           │ - price   │ │ - status   │
│ - status     │       │           │ - stock   │ └────────────┘
│ - pickup_at  │       │           └───────────┘
└──────────────┘       │
                       │
                       ▼
                ┌──────────────┐
                │   reviews    │
                │              │
                │ - id         │
                │ - reservation│
                │ - rating     │
                │ - content    │
                └──────────────┘
```

---

## 테이블 상세 설계

### 1. `users` (Supabase Auth 기본 테이블)

Supabase Auth가 자동 관리하는 테이블입니다.

```sql
-- Supabase Auth 기본 테이블 (auth.users)
-- 직접 생성하지 않음
```

**주요 필드:**
- `id`: UUID (Primary Key)
- `email`: 이메일
- `phone`: 전화번호
- `created_at`: 가입일
- `email_confirmed_at`: 이메일 인증일

---

### 2. `user_profiles` - 사용자 프로필

사용자 타입을 구분하는 테이블입니다.

```sql
CREATE TYPE user_type AS ENUM ('consumer', 'store', 'admin');

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
```

---

### 3. `consumers` - 소비자 정보

```sql
CREATE TABLE consumers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  total_savings DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 누적 절약 금액
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id),
  UNIQUE(nickname)
);

-- 인덱스
CREATE INDEX idx_consumers_user_id ON consumers(user_id);
CREATE INDEX idx_consumers_nickname ON consumers(nickname);
```

**주요 필드 설명:**
- `total_savings`: 가입 후 누적 절약 금액 (정가 - 할인가의 합계)
- `nickname`: 예약 시 사용되는 닉네임 (고유값)

---

### 4. `stores` - 업체 정보

```sql
CREATE TYPE store_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  phone VARCHAR(20) NOT NULL,

  -- 주소 정보
  address TEXT NOT NULL,
  address_detail TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- 영업 시간
  opening_time TIME,
  closing_time TIME,

  -- 업체 이미지
  thumbnail_url TEXT,
  images TEXT[], -- 여러 이미지 URL 배열

  -- 정책
  refund_policy TEXT,
  exchange_policy TEXT,
  no_show_policy TEXT,

  -- 통계
  total_transactions INT NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,

  -- 상태
  status store_status NOT NULL DEFAULT 'active',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_location ON stores USING gist(ll_to_earth(latitude, longitude)); -- 지리적 검색
CREATE INDEX idx_stores_rating ON stores(average_rating DESC);
```

**주요 필드 설명:**
- `status`:
  - `active`: 정상 영업 (캐시 충분 + 영업시간 내)
  - `inactive`: 비활성 (캐시 부족 or 영업시간 외)
  - `suspended`: 정지 (운영자에 의해)
- `latitude`, `longitude`: 지도 표시 및 거리 계산용

---

### 5. `store_cash` - 업체 캐시 (크레딧)

```sql
CREATE TYPE cash_status AS ENUM ('sufficient', 'low', 'depleted');

CREATE TABLE store_cash (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  balance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 현재 잔액
  total_charged DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 총 충전 금액
  total_used DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 총 사용 금액

  status cash_status NOT NULL DEFAULT 'depleted',
  low_balance_notified_at TIMESTAMPTZ, -- 잔액 부족 알림 발송 시각

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(store_id),
  CHECK (balance >= 0),
  CHECK (total_charged >= 0),
  CHECK (total_used >= 0)
);

-- 인덱스
CREATE INDEX idx_store_cash_store_id ON store_cash(store_id);
CREATE INDEX idx_store_cash_status ON store_cash(status);
```

**캐시 상태 기준:**
- `sufficient`: balance >= 10,000원
- `low`: 0 < balance < 10,000원
- `depleted`: balance = 0원

---

### 6. `cash_transactions` - 캐시 거래 내역

```sql
CREATE TYPE transaction_type AS ENUM ('charge', 'deduct', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  type transaction_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL, -- 거래 후 잔액

  status transaction_status NOT NULL DEFAULT 'pending',

  -- 충전 관련 (토스 페이먼츠)
  payment_key VARCHAR(200), -- 토스 결제 키
  order_id VARCHAR(100), -- 주문 ID

  -- 차감 관련
  reservation_id UUID REFERENCES reservations(id),

  description TEXT,
  metadata JSONB, -- 추가 정보

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CHECK (amount > 0)
);

-- 인덱스
CREATE INDEX idx_cash_transactions_store_id ON cash_transactions(store_id);
CREATE INDEX idx_cash_transactions_type ON cash_transactions(type);
CREATE INDEX idx_cash_transactions_status ON cash_transactions(status);
CREATE INDEX idx_cash_transactions_created_at ON cash_transactions(created_at DESC);
CREATE INDEX idx_cash_transactions_payment_key ON cash_transactions(payment_key);
```

---

### 7. `products` - 상품

```sql
CREATE TYPE product_status AS ENUM ('active', 'sold_out', 'deleted');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  name VARCHAR(200) NOT NULL,
  description TEXT,
  images TEXT[], -- 상품 이미지 URL 배열

  -- 가격
  original_price DECIMAL(10, 2) NOT NULL, -- 정가
  discounted_price DECIMAL(10, 2) NOT NULL, -- 할인가
  discount_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    ROUND(((original_price - discounted_price) / original_price * 100)::numeric, 2)
  ) STORED, -- 자동 계산되는 할인율

  -- 재고
  stock INT NOT NULL DEFAULT 0,
  reserved_stock INT NOT NULL DEFAULT 0, -- 예약된 수량
  available_stock INT GENERATED ALWAYS AS (stock - reserved_stock) STORED,

  -- 유통기한
  manufactured_date DATE NOT NULL,
  expiry_date DATE NOT NULL,

  status product_status NOT NULL DEFAULT 'active',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (original_price > 0),
  CHECK (discounted_price > 0),
  CHECK (discounted_price < original_price),
  CHECK (stock >= 0),
  CHECK (reserved_stock >= 0),
  CHECK (reserved_stock <= stock)
);

-- 인덱스
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_discount_rate ON products(discount_rate DESC);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

**주요 필드 설명:**
- `discount_rate`: PostgreSQL GENERATED ALWAYS로 자동 계산
- `available_stock`: 실제 구매 가능 수량 (stock - reserved_stock)

---

### 8. `reservations` - 예약

```sql
CREATE TYPE reservation_status AS ENUM (
  'confirmed',     -- 예약 확정
  'cancelled_by_consumer', -- 소비자가 취소
  'cancelled_by_store',    -- 업체가 취소
  'completed',     -- 픽업 완료
  'no_show'        -- 노쇼
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_number VARCHAR(20) NOT NULL UNIQUE, -- 예약 번호 (자동 생성)

  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  quantity INT NOT NULL DEFAULT 1,

  -- 가격 정보 (스냅샷)
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL, -- quantity * discounted_price
  saved_amount DECIMAL(10, 2) NOT NULL, -- quantity * (original_price - discounted_price)

  -- 시간
  pickup_time TIMESTAMPTZ NOT NULL, -- 픽업 예정 시간
  completed_at TIMESTAMPTZ, -- 픽업 완료 시각
  cancelled_at TIMESTAMPTZ, -- 취소 시각

  status reservation_status NOT NULL DEFAULT 'confirmed',

  -- 수수료 (픽업 완료 시 차감)
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00, -- 수수료율 (업체별 다를 수 있음)
  commission_amount DECIMAL(10, 2), -- 실제 차감된 수수료

  cancellation_reason TEXT, -- 취소 사유

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (quantity > 0),
  CHECK (total_amount > 0),
  CHECK (saved_amount >= 0)
);

-- 인덱스
CREATE INDEX idx_reservations_consumer_id ON reservations(consumer_id);
CREATE INDEX idx_reservations_store_id ON reservations(store_id);
CREATE INDEX idx_reservations_product_id ON reservations(product_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX idx_reservations_pickup_time ON reservations(pickup_time);
CREATE INDEX idx_reservations_number ON reservations(reservation_number);
```

**예약 번호 생성 규칙:**
- 형식: `R{YYYYMMDD}{순번 6자리}` (예: R202601100001234)
- 함수로 자동 생성

---

### 9. `reviews` - 리뷰

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  rating INT NOT NULL, -- 1~5
  content TEXT,
  images TEXT[], -- 리뷰 이미지

  reply TEXT, -- 업체 답글
  reply_created_at TIMESTAMPTZ,

  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id), -- 운영자가 삭제한 경우

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(reservation_id) -- 1 예약당 1 리뷰
);

-- 인덱스
CREATE INDEX idx_reviews_consumer_id ON reviews(consumer_id);
CREATE INDEX idx_reviews_store_id ON reviews(store_id);
CREATE INDEX idx_reviews_reservation_id ON reviews(reservation_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

**리뷰 작성 권한 관리:**
- `completed` 상태 reservations만 리뷰 작성 가능
- 1 reservation당 1개 리뷰만 작성 가능

---

### 10. `review_rights` - 리뷰 작성 권한

```sql
CREATE TABLE review_rights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  total_rights INT NOT NULL DEFAULT 0, -- 총 권한 수
  used_rights INT NOT NULL DEFAULT 0, -- 사용한 권한 수
  available_rights INT GENERATED ALWAYS AS (total_rights - used_rights) STORED,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(consumer_id, store_id),
  CHECK (used_rights >= 0),
  CHECK (used_rights <= total_rights)
);

-- 인덱스
CREATE INDEX idx_review_rights_consumer_store ON review_rights(consumer_id, store_id);
```

**권한 관리 로직:**
- 픽업 완료 시: `total_rights += 1`
- 리뷰 작성 시: `used_rights += 1`

---

### 11. `favorites` - 즐겨찾기

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(consumer_id, store_id)
);

-- 인덱스
CREATE INDEX idx_favorites_consumer_id ON favorites(consumer_id);
CREATE INDEX idx_favorites_store_id ON favorites(store_id);
```

---

### 12. `notification_subscriptions` - 알림 구독

```sql
CREATE TYPE subscription_type AS ENUM ('all_products', 'specific_product');

CREATE TABLE notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  type subscription_type NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- specific_product인 경우

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (
    (type = 'all_products' AND product_id IS NULL) OR
    (type = 'specific_product' AND product_id IS NOT NULL)
  )
);

-- 인덱스
CREATE INDEX idx_notification_subscriptions_consumer ON notification_subscriptions(consumer_id);
CREATE INDEX idx_notification_subscriptions_store ON notification_subscriptions(store_id);
CREATE INDEX idx_notification_subscriptions_product ON notification_subscriptions(product_id);
```

---

### 13. `notifications` - 알림 내역

```sql
CREATE TYPE notification_type AS ENUM (
  'product_registered',    -- 상품 등록
  'reservation_confirmed', -- 예약 확정
  'reservation_cancelled', -- 예약 취소
  'pickup_reminder',       -- 픽업 리마인더
  'review_received',       -- 리뷰 작성됨
  'cash_low',             -- 캐시 부족
  'cash_depleted'         -- 캐시 소진
);

CREATE TYPE notification_channel AS ENUM ('push', 'kakao', 'email');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,

  channels notification_channel[] NOT NULL, -- 발송 채널들

  -- 관련 데이터
  reservation_id UUID REFERENCES reservations(id),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  review_id UUID REFERENCES reviews(id),

  metadata JSONB,

  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 인덱스 전략

### 1. **검색 성능 최적화**

#### 거리 기반 업체 검색
```sql
-- PostGIS 확장 설치
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- 지리적 인덱스
CREATE INDEX idx_stores_location ON stores
USING gist(ll_to_earth(latitude, longitude));
```

#### 추천순 (평점순) 업체 검색
```sql
CREATE INDEX idx_stores_rating_active ON stores(average_rating DESC, created_at DESC)
WHERE status = 'active';
```

### 2. **동시성 제어**

예약 시 재고 차감에서 동시성 문제를 방지하기 위한 인덱스:

```sql
CREATE INDEX idx_products_stock_available ON products(id, available_stock)
WHERE status = 'active' AND available_stock > 0;
```

---

## RLS 정책

Supabase의 Row Level Security를 활용한 권한 관리:

### 1. **소비자 정책**

```sql
-- consumers 테이블: 자신의 정보만 조회/수정 가능
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "소비자는 자신의 정보만 조회 가능" ON consumers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "소비자는 자신의 정보만 수정 가능" ON consumers
  FOR UPDATE USING (auth.uid() = user_id);
```

### 2. **업체 정책**

```sql
-- stores 테이블: 모든 사용자 조회 가능, 소유자만 수정 가능
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 업체 정보 조회 가능" ON stores
  FOR SELECT USING (true);

CREATE POLICY "업체는 자신의 정보만 수정 가능" ON stores
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. **상품 정책**

```sql
-- products 테이블
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 상품 조회 가능" ON products
  FOR SELECT USING (status != 'deleted');

CREATE POLICY "업체는 자신의 상품만 등록/수정/삭제 가능" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );
```

### 4. **예약 정책**

```sql
-- reservations 테이블
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "소비자는 자신의 예약만 조회 가능" ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = reservations.consumer_id
      AND consumers.user_id = auth.uid()
    )
  );

CREATE POLICY "업체는 자신의 예약만 조회 가능" ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = reservations.store_id
      AND stores.user_id = auth.uid()
    )
  );
```

---

## 트리거 및 함수

### 1. **예약 번호 자동 생성**

```sql
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix VARCHAR(8);
  sequence_num INT;
  new_number VARCHAR(20);
BEGIN
  -- 날짜 prefix (YYYYMMDD)
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');

  -- 오늘 생성된 예약 수 + 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM reservations
  WHERE reservation_number LIKE 'R' || date_prefix || '%';

  -- 예약 번호 생성: R + YYYYMMDD + 6자리 순번
  new_number := 'R' || date_prefix || LPAD(sequence_num::TEXT, 6, '0');

  NEW.reservation_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_reservation_number
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION generate_reservation_number();
```

### 2. **예약 시 재고 차감** (동시성 제어)

```sql
CREATE OR REPLACE FUNCTION reserve_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- 재고 확인 및 차감 (FOR UPDATE로 락 획득)
  UPDATE products
  SET reserved_stock = reserved_stock + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id
    AND (stock - reserved_stock) >= NEW.quantity
    AND status = 'active';

  -- 재고 부족 시 에러
  IF NOT FOUND THEN
    RAISE EXCEPTION '재고가 부족합니다';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reserve_product_stock
BEFORE INSERT ON reservations
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION reserve_product_stock();
```

### 3. **예약 취소 시 재고 복구**

```sql
CREATE OR REPLACE FUNCTION restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- 상태가 취소로 변경된 경우
  IF OLD.status = 'confirmed' AND
     NEW.status IN ('cancelled_by_consumer', 'cancelled_by_store') THEN

    UPDATE products
    SET reserved_stock = reserved_stock - OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restore_product_stock
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION restore_product_stock();
```

### 4. **픽업 완료 시 처리**

```sql
CREATE OR REPLACE FUNCTION complete_pickup()
RETURNS TRIGGER AS $$
DECLARE
  commission DECIMAL(10, 2);
  store_cash_id UUID;
BEGIN
  -- 상태가 completed로 변경된 경우
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN

    -- 1. 재고에서 reserved_stock 차감
    UPDATE products
    SET reserved_stock = reserved_stock - OLD.quantity,
        stock = stock - OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;

    -- 2. 수수료 계산
    commission := OLD.total_amount * (OLD.commission_rate / 100);
    NEW.commission_amount := commission;

    -- 3. 업체 캐시 차감
    UPDATE store_cash
    SET balance = balance - commission,
        total_used = total_used + commission,
        updated_at = NOW()
    WHERE store_id = OLD.store_id
    RETURNING id INTO store_cash_id;

    -- 4. 캐시 거래 내역 추가
    INSERT INTO cash_transactions (
      store_id, type, amount, balance_after, status,
      reservation_id, description, completed_at
    )
    SELECT
      OLD.store_id,
      'deduct',
      commission,
      sc.balance,
      'completed',
      OLD.id,
      '픽업 완료 수수료 차감',
      NOW()
    FROM store_cash sc
    WHERE sc.id = store_cash_id;

    -- 5. 업체 거래 건수 증가
    UPDATE stores
    SET total_transactions = total_transactions + 1,
        updated_at = NOW()
    WHERE id = OLD.store_id;

    -- 6. 소비자 절약 금액 누적
    UPDATE consumers
    SET total_savings = total_savings + OLD.saved_amount,
        updated_at = NOW()
    WHERE id = OLD.consumer_id;

    -- 7. 리뷰 작성 권한 추가
    INSERT INTO review_rights (consumer_id, store_id, total_rights)
    VALUES (OLD.consumer_id, OLD.store_id, 1)
    ON CONFLICT (consumer_id, store_id)
    DO UPDATE SET total_rights = review_rights.total_rights + 1;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complete_pickup
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION complete_pickup();
```

### 5. **캐시 잔액 상태 업데이트**

```sql
CREATE OR REPLACE FUNCTION update_cash_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance >= 10000 THEN
    NEW.status := 'sufficient';
  ELSIF NEW.balance > 0 THEN
    NEW.status := 'low';
    -- 알림 발송 (별도 함수에서 처리)
  ELSE
    NEW.status := 'depleted';
  END IF;

  -- 업체 상태 동기화
  UPDATE stores
  SET status = CASE
    WHEN NEW.status = 'depleted' THEN 'inactive'
    ELSE 'active'
  END
  WHERE id = NEW.store_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_cash_status
BEFORE UPDATE ON store_cash
FOR EACH ROW
WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
EXECUTE FUNCTION update_cash_status();
```

### 6. **업체 평균 평점 업데이트**

```sql
CREATE OR REPLACE FUNCTION update_store_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores
  SET average_rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE store_id = NEW.store_id
      AND is_deleted = false
  )
  WHERE id = NEW.store_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_store_rating_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_store_rating();

CREATE TRIGGER trg_update_store_rating_update
AFTER UPDATE ON reviews
FOR EACH ROW
WHEN (OLD.rating IS DISTINCT FROM NEW.rating OR OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
EXECUTE FUNCTION update_store_rating();
```

---

## 데이터 보관 정책

### 1. **3개월 데이터 보관 규칙**

```sql
-- 예약 취소 내역 및 거래 내역 자동 삭제 (3개월)
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
  -- 3개월 이전 취소된 예약 삭제
  DELETE FROM reservations
  WHERE status IN ('cancelled_by_consumer', 'cancelled_by_store')
    AND cancelled_at < NOW() - INTERVAL '3 months';

  -- 3개월 이전 완료된 예약 중 리뷰가 없는 것 삭제
  DELETE FROM reservations
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '3 months'
    AND NOT EXISTS (
      SELECT 1 FROM reviews WHERE reviews.reservation_id = reservations.id
    );

  -- 3개월 이전 캐시 거래 내역 삭제
  DELETE FROM cash_transactions
  WHERE created_at < NOW() - INTERVAL '3 months';

  -- 3개월 이전 알림 내역 삭제
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 실행되는 스케줄러 (Supabase pg_cron 사용)
-- SELECT cron.schedule('cleanup-old-records', '0 0 * * *', 'SELECT cleanup_old_records()');
```

### 2. **업체 탈퇴 시 데이터 처리**

```sql
CREATE OR REPLACE FUNCTION handle_store_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- 업체 상태를 삭제로 변경
  UPDATE stores
  SET status = 'suspended',
      updated_at = NOW()
  WHERE user_id = OLD.id;

  -- 모든 상품 비활성화
  UPDATE products
  SET status = 'deleted',
      updated_at = NOW()
  WHERE store_id IN (SELECT id FROM stores WHERE user_id = OLD.id);

  -- 예정된 예약 모두 취소
  UPDATE reservations
  SET status = 'cancelled_by_store',
      cancelled_at = NOW(),
      cancellation_reason = '업체 탈퇴로 인한 자동 취소'
  WHERE store_id IN (SELECT id FROM stores WHERE user_id = OLD.id)
    AND status = 'confirmed';

  -- 3개월 후 완전 삭제 예약 (별도 배치 작업에서 처리)

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_store_withdrawal
BEFORE DELETE ON auth.users
FOR EACH ROW
WHEN (EXISTS (SELECT 1 FROM stores WHERE user_id = OLD.id))
EXECUTE FUNCTION handle_store_withdrawal();
```

---

## 성능 최적화 전략

### 1. **파티셔닝**

대용량 데이터 처리를 위한 테이블 파티셔닝:

```sql
-- reservations 테이블을 월별로 파티셔닝
CREATE TABLE reservations_partitioned (
  LIKE reservations INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
CREATE TABLE reservations_2026_01 PARTITION OF reservations_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE reservations_2026_02 PARTITION OF reservations_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### 2. **Materialized View**

업체 리스트 성능 최적화:

```sql
CREATE MATERIALIZED VIEW store_list_view AS
SELECT
  s.id,
  s.name,
  s.address,
  s.latitude,
  s.longitude,
  s.thumbnail_url,
  s.average_rating,
  s.total_transactions,
  s.status,
  sc.status as cash_status,
  COUNT(DISTINCT p.id) as product_count,
  MIN(p.discount_rate) as max_discount_rate
FROM stores s
LEFT JOIN store_cash sc ON s.id = sc.store_id
LEFT JOIN products p ON s.id = p.store_id AND p.status = 'active'
WHERE s.status != 'suspended'
GROUP BY s.id, s.name, s.address, s.latitude, s.longitude,
         s.thumbnail_url, s.average_rating, s.total_transactions,
         s.status, sc.status;

-- 인덱스
CREATE INDEX idx_store_list_view_rating ON store_list_view(average_rating DESC);
CREATE INDEX idx_store_list_view_location ON store_list_view
  USING gist(ll_to_earth(latitude, longitude));

-- 정기적으로 갱신 (5분마다)
-- SELECT cron.schedule('refresh-store-list', '*/5 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY store_list_view');
```

---

## 마이그레이션 순서

데이터베이스 생성 시 아래 순서로 실행:

1. ✅ Extensions 설치 (`uuid-ossp`, `postgis`, `earthdistance`)
2. ✅ Types 생성 (ENUM types)
3. ✅ Tables 생성 (의존성 순서 고려)
4. ✅ Indexes 생성
5. ✅ Functions 생성
6. ✅ Triggers 생성
7. ✅ RLS Policies 적용
8. ✅ Materialized Views 생성
9. ✅ 초기 데이터 입력 (필요 시)

---

## 다음 단계

- [ ] Supabase 프로젝트 생성 및 마이그레이션 스크립트 작성
- [ ] API 엔드포인트 설계
- [ ] React Native 앱 구조 설계
- [ ] 상태 관리 및 데이터 플로우 설계

---

**문서 작성**: Claude Code
**최종 검토**: 2026-01-10
